// ============================================
// freelancing.js — Freelancing Page
// ============================================

let freelanceView = 'overview'; // overview | clients | transactions

function renderFreelancing() {
  const totals = FreelanceTxns.totals();
  const clients = FreelanceClients.list();
  const monthly = Calc.monthlyFreelance();
  const allTxns = FreelanceTxns.list().sort((a, b) => new Date(b.date) - new Date(a.date));

  const margin = totals.income > 0 ? Math.round((totals.profit / totals.income) * 100) : 0;

  document.getElementById('page-freelancing').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Freelancing</h2>
        <p>Income, expenses, and profit tracking</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary btn-sm" id="btn-add-client"><i class="fas fa-user-plus"></i> Client</button>
        <button class="btn btn-primary" id="btn-add-txn"><i class="fas fa-plus"></i> Transaction</button>
      </div>
    </div>

    <!-- All-time totals banner -->
    <div class="freelance-profit-banner mb-4">
      <div style="position:relative;z-index:1">
        <div style="font-size:11px;font-weight:600;opacity:0.7;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">All-Time Freelance Profit</div>
        <div style="font-size:36px;font-weight:900;letter-spacing:-1px;margin-bottom:14px">${formatINR(totals.profit)}</div>
        <div style="display:flex;gap:20px">
          <div><div style="font-size:10px;opacity:0.65;text-transform:uppercase">Income</div><div style="font-size:15px;font-weight:700;color:#4ade80">${formatINR(totals.income)}</div></div>
          <div><div style="font-size:10px;opacity:0.65;text-transform:uppercase">Expenses</div><div style="font-size:15px;font-weight:700;color:#f87171">${formatINR(totals.expense)}</div></div>
          <div><div style="font-size:10px;opacity:0.65;text-transform:uppercase">Margin</div><div style="font-size:15px;font-weight:700;color:#a7f3d0">${margin}%</div></div>
        </div>
      </div>
    </div>

    <!-- This month -->
    <div class="card section-gap">
      <div class="card-header" style="padding:14px 16px 0">
        <h3 style="font-size:14px">This Month — ${currentMonthLabel()}</h3>
      </div>
      <div class="card-body">
        <div class="freelance-stat-row">
          <div class="freelance-stat">
            <div class="freelance-stat-icon" style="color:var(--success)"><i class="fas fa-money-bill-wave"></i></div>
            <div class="freelance-stat-value text-success">${formatINR(monthly.income)}</div>
            <div class="freelance-stat-label">Income</div>
          </div>
          <div class="freelance-stat">
            <div class="freelance-stat-icon" style="color:var(--danger)"><i class="fas fa-money-bill-transfer"></i></div>
            <div class="freelance-stat-value text-danger">${formatINR(monthly.expense)}</div>
            <div class="freelance-stat-label">Expenses</div>
          </div>
          <div class="freelance-stat">
            <div class="freelance-stat-icon" style="color:var(--primary)"><i class="fas fa-arrow-trend-up"></i></div>
            <div class="freelance-stat-value text-brand">${formatINR(monthly.profit)}</div>
            <div class="freelance-stat-label">Profit</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-card section-gap">
      <div class="chart-card-header">
        <div>
          <div class="chart-card-title">Monthly Income vs Expenses</div>
          <div class="chart-card-sub">Last 6 months</div>
        </div>
      </div>
      <canvas id="freelance-chart" height="200"></canvas>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab-btn ${freelanceView === 'clients' ? 'active' : ''}" onclick="freelanceView='clients';renderFreelancing()">
        <i class="fas fa-users"></i> Clients (${clients.length})
      </button>
      <button class="tab-btn ${freelanceView === 'transactions' || freelanceView === 'overview' ? 'active' : ''}" onclick="freelanceView='transactions';renderFreelancing()">
        <i class="fas fa-receipt"></i> All Transactions (${allTxns.length})
      </button>
    </div>

    <!-- Content -->
    <div id="freelance-content">
      ${freelanceView === 'clients' ? renderClientsTab(clients) : renderTransactionsTab(allTxns)}
    </div>
  `;

  // Buttons
  document.getElementById('btn-add-client').addEventListener('click', openClientModal);
  document.getElementById('btn-add-txn').addEventListener('click', () => openFreelanceTxnModal());

  // Card actions
  document.querySelectorAll('[data-fl-action]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handleFreelanceAction(el.dataset.flAction, el.dataset.flId);
    });
  });

  // Draw chart after render
  setTimeout(() => drawFreelanceChart(), 100);
}

function renderClientsTab(clients) {
  if (clients.length === 0) {
    return `<div class="empty-state">
      <div class="empty-state-icon"><i class="fas fa-users"></i></div>
      <h3>No Clients Yet</h3>
      <p>Add your freelance clients or companies to organize your income and expenses.</p>
      <button class="btn btn-primary" onclick="openClientModal()">Add First Client</button>
    </div>`;
  }

  return clients.map(client => {
    const txns = FreelanceTxns.forClient(client.id);
    const income = txns.reduce((s, t) => s + (parseFloat(t.inrIncome) || 0), 0);
    const expense = txns.reduce((s, t) => s + (parseFloat(t.inrExpense) || 0), 0);
    const profit = txns.reduce((s, t) => s + (parseFloat(t.inrProfit) || 0), 0);

    return `<div class="client-card mb-3">
      <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
        <div class="client-avatar">${initials(client.name)}</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700">${esc(client.name)}</div>
          ${client.notes ? `<div style="font-size:12px;color:var(--text-muted)">${esc(client.notes)}</div>` : ''}
          <div style="font-size:12px;color:var(--text-muted)">${txns.length} transactions</div>
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-ghost btn-icon-sm" data-fl-action="edit-client" data-fl-id="${client.id}"><i class="fas fa-pen"></i></button>
          <button class="btn btn-ghost btn-icon-sm" style="color:var(--danger)" data-fl-action="delete-client" data-fl-id="${client.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="info-grid" style="gap:8px">
        <div class="info-item">
          <div class="info-label">Total Income</div>
          <div class="info-value success">${formatINR(income)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Expenses</div>
          <div class="info-value danger">${formatINR(expense)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Profit</div>
          <div class="info-value success">${formatINR(profit)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Margin</div>
          <div class="info-value">${income > 0 ? Math.round((profit / income) * 100) : 0}%</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-top:10px;width:100%" data-fl-action="add-txn-client" data-fl-id="${client.id}">
        <i class="fas fa-plus"></i> Add Transaction for ${esc(client.name)}
      </button>
    </div>`;
  }).join('');
}

function renderTransactionsTab(txns) {
  if (txns.length === 0) {
    return `<div class="empty-state">
      <div class="empty-state-icon"><i class="fas fa-receipt"></i></div>
      <h3>No Transactions Yet</h3>
      <p>Record your freelance income and expenses from clients and projects.</p>
      <button class="btn btn-primary" onclick="openFreelanceTxnModal()">Add First Transaction</button>
    </div>`;
  }

  return txns.map(txn => `
    <div class="txn-card mb-2">
      <div class="client-avatar" style="width:36px;height:36px;font-size:13px">${initials(txn.clientName || '?')}</div>
      <div class="txn-info">
        <div class="txn-name">${esc(txn.description || txn.clientName)}</div>
        <div class="txn-meta">${esc(txn.clientName || '')} · ${formatDate(txn.date)}</div>
        ${txn.currency !== 'INR' && txn.foreignAmount
          ? `<div class="txn-meta" style="color:var(--info)">${txn.currency} ${txn.foreignAmount} @ ${txn.exchangeRate}</div>`
          : ''
        }
      </div>
      <div class="txn-amounts">
        <div class="txn-income">+${formatINR(txn.inrIncome)}</div>
        <div class="txn-expense">-${formatINR(txn.inrExpense)}</div>
        <div class="txn-profit">= ${formatINR(txn.inrProfit)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <button class="btn btn-ghost btn-icon-sm" data-fl-action="edit-txn" data-fl-id="${txn.id}"><i class="fas fa-pen"></i></button>
        <button class="btn btn-ghost btn-icon-sm" style="color:var(--danger)" data-fl-action="delete-txn" data-fl-id="${txn.id}"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

function handleFreelanceAction(action, id) {
  switch (action) {
    case 'edit-client': {
      const c = FreelanceClients.find(id);
      if (c) openClientModal(c);
      break;
    }
    case 'delete-client': {
      const c = FreelanceClients.find(id);
      if (!c) return;
      confirmDialog({
        title: 'Delete Client?',
        message: `Delete "${c.name}" and all their transactions? This cannot be undone.`,
        onConfirm: () => {
          FreelanceClients.delete(id);
          showToast('Client deleted', 'success');
          renderFreelancing();
        }
      });
      break;
    }
    case 'add-txn-client': openFreelanceTxnModal(null, id); break;
    case 'edit-txn': {
      const t = FreelanceTxns.find(id);
      if (t) openFreelanceTxnModal(t);
      break;
    }
    case 'delete-txn': {
      const t = FreelanceTxns.find(id);
      if (!t) return;
      confirmDialog({
        title: 'Delete Transaction?',
        message: 'Delete this freelance transaction? This cannot be undone.',
        onConfirm: () => {
          FreelanceTxns.delete(id);
          showToast('Transaction deleted', 'success');
          renderFreelancing();
          refreshDashboardWidget();
        }
      });
      break;
    }
  }
}

function openClientModal(client = null) {
  const isEdit = !!client;
  openModal({
    title: isEdit ? 'Edit Client' : 'Add Client / Company',
    icon: 'fa-user-tie',
    body: `
      <form id="client-form">
        <div class="form-group">
          <label class="form-label">Client / Company Name <span class="required">*</span></label>
          <input type="text" name="name" class="form-control" placeholder="e.g. ABC Technologies" required value="${esc(client?.name || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="form-control" rows="2" placeholder="Contact info, project details...">${esc(client?.notes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-client-btn">${isEdit ? 'Save' : 'Add Client'}</button>
    `
  });

  document.getElementById('save-client-btn').addEventListener('click', () => {
    const form = document.getElementById('client-form');
    if (!validateForm(form)) return;
    const data = formData(form);
    if (isEdit) {
      FreelanceClients.update(client.id, data);
      showToast('Client updated!', 'success');
    } else {
      FreelanceClients.create(data);
      showToast('Client added!', 'success');
    }
    closeModal();
    renderFreelancing();
  });
}

function openFreelanceTxnModal(txn = null, presetClientId = null) {
  const isEdit = !!txn;
  const clients = FreelanceClients.list();

  openModal({
    title: isEdit ? 'Edit Transaction' : 'Add Freelance Transaction',
    icon: 'fa-laptop-code',
    iconBg: '#F5F3FF',
    iconColor: '#8B5CF6',
    size: 'modal-lg',
    body: `
      <form id="fl-txn-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Client / Company <span class="required">*</span></label>
            <select name="clientId" class="form-control" id="fl-client-select" required>
              <option value="">— Select Client —</option>
              ${clients.map(c => `<option value="${c.id}" ${(txn?.clientId === c.id || presetClientId === c.id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
              <option value="__new__">+ Add New Client</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date <span class="required">*</span></label>
            <input type="date" name="date" class="form-control" value="${formatDateInput(txn?.date) || todayStr()}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description <span class="required">*</span></label>
          <input type="text" name="description" class="form-control" placeholder="e.g. Website development, Logo design" required value="${esc(txn?.description || '')}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Currency</label>
            <select name="currency" class="form-control" id="fl-currency">
              <option value="INR" ${(!txn || txn.currency === 'INR') ? 'selected' : ''}>INR ₹</option>
              <option value="USD" ${txn?.currency === 'USD' ? 'selected' : ''}>USD $</option>
              <option value="EUR" ${txn?.currency === 'EUR' ? 'selected' : ''}>EUR €</option>
              <option value="GBP" ${txn?.currency === 'GBP' ? 'selected' : ''}>GBP £</option>
              <option value="AED" ${txn?.currency === 'AED' ? 'selected' : ''}>AED د.إ</option>
            </select>
          </div>
          <div class="form-group" id="exchange-rate-group" style="${(!txn || txn.currency === 'INR') ? 'display:none' : ''}">
            <label class="form-label">Exchange Rate (1 unit = ₹)</label>
            <input type="number" name="exchangeRate" class="form-control" placeholder="e.g. 85" min="0" step="0.01" value="${txn?.exchangeRate || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Amount Received <span class="required">*</span></label>
            <input type="number" name="foreignAmount" class="form-control" placeholder="e.g. 100" required min="0" step="0.01" value="${txn?.foreignAmount || txn?.inrIncome || ''}" id="fl-income-input">
            <div class="form-hint" id="fl-inr-income-hint">${txn && txn.currency !== 'INR' ? `= ${formatINR(txn.inrIncome)}` : ''}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Expenses Paid (same currency)</label>
            <input type="number" name="foreignExpense" class="form-control" placeholder="0" min="0" step="0.01" value="${txn?.foreignExpense || txn?.inrExpense || 0}" id="fl-expense-input">
          </div>
        </div>

        <!-- INR Preview -->
        <div id="fl-inr-preview" style="background:var(--gray-50);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;font-weight:600">INR Calculation Preview</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            <div><div style="font-size:10px;color:var(--text-muted)">INCOME</div><div style="font-weight:800;color:var(--success)" id="fl-preview-income">₹0</div></div>
            <div><div style="font-size:10px;color:var(--text-muted)">EXPENSE</div><div style="font-weight:800;color:var(--danger)" id="fl-preview-expense">₹0</div></div>
            <div><div style="font-size:10px;color:var(--text-muted)">PROFIT</div><div style="font-weight:800;color:var(--primary)" id="fl-preview-profit">₹0</div></div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Payment Method</label>
            <select name="paymentMethod" class="form-control">
              <option value="Bank Transfer" ${txn?.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
              <option value="UPI" ${txn?.paymentMethod === 'UPI' ? 'selected' : ''}>UPI</option>
              <option value="Payoneer" ${txn?.paymentMethod === 'Payoneer' ? 'selected' : ''}>Payoneer</option>
              <option value="PayPal" ${txn?.paymentMethod === 'PayPal' ? 'selected' : ''}>PayPal</option>
              <option value="Wise" ${txn?.paymentMethod === 'Wise' ? 'selected' : ''}>Wise</option>
              <option value="Cash" ${txn?.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
              <option value="Other" ${txn?.paymentMethod === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Linked Account (optional)</label>
            <select name="accountId" class="form-control">
              ${accountSelectOptions(txn?.accountId)}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="form-control" rows="2" placeholder="Project details, invoice number, etc.">${esc(txn?.notes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-fl-txn-btn">${isEdit ? 'Save Changes' : 'Add Transaction'}</button>
    `
  });

  // Currency toggle
  const currencySelect = document.getElementById('fl-currency');
  const exchangeGroup = document.getElementById('exchange-rate-group');
  function updateExchangeVisibility() {
    exchangeGroup.style.display = currencySelect.value !== 'INR' ? '' : 'none';
    updatePreview();
  }
  currencySelect?.addEventListener('change', updateExchangeVisibility);

  // Live preview
  function updatePreview() {
    const currency = currencySelect?.value || 'INR';
    const rate = parseFloat(document.querySelector('[name="exchangeRate"]')?.value) || (currency === 'INR' ? 1 : 0);
    const income = parseFloat(document.getElementById('fl-income-input')?.value) || 0;
    const expense = parseFloat(document.getElementById('fl-expense-input')?.value) || 0;
    const factor = currency === 'INR' ? 1 : rate;
    const inrIncome = income * factor;
    const inrExpense = expense * factor;
    const inrProfit = inrIncome - inrExpense;
    document.getElementById('fl-preview-income').textContent = formatINR(inrIncome);
    document.getElementById('fl-preview-expense').textContent = formatINR(inrExpense);
    document.getElementById('fl-preview-profit').textContent = formatINR(inrProfit);
  }

  document.getElementById('fl-income-input')?.addEventListener('input', updatePreview);
  document.getElementById('fl-expense-input')?.addEventListener('input', updatePreview);
  document.querySelector('[name="exchangeRate"]')?.addEventListener('input', updatePreview);

  // Handle "Add new client" in select
  document.getElementById('fl-client-select')?.addEventListener('change', function() {
    if (this.value === '__new__') {
      this.value = '';
      closeModal();
      openClientModal();
    }
  });

  updatePreview();

  document.getElementById('save-fl-txn-btn').addEventListener('click', () => {
    const form = document.getElementById('fl-txn-form');
    if (!validateForm(form)) { showToast('Please fill required fields', 'warning'); return; }
    const data = formData(form);
    if (!data.clientId) { showToast('Please select a client', 'warning'); return; }

    const currency = data.currency || 'INR';
    const rate = parseFloat(data.exchangeRate) || (currency === 'INR' ? 1 : 0);
    const foreignAmount = parseFloat(data.foreignAmount) || 0;
    const foreignExpense = parseFloat(data.foreignExpense) || 0;
    const factor = currency === 'INR' ? 1 : rate;
    const inrIncome = foreignAmount * factor;
    const inrExpense = foreignExpense * factor;
    const inrProfit = inrIncome - inrExpense;

    const client = FreelanceClients.find(data.clientId);
    const txnData = {
      ...data,
      clientName: client?.name || '',
      foreignAmount,
      foreignExpense,
      exchangeRate: rate,
      inrIncome,
      inrExpense,
      inrProfit
    };

    if (isEdit) {
      FreelanceTxns.update(txn.id, txnData);
      showToast('Transaction updated!', 'success');
    } else {
      FreelanceTxns.create(txnData);
      // Credit account if selected
      if (data.accountId) {
        const acc = Accounts.find(data.accountId);
        if (acc) {
          Accounts.update(data.accountId, { balance: (parseFloat(acc.balance) || 0) + inrProfit });
          Transactions.create({
            type: 'income', category: 'freelance', amount: inrIncome,
            accountId: data.accountId, description: `Freelance Income: ${data.description}`, date: data.date
          });
          if (inrExpense > 0) {
            Transactions.create({
              type: 'expense', category: 'freelance_expense', amount: inrExpense,
              accountId: data.accountId, description: `Freelance Expense: ${data.description}`, date: data.date
            });
          }
        }
      }
      showToast('Transaction added!', 'success');
    }
    closeModal();
    renderFreelancing();
    refreshDashboardWidget();
  });
}

function drawFreelanceChart() {
  const canvas = document.getElementById('freelance-chart');
  if (!canvas) return;
  const monthly = FreelanceTxns.monthlyData(6);

  // Destroy existing chart
  if (window._freelanceChart) { window._freelanceChart.destroy(); }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#94A3B8' : '#64748B';

  window._freelanceChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: monthly.map(m => m.label),
      datasets: [
        {
          label: 'Income',
          data: monthly.map(m => m.income),
          backgroundColor: 'rgba(34,197,94,0.75)',
          borderRadius: 6
        },
        {
          label: 'Expenses',
          data: monthly.map(m => m.expense),
          backgroundColor: 'rgba(239,68,68,0.7)',
          borderRadius: 6
        },
        {
          label: 'Profit',
          data: monthly.map(m => m.profit),
          backgroundColor: 'rgba(99,102,241,0.8)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: textColor, boxRadius: 4 } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatINR(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            callback: v => formatINRCompact(v)
          }
        }
      }
    }
  });
}
