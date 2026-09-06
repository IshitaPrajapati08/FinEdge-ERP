import { prisma } from '../lib/prisma.js';
import { money, moneyStr } from '../lib/money.js';

const journalByIdCache = new Map();
const accountByIdCache = new Map();

/**
 * Central accounting engine.
 * The ONLY module allowed to create JournalEntry and JournalItem records.
 */
export const accountingService = {
  /**
   * Create a balanced journal entry with items.
   *
   * @param {number} journalId
   * @param {Date|string|null} date
   * @param {string|null} reference
   * @param {Array<{accountId: number, debit: any, credit: any}>} items
   * @param {import('@prisma/client').Prisma.TransactionClient} [txClient]
   */
  async createJournalEntry(journalId, date, reference, items, txClient) {
    // Backward-compatible: createJournalEntry(journalId, items, reference)
    if (Array.isArray(date)) {
      items = date;
      reference = reference ?? null;
      date = new Date();
    }

    const execute = async (tx) => {
      if (!journalId) {
        throw new Error('Journal ID is required');
      }

      if (!Array.isArray(items) || items.length < 2) {
        throw new Error('At least two journal items are required');
      }

      let journal = journalByIdCache.get(journalId);
      if (!journal) {
        journal = await tx.journal.findUnique({
          where: { id: journalId },
        });
        if (journal) {
          journalByIdCache.set(journalId, journal);
        }
      }

      if (!journal) {
        throw new Error('Required journal not found');
      }

      // Batch load missing accounts to avoid sequential queries
      const missingAccountIds = items
        .map((i) => i.accountId)
        .filter((id) => id && !accountByIdCache.has(id));

      if (missingAccountIds.length > 0) {
        const uniqueIds = [...new Set(missingAccountIds)];
        const fetchedAccounts = await tx.account.findMany({
          where: { id: { in: uniqueIds } },
        });
        fetchedAccounts.forEach((acc) => accountByIdCache.set(acc.id, acc));
      }

      let totalDebit = money(0);
      let totalCredit = money(0);
      const validatedItems = [];

      for (const item of items) {
        if (!item.accountId) {
          throw new Error('Account ID is required for each item');
        }

        const account = accountByIdCache.get(item.accountId);

        if (!account) {
          throw new Error('Required account not found');
        }

        const debit = money(item.debit || 0);
        const credit = money(item.credit || 0);

        if (debit.lessThan(0)) {
          throw new Error('Debit cannot be negative');
        }
        if (credit.lessThan(0)) {
          throw new Error('Credit cannot be negative');
        }

        if (debit.greaterThan(0) && credit.greaterThan(0)) {
          throw new Error(
            `Account ${account.name}: Cannot have both debit and credit`
          );
        }

        if (debit.equals(0) && credit.equals(0)) {
          throw new Error(
            `Account ${account.name}: Journal item must have a debit or a credit`
          );
        }

        validatedItems.push({
          accountId: item.accountId,
          debit: moneyStr(debit),
          credit: moneyStr(credit),
        });

        totalDebit = totalDebit.plus(debit);
        totalCredit = totalCredit.plus(credit);
      }

      if (totalDebit.toFixed(2) !== totalCredit.toFixed(2)) {
        throw new Error('Debit and credit totals do not match');
      }

      const entry = await tx.journalEntry.create({
        data: {
          journalId,
          date: date ? new Date(date) : new Date(),
          reference: reference ?? null,
          status: 'POSTED',
        },
      });

      await Promise.all(
        validatedItems.map((item) =>
          tx.journalItem.create({
            data: {
              entryId: entry.id,
              accountId: item.accountId,
              debit: item.debit,
              credit: item.credit,
            },
          })
        )
      );

      return tx.journalEntry.findUnique({
        where: { id: entry.id },
        include: {
          journal: true,
          items: {
            include: {
              account: true,
            },
          },
        },
      });
    };

    if (txClient) {
      return execute(txClient);
    }

    return prisma.$transaction(execute, { maxWait: 15000, timeout: 60000 });
  },

  async getAllJournalEntries() {
    return prisma.journalEntry.findMany({
      include: {
        journal: true,
        items: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  },

  async getJournalEntryById(id) {
    return prisma.journalEntry.findUnique({
      where: { id },
      include: {
        journal: true,
        items: {
          include: {
            account: true,
          },
        },
      },
    });
  },

  async getLedgerForAccount(accountId) {
    const items = await prisma.journalItem.findMany({
      where: { accountId },
      include: {
        entry: {
          include: {
            journal: true,
          },
        },
        account: true,
      },
      orderBy: [
        { entry: { date: 'asc' } },
        { id: 'asc' },
      ],
    });

    let balance = money(0);
    return items.map((item) => {
      const debit = money(item.debit);
      const credit = money(item.credit);
      const type = (item.account.type || '').toLowerCase();

      if (type === 'asset' || type === 'expense') {
        balance = balance.plus(debit).minus(credit);
      } else {
        balance = balance.minus(debit).plus(credit);
      }

      return {
        accountId: item.account.id,
        account: item.account.name,
        accountName: item.account.name,
        accountType: item.account.type,
        date: item.entry.date,
        journal: item.entry.journal.name,
        journalName: item.entry.journal.name,
        reference: item.entry.reference,
        debit: moneyStr(item.debit),
        credit: moneyStr(item.credit),
        runningBalance: moneyStr(balance),
        balance: moneyStr(balance),
      };
    });
  },

  async updateJournalEntry(id, data = {}) {
    const update = {};
    if (data.reference !== undefined) update.reference = data.reference || null;
    if (data.date !== undefined) update.date = new Date(data.date);

    if (Object.keys(update).length === 0) {
      throw new Error('Reference or date is required');
    }

    return prisma.journalEntry.update({
      where: { id },
      data: update,
      include: {
        journal: true,
        items: { include: { account: true } },
      },
    });
  },

  async getCompleteLedger() {
    const items = await prisma.journalItem.findMany({
      include: {
        entry: {
          include: {
            journal: true,
          },
        },
        account: true,
      },
      orderBy: [
        { account: { name: 'asc' } },
        { entry: { date: 'asc' } },
        { id: 'asc' },
      ],
    });

    const balances = new Map();
    return items.map((item) => {
      const debit = money(item.debit);
      const credit = money(item.credit);
      const type = (item.account.type || '').toLowerCase();
      const previous = balances.get(item.account.id) || money(0);
      const balance = type === 'asset' || type === 'expense'
        ? previous.plus(debit).minus(credit)
        : previous.minus(debit).plus(credit);

      balances.set(item.account.id, balance);

      return {
        accountId: item.account.id,
        account: item.account.name,
        accountName: item.account.name,
        accountType: item.account.type,
        date: item.entry.date,
        journal: item.entry.journal.name,
        journalName: item.entry.journal.name,
        reference: item.entry.reference,
        debit: moneyStr(item.debit),
        credit: moneyStr(item.credit),
        runningBalance: moneyStr(balance),
        balance: moneyStr(balance),
      };
    });
  },

  async getLedgerGroupedByAccount() {
    const accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' },
    });

    const grouped = [];
    for (const account of accounts) {
      const entries = await this.getLedgerForAccount(account.id);
      if (entries.length === 0) continue;
      grouped.push({
        account: {
          id: account.id,
          name: account.name,
          type: account.type,
        },
        entries,
        closingBalance:
          entries.length > 0
            ? entries[entries.length - 1].runningBalance
            : '0.00',
      });
    }

    return grouped;
  },
};

export default accountingService;
