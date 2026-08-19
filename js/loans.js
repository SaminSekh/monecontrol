// ============================================
// loans.js — Lent & Borrowed Money Page
// ============================================

let loansActiveTab = 'lent';

function renderLoans() {
  const lent = LoansLent.list();
  const borrowed = LoansBorrowed.list();

  const totalReceivable = LoansLent.totalReceivable();
  const totalPayable = LoansBorrowed.totalPayable();

  document.getElementById('page-loans').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Loans</h2>
        <p>Money you've lent and borrowed</p>
      </div>
      <button class="btn btn-primary" id="btn-add-loan"><i class="fas fa-plus"></i> Add</button>
    </div>

    <!-- Summary Row -->
    <div class="grid grid-2 section-gap">
      <div class="stat-card" style="border-left:4px solid var(--success)">
        <div class="stat-card-label">Money I'll Receive</div>
        <div class="stat-card-value text-success">${formatINR(totalReceivable)}</div>
        <div class="stat-card-sub">${lent.filter(l => l.status !== 'paid').length} active loan${lent.filter(l => l.status !== 'paid').length !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat-card" style="border-left:4px solid var(--danger)">
        <div class="stat-card-label">Money I Need to Pay</div>
        <div class="stat-card-value text-danger">${formatINR(totalPayable)}</div>
        <div class="stat-card-sub">${borrowed.filter(l => l.status !== 'paid').length} active debt${borrowed.filter(l => l.status !== 'paid').length !== 1 ? 's' : ''}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs" id="loans-tabs">
      <button class="tab-btn ${loansActiveTab === 'lent' ? 'active' : ''}" data-tab="lent">
        <i class="fas fa-hand-holding-dollar"></i> Money I Lent (${lent.length})
      </button>
      <button class="tab-btn ${loansActiveTab === 'borrowed' ? 'active' : ''}" data-tab="borrowed">
        <i class="fas fa-sack-dollar"></i> Money I Borrowed (${borrowed.length})
      </button>
    </div>

    <!-- Lent Tab -->
    <div id="loans-tab-lent" style="${loansActiveTab === 'lent' ? '' : 'display:none'}">
      ${lent.length === 0
        ? `<div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-hand-holding-dollar"></i></div>
            <h3>No Loans Lent</h3>
            <p>Track money you've given to friends and family. Record repayments easily.</p>
            <button class="btn btn-primary" id="add-lent-empty">Add Lent Money</button>
          </div>`
        : lent.map(l => renderLentCard(l)).join('')
      }
    </div>

    <!-- Borrowed Tab -->
    <div id="loans-tab-borrowed" style="${loansActiveTab === 'borrowed' ? '' : 'display:none'}">
      ${borrowed.length === 0
        ? `<div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-sack-dollar"></i></div>
            <h3>No Borrowed Money</h3>
            <p>Track money you've borrowed from others and record your repayments.</p>
            <button class="btn btn-primary" id="add-borrowed-empty">Add Borrowed Money</button>
          </div>`
        : borrowed.map(l => renderBorrowedCard(l)).join('')
      }
    </div>
  `;

  // Tab switching
  document.querySelectorAll('#loans-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loansActiveTab = btn.dataset.tab;
      renderLoans();
    });
  });

  // Add button
  document.getElementById('btn-add-loan').addEventListener('click', () => {
    if (loansActiveTab === 'lent') openLentModal();
    else openBorrowedModal();
  });

  // Empty state add buttons
  document.getElementById('add-lent-empty')?.addEventListener('click', () => openLentModal());
  document.getElementById('add-borrowed-empty')?.addEventListener('click', () => openBorrowedModal());

  // Card action buttons
  document.querySelectorAll('[data-loan-action]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handleLoanAction(el.dataset.loanAction, el.dataset.loanId, el.dataset.loanType);
    });
  });
}

function renderLentCard(loan) {
  const sb = loanStatusBadge(loan.status);
  const remaining = parseFloat(loan.remaining) || 0;
  const given = parseFloat(loan.amountGiven) || 0;
  const repaid = parseFloat(loan.amountRepaid) || 0;
  const completePct = given > 0 ? pct(repaid, given) : 0;
  const days = loan.expectedDate ? daysUntil(loan.expectedDate) : null;

  return `<div class="loan-card mb-3">
    <div class="loan-person">
      <div class="loan-avatar">${initials(loan.personName)}</div>
      <div class="loan-person-info">
        <div class="loan-person-name">${esc(loan.personName)}</div>
        ${loan.phone ? `<div class="loan-person-phone"><i class="fas fa-phone" style="font-size:10px"></i> ${esc(loan.phone)}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="badge ${sb.cls}">${sb.label}</span>
        ${days !== null ? dueBadgeHtml(days) : ''}
      </div>
    </div>

    <div class="loan-amounts">
      <div class="loan-amount-item">
        <div class="loan-amount-label">Given</div>
        <div class="loan-amount-value">${formatINR(given)}</div>
      </div>
      <div class="loan-amount-item">
        <div class="loan-amount-label">Received</div>
        <div class="loan-amount-value text-success">${formatINR(repaid)}</div>
      </div>
      <div class="loan-amount-item">
        <div class="loan-amount-label">Remaining</div>
        <div class="loan-amount-value text-danger">${formatINR(remaining)}</div>
      </div>
    </div>

    <div class="progress-wrapper">
      <div class="progress-label"><span>Repaid</span><span>${completePct}%</span></div>
      <div class="progress-bar"><div class="progress-fill success" style="width:${completePct}%"></div></div>
    </div>

    ${loan.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">${esc(loan.notes)}</div>` : ''}
    ${loan.expectedDate ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px"><i class="fas fa-calendar"></i> Expected: ${formatDate(loan.expectedDate)}</div>` : ''}

    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      ${loan.status !== 'paid' ? `<button class="btn btn-success btn-sm" data-loan-action="repayment" data-loan-id="${loan.id}" data-loan-type="lent">
        <i class="fas fa-hand-holding-dollar"></i> Record Repayment
      </button>` : ''}
      ${loan.status !== 'paid' ? `<button class="btn btn-secondary btn-sm" data-loan-action="mark-paid" data-loan-id="${loan.id}" data-loan-type="lent">
        <i class="fas fa-check"></i> Mark Fully Paid
      </button>` : ''}
      <button class="btn btn-ghost btn-sm" data-loan-action="edit" data-loan-id="${loan.id}" data-loan-type="lent">
        <i class="fas fa-pen"></i>
      </button>
      <button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-loan-action="delete" data-loan-id="${loan.id}" data-loan-type="lent">
        <i class="fas fa-trash"></i>
      </button>
      <button class="btn btn-ghost btn-sm" data-loan-action="history" data-loan-id="${loan.id}" data-loan-type="lent">
        <i class="fas fa-history"></i> History
      </button>
    </div>
  </div>`;
}

function renderBorrowedCard(loan) {
  const sb = loanStatusBadge(loan.status);
  const remaining = parseFloat(loan.remaining) || 0;
  const borrowed = parseFloat(loan.amountBorrowed) || 0;
  const repaid = parseFloat(loan.amountRepaid) || 0;
  const completePct = borrowed > 0 ? pct(repaid, borrowed) : 0;
  const days = loan.expectedDate ? daysUntil(loan.expectedDate) : null;

  return `<div class="loan-card mb-3">
    <div class="loan-person">
      <div class="loan-avatar" style="background:linear-gradient(135deg,#EF4444,#DC2626)">${initials(loan.personName)}</div>
      <div class="loan-person-info">
        <div class="loan-person-name">${esc(loan.personName)}</div>
        ${loan.phone ? `<div class="loan-person-phone"><i class="fas fa-phone" style="font-size:10px"></i> ${esc(loan.phone)}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <span class="badge ${sb.cls}">${sb.label}</span>
        ${days !== null ? dueBadgeHtml(days) : ''}
      </div>
    </div>

    <div class="loan-amounts">
      <div class="loan-amount-item">
        <div class="loan-amount-label">Borrowed</div>
        <div class="loan-amount-value">${formatINR(borrowed)}</div>
      </div>
      <div class="loan-amount-item">
        <div class="loan-amount-label">Paid Back</div>
        <div class="loan-amount-value text-success">${formatINR(repaid)}</div>
      </div>
      <div class="loan-amount-item">
        <div class="loan-amount-label">Still Owe</div>
        <div class="loan-amount-value text-danger">${formatINR(remaining)}</div>
      </div>
    </div>

    <div class="progress-wrapper">
      <div class="progress-label"><span>Paid Back</span><span>${completePct}%</span></div>
      <div class="progress-bar"><div class="progress-fill ${completePct > 50 ? 'success' : 'warning'}" style="width:${completePct}%"></div></div>
    </div>

    ${loan.notes ? `<div style="font-size:12px;color:var(--text-muted);margin-top:8px">${esc(loan.notes)}</div>` : ''}
    ${loan.expectedDate ? `<div style="font-size:12px;color:var(--text-muted);margin-top:4px"><i class="fas fa-calendar"></i> Due: ${formatDate(loan.expectedDate)}</div>` : ''}

    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      ${loan.status !== 'paid' ? `<button class="btn btn-primary btn-sm" data-loan-action="repayment" data-loan-id="${loan.id}" data-loan-type="borrowed">
        <i class="fas fa-money-bill-transfer"></i> Record Payment Made
      </button>` : ''}
      ${loan.status !== 'paid' ? `<button class="btn btn-secondary btn-sm" data-loan-action="mark-paid" data-loan-id="${loan.id}" data-loan-type="borrowed">
        <i class="fas fa-check"></i> Mark Fully Paid
      </button>` : ''}
      <button class="btn btn-ghost btn-sm" data-loan-action="edit" data-loan-id="${loan.id}" data-loan-type="borrowed">
        <i class="fas fa-pen"></i>
      </button>
      <button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-loan-action="delete" data-loan-id="${loan.id}" data-loan-type="borrowed">
        <i class="fas fa-trash"></i>
      </button>
      <button class="btn btn-ghost btn-sm" data-loan-action="history" data-loan-id="${loan.id}" data-loan-type="borrowed">
        <i class="fas fa-history"></i> History
      </button>
    </div>
  </div>`;
}

function handleLoanAction(action, loanId, loanType) {
  const db = loanType === 'lent' ? LoansLent : LoansBorrowed;
  const loan = db.find(loanId);
  if (!loan) return;

  switch (action) {
    case 'repayment': openRepaymentModal(loan, loanType); break;
    case 'mark-paid':
      // Open the repayment modal with the remaining amount automatically
      openRepaymentModal(loan, loanType);
      break;
    case 'edit': openLentModal(loan, loanType === 'borrowed'); break;
    case 'delete':
      confirmDialog({
        title: 'Delete Loan Record?',
        message: `This will permanently delete the loan record for "${loan.personName}".`,
        onConfirm: () => {
          db.delete(loanId);
          showToast('Loan deleted', 'success');
          renderLoans();
          refreshDashboardWidget();
        }
      });
      break;
    case 'history': openRepaymentHistory(loan, loanType); break;
  }
}

function openLentModal(loan = null, isBorrowed = false) {
  const isEdit = !!loan;
  const title = isBorrowed
    ? (isEdit ? 'Edit Borrowed Money' : 'Add Borrowed Money')
    : (isEdit ? 'Edit Lent Money' : 'Add Lent Money');

  const overlay = openModal({
    title,
    icon: isBorrowed ? 'fa-sack-dollar' : 'fa-hand-holding-dollar',
    iconBg: isBorrowed ? '#FEF2F2' : '#FFFBEB',
    iconColor: isBorrowed ? '#EF4444' : '#F59E0B',
    body: `
      <form id="loan-form">
        <div class="form-group">
          <label class="form-label">Person Name <span class="required">*</span></label>
          <input type="text" name="personName" class="form-control" placeholder="Full name" required value="${esc(loan?.personName || '')}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" name="phone" class="form-control" placeholder="+91 XXXXX XXXXX" value="${esc(loan?.phone || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Amount (₹) <span class="required">*</span></label>
            <input type="number" name="${isBorrowed ? 'amountBorrowed' : 'amountGiven'}" class="form-control"
              placeholder="0" required min="0" step="0.01"
              value="${loan ? (isBorrowed ? loan.amountBorrowed : loan.amountGiven) : ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">${isBorrowed ? 'Borrowed' : 'Given'} Date</label>
            <input type="date" name="${isBorrowed ? 'borrowedDate' : 'givenDate'}" class="form-control"
              value="${formatDateInput(isBorrowed ? loan?.borrowedDate : loan?.givenDate) || todayStr()}">
          </div>
          <div class="form-group">
            <label class="form-label">Expected Repayment Date</label>
            <input type="date" name="expectedDate" class="form-control" value="${formatDateInput(loan?.expectedDate) || ''}">
          </div>
        </div>
        ${!isEdit ? `
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">${isBorrowed ? 'Money Received In' : 'Money Given From'} <span class="required">*</span></label>
            <select name="accountId" class="form-control" required>
              <option value="">Select Account</option>
              ${Accounts.list().map(a => `<option value="${a.id}">${esc(a.name)} (${formatINR(a.balance)})</option>`).join('')}
            </select>
          </div>
        </div>
        ` : ''}
        <div class="form-group">
          <label class="form-label">Notes / Details</label>
          <textarea name="notes" class="form-control" rows="2" placeholder="Reason, purpose, etc.">${esc(loan?.notes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-loan-btn">${isEdit ? 'Save Changes' : 'Add Record'}</button>
    `
  });

  document.getElementById('save-loan-btn').addEventListener('click', () => {
    const form = document.getElementById('loan-form');
    if (!validateForm(form)) { showToast('Please fill required fields', 'warning'); return; }
    const data = formData(form);
    const db = isBorrowed ? LoansBorrowed : LoansLent;

    if (isEdit) {
      db.update(loan.id, data);
      showToast('Loan updated!', 'success');
    } else {
      const amtField = isBorrowed ? 'amountBorrowed' : 'amountGiven';
      const amt = parseFloat(data[amtField]) || 0;
      const newLoan = db.create({
        ...data,
        amountRepaid: 0,
        remaining: amt,
        status: 'active'
      });
      // Deduct/Credit account & log txn
      const acc = Accounts.find(data.accountId);
      if (acc) {
        if (isBorrowed) {
          Accounts.update(data.accountId, { balance: (parseFloat(acc.balance) || 0) + amt });
          Transactions.create({
            type: 'borrowed', category: 'lent', amount: amt, accountId: data.accountId,
            description: `Borrowed from ${data.personName}`, date: todayStr(), referenceId: newLoan.id
          });
        } else {
          Accounts.update(data.accountId, { balance: (parseFloat(acc.balance) || 0) - amt });
          Transactions.create({
            type: 'lent', category: 'lent', amount: amt, accountId: data.accountId,
            description: `Lent to ${data.personName}`, date: todayStr(), referenceId: newLoan.id
          });
        }
      }
      showToast('Loan added!', 'success');
    }
    closeModal();
    renderLoans();
    refreshDashboardWidget();
  });
}

// Alias for FAB menu
function openBorrowedModal(loan = null) {
  openLentModal(loan, true);
}

function openRepaymentModal(loan, loanType) {
  const isBorrowed = loanType === 'borrowed';
  const remaining = parseFloat(isBorrowed ? loan.remaining : loan.remaining) || 0;

  openModal({
    title: `Record ${isBorrowed ? 'Payment Made' : 'Repayment Received'}`,
    icon: 'fa-money-bill-transfer',
    iconBg: '#F0FDF4',
    iconColor: '#22C55E',
    body: `
      <div style="background:var(--gray-50);border-radius:var(--radius);padding:12px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-muted)">Remaining Amount</div>
        <div style="font-size:22px;font-weight:800;color:var(--danger)">${formatINR(remaining)}</div>
        <div style="font-size:12px;color:var(--text-muted)">From: ${esc(loan.personName)}</div>
      </div>
      <form id="repayment-form">
        <div class="form-group">
          <label class="form-label">Amount ${isBorrowed ? 'Paid' : 'Received'} (₹) <span class="required">*</span></label>
          <input type="number" name="amount" class="form-control" placeholder="0"
            required min="0.01" max="${remaining}" step="0.01">
          <div class="form-hint">Maximum: ${formatINR(remaining)}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" name="date" class="form-control" value="${todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">${isBorrowed ? 'Paid From' : 'Received In'} <span class="required">*</span></label>
          <select name="accountId" class="form-control" required>
            <option value="">Select Account</option>
            ${Accounts.list().map(a => `<option value="${a.id}">${esc(a.name)} (${formatINR(a.balance)})</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" name="notes" class="form-control" placeholder="Optional note...">
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" id="save-repayment-btn">
        <i class="fas fa-check"></i> Confirm ${isBorrowed ? 'Payment' : 'Repayment'}
      </button>
    `
  });

  document.getElementById('save-repayment-btn').addEventListener('click', () => {
    const form = document.getElementById('repayment-form');
    if (!validateForm(form)) { showToast('Please enter amount', 'warning'); return; }
    const d = formData(form);
    const amt = parseFloat(d.amount);
    if (isNaN(amt) || amt <= 0) { showToast('Enter a valid amount', 'warning'); return; }

    const db = isBorrowed ? LoansBorrowed : LoansLent;
    db.addRepayment(loan.id, amt, d.date || todayStr(), d.notes);

    const acc = Accounts.find(d.accountId);
    if (acc) {
      if (isBorrowed) {
        Accounts.update(d.accountId, { balance: (parseFloat(acc.balance) || 0) - amt });
        Transactions.create({
          type: 'repayment_made', category: 'lent', amount: amt, accountId: d.accountId,
          description: `Repaid to ${loan.personName}`, date: d.date || todayStr(), referenceId: loan.id
        });
      } else {
        Accounts.update(d.accountId, { balance: (parseFloat(acc.balance) || 0) + amt });
        Transactions.create({
          type: 'repayment_received', category: 'lent', amount: amt, accountId: d.accountId,
          description: `Repayment from ${loan.personName}`, date: d.date || todayStr(), referenceId: loan.id
        });
      }
    }

    showToast(`${formatINR(amt)} ${isBorrowed ? 'payment' : 'repayment'} recorded!`, 'success');
    closeModal();
    renderLoans();
    refreshDashboardWidget();
  });
}

function openRepaymentHistory(loan, loanType) {
  const repayments = LoanRepayments.forLoan(loan.id).filter(r => r.loanType === loanType);

  openModal({
    title: `Repayment History — ${loan.personName}`,
    icon: 'fa-history',
    size: 'modal-lg',
    body: `
      <div class="info-grid mb-3">
        <div class="info-item">
          <div class="info-label">${loanType === 'lent' ? 'Total Given' : 'Total Borrowed'}</div>
          <div class="info-value">${formatINR(loanType === 'lent' ? loan.amountGiven : loan.amountBorrowed)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Repaid</div>
          <div class="info-value success">${formatINR(loan.amountRepaid)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Remaining</div>
          <div class="info-value ${parseFloat(loan.remaining) > 0 ? 'danger' : 'success'}">${formatINR(loan.remaining)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">${loan.status}</div>
        </div>
      </div>
      ${repayments.length === 0
        ? `<div class="empty-state" style="padding:20px"><p>No repayments recorded yet</p></div>`
        : repayments.map(r => `
          <div class="list-item">
            <div class="list-icon" style="background:var(--success-bg);color:var(--success)"><i class="fas fa-check"></i></div>
            <div class="list-content">
              <div class="list-title">${formatINR(r.amount)} received</div>
              <div class="list-sub">${formatDate(r.date)}${r.notes ? ' · ' + esc(r.notes) : ''}</div>
            </div>
          </div>
        `).join('')
      }
    `
  });
}
