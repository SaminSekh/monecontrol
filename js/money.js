// ============================================
// money.js — Accounts / Money Page
// ============================================

function renderMoney() {
  const accounts = Accounts.list();
  const total = Accounts.totalBalance();
  const cash = Accounts.cashTotal();
  const bank = Accounts.bankTotal();

  document.getElementById('page-money').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>My Money</h2>
        <p>All your accounts in one place</p>
      </div>
      <button class="btn btn-primary" id="btn-add-account"><i class="fas fa-plus"></i> Add Account</button>
    </div>

    <!-- Total -->
    <div class="hero-card section-gap">
      <div class="hero-card-label">Total Available Money</div>
      <div class="hero-card-value">${formatINR(total)}</div>
      <div class="hero-card-row">
        <div class="hero-card-item"><label>Cash</label><span>${formatINR(cash)}</span></div>
        <div class="hero-card-item"><label>Bank & Savings</label><span>${formatINR(bank)}</span></div>
      </div>
    </div>

    <!-- Accounts list -->
    <div class="section-header">
      <h3>Accounts (${accounts.length})</h3>
    </div>

    ${accounts.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-wallet"></i></div>
        <h3>No Accounts Yet</h3>
        <p>Add your cash, bank accounts, and savings to track your money in one place.</p>
        <button class="btn btn-primary" onclick="document.getElementById('btn-add-account').click()">Add First Account</button>
      </div>
    ` : `
      <div class="accounts-grid">
        ${accounts.map(acc => renderAccountCard(acc)).join('')}
      </div>
    `}
  `;

  document.getElementById('btn-add-account').addEventListener('click', () => openAccountModal());

  // Account card actions
  document.querySelectorAll('[data-account-action]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const { accountAction, accountId } = el.dataset;
      handleAccountAction(accountAction, accountId);
    });
  });

  document.querySelectorAll('[data-account-id]').forEach(el => {
    el.addEventListener('click', () => {
      const { accountId } = el.dataset;
      if (!el.dataset.accountAction) openAccountDetail(accountId);
    });
  });
}

function renderAccountCard(acc) {
  const meta = accountTypeMeta(acc.type);
  const bal = parseFloat(acc.balance) || 0;
  return `
    <div class="account-card" data-account-id="${acc.id}">
      <div class="account-icon" style="background:${meta.bg};color:${meta.color}">
        <i class="fas ${meta.icon}"></i>
      </div>
      <div class="account-info">
        <div class="account-name">${esc(acc.name)}</div>
        <div class="account-type">${meta.label}${acc.bankName ? ' · ' + esc(acc.bankName) : ''}</div>
      </div>
      <div style="text-align:right">
        <div class="account-balance ${bal >= 0 ? 'text-success' : 'text-danger'}">${formatINR(bal)}</div>
        <div style="display:flex;gap:4px;margin-top:6px;justify-content:flex-end">
          <button class="btn btn-ghost btn-icon-sm" title="Add Money"
            data-account-action="add" data-account-id="${acc.id}">
            <i class="fas fa-plus"></i>
          </button>
          <button class="btn btn-ghost btn-icon-sm" title="Withdraw"
            data-account-action="withdraw" data-account-id="${acc.id}">
            <i class="fas fa-minus"></i>
          </button>
          <button class="btn btn-ghost btn-icon-sm" title="Transfer"
            data-account-action="transfer" data-account-id="${acc.id}">
            <i class="fas fa-arrows-left-right"></i>
          </button>
          <button class="btn btn-ghost btn-icon-sm" title="Edit"
            data-account-action="edit" data-account-id="${acc.id}">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn btn-ghost btn-icon-sm" title="Delete"
            data-account-action="delete" data-account-id="${acc.id}" style="color:var(--danger)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function handleAccountAction(action, accountId) {
  const acc = Accounts.find(accountId);
  if (!acc && action !== 'add-account') return;

  switch (action) {
    case 'add': openAddWithdrawModal(acc, 'add'); break;
    case 'withdraw': openAddWithdrawModal(acc, 'withdraw'); break;
    case 'transfer': openTransferModal(acc); break;
    case 'edit': openAccountModal(acc); break;
    case 'delete':
      confirmDialog({
        title: 'Delete Account?',
        message: `Are you sure you want to delete "${acc.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        onConfirm: () => {
          Accounts.delete(accountId);
          showToast('Account deleted', 'success');
          renderMoney();
          updateNotificationBadge();
        }
      });
      break;
  }
}

function openAccountModal(acc = null) {
  const isEdit = !!acc;
  const overlay = openModal({
    title: isEdit ? 'Edit Account' : 'Add Account',
    icon: 'fa-wallet',
    body: `
      <form id="account-form">
        <div class="form-group">
          <label class="form-label">Account Name <span class="required">*</span></label>
          <input type="text" name="name" class="form-control" placeholder="e.g. SBI Savings, Cash Wallet" required value="${esc(acc?.name || '')}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Type <span class="required">*</span></label>
            <select name="type" class="form-control" required>
              <option value="cash" ${acc?.type === 'cash' ? 'selected' : ''}>Cash</option>
              <option value="bank" ${acc?.type === 'bank' ? 'selected' : ''}>Bank Account</option>
              <option value="savings" ${acc?.type === 'savings' ? 'selected' : ''}>Savings Account</option>
              <option value="other" ${acc?.type === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Balance (₹) <span class="required">*</span></label>
            <input type="number" name="balance" class="form-control" placeholder="0" required
              value="${acc?.balance ?? ''}" min="0" step="0.01">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Bank Name <span style="color:var(--text-muted);font-weight:400">(optional)</span></label>
          <input type="text" name="bankName" class="form-control" placeholder="e.g. State Bank of India"
            value="${esc(acc?.bankName || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="form-control" rows="2" placeholder="Any notes...">${esc(acc?.notes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-account-btn">${isEdit ? 'Save Changes' : 'Add Account'}</button>
    `
  });

  document.getElementById('save-account-btn').addEventListener('click', () => {
    const form = document.getElementById('account-form');
    if (!validateForm(form)) { showToast('Please fill required fields', 'warning'); return; }
    const data = formData(form);
    data.balance = parseFloat(data.balance) || 0;

    if (isEdit) {
      Accounts.update(acc.id, data);
      showToast('Account updated!', 'success');
    } else {
      Accounts.create(data);
      showToast('Account added!', 'success');
    }
    closeModal();
    renderMoney();
    refreshDashboardWidget();
  });
}

function openAddWithdrawModal(acc, mode) {
  const isAdd = mode === 'add';
  const overlay = openModal({
    title: isAdd ? `Add Money to ${acc.name}` : `Withdraw from ${acc.name}`,
    icon: isAdd ? 'fa-arrow-down-left' : 'fa-arrow-up-right',
    iconBg: isAdd ? '#F0FDF4' : '#FEF2F2',
    iconColor: isAdd ? '#22C55E' : '#EF4444',
    body: `
      <div style="background:var(--gray-50);border-radius:var(--radius);padding:12px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-muted)">Current Balance</div>
        <div style="font-size:22px;font-weight:800;color:var(--text-primary)">${formatINR(acc.balance)}</div>
      </div>
      <form id="addwithdraw-form">
        <div class="form-group">
          <label class="form-label">Amount (₹) <span class="required">*</span></label>
          <input type="number" name="amount" class="form-control" placeholder="0" required min="0.01" step="0.01" autofocus>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" name="date" class="form-control" value="${todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" name="description" class="form-control" placeholder="${isAdd ? 'e.g. Salary received' : 'e.g. Rent paid'}">
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn ${isAdd ? 'btn-success' : 'btn-danger'}" id="addwithdraw-btn">
        <i class="fas ${isAdd ? 'fa-plus' : 'fa-minus'}"></i> ${isAdd ? 'Add Money' : 'Withdraw'}
      </button>
    `
  });

  document.getElementById('addwithdraw-btn').addEventListener('click', () => {
    const form = document.getElementById('addwithdraw-form');
    if (!validateForm(form)) { showToast('Please enter amount', 'warning'); return; }
    const d = formData(form);
    const amount = parseFloat(d.amount) || 0;
    if (amount <= 0) { showToast('Amount must be greater than 0', 'warning'); return; }

    const newBalance = isAdd
      ? (parseFloat(acc.balance) || 0) + amount
      : (parseFloat(acc.balance) || 0) - amount;

    Accounts.update(acc.id, { balance: newBalance });
    Transactions.create({
      type: isAdd ? 'income' : 'expense',
      amount,
      accountId: acc.id,
      description: d.description || (isAdd ? 'Money added' : 'Money withdrawn'),
      date: d.date || todayStr(),
      category: 'manual'
    });

    showToast(`${isAdd ? 'Added' : 'Withdrawn'} ${formatINR(amount)} ${isAdd ? 'to' : 'from'} ${acc.name}`, 'success');
    closeModal();
    renderMoney();
    refreshDashboardWidget();
  });
}

function openTransactionModal(type = 'expense') {
  const isIncome = type === 'income';
  const accounts = Accounts.list();
  
  if (accounts.length === 0) {
    showToast('Add an account first to record transactions.', 'warning');
    return;
  }

  const overlay = openModal({
    title: isIncome ? 'Add Income' : 'Add Expense',
    icon: isIncome ? 'fa-arrow-down-long' : 'fa-arrow-up-right-from-square',
    iconBg: isIncome ? '#F0FDF4' : '#FEF2F2',
    iconColor: isIncome ? '#22C55E' : '#EF4444',
    body: `
      <form id="generic-txn-form">
        <div class="form-group">
          <label class="form-label">Amount (₹) <span class="required">*</span></label>
          <input type="number" name="amount" class="form-control" placeholder="0" required min="0.01" step="0.01" autofocus>
        </div>
        <div class="form-group">
          <label class="form-label">Account <span class="required">*</span></label>
          <select name="accountId" class="form-control" required>
            ${accountSelectOptions()}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" name="date" class="form-control" value="${todayStr()}">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select name="category" class="form-control">
              ${isIncome ? `
                <option value="salary">Salary</option>
                <option value="business">Business</option>
                <option value="gift">Gift</option>
                <option value="other">Other</option>
              ` : `
                <option value="food">Food & Dining</option>
                <option value="shopping">Shopping</option>
                <option value="transport">Transportation</option>
                <option value="bills">Bills & Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="health">Health & Fitness</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              `}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description <span class="required">*</span></label>
          <input type="text" name="description" class="form-control" placeholder="${isIncome ? 'e.g. Monthly Salary' : 'e.g. Coffee, Groceries'}" required>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn ${isIncome ? 'btn-success' : 'btn-danger'}" id="generic-txn-btn">
        <i class="fas ${isIncome ? 'fa-plus' : 'fa-minus'}"></i> ${isIncome ? 'Save Income' : 'Save Expense'}
      </button>
    `
  });

  document.getElementById('generic-txn-btn').addEventListener('click', () => {
    const form = document.getElementById('generic-txn-form');
    if (!validateForm(form)) { showToast('Please fill required fields', 'warning'); return; }
    
    const d = formData(form);
    const amount = parseFloat(d.amount) || 0;
    if (amount <= 0) { showToast('Amount must be greater than 0', 'warning'); return; }

    const acc = Accounts.find(d.accountId);
    if (!acc) return;

    const newBalance = isIncome
      ? (parseFloat(acc.balance) || 0) + amount
      : (parseFloat(acc.balance) || 0) - amount;

    Accounts.update(acc.id, { balance: newBalance });
    Transactions.create({
      type: isIncome ? 'income' : 'expense',
      amount,
      accountId: acc.id,
      description: d.description,
      date: d.date || todayStr(),
      category: d.category || 'other'
    });

    showToast(`${isIncome ? 'Income' : 'Expense'} of ${formatINR(amount)} added!`, 'success');
    closeModal();
    if (currentPage === 'money') renderMoney();
    refreshDashboardWidget();
  });
}

function openTransferModal(fromAcc) {
  const accounts = Accounts.list().filter(a => a.id !== fromAcc.id);
  if (accounts.length === 0) {
    showToast('No other accounts to transfer to. Add another account first.', 'warning');
    return;
  }

  const overlay = openModal({
    title: 'Transfer Money',
    icon: 'fa-arrows-left-right',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    body: `
      <form id="transfer-form">
        <div class="form-group">
          <label class="form-label">From Account</label>
          <div style="padding:10px 14px;background:var(--gray-50);border-radius:var(--radius-sm);font-weight:600">
            ${esc(fromAcc.name)} — ${formatINR(fromAcc.balance)}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">To Account <span class="required">*</span></label>
          <select name="toAccountId" class="form-control" required>
            <option value="">— Select Account —</option>
            ${accounts.map(a => `<option value="${a.id}">${esc(a.name)} (${formatINR(a.balance)})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Amount (₹) <span class="required">*</span></label>
          <input type="number" name="amount" class="form-control" placeholder="0" required min="0.01" step="0.01">
          <div class="form-hint">Available: ${formatINR(fromAcc.balance)}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" name="date" class="form-control" value="${todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" name="description" class="form-control" placeholder="Transfer reason...">
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="transfer-btn"><i class="fas fa-arrows-left-right"></i> Transfer</button>
    `
  });

  document.getElementById('transfer-btn').addEventListener('click', () => {
    const form = document.getElementById('transfer-form');
    if (!validateForm(form)) { showToast('Please fill required fields', 'warning'); return; }
    const d = formData(form);
    const amount = parseFloat(d.amount) || 0;
    if (amount <= 0) { showToast('Amount must be greater than 0', 'warning'); return; }
    if (amount > parseFloat(fromAcc.balance)) { showToast('Insufficient balance in source account', 'error'); return; }

    const toAcc = Accounts.find(d.toAccountId);
    if (!toAcc) return;

    // Deduct from source
    Accounts.update(fromAcc.id, { balance: (parseFloat(fromAcc.balance) || 0) - amount });
    // Add to destination
    Accounts.update(toAcc.id, { balance: (parseFloat(toAcc.balance) || 0) + amount });

    // Record as transfer (NOT income/expense — does not affect total)
    Transactions.create({
      type: 'transfer',
      amount,
      accountId: fromAcc.id,
      fromAccountId: fromAcc.id,
      toAccountId: toAcc.id,
      description: d.description || `Transfer from ${fromAcc.name} to ${toAcc.name}`,
      date: d.date || todayStr(),
      category: 'transfer'
    });

    showToast(`Transferred ${formatINR(amount)} from ${fromAcc.name} to ${toAcc.name}`, 'success');
    closeModal();
    renderMoney();
    refreshDashboardWidget();
  });
}

function openAccountDetail(accountId) {
  const acc = Accounts.find(accountId);
  if (!acc) return;
  const meta = accountTypeMeta(acc.type);
  const txns = Transactions.forAccount(accountId).slice(0, 20);

  openModal({
    title: acc.name,
    icon: meta.icon,
    iconBg: meta.bg,
    iconColor: meta.color,
    size: 'modal-lg',
    body: `
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:32px;font-weight:900;color:${parseFloat(acc.balance) >= 0 ? 'var(--success)' : 'var(--danger)'}">${formatINR(acc.balance)}</div>
        <div style="font-size:13px;color:var(--text-muted)">${meta.label}${acc.bankName ? ' · ' + esc(acc.bankName) : ''}</div>
        ${acc.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px">${esc(acc.notes)}</div>` : ''}
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
          <button class="btn btn-success btn-sm" data-account-action="add" data-account-id="${acc.id}"><i class="fas fa-plus"></i> Add</button>
          <button class="btn btn-danger btn-sm" data-account-action="withdraw" data-account-id="${acc.id}"><i class="fas fa-minus"></i> Withdraw</button>
          <button class="btn btn-secondary btn-sm" data-account-action="transfer" data-account-id="${acc.id}"><i class="fas fa-arrows-left-right"></i> Transfer</button>
        </div>
      </div>
      <h4 style="margin-bottom:12px">Recent Transactions</h4>
      ${txns.length === 0
        ? `<div class="empty-state" style="padding:20px"><p style="margin-bottom:0">No transactions yet</p></div>`
        : txns.map(t => {
            const tm = txnTypeMeta(t.type);
            const isPos = ['income', 'repayment_received', 'borrowed'].includes(t.type);
            return `<div class="list-item">
              <div class="list-icon" style="background:${tm.bg};color:${tm.color}"><i class="fas ${tm.icon}"></i></div>
              <div class="list-content">
                <div class="list-title">${esc(t.description || t.type)}</div>
                <div class="list-sub">${formatDate(t.date)}</div>
              </div>
              <div class="list-amount">
                <div class="list-amount-value ${isPos ? 'text-success' : t.type === 'transfer' ? 'text-info' : 'text-danger'}">
                  ${t.type === 'transfer' ? '⇄' : isPos ? '+' : '-'}${formatINR(t.amount)}
                </div>
              </div>
            </div>`;
          }).join('')
      }
    `
  });

  // Bind action buttons in modal
  setTimeout(() => {
    document.querySelectorAll('[data-account-action]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        closeModal();
        setTimeout(() => handleAccountAction(el.dataset.accountAction, el.dataset.accountId), 250);
      });
    });
  }, 100);
}
