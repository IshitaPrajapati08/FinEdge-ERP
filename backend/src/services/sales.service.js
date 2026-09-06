import { prisma } from '../lib/prisma.js';
import { money, moneyStr } from '../lib/money.js';
import { accountingService } from './accounting.service.js';

function isCustomerType(type) {
  const t = (type || '').toLowerCase();
  return t === 'customer' || t === 'both';
}

export function calculateSalesLineTotal(line) {
  const subtotal = money(line.qty).times(money(line.unitPrice));
  const taxPercent = money(line.tax || 0);
  const taxAmount = subtotal.times(taxPercent).div(100);
  return subtotal.plus(taxAmount);
}

export function calculateSalesTotals(lines) {
  let subtotal = money(0);
  let tax = money(0);
  for (const line of lines) {
    const lineSubtotal = money(line.qty).times(money(line.unitPrice));
    const lineTax = lineSubtotal.times(money(line.tax || 0)).div(100);
    subtotal = subtotal.plus(lineSubtotal);
    tax = tax.plus(lineTax);
  }
  return {
    subtotal,
    tax,
    total: subtotal.plus(tax),
  };
}

const accountCache = new Map();
const journalCache = new Map();

async function requireAccount(client, name) {
  if (accountCache.has(name)) {
    return accountCache.get(name);
  }
  const account = await client.account.findUnique({ where: { name } });
  if (!account) {
    throw new Error(`Required account '${name}' not found`);
  }
  accountCache.set(name, account);
  return account;
}

async function requireJournal(client, name) {
  if (journalCache.has(name)) {
    return journalCache.get(name);
  }
  const journal = await client.journal.findUnique({ where: { name } });
  if (!journal) {
    throw new Error(`Required journal '${name}' not found`);
  }
  journalCache.set(name, journal);
  return journal;
}

function serializeSalesOrder(so) {
  if (!so) return so;
  const totals = calculateSalesTotals(so.lines || []);
  return {
    ...so,
    subtotal: moneyStr(totals.subtotal),
    taxTotal: moneyStr(totals.tax),
    total: moneyStr(totals.total),
  };
}

function invoiceTotals(invoice) {
  return calculateSalesTotals(invoice.salesOrder?.lines || []);
}

function paymentsSum(payments) {
  return (payments || []).reduce(
    (sum, p) => sum.plus(money(p.amount)),
    money(0)
  );
}

function serializeCustomerInvoice(invoice) {
  if (!invoice) return invoice;
  const totals = invoiceTotals(invoice);
  const paid = paymentsSum(invoice.payments);
  const outstanding = totals.total.minus(paid);
  
  // Serialize nested objects to ensure JSON compatibility
  return JSON.parse(JSON.stringify({
    ...invoice,
    subtotal: moneyStr(totals.subtotal),
    taxTotal: moneyStr(totals.tax),
    total: moneyStr(totals.total),
    amountPaid: moneyStr(paid),
    outstanding: moneyStr(outstanding),
    invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.toISOString() : null,
    createdAt: invoice.createdAt ? invoice.createdAt.toISOString() : null,
    updatedAt: invoice.updatedAt ? invoice.updatedAt.toISOString() : null,
  }));
}

export const salesService = {
  async createSalesOrder(customerId, lines) {
    if (!customerId) {
      throw new Error('Customer not found');
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error('At least one line item is required');
    }

    const customer = await prisma.contact.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (!isCustomerType(customer.type)) {
      throw new Error('Customer not found');
    }

    const productIds = lines.map((l) => l.productId).filter(Boolean);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(existingProducts.map((p) => [p.id, p]));

    for (const line of lines) {
      if (!line.productId) {
        throw new Error('Product not found');
      }

      const qty = Number(line.qty);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      if (money(line.unitPrice).lessThan(0)) {
        throw new Error('Unit price cannot be negative');
      }

      if (money(line.tax || 0).lessThan(0)) {
        throw new Error('Tax cannot be negative');
      }

      const product = productMap.get(line.productId);
      if (!product) {
        throw new Error('Product not found');
      }
    }

    const so = await prisma.salesOrder.create({
      data: {
        customerId,
        status: 'DRAFT',
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            qty: Number(line.qty),
            unitPrice: moneyStr(line.unitPrice),
            tax: moneyStr(line.tax || 0),
          })),
        },
      },
      include: {
        customer: true,
        lines: { include: { product: true } },
      },
    });

    return serializeSalesOrder(so);
  },

  async confirmSalesOrder(soId) {
    const so = await prisma.salesOrder.findUnique({
      where: { id: soId },
    });

    if (!so) {
      throw new Error('Sales Order not found');
    }

    if (so.status !== 'DRAFT') {
      throw new Error(`Cannot confirm Sales Order with status ${so.status}`);
    }

    const updated = await prisma.salesOrder.update({
      where: { id: soId },
      data: { status: 'CONFIRMED' },
      include: {
        customer: true,
        lines: { include: { product: true } },
        customerInvoice: true,
      },
    });

    return serializeSalesOrder(updated);
  },

  /**
   * Tax handling (MVP): SalesOrderLine.tax is a percentage.
   * Invoice total = subtotal + (subtotal * tax% / 100).
   * That total is posted to Debtors / Sales Income.
   * There is no dedicated Tax/GST account.
   */
  async generateCustomerInvoice(salesOrderId, options = {}) {
    // 1. Pre-fetch required static accounts & journal outside transaction
    const [debtorsAccount, salesIncomeAccount, journal] = await Promise.all([
      requireAccount(prisma, 'Debtors'),
      requireAccount(prisma, 'Sales Income'),
      requireJournal(prisma, 'Sales Journal'),
    ]);

    return prisma.$transaction(
      async (tx) => {
        const so = await tx.salesOrder.findUnique({
          where: { id: salesOrderId },
          include: {
            lines: { include: { product: true } },
            customer: true,
            customerInvoice: true,
          },
        });

        if (!so) {
          throw new Error('Sales Order not found');
        }

        if (so.customerInvoice) {
          throw new Error('Sales order already invoiced');
        }

        if (so.status !== 'DRAFT' && so.status !== 'CONFIRMED') {
          throw new Error('Sales order already invoiced');
        }

        if (so.lines.length === 0) {
          throw new Error('Sales Order must have at least one line item');
        }

        const totals = calculateSalesTotals(so.lines);
        const invoiceDate = options.invoiceDate ? new Date(options.invoiceDate) : new Date();
        const dueDate = options.dueDate ? new Date(options.dueDate) : null;

        const journalEntry = await accountingService.createJournalEntry(
          journal.id,
          invoiceDate,
          `SO-${salesOrderId}`,
          [
            {
              accountId: debtorsAccount.id,
              debit: moneyStr(totals.total),
              credit: 0,
            },
            {
              accountId: salesIncomeAccount.id,
              debit: 0,
              credit: moneyStr(totals.total),
            },
          ],
          tx
        );

        const invoice = await tx.customerInvoice.create({
          data: {
            salesOrderId,
            invoiceDate,
            dueDate,
            journalEntryId: journalEntry.id,
            status: 'POSTED',
          },
          include: {
            salesOrder: {
              include: {
                customer: true,
                lines: { include: { product: true } },
              },
            },
            journalEntry: {
              include: {
                journal: true,
                items: { include: { account: true } },
              },
            },
            payments: true,
          },
        });

        await tx.salesOrder.update({
          where: { id: salesOrderId },
          data: { status: 'INVOICED' },
        });

        return serializeCustomerInvoice(invoice);
      },
      { maxWait: 15000, timeout: 60000 }
    );
  },

  async recordCustomerPayment(invoiceId, amount, paymentType) {
    const type = (paymentType || '').toLowerCase();
    if (!['cash', 'bank'].includes(type)) {
      throw new Error('Payment type must be cash or bank');
    }

    const debtorsAccount = await requireAccount(prisma, 'Debtors');
    const paymentAccountName = type === 'cash' ? 'Cash' : 'Bank';
    const paymentAccount = await requireAccount(prisma, paymentAccountName);
    const journalName = type === 'cash' ? 'Cash Journal' : 'Bank Journal';
    const journal = await requireJournal(prisma, journalName);

    return prisma.$transaction(
      async (tx) => {
        const invoice = await tx.customerInvoice.findUnique({
          where: { id: invoiceId },
          include: {
            salesOrder: { include: { lines: true } },
            payments: true,
          },
        });

        if (!invoice) {
          throw new Error('Customer Invoice not found');
        }

        if (invoice.status === 'PAID') {
          throw new Error('Invoice is already paid');
        }

        const totals = invoiceTotals(invoice);
        const alreadyPaid = paymentsSum(invoice.payments);
        const outstanding = totals.total.minus(alreadyPaid);
        const paymentAmount = money(amount);

        if (paymentAmount.lessThanOrEqualTo(0)) {
          throw new Error('Payment amount must be greater than 0');
        }

        if (paymentAmount.greaterThan(outstanding)) {
          throw new Error('Payment amount exceeds outstanding amount');
        }

        const journalEntry = await accountingService.createJournalEntry(
          journal.id,
          new Date(),
          `CUSTOMER-PAYMENT-${invoiceId}`,
          [
            {
              accountId: paymentAccount.id,
              debit: moneyStr(paymentAmount),
              credit: 0,
            },
            {
              accountId: debtorsAccount.id,
              debit: 0,
              credit: moneyStr(paymentAmount),
            },
          ],
          tx
        );

        const payment = await tx.payment.create({
          data: {
            type,
            amount: moneyStr(paymentAmount),
            linkedInvoiceId: invoiceId,
            journalEntryId: journalEntry.id,
            status: 'RECORDED',
          },
        });

        const newPaid = alreadyPaid.plus(paymentAmount);
        const fullyPaid =
          newPaid.equals(totals.total) ||
          newPaid.greaterThanOrEqualTo(totals.total);

        if (fullyPaid) {
          await tx.customerInvoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID' },
          });
        }

        return {
          payment,
          journalEntry,
          invoiceStatus: fullyPaid ? 'PAID' : 'POSTED',
        };
      },
      { maxWait: 15000, timeout: 60000 }
    );
  },

  async getAllSalesOrders() {
    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        lines: { include: { product: true } },
        customerInvoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(serializeSalesOrder);
  },

  async getSalesOrderById(soId) {
    const so = await prisma.salesOrder.findUnique({
      where: { id: soId },
      include: {
        customer: true,
        lines: { include: { product: true } },
        customerInvoice: true,
      },
    });
    return serializeSalesOrder(so);
  },

  async getAllCustomerInvoices() {
    const invoices = await prisma.customerInvoice.findMany({
      include: {
        salesOrder: {
          include: {
            customer: true,
            lines: { include: { product: true } },
          },
        },
        journalEntry: {
          include: {
            journal: true,
            items: { include: { account: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map(serializeCustomerInvoice);
  },

  async getCustomerInvoiceById(invoiceId) {
    const invoice = await prisma.customerInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        salesOrder: {
          include: {
            customer: true,
            lines: { include: { product: true } },
          },
        },
        journalEntry: {
          include: {
            journal: true,
            items: { include: { account: true } },
          },
        },
        payments: true,
      },
    });
    return serializeCustomerInvoice(invoice);
  },
};

export default salesService;

