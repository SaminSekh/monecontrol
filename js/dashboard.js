// ============================================
// dashboard.js — Dashboard Page
// ============================================

function renderDashboard() {
  const nw = Calc.netWorth();
  const freelance = Calc.monthlyFreelance();
  const { emi: emiUpcoming, insurance: insUpcoming } = Calc.upcomingPayments(30);
  const recent = Transactions.recent(8);
  const now = new Date();

  document.getElementById('page-dashboard').innerHTML = `
    <!-- Greeting -->
    <div class="dashboard-greeting">
      <h2>${greetingText()} <i class="fas fa-hand-sparkles" style="color:#FCD34D"></i></h2>
      <p>${currentMonthLabel()} &nbsp;·&nbsp; ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </div>

    ${typeof getLiveIncomes === 'function' && getLiveIncomes().length > 0 ? `
    <!-- Live Earnings Banner -->
    <div class="card mb-4" style="cursor:pointer;" onclick="navigate('live')">
      <div class="card-body" style="display:flex; justify-content:space-between; align-items:center; padding: 16px 20px;">
        <div style="display:flex; flex-direction:column;">
          <span class="text-muted" style="font-size: 13px; font-weight:500; margin-bottom:2px">Earned Today So Far</span>
          <span id="dashboard-live-ticker" class="text-success" style="font-size: 24px; font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -0.5px; line-height:1;">₹0.0000</span>
        </div>
        <div style="background:var(--success-bg); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;">
          <i class="fas fa-bolt" style="color:var(--success)"></i>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Notifications -->
    ${renderDashboardAlerts(emiUpcoming, insUpcoming)}

    <!-- Net Worth Hero Card -->
    <div class="net-worth-card mb-4">
      <div class="net-worth-label">Total Net Worth</div>
      <div class="net-worth-value">${formatINR(nw.netWorth)}</div>
      <div class="net-worth-row">
        <div class="net-worth-item has-tooltip">
          <div class="net-worth-item-label">Cash</div>
          <div class="net-worth-item-value">${formatINR(nw.cash)}</div>
          <div class="tooltip-card">
            ${Accounts.list().filter(a => a.type === 'cash').map(a => `
              <div class="tooltip-row"><span class="tooltip-label">${esc(a.name)}</span><span class="tooltip-value">${formatINR(a.balance)}</span></div>
            `).join('') || '<div class="tooltip-row">No cash accounts</div>'}
          </div>
        </div>
        <div class="net-worth-item has-tooltip">
          <div class="net-worth-item-label">Bank</div>
          <div class="net-worth-item-value">${formatINR(nw.bank)}</div>
          <div class="tooltip-card">
            ${Accounts.list().filter(a => a.type === 'bank' || a.type === 'savings').map(a => `
              <div class="tooltip-row"><span class="tooltip-label">${esc(a.name)}</span><span class="tooltip-value">${formatINR(a.balance)}</span></div>
            `).join('') || '<div class="tooltip-row">No bank accounts</div>'}
          </div>
        </div>
        <div class="net-worth-item has-tooltip">
          <div class="net-worth-item-label">Receivable</div>
          <div class="net-worth-item-value positive">${formatINR(nw.receivable)}</div>
          <div class="tooltip-card">
            ${LoansLent.list().filter(l => (l.amount - l.repaid) > 0).map(l => `
              <div class="tooltip-row"><span class="tooltip-label">${esc(l.personName)}</span><span class="tooltip-value text-success">${formatINR(l.amount - l.repaid)}</span></div>
            `).join('') || '<div class="tooltip-row">Nobody owes you</div>'}
          </div>
        </div>
        <div class="net-worth-item has-tooltip">
          <div class="net-worth-item-label">Payable</div>
          <div class="net-worth-item-value negative">${formatINR(nw.payable)}</div>
          <div class="tooltip-card">
            ${LoansBorrowed.list().filter(l => (l.amount - l.repaid) > 0).map(l => `
              <div class="tooltip-row"><span class="tooltip-label">${esc(l.personName)}</span><span class="tooltip-value text-danger">${formatINR(l.amount - l.repaid)}</span></div>
            `).join('') || '<div class="tooltip-row">You owe nothing</div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats section-gap">
      <div class="quick-stat-card has-tooltip">
        <div class="quick-stat-icon" style="color:#22C55E"><i class="fas fa-money-bills"></i></div>
        <div class="quick-stat-value" style="font-size:16px">${formatINR(nw.cash)}</div>
        <div class="quick-stat-label">Cash in Hand</div>
        <div class="tooltip-card">
          ${Accounts.list().filter(a => a.type === 'cash').map(a => `
            <div class="tooltip-row"><span class="tooltip-label">${esc(a.name)}</span><span class="tooltip-value">${formatINR(a.balance)}</span></div>
          `).join('') || '<div class="tooltip-row">No cash accounts</div>'}
        </div>
      </div>
      <div class="quick-stat-card has-tooltip">
        <div class="quick-stat-icon" style="color:#3B82F6"><i class="fas fa-building-columns"></i></div>
        <div class="quick-stat-value" style="font-size:16px">${formatINR(nw.bank)}</div>
        <div class="quick-stat-label">Bank Balance</div>
        <div class="tooltip-card">
          ${Accounts.list().filter(a => a.type === 'bank' || a.type === 'savings').map(a => `
            <div class="tooltip-row"><span class="tooltip-label">${esc(a.name)}</span><span class="tooltip-value">${formatINR(a.balance)}</span></div>
          `).join('') || '<div class="tooltip-row">No bank accounts</div>'}
        </div>
      </div>
      <div class="quick-stat-card has-tooltip">
        <div class="quick-stat-icon" style="color:#F59E0B"><i class="fas fa-hand-holding-dollar"></i></div>
        <div class="quick-stat-value" style="font-size:16px">${formatINR(nw.receivable)}</div>
        <div class="quick-stat-label">Will Receive</div>
        <div class="tooltip-card">
          ${LoansLent.list().filter(l => (l.amount - l.repaid) > 0).map(l => `
            <div class="tooltip-row"><span class="tooltip-label">${esc(l.personName)}</span><span class="tooltip-value text-success">${formatINR(l.amount - l.repaid)}</span></div>
          `).join('') || '<div class="tooltip-row">Nobody owes you</div>'}
        </div>
      </div>
      <div class="quick-stat-card has-tooltip">
        <div class="quick-stat-icon" style="color:#EF4444"><i class="fas fa-sack-dollar"></i></div>
        <div class="quick-stat-value" style="font-size:16px">${formatINR(nw.payable)}</div>
        <div class="quick-stat-label">Need to Pay</div>
        <div class="tooltip-card">
          ${LoansBorrowed.list().filter(l => (l.amount - l.repaid) > 0).map(l => `
            <div class="tooltip-row"><span class="tooltip-label">${esc(l.personName)}</span><span class="tooltip-value text-danger">${formatINR(l.amount - l.repaid)}</span></div>
          `).join('') || '<div class="tooltip-row">You owe nothing</div>'}
        </div>
      </div>
    </div>

    <!-- Two column row -->
    <div class="grid grid-2 section-gap">

      <!-- Upcoming Payments -->
      <div class="card">
        <div class="card-header" style="padding:16px 16px 0">
          <h3 style="font-size:14px;font-weight:700">Upcoming Payments</h3>
          <button class="btn btn-ghost btn-sm" onclick="navigate('payments')">View All</button>
        </div>
        <div class="card-body">
          ${renderUpcomingPaymentsList([...emiUpcoming.slice(0, 4), ...insUpcoming.slice(0, 2)])}
        </div>
      </div>

      <!-- Freelance Summary -->
      <div class="card">
        <div class="card-header" style="padding:16px 16px 0">
          <h3 style="font-size:14px;font-weight:700">This Month's Freelance</h3>
          <button class="btn btn-ghost btn-sm" onclick="navigate('freelancing')">View All</button>
        </div>
        <div class="card-body">
          ${renderFreelanceSummaryWidget(freelance)}
        </div>
      </div>
    </div>

    <!-- Accounts Summary -->
    <div class="card section-gap">
      <div class="card-header" style="padding:16px 16px 0">
        <h3 style="font-size:14px;font-weight:700">My Accounts</h3>
        <button class="btn btn-ghost btn-sm" onclick="navigate('money')">Manage</button>
      </div>
      <div class="card-body">
        ${renderAccountsSummaryWidget()}
      </div>
    </div>

    <!-- Recent Transactions -->
    <div class="card section-gap">
      <div class="card-header" style="padding:16px 16px 0">
        <h3 style="font-size:14px;font-weight:700">Recent Transactions</h3>
      </div>
      <div class="card-body">
        ${renderRecentTxnList(recent)}
      </div>
    </div>
  `;

  if (typeof startLiveTicker === 'function' && typeof getLiveIncomes === 'function') {
    startLiveTicker(getLiveIncomes());
  }
}

function renderDashboardAlerts(emiUpcoming, insUpcoming) {
  const alerts = [];

  // Overdue EMIs
  const overdue = emiUpcoming.filter(i => daysUntil(i.dueDate) < 0);
  if (overdue.length > 0) {
    alerts.push(`<div class="notification-item notif-danger">
      <i class="fas fa-exclamation-triangle notif-icon"></i>
      <div class="notif-text"><strong>${overdue.length} overdue payment${overdue.length > 1 ? 's' : ''}!</strong>
      <span>Please mark payments as paid or check your account</span></div>
    </div>`);
  }

  // EMI due soon
  const soon = emiUpcoming.filter(i => { const d = daysUntil(i.dueDate); return d >= 0 && d <= 5; });
  soon.forEach(i => {
    const payment = Payments.find(i.paymentId);
    const name = payment ? payment.name : 'EMI';
    const balCheck = Payments.checkBalance(i.id);
    const d = daysUntil(i.dueDate);
    alerts.push(`<div class="notification-item ${balCheck?.status === 'insufficient' ? 'notif-danger' : 'notif-warning'}">
      <i class="fas ${balCheck?.status === 'insufficient' ? 'fa-triangle-exclamation' : 'fa-bell'} notif-icon"></i>
      <div class="notif-text">
        <strong>${esc(name)} due ${d === 0 ? 'today' : `in ${d} day${d > 1 ? 's' : ''}`} — ${formatINR(i.amount)}</strong>
        <span>${balCheck?.status === 'insufficient'
          ? `⚠ Short by ${formatINR(balCheck.shortfall)} in ${esc(balCheck.accountName)}`
          : balCheck?.accountName ? `✓ ${esc(balCheck.accountName)} has sufficient balance` : 'No account linked'}</span>
      </div>
    </div>`);
  });

  // Insurance due soon
  insUpcoming.slice(0, 2).forEach(ins => {
    const d = daysUntil(ins.nextPaymentDate);
    if (d >= 0 && d <= 7) {
      alerts.push(`<div class="notification-item notif-info">
        <i class="fas fa-shield-halved notif-icon"></i>
        <div class="notif-text"><strong>${esc(ins.name)} premium due ${d === 0 ? 'today' : `in ${d} days`}</strong>
        <span>${formatINR(ins.premiumAmount)}</span></div>
      </div>`);
    }
  });

  if (alerts.length === 0) return '';
  return `<div class="notification-list">${alerts.join('')}</div>`;
}

function renderUpcomingPaymentsList(items) {
  if (items.length === 0) {
    return `<div class="empty-state" style="padding:20px">
      <div class="empty-state-icon" style="width:48px;height:48px;font-size:20px"><i class="fas fa-calendar-check"></i></div>
      <p style="font-size:13px;margin-bottom:0">No upcoming payments</p>
    </div>`;
  }

  return items.map(item => {
    // Determine if EMI or insurance
    const isIns = !!item.insuranceId || !item.paymentId;
    let name, amount, dueDate, accountId;

    if (item.paymentId) {
      const payment = Payments.find(item.paymentId);
      name = payment ? payment.name : 'Payment';
      amount = item.amount;
      dueDate = item.dueDate;
      accountId = item.accountId || (payment ? payment.linkedAccountId : null);
    } else {
      name = item.name;
      amount = item.premiumAmount;
      dueDate = item.nextPaymentDate;
      accountId = item.linkedAccountId;
    }

    const days = daysUntil(dueDate);
    const acc = accountId ? Accounts.find(accountId) : null;
    const sufficient = acc && parseFloat(acc.balance) >= parseFloat(amount);

    let balHtml = '';
    if (acc) {
      balHtml = sufficient
        ? `<span class="balance-check balance-ok"><i class="fas fa-circle-check"></i> ${esc(acc.name)}</span>`
        : `<span class="balance-check balance-fail"><i class="fas fa-triangle-exclamation"></i> Short ${formatINR(amount - acc.balance)}</span>`;
    }

    return `<div class="upcoming-card" style="margin-bottom:8px">
      <div class="upcoming-icon" style="background:#EEF2FF;color:#6366F1">
        <i class="fas ${item.paymentId ? 'fa-calendar-check' : 'fa-shield-halved'}"></i>
      </div>
      <div class="upcoming-info">
        <div class="upcoming-name">${esc(name)}</div>
        <div class="upcoming-meta">${dueBadgeHtml(days)}</div>
        ${balHtml}
      </div>
      <div class="upcoming-amount">${formatINR(amount)}</div>
    </div>`;
  }).join('');
}

function renderFreelanceSummaryWidget(freelance) {
  if (freelance.income === 0 && freelance.expense === 0) {
    return `<div class="empty-state" style="padding:20px">
      <div class="empty-state-icon" style="width:48px;height:48px;font-size:20px"><i class="fas fa-laptop-code"></i></div>
      <p style="font-size:13px;margin-bottom:0">No freelance transactions this month</p>
    </div>`;
  }

  const margin = freelance.income ? Math.round((freelance.profit / freelance.income) * 100) : 0;

  return `
    <div class="info-grid" style="gap:8px">
      <div class="info-item">
        <div class="info-label">Income</div>
        <div class="info-value success">${formatINR(freelance.income)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Expenses</div>
        <div class="info-value danger">${formatINR(freelance.expense)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Profit</div>
        <div class="info-value success">${formatINR(freelance.profit)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Margin</div>
        <div class="info-value ${margin >= 30 ? 'success' : margin >= 10 ? 'warning' : 'danger'}">${margin}%</div>
      </div>
    </div>
    <div class="progress-wrapper mt-2">
      <div class="progress-label"><span>Profit Margin</span><span>${margin}%</span></div>
      <div class="progress-bar"><div class="progress-fill ${margin >= 30 ? 'success' : margin >= 10 ? 'warning' : 'danger'}" style="width:${margin}%"></div></div>
    </div>
  `;
}

function renderAccountsSummaryWidget() {
  const accounts = Accounts.list();
  if (accounts.length === 0) {
    return `<div class="empty-state" style="padding:20px">
      <div class="empty-state-icon" style="width:48px;height:48px;font-size:20px"><i class="fas fa-wallet"></i></div>
      <p style="font-size:13px;margin-bottom:0">No accounts added yet</p>
      <button class="btn btn-primary btn-sm mt-2" onclick="navigate('money')">Add Account</button>
    </div>`;
  }

  return accounts.slice(0, 5).map(acc => {
    const meta = accountTypeMeta(acc.type);
    return `<div class="list-item">
      <div class="list-icon" style="background:${meta.bg};color:${meta.color}"><i class="fas ${meta.icon}"></i></div>
      <div class="list-content">
        <div class="list-title">${esc(acc.name)}</div>
        <div class="list-sub">${meta.label}${acc.bankName ? ' · ' + esc(acc.bankName) : ''}</div>
      </div>
      <div class="list-amount">
        <div class="list-amount-value ${parseFloat(acc.balance) >= 0 ? 'text-success' : 'text-danger'}">${formatINR(acc.balance)}</div>
      </div>
    </div>`;
  }).join('');
}

function renderRecentTxnList(transactions) {
  if (transactions.length === 0) {
    return `<div class="empty-state" style="padding:20px">
      <div class="empty-state-icon" style="width:48px;height:48px;font-size:20px"><i class="fas fa-receipt"></i></div>
      <p style="font-size:13px;margin-bottom:0">No transactions yet</p>
    </div>`;
  }

  return transactions.map(t => {
    const meta = txnTypeMeta(t.type);
    const isPositive = ['income', 'repayment_received', 'borrowed'].includes(t.type);
    return `<div class="list-item">
      <div class="list-icon" style="background:${meta.bg};color:${meta.color}"><i class="fas ${meta.icon}"></i></div>
      <div class="list-content">
        <div class="list-title">${esc(t.description || t.category || t.type)}</div>
        <div class="list-sub">${formatDate(t.date)}</div>
      </div>
      <div class="list-amount">
        <div class="list-amount-value ${isPositive ? 'text-success' : 'text-danger'}">
          ${isPositive ? '+' : '-'}${formatINR(t.amount)}
        </div>
      </div>
    </div>`;
  }).join('');
}
