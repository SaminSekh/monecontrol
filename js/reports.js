// ============================================
// reports.js — Reports Page
// ============================================

let reportFilter = 'month';
let reportFrom = '', reportTo = '';

function renderReports() {
  const now = new Date();
  const ranges = getDateRange(reportFilter, reportFrom, reportTo);

  document.getElementById('page-reports').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Reports</h2>
        <p>Financial overview and analysis</p>
      </div>
    </div>

    <!-- Date Filter -->
    <div class="card section-gap">
      <div class="card-body">
        <div class="filter-row">
          ${['today','week','month','lastmonth','year','custom'].map(f => `
            <button class="filter-chip ${reportFilter === f ? 'active' : ''}" data-filter="${f}">
              ${f === 'today' ? 'Today' : f === 'week' ? 'This Week' : f === 'month' ? 'This Month' :
                f === 'lastmonth' ? 'Last Month' : f === 'year' ? 'This Year' : 'Custom'}
            </button>
          `).join('')}
        </div>
        ${reportFilter === 'custom' ? `
          <div class="form-row" style="margin-top:10px">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">From</label>
              <input type="date" id="report-from" class="form-control" value="${reportFrom}">
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">To</label>
              <input type="date" id="report-to" class="form-control" value="${reportTo}">
            </div>
            <div style="display:flex;align-items:flex-end">
              <button class="btn btn-primary" id="apply-custom-range">Apply</button>
            </div>
          </div>
        ` : ''}
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px">
          <i class="fas fa-calendar"></i> ${formatDate(ranges.from)} → ${formatDate(ranges.to)}
        </div>
      </div>
    </div>

    ${renderReportContent(ranges)}
  `;

  // Filter chips
  document.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      reportFilter = btn.dataset.filter;
      if (reportFilter !== 'custom') { reportFrom = ''; reportTo = ''; }
      renderReports();
    });
  });

  document.getElementById('apply-custom-range')?.addEventListener('click', () => {
    reportFrom = document.getElementById('report-from').value;
    reportTo = document.getElementById('report-to').value;
    renderReports();
  });

  // Draw chart after render
  setTimeout(() => drawReportsChart(ranges), 100);
}

function getDateRange(filter, customFrom, customTo) {
  const now = new Date();
  let from, to;

  switch (filter) {
    case 'today':
      from = to = now.toISOString().split('T')[0];
      break;
    case 'week':
      const dayOfWeek = now.getDay();
      from = new Date(now); from.setDate(now.getDate() - dayOfWeek);
      to = new Date(now); to.setDate(now.getDate() + (6 - dayOfWeek));
      from = from.toISOString().split('T')[0];
      to = to.toISOString().split('T')[0];
      break;
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      break;
    case 'lastmonth':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      break;
    case 'year':
      from = `${now.getFullYear()}-01-01`;
      to = `${now.getFullYear()}-12-31`;
      break;
    case 'custom':
      from = customFrom || now.toISOString().split('T')[0];
      to = customTo || now.toISOString().split('T')[0];
      break;
    default:
      from = to = now.toISOString().split('T')[0];
  }
  return { from, to };
}

function renderTxnTooltip(tList) {
  if (tList.length === 0) return '<div class="tooltip-row">No transactions</div>';
  const rows = tList.slice(0, 5).map(t => `
    <div class="tooltip-row" style="flex-direction:column;align-items:flex-start;gap:2px">
      <div style="display:flex;justify-content:space-between;width:100%">
        <span class="tooltip-label">${esc(t.description || t.category)}</span>
        <span class="tooltip-value">${formatINR(t.amount)}</span>
      </div>
      <div style="font-size:10px;color:var(--text-muted)">${new Date(t.date).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
    </div>
  `).join('');
  if (tList.length > 5) return rows + `<div class="tooltip-row" style="justify-content:center;color:var(--text-muted);font-size:10px;margin-top:4px;border-top:none">...and ${tList.length - 5} more</div>`;
  return rows;
}

function renderReportContent(ranges) {
  const txns = Transactions.byDateRange(ranges.from, ranges.to);
  const flTxns = FreelanceTxns.list().filter(t => {
    const d = t.date;
    return d >= ranges.from && d <= ranges.to;
  });

  // Totals
  const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const emiPaid = txns.filter(t => t.type === 'expense' && t.category === 'emi').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const insPaid = txns.filter(t => t.type === 'expense' && t.category === 'insurance').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const netCashFlow = income - expense;

  const flIncome = flTxns.reduce((s, t) => s + (parseFloat(t.inrIncome) || 0), 0);
  const flExpense = flTxns.reduce((s, t) => s + (parseFloat(t.inrExpense) || 0), 0);
  const flProfit = flTxns.reduce((s, t) => s + (parseFloat(t.inrProfit) || 0), 0);

  const lentInPeriod = LoansLent.list().filter(l => l.givenDate >= ranges.from && l.givenDate <= ranges.to)
    .reduce((s, l) => s + (parseFloat(l.amountGiven) || 0), 0);
  const borrowedInPeriod = LoansBorrowed.list().filter(l => l.borrowedDate >= ranges.from && l.borrowedDate <= ranges.to)
    .reduce((s, l) => s + (parseFloat(l.amountBorrowed) || 0), 0);

  const nw = Calc.netWorth();

  return `
    <!-- Net Worth Snapshot -->
    <div class="card section-gap" style="overflow:visible">
      <div class="card-body-lg">
        <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Current Net Worth Snapshot</div>
        <div class="report-summary-grid">
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Total Available</div>
            <div class="report-summary-value text-success">${formatINR(nw.available)}</div>
            <div class="tooltip-card">
              <div class="tooltip-row"><span class="tooltip-label">Cash</span><span class="tooltip-value">${formatINR(nw.cash)}</span></div>
              <div class="tooltip-row"><span class="tooltip-label">Bank</span><span class="tooltip-value">${formatINR(nw.bank)}</span></div>
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Will Receive</div>
            <div class="report-summary-value text-brand">${formatINR(nw.receivable)}</div>
            <div class="tooltip-card">
              ${LoansLent.list().filter(l => (l.amount - l.repaid) > 0).map(l => `
                <div class="tooltip-row"><span class="tooltip-label">${esc(l.personName)}</span><span class="tooltip-value">${formatINR(l.amount - l.repaid)}</span></div>
              `).join('') || '<div class="tooltip-row">Nobody owes you</div>'}
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Need to Pay</div>
            <div class="report-summary-value text-danger">${formatINR(nw.payable)}</div>
            <div class="tooltip-card">
              ${LoansBorrowed.list().filter(l => (l.amount - l.repaid) > 0).map(l => `
                <div class="tooltip-row"><span class="tooltip-label">${esc(l.personName)}</span><span class="tooltip-value">${formatINR(l.amount - l.repaid)}</span></div>
              `).join('') || '<div class="tooltip-row">You owe nothing</div>'}
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Net Worth</div>
            <div class="report-summary-value ${nw.netWorth >= 0 ? 'text-success' : 'text-danger'}">${formatINR(nw.netWorth)}</div>
            <div class="tooltip-card">
              <div class="tooltip-row"><span class="tooltip-label">Assets</span><span class="tooltip-value text-success">+${formatINR(nw.available + nw.receivable)}</span></div>
              <div class="tooltip-row"><span class="tooltip-label">Liabilities</span><span class="tooltip-value text-danger">-${formatINR(nw.payable)}</span></div>
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Cash</div>
            <div class="report-summary-value">${formatINR(nw.cash)}</div>
            <div class="tooltip-card">
              ${Accounts.list().filter(a => a.type === 'cash').map(a => `
                <div class="tooltip-row"><span class="tooltip-label">${esc(a.name)}</span><span class="tooltip-value">${formatINR(a.balance)}</span></div>
              `).join('') || '<div class="tooltip-row">No cash accounts</div>'}
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Bank Balance</div>
            <div class="report-summary-value">${formatINR(nw.bank)}</div>
            <div class="tooltip-card">
              ${Accounts.list().filter(a => a.type === 'bank' || a.type === 'savings').map(a => `
                <div class="tooltip-row"><span class="tooltip-label">${esc(a.name)}</span><span class="tooltip-value">${formatINR(a.balance)}</span></div>
              `).join('') || '<div class="tooltip-row">No bank accounts</div>'}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Period Summary -->
    <div class="card section-gap" style="overflow:visible">
      <div class="card-body-lg">
        <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Period Summary</div>
        <div class="report-summary-grid">
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Total Income</div>
            <div class="report-summary-value text-success">${formatINR(income)}</div>
            <div class="tooltip-card" style="width:200px">
              ${renderTxnTooltip(txns.filter(t => t.type === 'income').sort((a,b)=>new Date(b.date)-new Date(a.date)))}
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Total Expenses</div>
            <div class="report-summary-value text-danger">${formatINR(expense)}</div>
            <div class="tooltip-card" style="width:200px">
              ${renderTxnTooltip(txns.filter(t => t.type === 'expense').sort((a,b)=>new Date(b.date)-new Date(a.date)))}
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Net Cash Flow</div>
            <div class="report-summary-value ${netCashFlow >= 0 ? 'text-success' : 'text-danger'}">${formatINR(netCashFlow)}</div>
            <div class="tooltip-card">
              <div class="tooltip-row"><span class="tooltip-label">Total In</span><span class="tooltip-value text-success">+${formatINR(income)}</span></div>
              <div class="tooltip-row"><span class="tooltip-label">Total Out</span><span class="tooltip-value text-danger">-${formatINR(expense)}</span></div>
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">EMI Paid</div>
            <div class="report-summary-value">${formatINR(emiPaid)}</div>
            <div class="tooltip-card" style="width:200px">
              ${renderTxnTooltip(txns.filter(t => t.type === 'expense' && t.category === 'emi').sort((a,b)=>new Date(b.date)-new Date(a.date)))}
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Insurance Paid</div>
            <div class="report-summary-value">${formatINR(insPaid)}</div>
            <div class="tooltip-card" style="width:200px">
              ${renderTxnTooltip(txns.filter(t => t.type === 'expense' && t.category === 'insurance').sort((a,b)=>new Date(b.date)-new Date(a.date)))}
            </div>
          </div>
          <div class="report-summary-card has-tooltip">
            <div class="report-summary-label">Money Lent</div>
            <div class="report-summary-value">${formatINR(lentInPeriod)}</div>
            <div class="tooltip-card" style="width:200px">
              ${(function(){
                const ll = LoansLent.list().filter(l => l.givenDate >= ranges.from && l.givenDate <= ranges.to);
                if(!ll.length) return '<div class="tooltip-row">No loans given</div>';
                return ll.map(l => `
                  <div class="tooltip-row" style="flex-direction:column;align-items:flex-start;gap:2px">
                    <div style="display:flex;justify-content:space-between;width:100%">
                      <span class="tooltip-label">${esc(l.personName)}</span>
                      <span class="tooltip-value">${formatINR(l.amountGiven)}</span>
                    </div>
                    <div style="font-size:10px;color:var(--text-muted)">${new Date(l.givenDate).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</div>
                  </div>
                `).join('');
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Freelance Summary -->
    <div class="card section-gap">
      <div class="card-body-lg">
        <div style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Freelance Summary</div>
        <div class="report-summary-grid">
          <div class="report-summary-card">
            <div class="report-summary-label">Freelance Income</div>
            <div class="report-summary-value text-success">${formatINR(flIncome)}</div>
          </div>
          <div class="report-summary-card">
            <div class="report-summary-label">Freelance Expenses</div>
            <div class="report-summary-value text-danger">${formatINR(flExpense)}</div>
          </div>
          <div class="report-summary-card">
            <div class="report-summary-label">Freelance Profit</div>
            <div class="report-summary-value text-brand">${formatINR(flProfit)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-2 section-gap">
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <div class="chart-card-title">Account Balances</div>
            <div class="chart-card-sub">Current distribution</div>
          </div>
        </div>
        <canvas id="accounts-chart" height="220"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-card-header">
          <div>
            <div class="chart-card-title">Money Flow</div>
            <div class="chart-card-sub">Income vs Expenses</div>
          </div>
        </div>
        <canvas id="flow-chart" height="220"></canvas>
      </div>
    </div>

    <!-- Account Breakdown -->
    <div class="card section-gap">
      <div class="card-header" style="padding:16px 16px 0">
        <h3 style="font-size:14px">Account Balances</h3>
      </div>
      <div class="card-body">
        ${Accounts.list().map(acc => {
          const meta = accountTypeMeta(acc.type);
          const bal = parseFloat(acc.balance) || 0;
          return `<div class="list-item">
            <div class="list-icon" style="background:${meta.bg};color:${meta.color}"><i class="fas ${meta.icon}"></i></div>
            <div class="list-content">
              <div class="list-title">${esc(acc.name)}</div>
              <div class="list-sub">${meta.label}</div>
            </div>
            <div class="list-amount">
              <div class="list-amount-value ${bal >= 0 ? 'text-success' : 'text-danger'}">${formatINR(bal)}</div>
            </div>
          </div>`;
        }).join('') || '<div class="empty-state" style="padding:20px"><p>No accounts yet</p></div>'}
      </div>
    </div>
    <!-- Transaction Records -->
    <div class="card section-gap">
      <div class="card-header" style="padding:16px 16px 0">
        <h3 style="font-size:14px">Transaction Records</h3>
      </div>
      <div class="card-body">
        ${txns.length ? [...txns].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(t => {
          const meta = txnTypeMeta(t.type);
          const isPos = t.type === 'income' || t.type === 'repayment_received' || t.type === 'borrowed';
          const isTransfer = t.type === 'transfer';
          const amtCls = isPos ? 'text-success' : isTransfer ? 'text-brand' : 'text-danger';
          const prefix = isPos ? '+' : isTransfer ? '' : '-';
          return `<div class="list-item">
            <div class="list-icon" style="background:${meta.bg};color:${meta.color}"><i class="fas ${meta.icon}"></i></div>
            <div class="list-content">
              <div class="list-title">${esc(t.description || t.category || t.type)}</div>
              <div class="list-sub">${new Date(t.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</div>
            </div>
            <div class="list-amount">
              <div class="list-amount-value ${amtCls}">${prefix}${formatINR(t.amount)}</div>
            </div>
          </div>`;
        }).join('') : '<div class="empty-state" style="padding:20px"><p>No transactions in this period</p></div>'}
      </div>
    </div>
  `;
}

function drawReportsChart(ranges) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';

  // Accounts pie chart
  const accCanvas = document.getElementById('accounts-chart');
  if (accCanvas) {
    if (window._accChart) window._accChart.destroy();
    const accounts = Accounts.list();
    if (accounts.length > 0) {
      const colors = ['#6366F1','#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#14B8A6'];
      window._accChart = new Chart(accCanvas, {
        type: 'doughnut',
        data: {
          labels: accounts.map(a => a.name),
          datasets: [{
            data: accounts.map(a => Math.max(0, parseFloat(a.balance) || 0)),
            backgroundColor: accounts.map((_, i) => colors[i % colors.length]),
            borderWidth: 2,
            borderColor: isDark ? '#1E293B' : '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: textColor, boxRadius: 4 } },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatINR(ctx.raw)}` } }
          }
        }
      });
    }
  }

  // Flow bar chart
  const flowCanvas = document.getElementById('flow-chart');
  if (flowCanvas) {
    if (window._flowChart) window._flowChart.destroy();
    const txns = Transactions.byDateRange(ranges.from, ranges.to);
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const flTxns = FreelanceTxns.list().filter(t => t.date >= ranges.from && t.date <= ranges.to);
    const flIncome = flTxns.reduce((s, t) => s + (parseFloat(t.inrIncome) || 0), 0);
    const flExpense = flTxns.reduce((s, t) => s + (parseFloat(t.inrExpense) || 0), 0);

    window._flowChart = new Chart(flowCanvas, {
      type: 'bar',
      data: {
        labels: ['Regular', 'Freelance'],
        datasets: [
          { label: 'Income', data: [income, flIncome], backgroundColor: 'rgba(34,197,94,0.75)', borderRadius: 6 },
          { label: 'Expenses', data: [expense, flExpense], backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: textColor, boxRadius: 4 } },
          tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatINR(ctx.raw)}` } }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, callback: v => formatINRCompact(v) } }
        }
      }
    });
  }
}
