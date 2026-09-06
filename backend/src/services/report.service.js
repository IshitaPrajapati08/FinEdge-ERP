import { prisma } from '../lib/prisma.js';
import { money, moneyStr } from '../lib/money.js';
import { accountingService } from './accounting.service.js';

function accountBalance(type, debit, credit) {
  const t = (type || '').toLowerCase();
  if (t === 'asset' || t === 'expense') {
    return debit.minus(credit);
  }
  return credit.minus(debit);
}

async function loadAccountBalances() {
  const items = await prisma.journalItem.findMany({
    include: { account: true },
  });

  const accountBalances = {};

  for (const item of items) {
    if (!accountBalances[item.accountId]) {
      accountBalances[item.accountId] = {
        account: item.account,
        debit: money(0),
        credit: money(0),
      };
    }

    accountBalances[item.accountId].debit = accountBalances[
      item.accountId
    ].debit.plus(money(item.debit));
    accountBalances[item.accountId].credit = accountBalances[
      item.accountId
    ].credit.plus(money(item.credit));
  }

  return accountBalances;
}

export const reportService = {
  async getProfitAndLoss(period = 'all') {
    const items = await prisma.journalItem.findMany({
      include: { account: true, entry: true },
    });

    let totalRevenue = money(0);
    let totalExpenses = money(0);

    for (const item of items) {
      const debit = money(item.debit);
      const credit = money(item.credit);
      const type = (item.account.type || '').toLowerCase();

      if (type === 'income') {
        totalRevenue = totalRevenue.plus(credit).minus(debit);
      } else if (type === 'expense') {
        totalExpenses = totalExpenses.plus(debit).minus(credit);
      }
    }

    const netProfit = totalRevenue.minus(totalExpenses);

    return {
      period: period || 'all',
      totalRevenue: moneyStr(totalRevenue),
      totalExpenses: moneyStr(totalExpenses),
      netProfit: moneyStr(netProfit),
      totalIncome: moneyStr(totalRevenue),
      totalExpense: moneyStr(totalExpenses),
    };
  },

  async getBalanceSheet() {
    const accountBalances = await loadAccountBalances();

    let totalAssets = money(0);
    let totalLiabilities = money(0);
    let totalCapital = money(0);

    const assets = [];
    const liabilities = [];
    const capital = [];

    for (const accountId in accountBalances) {
      const { account, debit, credit } = accountBalances[accountId];
      const balance = accountBalance(account.type, debit, credit);
      const accountData = {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: moneyStr(balance),
      };

      const type = (account.type || '').toLowerCase();
      if (type === 'asset') {
        assets.push(accountData);
        totalAssets = totalAssets.plus(balance);
      } else if (type === 'liability') {
        liabilities.push(accountData);
        totalLiabilities = totalLiabilities.plus(balance);
      } else if (type === 'capital') {
        capital.push(accountData);
        totalCapital = totalCapital.plus(balance);
      }
    }

    const pl = await this.getProfitAndLoss();
    const currentPeriodProfit = money(pl.netProfit);
    const equitySide = totalLiabilities
      .plus(totalCapital)
      .plus(currentPeriodProfit);
    const balanced = moneyStr(totalAssets) === moneyStr(equitySide);

    return {
      assets: {
        items: assets,
        total: moneyStr(totalAssets),
      },
      liabilities: {
        items: liabilities,
        total: moneyStr(totalLiabilities),
      },
      capital: {
        items: capital,
        total: moneyStr(totalCapital),
      },
      totalAssets: moneyStr(totalAssets),
      totalLiabilities: moneyStr(totalLiabilities),
      totalCapital: moneyStr(totalCapital),
      currentPeriodProfit: moneyStr(currentPeriodProfit),
      netProfit: moneyStr(currentPeriodProfit),
      totalCapitalWithPL: moneyStr(totalCapital.plus(currentPeriodProfit)),
      totalLiabilitiesAndCapital: moneyStr(equitySide),
      balanced,
      isBalanced: balanced,
    };
  },

  async getDashboardSummary() {
    const pl = await this.getProfitAndLoss();
    const accountBalances = await loadAccountBalances();

    let cashBalance = money(0);
    let bankBalance = money(0);
    let receivables = money(0);
    let payables = money(0);

    for (const accountId in accountBalances) {
      const { account, debit, credit } = accountBalances[accountId];
      const balance = accountBalance(account.type, debit, credit);
      const displayBalance = balance.lessThan(0) ? money(0) : balance;

      if (account.name === 'Cash') cashBalance = displayBalance;
      if (account.name === 'Bank') bankBalance = displayBalance;
      if (account.name === 'Debtors') receivables = displayBalance;
      if (account.name === 'Creditors') payables = displayBalance;
    }

    const recentJournalEntries = await prisma.journalEntry.findMany({
      take: 10,
      include: {
        journal: true,
        items: { include: { account: true } },
      },
      orderBy: { date: 'desc' },
    });

    return {
      totalRevenue: pl.totalRevenue,
      totalExpenses: pl.totalExpenses,
      netProfit: pl.netProfit,
      revenue: pl.totalRevenue,
      expenses: pl.totalExpenses,
      cashBalance: moneyStr(cashBalance),
      bankBalance: moneyStr(bankBalance),
      receivables: moneyStr(receivables),
      payables: moneyStr(payables),
      recentTransactions: recentJournalEntries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        journal: entry.journal.name,
        journalName: entry.journal.name,
        reference: entry.reference,
        status: entry.status,
        items: entry.items,
      })),
    };
  },

  async getLedger(accountId = null) {
    if (accountId) {
      return accountingService.getLedgerForAccount(accountId);
    }
    return accountingService.getCompleteLedger();
  },

  async getAccountBalances() {
    const accountBalances = await loadAccountBalances();
    const results = [];

    for (const accountId in accountBalances) {
      const { account, debit, credit } = accountBalances[accountId];
      const balance = accountBalance(account.type, debit, credit);
      results.push({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: moneyStr(balance),
        debit: moneyStr(debit),
        credit: moneyStr(credit),
      });
    }

    return results;
  },
};

export default reportService;
