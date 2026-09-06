import { prisma } from '../lib/prisma.js';
import { money, moneyStr } from '../lib/money.js';
import { accountingService } from './accounting.service.js';

function isVendorType(type) {
  const t = (type || '').toLowerCase();
  return t === 'vendor' || t === 'both';
}

function lineTotal(line) {
  return money(line.qty).times(money(line.unitPrice));
}

export function calculatePurchaseTotal(lines) {
  return lines.reduce((sum, line) => sum.plus(lineTotal(line)), money(0));
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

function serializePurchaseOrder(po) {
  if (!po) return po;
  const total = calculatePurchaseTotal(po.lines || []);
  return {
    ...po,
    total: moneyStr(total),
  };
}

function billTotalFromLines(bill) {
  const lines = bill.purchaseOrder?.lines || [];
  return calculatePurchaseTotal(lines);
}

function paymentsSum(payments) {
  return (payments || []).reduce(
    (sum, p) => sum.plus(money(p.amount)),
    money(0)
  );
}

function serializeVendorBill(bill) {
  if (!bill) return bill;
  const total = billTotalFromLines(bill);
  const paid = paymentsSum(bill.payments);
  const outstanding = total.minus(paid);
  return {
    ...bill,
    total: moneyStr(total),
    amountPaid: moneyStr(paid),
    outstanding: moneyStr(outstanding),
  };
}

export const purchaseService = {
  async convertPurchaseOrderToVendorBill(purchaseOrderId, options = {}) {
    // 1. Pre-fetch required static accounts & journal outside transaction
    const [purchaseExpenseAccount, creditorsAccount, journal] = await Promise.all([
      requireAccount(prisma, 'Purchase Expense'),
      requireAccount(prisma, 'Creditors'),
      requireJournal(prisma, 'Purchase Journal'),
    ]);

    return prisma.$transaction(
      async (tx) => {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: purchaseOrderId },
          include: {
            lines: { include: { product: true } },
            vendor: true,
            vendorBill: true,
          },
        });

        if (!po) {
          throw new Error('Purchase Order not found');
        }

        if (po.vendorBill) {
          throw new Error('Purchase order already converted to bill');
        }

        if (po.status !== 'DRAFT' && po.status !== 'CONFIRMED') {
          throw new Error('Purchase order already converted to bill');
        }

        if (po.lines.length === 0) {
          throw new Error('Purchase Order must have at least one line item');
        }

        const totalAmount = calculatePurchaseTotal(po.lines);
        const billDate = options.invoiceDate ? new Date(options.invoiceDate) : new Date();
        const dueDate = options.dueDate ? new Date(options.dueDate) : null;

        const journalEntry = await accountingService.createJournalEntry(
          journal.id,
          billDate,
          `PO-${purchaseOrderId}`,
          [
            {
              accountId: purchaseExpenseAccount.id,
              debit: moneyStr(totalAmount),
              credit: 0,
            },
            {
              accountId: creditorsAccount.id,
              debit: 0,
              credit: moneyStr(totalAmount),
            },
          ],
          tx
        );

        const vendorBill = await tx.vendorBill.create({
          data: {
            purchaseOrderId,
            invoiceDate: billDate,
            dueDate,
            journalEntryId: journalEntry.id,
            status: 'POSTED',
          },
          include: {
            purchaseOrder: {
              include: {
                vendor: true,
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

        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: 'BILLED' },
        });

        return serializeVendorBill(vendorBill);
      },
      { maxWait: 15000, timeout: 60000 }
    );
  },

  async recordVendorPayment(billId, amount, paymentType) {
    const type = (paymentType || '').toLowerCase();
    if (!['cash', 'bank'].includes(type)) {
      throw new Error('Payment type must be cash or bank');
    }

    const creditorsAccount = await requireAccount(prisma, 'Creditors');
    const paymentAccountName = type === 'cash' ? 'Cash' : 'Bank';
    const paymentAccount = await requireAccount(prisma, paymentAccountName);
    const journalName = type === 'cash' ? 'Cash Journal' : 'Bank Journal';
    const journal = await requireJournal(prisma, journalName);

    return prisma.$transaction(
      async (tx) => {
        const bill = await tx.vendorBill.findUnique({
          where: { id: billId },
          include: {
            purchaseOrder: { include: { lines: true } },
            payments: true,
          },
        });

        if (!bill) {
          throw new Error('Vendor Bill not found');
        }

        if (bill.status === 'PAID') {
          throw new Error('Bill is already paid');
        }

        const total = billTotalFromLines(bill);
        const alreadyPaid = paymentsSum(bill.payments);
        const outstanding = total.minus(alreadyPaid);
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
          `VENDOR-PAYMENT-${billId}`,
          [
            {
              accountId: creditorsAccount.id,
              debit: moneyStr(paymentAmount),
              credit: 0,
            },
            {
              accountId: paymentAccount.id,
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
            linkedBillId: billId,
            journalEntryId: journalEntry.id,
            status: 'RECORDED',
          },
        });

        const newPaid = alreadyPaid.plus(paymentAmount);
        const fullyPaid = newPaid.equals(total) || newPaid.greaterThanOrEqualTo(total);
        if (fullyPaid) {
          await tx.vendorBill.update({
            where: { id: billId },
            data: { status: 'PAID' },
          });
        }

        return {
          payment,
          journalEntry,
          billStatus: fullyPaid ? 'PAID' : 'POSTED',
        };
      },
      { maxWait: 15000, timeout: 60000 }
    );
  },

  async getAllPurchaseOrders() {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        vendor: true,
        lines: { include: { product: true } },
        vendorBill: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(serializePurchaseOrder);
  },

  async getAllVendorBills() {
    const bills = await prisma.vendorBill.findMany({
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
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
    return bills.map(serializeVendorBill);
  },

  async getVendorBillById(billId) {
    const bill = await prisma.vendorBill.findUnique({
      where: { id: billId },
      include: {
        purchaseOrder: {
          include: {
            vendor: true,
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
    return serializeVendorBill(bill);
  },

  async getPurchaseOrderById(poId) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        vendor: true,
        lines: { include: { product: true } },
        vendorBill: true,
      },
    });
    return serializePurchaseOrder(po);
  },

  async createPurchaseOrder(vendorId, lines) {
    if (!vendorId) {
      throw new Error('Vendor not found');
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      throw new Error('At least one line item is required');
    }

    const vendor = await prisma.contact.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    if (!isVendorType(vendor.type)) {
      throw new Error('Vendor not found');
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

      const product = productMap.get(line.productId);
      if (!product) {
        throw new Error('Product not found');
      }
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        vendorId,
        status: 'DRAFT',
        lines: {
          create: lines.map((line) => ({
            productId: line.productId,
            qty: Number(line.qty),
            unitPrice: moneyStr(line.unitPrice),
          })),
        },
      },
      include: {
        vendor: true,
        lines: { include: { product: true } },
      },
    });

    return serializePurchaseOrder(po);
  },

  async confirmPurchaseOrder(poId) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new Error(
        `Cannot confirm Purchase Order with status ${po.status}`
      );
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'CONFIRMED' },
      include: {
        vendor: true,
        lines: { include: { product: true } },
        vendorBill: true,
      },
    });

    return serializePurchaseOrder(updated);
  },
};

export default purchaseService;
