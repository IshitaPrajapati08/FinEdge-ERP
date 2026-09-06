import { prisma } from '../lib/prisma.js';
import Decimal from 'decimal.js';
import { salesService } from './sales.service.js';
import { purchaseService } from './purchase.service.js';

export const invoiceCreatorService = {
  /**
   * Confirm and create an ERP Customer Invoice or Vendor Bill using existing Prisma services
   */
  async confirmAndCreateInvoice(payload, user) {
    const {
      invoiceType = 'customer_invoice',
      partyName,
      invoiceDate,
      dueDate,
      invoiceNumber,
      items = [],
    } = payload;

    if (!partyName || typeof partyName !== 'string' || partyName.trim() === '') {
      throw new Error('Customer or Vendor name is required.');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('At least one invoice line item is required.');
    }

    // 1. Resolve Contact (Customer or Vendor)
    const trimmedParty = partyName.trim();
    let contact = await prisma.contact.findFirst({
      where: {
        name: {
          equals: trimmedParty,
          mode: 'insensitive',
        },
      },
    });

    if (!contact) {
      const requiredType =
        invoiceType === 'vendor_bill' ? 'vendor' : 'customer';

      contact = await prisma.contact.create({
        data: {
          name: trimmedParty,
          type: requiredType,
        },
      });
    }

    // 2. Batch resolve Products by ID if present
    const productIdsToFetch = items
      .map((it) => parseInt(it.productId, 10))
      .filter((id) => Number.isInteger(id) && id > 0);

    let productMapById = new Map();
    if (productIdsToFetch.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIdsToFetch } },
      });
      productMapById = new Map(products.map((p) => [p.id, p]));
    }

    const resolvedLines = [];

    for (let i = 0; i < items.length; i++) {
      const line = items[i];
      const pName = String(line.productName || `Item #${i + 1}`).trim();
      const qty = Math.max(1, parseInt(line.quantity, 10) || 1);
      const unitPrice = Math.max(0, parseFloat(line.unitPrice) || 0);
      const tax = Math.max(0, parseFloat(line.tax) || 0);

      let product = null;

      if (line.productId) {
        product = productMapById.get(parseInt(line.productId, 10)) || null;
      }

      if (!product) {
        product = await prisma.product.findFirst({
          where: {
            name: {
              equals: pName,
              mode: 'insensitive',
            },
          },
        });
      }

      if (!product) {
        const estimatedCost = Math.round(unitPrice * 0.6 * 100) / 100;
        product = await prisma.product.create({
          data: {
            name: pName,
            type: 'furniture',
            salesPrice: new Decimal(unitPrice).toFixed(2),
            cost: new Decimal(estimatedCost).toFixed(2),
            category: 'general',
          },
        });
      }

      resolvedLines.push({
        productId: product.id,
        productName: product.name,
        qty,
        unitPrice,
        tax,
      });
    }

    // 3. Create either Customer Invoice or Vendor Bill using existing services
    if (invoiceType === 'vendor_bill') {
      const poLines = resolvedLines.map((l) => ({
        productId: l.productId,
        qty: l.qty,
        unitPrice: l.unitPrice,
      }));

      const po = await purchaseService.createPurchaseOrder(contact.id, poLines);
      await purchaseService.confirmPurchaseOrder(po.id);
      const bill = await purchaseService.convertPurchaseOrderToVendorBill(po.id, {
        invoiceDate,
        dueDate,
      });

      return {
        success: true,
        invoiceType: 'vendor_bill',
        id: bill.id,
        orderId: po.id,
        invoiceNumber: invoiceNumber || `BILL-${bill.id}`,
        contactName: contact.name,
        status: bill.status,
        date: invoiceDate || new Date().toISOString().split('T')[0],
      };
    } else {
      const soLines = resolvedLines.map((l) => ({
        productId: l.productId,
        qty: l.qty,
        unitPrice: l.unitPrice,
        tax: l.tax,
      }));

      const so = await salesService.createSalesOrder(contact.id, soLines);
      await salesService.confirmSalesOrder(so.id);
      const invoice = await salesService.generateCustomerInvoice(so.id, {
        invoiceDate,
        dueDate,
      });

      return {
        success: true,
        invoiceType: 'customer_invoice',
        id: invoice.id,
        orderId: so.id,
        invoiceNumber: invoiceNumber || `INV-${invoice.id}`,
        contactName: contact.name,
        status: invoice.status,
        date: invoiceDate || new Date().toISOString().split('T')[0],
      };
    }
  },
};

export default invoiceCreatorService;
