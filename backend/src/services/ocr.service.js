import { createRequire } from 'module';
import { PrismaClient } from '@prisma/client';
import Tesseract from 'tesseract.js';
import Groq from 'groq-sdk';
import Decimal from 'decimal.js';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const PDFParse = pdfParseModule.PDFParse || pdfParseModule;

const prisma = new PrismaClient();

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured in backend environment.');
  }
  return new Groq({ apiKey });
}

function getModel() {
  return process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
}

/**
 * Extract plain text from an uploaded document buffer (PDF or Image)
 */
export async function extractTextFromFile(fileBuffer, mimeType, originalName = '') {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('Invalid file buffer provided.');
  }

  const isPdf =
    mimeType === 'application/pdf' ||
    originalName.toLowerCase().endsWith('.pdf');

  const isImage =
    mimeType?.startsWith('image/') ||
    /\.(png|jpe?g|webp|bmp)$/i.test(originalName);

  let extractedText = '';

  if (isPdf) {
    try {
      if (typeof PDFParse === 'function' && PDFParse.prototype?.getText) {
        const parser = new PDFParse({ data: fileBuffer });
        const result = await parser.getText();
        extractedText = (result?.text || '').trim();
      } else if (typeof pdfParseModule === 'function') {
        const pdfData = await pdfParseModule(fileBuffer);
        extractedText = (pdfData?.text || '').trim();
      } else {
        throw new Error('No compatible PDF parser available.');
      }
    } catch (pdfErr) {
      throw new Error(`Failed to parse PDF document: ${pdfErr.message}`);
    }
  } else if (isImage) {
    try {
      const { data } = await Tesseract.recognize(fileBuffer, 'eng', {
        logger: () => {}, // silent
      });
      extractedText = (data?.text || '').trim();
    } catch (ocrErr) {
      throw new Error(`Failed to perform OCR on image: ${ocrErr.message}`);
    }
  } else {
    throw new Error(
      `Unsupported file type "${mimeType || originalName}". Supported formats: PDF, PNG, JPG, JPEG.`
    );
  }

  if (!extractedText || extractedText.length < 5) {
    throw new Error(
      'Unable to extract legible text from this document. Please ensure the document is clear, well-lit, and not corrupted.'
    );
  }

  return extractedText;
}

/**
 * Send extracted document text to Groq LLM to convert into structured ERP invoice JSON
 */
export async function analyzeInvoiceWithGroq(extractedText) {
  const groq = getGroqClient();
  const model = getModel();

  const currentDate = new Date().toISOString().split('T')[0];

  const systemPrompt = `You are FinEdge ERP's AI Invoice Data Extraction Engine.
Your task is to analyze the raw text extracted from an invoice document and return a structured, clean JSON object.

Extract into strictly valid JSON matching this schema:
{
  "invoiceType": "vendor_bill" or "customer_invoice",
  "invoiceNumber": "string or empty if missing",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or null",
  "vendorName": "string or empty",
  "customerName": "string or empty",
  "items": [
    {
      "productName": "clean product title",
      "quantity": 1,
      "unitPrice": 100.00,
      "tax": 0.00,
      "total": 100.00
    }
  ],
  "subtotal": 100.00,
  "tax": 0.00,
  "total": 100.00,
  "currency": "INR",
  "confidence": "high" | "medium" | "low",
  "notes": "brief observation or empty"
}

Extraction guidelines:
1. Determine invoiceType:
   - If the document is an invoice/bill received from an external vendor or supplier (e.g. Azure Furniture, Office Supplies Co), set "vendor_bill".
   - If the document is a sales invoice issued to a client/customer (e.g. Nimesh Pathak), set "customer_invoice".
2. If invoiceDate is missing or unparseable, use "${currentDate}".
3. Ensure all numeric amounts are numbers, NOT strings.
4. If tax is not explicitly separated, set tax to 0.00 and subtotal equal to total.
5. Parse line items carefully with item name, quantity, unit price, and total.
6. Do NOT include markdown code fences (\`\`\`json or \`\`\`). Return ONLY the pure JSON string.`;

  const request = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Here is the extracted invoice document text:\n\n${extractedText.slice(
          0,
          8000
        )}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1024,
  };

  let completion;
  try {
    completion = await groq.chat.completions.create({
      ...request,
      response_format: { type: 'json_object' },
    });
  } catch (error) {
    if (error?.status !== 400 && error?.code !== 'json_validate_failed') {
      throw error;
    }
    completion = await groq.chat.completions.create(request);
  }

  const rawJson = completion.choices[0]?.message?.content;
  if (!rawJson) {
    throw new Error('Groq AI returned an empty extraction result.');
  }

  let parsed;
  try {
    const cleaned = rawJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI extraction JSON: ${err.message}`);
  }

  return normalizeExtractedInvoice(parsed, currentDate);
}

function normalizeExtractedInvoice(data, fallbackDate) {
  const invoiceType =
    data.invoiceType === 'vendor_bill' ? 'vendor_bill' : 'customer_invoice';

  const invoiceNumber = String(data.invoiceNumber || '').trim();
  const invoiceDate = /^\d{4}-\d{2}-\d{2}$/.test(data.invoiceDate)
    ? data.invoiceDate
    : fallbackDate;
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)
    ? data.dueDate
    : null;

  const vendorName = String(data.vendorName || '').trim();
  const customerName = String(data.customerName || '').trim();

  const items = Array.isArray(data.items)
    ? data.items.map((item, idx) => {
        const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
        const unitPrice = Math.max(0, parseFloat(item.unitPrice) || 0);
        const tax = Math.max(0, parseFloat(item.tax) || 0);
        const lineTotal =
          item.total !== undefined && !isNaN(item.total)
            ? Math.max(0, parseFloat(item.total))
            : qty * unitPrice;

        return {
          id: idx + 1,
          productName: String(item.productName || `Item #${idx + 1}`).trim(),
          quantity: qty,
          unitPrice: Number(unitPrice.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total: Number(lineTotal.toFixed(2)),
        };
      })
    : [];

  let subtotal =
    data.subtotal !== undefined && !isNaN(data.subtotal)
      ? Math.max(0, parseFloat(data.subtotal))
      : items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  let tax =
    data.tax !== undefined && !isNaN(data.tax)
      ? Math.max(0, parseFloat(data.tax))
      : items.reduce((sum, it) => sum + it.tax, 0);

  let total =
    data.total !== undefined && !isNaN(data.total)
      ? Math.max(0, parseFloat(data.total))
      : subtotal + tax;

  return {
    invoiceType,
    invoiceNumber,
    invoiceDate,
    dueDate,
    vendorName,
    customerName,
    partyName:
      invoiceType === 'vendor_bill'
        ? vendorName || customerName
        : customerName || vendorName,
    items,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(total.toFixed(2)),
    confidence: data.confidence || 'medium',
    notes: data.notes || '',
  };
}

/**
 * Fuzzy match extracted contact and products against existing Prisma records
 */
export async function matchErpEntities(invoiceData) {
  const result = { ...invoiceData };

  // 1. Match Contact
  const partyNameToFind = result.partyName;
  let matchedContact = null;

  if (partyNameToFind) {
    const existingContacts = await prisma.contact.findMany({
      select: { id: true, name: true, type: true, email: true },
    });

    const lowerParty = partyNameToFind.toLowerCase();
    matchedContact = existingContacts.find(
      (c) =>
        c.name.toLowerCase() === lowerParty ||
        lowerParty.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(lowerParty)
    );
  }

  result.matchedContact = matchedContact
    ? {
        id: matchedContact.id,
        name: matchedContact.name,
        type: matchedContact.type,
      }
    : null;
  result.isNewContact = !matchedContact;

  // 2. Match Products
  const existingProducts = await prisma.product.findMany({
    select: { id: true, name: true, type: true, salesPrice: true, cost: true, category: true },
  });

  result.items = result.items.map((item) => {
    const lowerItem = item.productName.toLowerCase();
    const match = existingProducts.find(
      (p) =>
        p.name.toLowerCase() === lowerItem ||
        lowerItem.includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(lowerItem)
    );

    return {
      ...item,
      matchedProductId: match ? match.id : null,
      matchedProductName: match ? match.name : null,
      isNewProduct: !match,
    };
  });

  return result;
}

/**
 * Validate numeric values, line item counts, and consistency
 */
export function validateInvoiceData(invoiceData) {
  const warnings = [];
  const errors = [];

  if (!invoiceData.partyName && !invoiceData.vendorName && !invoiceData.customerName) {
    warnings.push('Contact / party name was not detected. Please enter a name.');
  }

  if (!Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
    errors.push('The invoice contains no line items.');
  } else {
    for (const item of invoiceData.items) {
      if (!item.productName) {
        warnings.push(`Item #${item.id} has an empty product name.`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item "${item.productName}" quantity must be greater than 0.`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item "${item.productName}" unit price cannot be negative.`);
      }
    }
  }

  // Arithmetic check
  const calculatedItemsSum = invoiceData.items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );

  const roundedItemsSum = Math.round(calculatedItemsSum * 100) / 100;
  const roundedSubtotal = Math.round((invoiceData.subtotal || 0) * 100) / 100;

  if (Math.abs(roundedItemsSum - roundedSubtotal) > 1.0) {
    warnings.push(
      `Line items sum (₹${roundedItemsSum}) does not match the stated subtotal (₹${roundedSubtotal}).`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export const ocrService = {
  extractTextFromFile,
  analyzeInvoiceWithGroq,
  matchErpEntities,
  validateInvoiceData,
};

export default ocrService;
