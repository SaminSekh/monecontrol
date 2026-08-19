// ============================================
// db.js — localStorage Database Layer
// ============================================

const DB_KEYS = {
  accounts: 'mf_accounts',
  transactions: 'mf_transactions',
  loansLent: 'mf_loans_lent',
  loansBorrowed: 'mf_loans_borrowed',
  loanRepayments: 'mf_loan_repayments',
  payments: 'mf_payments',
  paymentInstallments: 'mf_payment_installments',
  insurance: 'mf_insurance',
  insurancePayments: 'mf_insurance_payments',
  freelanceClients: 'mf_freelance_clients',
  freelanceTxns: 'mf_freelance_txns',
  settings: 'mf_settings',
  liveSettings: 'mf_live_settings'
};

// ---- UUID Generator ----
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ---- Base read/write ----
function dbGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function dbSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Storage error:', e);
    return false;
  }
}

function dbGetObj(key, def = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch { return def; }
}

function dbSetObj(key, obj) {
  try {
    localStorage.setItem(key, JSON.stringify(obj));
    return true;
  } catch { return false; }
}

// ---- Generic CRUD ----
function dbList(key) { return dbGet(key); }
function dbFind(key, id) { return dbGet(key).find(x => x.id === id) || null; }

function dbInsert(key, data) {
  const arr = dbGet(key);
  const now = new Date().toISOString();
  const record = { id: uuid(), createdAt: now, updatedAt: now, ...data };
  arr.push(record);
  dbSet(key, arr);
  return record;
}

function dbUpdate(key, id, changes) {
  const arr = dbGet(key);
  const idx = arr.findIndex(x => x.id === id);
  if (idx === -1) return null;
  arr[idx] = { ...arr[idx], ...changes, updatedAt: new Date().toISOString() };
  dbSet(key, arr);
  return arr[idx];
}

function dbDelete(key, id) {
  const arr = dbGet(key).filter(x => x.id !== id);
  dbSet(key, arr);
  return true;
}

// ============================================
// ACCOUNTS
// ============================================
const Accounts = {
  list: () => dbList(DB_KEYS.accounts),
  find: (id) => dbFind(DB_KEYS.accounts, id),
  create: (data) => dbInsert(DB_KEYS.accounts, data),
  update: (id, data) => dbUpdate(DB_KEYS.accounts, id, data),
  delete: (id) => {
    dbDelete(DB_KEYS.accounts, id);
    const arr = dbGet(DB_KEYS.transactions).filter(t => t.accountId !== id && t.fromAccountId !== id && t.toAccountId !== id);
    dbSet(DB_KEYS.transactions, arr);
  },

  totalBalance() {
    return this.list().reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
  },

  cashTotal() {
    return this.list()
      .filter(a => a.type === 'cash')
      .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
  },

  bankTotal() {
    return this.list()
      .filter(a => a.type !== 'cash')
      .reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
  }
};

// ============================================
// TRANSACTIONS
// ============================================
const Transactions = {
  list: () => dbList(DB_KEYS.transactions),
  find: (id) => dbFind(DB_KEYS.transactions, id),
  create: (data) => dbInsert(DB_KEYS.transactions, data),
  delete: (id) => {
    const t = dbFind(DB_KEYS.transactions, id);
    if (t) Transactions.reverseTransaction(t);
    dbDelete(DB_KEYS.transactions, id);
  },

  reverseTransaction(t) {
    if (!t) return;
    let amt = parseFloat(t.amount) || 0;
    if (t.type === 'transfer') {
      const fromAcc = Accounts.find(t.fromAccountId);
      if (fromAcc) Accounts.update(t.fromAccountId, { balance: (parseFloat(fromAcc.balance) || 0) + amt });
      const toAcc = Accounts.find(t.toAccountId);
      if (toAcc) Accounts.update(t.toAccountId, { balance: (parseFloat(toAcc.balance) || 0) - amt });
    } else if (t.accountId) {
      const acc = Accounts.find(t.accountId);
      if (!acc) return;
      if (t.type === 'income' || t.type === 'repayment_received' || t.type === 'borrowed') {
        Accounts.update(t.accountId, { balance: (parseFloat(acc.balance) || 0) - amt });
      } else if (t.type === 'expense' || t.type === 'repayment_made' || t.type === 'lent') {
        Accounts.update(t.accountId, { balance: (parseFloat(acc.balance) || 0) + amt });
      }
    }
  },

  deleteByReference(refId) {
    const txns = dbGet(DB_KEYS.transactions).filter(t => t.referenceId === refId);
    txns.forEach(t => Transactions.reverseTransaction(t));
    const remaining = dbGet(DB_KEYS.transactions).filter(t => t.referenceId !== refId);
    dbSet(DB_KEYS.transactions, remaining);
  },

  forAccount(accountId) {
    return this.list()
      .filter(t => t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  recent(limit = 20) {
    return this.list()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  },

  byDateRange(from, to) {
    return this.list().filter(t => {
      const d = new Date(t.date);
      return d >= new Date(from) && d <= new Date(to);
    });
  },

  monthlyIncome(year, month) {
    return this.list()
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month && t.type === 'income';
      })
      .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  },

  monthlyExpense(year, month) {
    return this.list()
      .filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month && t.type === 'expense';
      })
      .reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  }
};

// ============================================
// LOANS — LENT (money I gave to others)
// ============================================
const LoansLent = {
  list: () => dbList(DB_KEYS.loansLent),
  find: (id) => dbFind(DB_KEYS.loansLent, id),
  create: (data) => dbInsert(DB_KEYS.loansLent, data),
  update: (id, data) => dbUpdate(DB_KEYS.loansLent, id, data),
  delete: (id) => {
    dbDelete(DB_KEYS.loansLent, id);
    // also delete repayments
    const reps = dbGet(DB_KEYS.loanRepayments).filter(r => !(r.loanId === id && r.loanType === 'lent'));
    dbSet(DB_KEYS.loanRepayments, reps);
    Transactions.deleteByReference(id);
  },

  totalReceivable() {
    return this.list()
      .filter(l => l.status !== 'paid')
      .reduce((s, l) => s + (parseFloat(l.remaining) || 0), 0);
  },

  addRepayment(loanId, amount, date, notes) {
    const loan = this.find(loanId);
    if (!loan) return null;
    const amt = parseFloat(amount);
    const newRepaid = (parseFloat(loan.amountRepaid) || 0) + amt;
    const newRemaining = Math.max(0, (parseFloat(loan.amountGiven) || 0) - newRepaid);
    const status = newRemaining <= 0 ? 'paid' : newRepaid > 0 ? 'partial' : 'active';
    this.update(loanId, { amountRepaid: newRepaid, remaining: newRemaining, status });
    dbInsert(DB_KEYS.loanRepayments, { loanId, loanType: 'lent', amount: amt, date, notes });
    return this.find(loanId);
  }
};

// ============================================
// LOANS — BORROWED (money I took from others)
// ============================================
const LoansBorrowed = {
  list: () => dbList(DB_KEYS.loansBorrowed),
  find: (id) => dbFind(DB_KEYS.loansBorrowed, id),
  create: (data) => dbInsert(DB_KEYS.loansBorrowed, data),
  update: (id, data) => dbUpdate(DB_KEYS.loansBorrowed, id, data),
  delete: (id) => {
    dbDelete(DB_KEYS.loansBorrowed, id);
    const reps = dbGet(DB_KEYS.loanRepayments).filter(r => !(r.loanId === id && r.loanType === 'borrowed'));
    dbSet(DB_KEYS.loanRepayments, reps);
    Transactions.deleteByReference(id);
  },

  totalPayable() {
    return this.list()
      .filter(l => l.status !== 'paid')
      .reduce((s, l) => s + (parseFloat(l.remaining) || 0), 0);
  },

  addRepayment(loanId, amount, date, notes) {
    const loan = this.find(loanId);
    if (!loan) return null;
    const amt = parseFloat(amount);
    const newRepaid = (parseFloat(loan.amountRepaid) || 0) + amt;
    const newRemaining = Math.max(0, (parseFloat(loan.amountBorrowed) || 0) - newRepaid);
    const status = newRemaining <= 0 ? 'paid' : newRepaid > 0 ? 'partial' : 'active';
    this.update(loanId, { amountRepaid: newRepaid, remaining: newRemaining, status });
    dbInsert(DB_KEYS.loanRepayments, { loanId, loanType: 'borrowed', amount: amt, date, notes });
    return this.find(loanId);
  }
};

const LoanRepayments = {
  forLoan: (loanId) => dbGet(DB_KEYS.loanRepayments).filter(r => r.loanId === loanId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
};

// ============================================
// PAYMENTS / EMI
// ============================================
const Payments = {
  list: () => dbList(DB_KEYS.payments),
  find: (id) => dbFind(DB_KEYS.payments, id),
  create: (data) => {
    const p = dbInsert(DB_KEYS.payments, data);
    // Auto-create installment records
    Payments._generateInstallments(p);
    return p;
  },
  update: (id, data) => dbUpdate(DB_KEYS.payments, id, data),
  delete: (id) => {
    dbDelete(DB_KEYS.payments, id);
    const insts = dbGet(DB_KEYS.paymentInstallments).filter(i => i.paymentId === id);
    insts.forEach(i => Transactions.deleteByReference(i.id));
    const remainingInsts = dbGet(DB_KEYS.paymentInstallments).filter(i => i.paymentId !== id);
    dbSet(DB_KEYS.paymentInstallments, remainingInsts);
  },

  _generateInstallments(payment) {
    const total = parseInt(payment.totalInstallments) || 1;
    const firstDate = new Date(payment.firstPaymentDate || payment.startDate);
    const freq = payment.frequency || 'monthly';
    const existing = dbGet(DB_KEYS.paymentInstallments).filter(i => i.paymentId === payment.id);
    const existingNums = new Set(existing.map(i => i.installmentNumber));

    const newInsts = [];
    for (let i = 1; i <= total; i++) {
      if (existingNums.has(i)) continue;
      const dueDate = new Date(firstDate);
      if (freq === 'monthly') dueDate.setMonth(firstDate.getMonth() + (i - 1));
      else if (freq === 'quarterly') dueDate.setMonth(firstDate.getMonth() + (i - 1) * 3);
      else if (freq === 'yearly') dueDate.setFullYear(firstDate.getFullYear() + (i - 1));
      else if (freq === 'weekly') dueDate.setDate(firstDate.getDate() + (i - 1) * 7);

      newInsts.push({
        id: uuid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        paymentId: payment.id,
        installmentNumber: i,
        amount: parseFloat(payment.emiAmount) || 0,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'upcoming',
        paidDate: null,
        accountId: payment.linkedAccountId || null
      });
    }

    const all = dbGet(DB_KEYS.paymentInstallments);
    dbSet(DB_KEYS.paymentInstallments, [...all, ...newInsts]);
  },

  markInstallmentPaid(installmentId, accountId) {
    const inst = dbFind(DB_KEYS.paymentInstallments, installmentId);
    if (!inst) return;
    dbUpdate(DB_KEYS.paymentInstallments, installmentId, {
      status: 'paid',
      paidDate: new Date().toISOString().split('T')[0],
      accountId
    });
    // update payment completed count
    const payment = Payments.find(inst.paymentId);
    if (payment) {
      const paid = dbGet(DB_KEYS.paymentInstallments)
        .filter(i => i.paymentId === inst.paymentId && i.status === 'paid').length;
      Payments.update(inst.paymentId, {
        completedInstallments: paid,
        totalPaid: paid * (parseFloat(payment.emiAmount) || 0)
      });
    }
    // deduct from account
    if (accountId) {
      const acc = Accounts.find(accountId);
      if (acc) {
        Accounts.update(accountId, { balance: (parseFloat(acc.balance) || 0) - (parseFloat(inst.amount) || 0) });
        Transactions.create({
          type: 'expense',
          category: 'emi',
          amount: parseFloat(inst.amount) || 0,
          accountId,
          description: `EMI payment #${inst.installmentNumber}`,
          date: new Date().toISOString().split('T')[0],
          referenceId: installmentId
        });
      }
    }
  },

  markInstallmentUnpaid(installmentId) {
    const inst = dbFind(DB_KEYS.paymentInstallments, installmentId);
    if (!inst || inst.status !== 'paid') return;
    dbUpdate(DB_KEYS.paymentInstallments, installmentId, { status: 'upcoming', paidDate: null });
    const payment = Payments.find(inst.paymentId);
    if (payment) {
      const paid = dbGet(DB_KEYS.paymentInstallments)
        .filter(i => i.paymentId === inst.paymentId && i.status === 'paid').length;
      Payments.update(inst.paymentId, {
        completedInstallments: paid,
        totalPaid: paid * (parseFloat(payment.emiAmount) || 0)
      });
    }
    // reverse account balance & delete the ledger transaction
    Transactions.deleteByReference(installmentId);
  },

  installments: (paymentId) => dbGet(DB_KEYS.paymentInstallments)
    .filter(i => i.paymentId === paymentId)
    .sort((a, b) => a.installmentNumber - b.installmentNumber),

  upcoming(days = 30) {
    const now = new Date();
    const future = new Date(); future.setDate(future.getDate() + days);
    return dbGet(DB_KEYS.paymentInstallments)
      .filter(i => {
        if (i.status === 'paid') return false;
        const d = new Date(i.dueDate);
        return d <= future;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  },

  checkBalance(installmentId) {
    const inst = dbFind(DB_KEYS.paymentInstallments, installmentId);
    if (!inst) return null;
    const payment = Payments.find(inst.paymentId);
    const accountId = inst.accountId || (payment ? payment.linkedAccountId : null);
    if (!accountId) return { status: 'no-account' };
    const acc = Accounts.find(accountId);
    if (!acc) return { status: 'no-account' };
    const balance = parseFloat(acc.balance) || 0;
    const required = parseFloat(inst.amount) || 0;
    return {
      status: balance >= required ? 'ok' : 'insufficient',
      balance,
      required,
      shortfall: Math.max(0, required - balance),
      accountName: acc.name
    };
  }
};

// ============================================
// INSURANCE
// ============================================
const Insurance = {
  list: () => dbList(DB_KEYS.insurance),
  find: (id) => dbFind(DB_KEYS.insurance, id),
  create: (data) => dbInsert(DB_KEYS.insurance, data),
  update: (id, data) => dbUpdate(DB_KEYS.insurance, id, data),
  delete: (id) => {
    dbDelete(DB_KEYS.insurance, id);
    const pays = dbGet(DB_KEYS.insurancePayments).filter(p => p.insuranceId !== id);
    dbSet(DB_KEYS.insurancePayments, pays);
    Transactions.deleteByReference(id);
  },

  addPayment(insuranceId, amount, date, notes) {
    const ins = this.find(insuranceId);
    if (!ins) return null;
    const amt = parseFloat(amount);
    const totalPaid = (parseFloat(ins.totalPremiumPaid) || 0) + amt;
    this.update(insuranceId, { totalPremiumPaid: totalPaid });
    return dbInsert(DB_KEYS.insurancePayments, { insuranceId, amount: amt, date, notes });
  },

  payments: (insuranceId) => dbGet(DB_KEYS.insurancePayments)
    .filter(p => p.insuranceId === insuranceId)
    .sort((a, b) => new Date(b.date) - new Date(a.date)),

  upcoming(days = 30) {
    const now = new Date();
    const future = new Date(); future.setDate(future.getDate() + days);
    return this.list().filter(i => {
      if (!i.nextPaymentDate || i.status === 'inactive') return false;
      const d = new Date(i.nextPaymentDate);
      return d <= future;
    }).sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
  }
};

// ============================================
// FREELANCING
// ============================================
const FreelanceClients = {
  list: () => dbList(DB_KEYS.freelanceClients),
  find: (id) => dbFind(DB_KEYS.freelanceClients, id),
  create: (data) => dbInsert(DB_KEYS.freelanceClients, data),
  update: (id, data) => dbUpdate(DB_KEYS.freelanceClients, id, data),
  delete: (id) => {
    dbDelete(DB_KEYS.freelanceClients, id);
    const txns = dbGet(DB_KEYS.freelanceTxns).filter(t => t.clientId !== id);
    txns.forEach(t => Transactions.deleteByReference(t.id));
    const newTxns = dbGet(DB_KEYS.freelanceTxns).filter(t => t.clientId !== id);
    dbSet(DB_KEYS.freelanceTxns, newTxns);
  }
};

const FreelanceTxns = {
  list: () => dbList(DB_KEYS.freelanceTxns),
  find: (id) => dbFind(DB_KEYS.freelanceTxns, id),
  create: (data) => dbInsert(DB_KEYS.freelanceTxns, data),
  update: (id, data) => dbUpdate(DB_KEYS.freelanceTxns, id, data),
  delete: (id) => {
    Transactions.deleteByReference(id);
    dbDelete(DB_KEYS.freelanceTxns, id);
  },

  forClient: (clientId) => dbGet(DB_KEYS.freelanceTxns)
    .filter(t => t.clientId === clientId)
    .sort((a, b) => new Date(b.date) - new Date(a.date)),

  totals() {
    const all = this.list();
    return {
      income: all.reduce((s, t) => s + (parseFloat(t.inrIncome) || 0), 0),
      expense: all.reduce((s, t) => s + (parseFloat(t.inrExpense) || 0), 0),
      profit: all.reduce((s, t) => s + (parseFloat(t.inrProfit) || 0), 0)
    };
  },

  monthlyData(months = 6) {
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear(), month = d.getMonth();
      const txns = this.list().filter(t => {
        const td = new Date(t.date);
        return td.getFullYear() === year && td.getMonth() === month;
      });
      result.push({
        label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        income: txns.reduce((s, t) => s + (parseFloat(t.inrIncome) || 0), 0),
        expense: txns.reduce((s, t) => s + (parseFloat(t.inrExpense) || 0), 0),
        profit: txns.reduce((s, t) => s + (parseFloat(t.inrProfit) || 0), 0)
      });
    }
    return result;
  }
};

// ============================================
// SETTINGS
// ============================================
const Settings = {
  get: () => dbGetObj(DB_KEYS.settings, { theme: 'light', currency: 'INR' }),
  set: (changes) => {
    const current = Settings.get();
    dbSetObj(DB_KEYS.settings, { ...current, ...changes });
  }
};

// ============================================
// EXPORT / IMPORT
// ============================================
const DataManager = {
  exportAll() {
    const data = {};
    Object.entries(DB_KEYS).forEach(([k, v]) => {
      data[k] = dbGet(v);
    });
    data._settings = Settings.get();
    data._version = '1.0';
    data._exportedAt = new Date().toISOString();
    return JSON.stringify(data, null, 2);
  },

  importAll(jsonStr) {
    const data = JSON.parse(jsonStr);
    Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
    Object.entries(DB_KEYS).forEach(([k, v]) => {
      if (data[k] !== undefined) dbSet(v, data[k]);
    });
    if (data._settings) dbSetObj(DB_KEYS.settings, data._settings);
    return true;
  },

  clearAll() {
    Object.values(DB_KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// ============================================
// CALCULATIONS
// ============================================
const Calc = {
  netWorth() {
    const available = Accounts.totalBalance();
    const receivable = LoansLent.totalReceivable();
    const payable = LoansBorrowed.totalPayable();
    return {
      available,
      receivable,
      payable,
      netWorth: available + receivable - payable,
      cash: Accounts.cashTotal(),
      bank: Accounts.bankTotal()
    };
  },

  upcomingPayments(days = 30) {
    const emiUpcoming = Payments.upcoming(days).slice(0, 10);
    const insUpcoming = Insurance.upcoming(days).slice(0, 5);
    return { emi: emiUpcoming, insurance: insUpcoming };
  },

  monthlyFreelance() {
    const now = new Date();
    const txns = FreelanceTxns.list().filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    return {
      income: txns.reduce((s, t) => s + (parseFloat(t.inrIncome) || 0), 0),
      expense: txns.reduce((s, t) => s + (parseFloat(t.inrExpense) || 0), 0),
      profit: txns.reduce((s, t) => s + (parseFloat(t.inrProfit) || 0), 0)
    };
  }
};
