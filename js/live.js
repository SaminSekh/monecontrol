// ============================================
// LIVE EARNING TRACKER (Multiple Incomes)
// ============================================

const DB_LIVE_KEY = 'mf_live_settings';

function getLiveIncomes() {
  try {
    const data = JSON.parse(localStorage.getItem(DB_LIVE_KEY));
    if (!data) return [];
    
    // Migration from old single-object format
    if (!Array.isArray(data)) {
      if (data.amount > 0) {
        const migrated = [{ id: uuid(), name: 'Primary Income', amount: data.amount, frequency: data.frequency }];
        localStorage.setItem(DB_LIVE_KEY, JSON.stringify(migrated));
        return migrated;
      }
      return [];
    }
    return data;
  } catch {
    return [];
  }
}

function saveLiveIncomes(incomes) {
  localStorage.setItem(DB_LIVE_KEY, JSON.stringify(incomes));
}

let liveTickerInterval = null;

function renderLive() {
  const incomes = getLiveIncomes();
  const page = document.getElementById('page-live');
  if (!page) return;
  
  page.innerHTML = `
    <div class="page-header mb-3">
      <h2>Live Earnings</h2>
      <p class="text-muted" style="font-size:13px; line-height:1.4">Watch your combined money grow in real-time. (This data is for visualization only and does not affect your actual ledger).</p>
    </div>

    <div class="card mb-4">
      <div class="card-body" style="text-align: center; padding: 40px 20px;">
        <p class="text-muted" style="margin-bottom: 10px; font-size: 16px; font-weight:500;">Earned Today So Far</p>
        <div id="live-ticker-display" class="text-success" style="font-size: 30px; font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -1px; margin:0; line-height:1;">₹0.0000</div>
        <p class="text-muted" style="margin-top: 15px; font-size: 13px; margin-bottom:0">(Since Midnight)</p>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; padding-bottom:8px">
        <h3 style="margin:0; font-size:14px; color:var(--text-muted)"><i class="fas fa-briefcase" style="margin-right:6px"></i> Income Sources</h3>
        <button class="btn btn-sm btn-primary" onclick="openLiveIncomeModal()"><i class="fas fa-plus"></i> Add</button>
      </div>
      <div class="card-body p-0">
        ${incomes.length === 0 ? 
          '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:14px;">No income sources added yet.</div>' : 
          incomes.map(inc => `
          <div class="list-item">
            <div class="list-icon" style="background:#EEF2FF;color:#6366F1"><i class="fas fa-money-bill-wave"></i></div>
            <div class="list-content">
              <div class="list-title">${esc(inc.name)}</div>
              <div class="list-subtitle">${formatINR(inc.amount)} / ${inc.frequency}</div>
            </div>
            <div class="list-actions">
              <button class="btn btn-icon btn-ghost" onclick='openLiveIncomeModal(${JSON.stringify(inc).replace(/'/g, "&#39;")})'><i class="fas fa-pen"></i></button>
              <button class="btn btn-icon btn-ghost text-danger" onclick="deleteLiveIncome('${inc.id}')"><i class="fas fa-trash-can"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 style="font-size:14px; margin:0; color:var(--text-muted)">Combined Earning Rates</h3>
      </div>
      <div class="card-body p-0">
        <div class="list-item">
          <div class="list-icon" style="background:#F3E8FF;color:#A855F7"><i class="fas fa-calendar"></i></div>
          <div class="list-content">
            <div class="list-title">Per Year</div>
            <div class="list-subtitle">365 days</div>
          </div>
          <div class="list-amount success" id="rate-year" style="font-weight:700">₹0.00</div>
        </div>
        <div class="list-item">
          <div class="list-icon" style="background:#E0F2FE;color:#0EA5E9"><i class="fas fa-calendar-days"></i></div>
          <div class="list-content">
            <div class="list-title">Per Month</div>
            <div class="list-subtitle">30 days</div>
          </div>
          <div class="list-amount success" id="rate-month" style="font-weight:700">₹0.00</div>
        </div>
        <div class="list-item">
          <div class="list-icon" style="background:#EEF2FF;color:#6366F1"><i class="fas fa-calendar-day"></i></div>
          <div class="list-content">
            <div class="list-title">Per Day</div>
            <div class="list-subtitle">24 hours</div>
          </div>
          <div class="list-amount success" id="rate-day" style="font-weight:700">₹0.00</div>
        </div>
        <div class="list-item">
          <div class="list-icon" style="background:#F0FDF4;color:#22C55E"><i class="fas fa-clock"></i></div>
          <div class="list-content">
            <div class="list-title">Per Hour</div>
            <div class="list-subtitle">60 minutes</div>
          </div>
          <div class="list-amount success" id="rate-hour" style="font-weight:700">₹0.00</div>
        </div>
        <div class="list-item">
          <div class="list-icon" style="background:#FFFBEB;color:#F59E0B"><i class="fas fa-stopwatch"></i></div>
          <div class="list-content">
            <div class="list-title">Per Minute</div>
            <div class="list-subtitle">60 seconds</div>
          </div>
          <div class="list-amount success" id="rate-minute" style="font-weight:700">₹0.00</div>
        </div>
        <div class="list-item">
          <div class="list-icon" style="background:#FEF2F2;color:#EF4444"><i class="fas fa-bolt"></i></div>
          <div class="list-content">
            <div class="list-title">Per Second</div>
            <div class="list-subtitle">1000 ms</div>
          </div>
          <div class="list-amount success" id="rate-second" style="font-weight:700">₹0.0000</div>
        </div>
      </div>
      </div>
    </div>
    
    <div class="card mt-4 mb-4">
      <div class="card-header">
        <h3 style="font-size:14px; margin:0; color:var(--text-muted)"><i class="fas fa-bullseye" style="margin-right:6px"></i> Goal Calculator</h3>
      </div>
      <div class="card-body">
        <p class="text-muted" style="font-size:13px; margin-bottom:12px;">Find out exactly how long it takes to earn a specific amount.</p>
        <div class="form-group mb-0">
          <label class="form-label">Target Amount (₹)</label>
          <input type="number" id="live-goal-amount" class="form-control" placeholder="e.g. 1000000" oninput="calculateLiveGoal()" min="0">
        </div>
        <div id="live-goal-result" style="display:none; margin-top:15px; padding:15px; background:var(--primary-bg); border-radius:var(--radius-sm); color:var(--primary-dark); font-weight:500; font-size:14px;">
        </div>
      </div>
    </div>
  `;

  startLiveTicker(incomes);
}

function calculateLiveGoal() {
  const amountEl = document.getElementById('live-goal-amount');
  const resultEl = document.getElementById('live-goal-result');
  if (!amountEl || !resultEl) return;
  
  const target = parseFloat(amountEl.value);
  if (isNaN(target) || target <= 0) {
    resultEl.style.display = 'none';
    return;
  }
  
  const incomes = getLiveIncomes();
  let totalPerDay = 0;
  incomes.forEach(inc => {
    if (inc.frequency === 'daily') totalPerDay += inc.amount;
    else if (inc.frequency === 'weekly') totalPerDay += inc.amount / 7;
    else if (inc.frequency === 'monthly') totalPerDay += inc.amount / 30.436875;
    else if (inc.frequency === 'yearly') totalPerDay += inc.amount / 365.25;
  });
  
  if (totalPerDay <= 0) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = '<i class="fas fa-circle-info"></i> Please add an income source first to calculate goals.';
    return;
  }
  
  let daysNeeded = target / totalPerDay;
  const years = Math.floor(daysNeeded / 365.25);
  daysNeeded -= years * 365.25;
  const months = Math.floor(daysNeeded / 30.436875);
  daysNeeded -= months * 30.436875;
  const days = Math.round(daysNeeded);
  
  let parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  
  resultEl.style.display = 'block';
  resultEl.innerHTML = `<i class="fas fa-stopwatch" style="margin-right:6px"></i> It will take you <strong>${parts.join(', ')}</strong> to earn ${formatINR(target)}.`;
}

function openLiveIncomeModal(income = null) {
  openModal({
    title: income ? 'Edit Income Source' : 'Add Income Source',
    icon: 'fa-money-bill-trend-up',
    body: `
      <form id="live-income-form">
        <input type="hidden" name="id" value="${income?.id || ''}">
        <div class="form-group">
          <label class="form-label">Income Name</label>
          <input type="text" name="name" class="form-control" placeholder="e.g. Primary Salary" value="${esc(income?.name || '')}" required>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label class="form-label">Amount (₹)</label>
            <input type="number" name="amount" class="form-control" value="${income?.amount || ''}" placeholder="e.g. 50000" min="0" step="0.01" required>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Frequency</label>
            <select name="frequency" class="form-control">
              <option value="daily" ${income?.frequency === 'daily' ? 'selected' : ''}>Daily</option>
              <option value="weekly" ${income?.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
              <option value="monthly" ${income?.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
              <option value="yearly" ${income?.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
            </select>
          </div>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveLiveIncome()"><i class="fas fa-check"></i> Save</button>
    `
  });
}

function saveLiveIncome() {
  const form = document.getElementById('live-income-form');
  if (!form.reportValidity()) return;
  
  const d = new FormData(form);
  const id = d.get('id');
  const name = d.get('name');
  const amount = parseFloat(d.get('amount')) || 0;
  const frequency = d.get('frequency');
  
  let incomes = getLiveIncomes();
  
  if (id) {
    const idx = incomes.findIndex(i => i.id === id);
    if (idx !== -1) incomes[idx] = { id, name, amount, frequency };
  } else {
    incomes.push({ id: uuid(), name, amount, frequency });
  }
  
  saveLiveIncomes(incomes);
  closeModal();
  renderLive();
}

function deleteLiveIncome(id) {
  confirmDialog({
    title: 'Delete Income?',
    message: 'Are you sure you want to remove this income source from the live tracker?',
    onConfirm: () => {
      let incomes = getLiveIncomes();
      incomes = incomes.filter(i => i.id !== id);
      saveLiveIncomes(incomes);
      renderLive();
    }
  });
}

function startLiveTicker(incomes) {
  if (liveTickerInterval) {
    cancelAnimationFrame(liveTickerInterval);
    liveTickerInterval = null;
  }

  let totalPerDay = 0;

  incomes.forEach(inc => {
    let perDay = 0;
    if (inc.frequency === 'daily') perDay = inc.amount;
    else if (inc.frequency === 'weekly') perDay = inc.amount / 7;
    else if (inc.frequency === 'monthly') perDay = inc.amount / 30.436875; // Average days in month
    else if (inc.frequency === 'yearly') perDay = inc.amount / 365.25;
    totalPerDay += perDay;
  });

  const perYear = totalPerDay * 365.25;
  const perMonth = totalPerDay * 30.436875;
  const perHour = totalPerDay / 24;
  const perMinute = perHour / 60;
  const perSecond = perMinute / 60;
  const perMillisecond = perSecond / 1000;

  const rYear = document.getElementById('rate-year');
  const rMonth = document.getElementById('rate-month');
  const rDay = document.getElementById('rate-day');
  const rHour = document.getElementById('rate-hour');
  const rMin = document.getElementById('rate-minute');
  const rSec = document.getElementById('rate-second');
  
  if (rYear) rYear.innerText = formatINR(perYear);
  if (rMonth) rMonth.innerText = formatINR(perMonth);
  if (rDay) rDay.innerText = formatINR(totalPerDay);
  if (rHour) rHour.innerText = formatINR(perHour);
  if (rMin) rMin.innerText = formatINR(perMinute);
  if (rSec) rSec.innerText = '₹' + perSecond.toFixed(4);

  const tickerEl = document.getElementById('live-ticker-display');
  const dashTickerEl = document.getElementById('dashboard-live-ticker');
  if (!tickerEl && !dashTickerEl) return;

  function updateTicker() {
    const now = new Date();
    // Milliseconds since midnight
    const msSinceMidnight = 
      now.getHours() * 3600000 +
      now.getMinutes() * 60000 +
      now.getSeconds() * 1000 +
      now.getMilliseconds();
      
    const earnedToday = msSinceMidnight * perMillisecond;
    const formatted = '₹' + earnedToday.toFixed(4);
    
    // Animate smoothly
    if (tickerEl) tickerEl.innerText = formatted;
    if (dashTickerEl) dashTickerEl.innerText = formatted;
    
    liveTickerInterval = requestAnimationFrame(updateTicker);
  }
  
  if (totalPerDay > 0) {
    liveTickerInterval = requestAnimationFrame(updateTicker);
  } else {
    if (tickerEl) tickerEl.innerText = '₹0.0000';
    if (dashTickerEl) dashTickerEl.innerText = '₹0.0000';
  }
}

// Intercept page navigation to stop animation when not viewing Live or Dashboard tab
document.addEventListener('DOMContentLoaded', () => {
  const originalNavigate = window.navigate;
  if (originalNavigate) {
    window.navigate = function(page) {
      if (page !== 'live' && page !== 'dashboard' && liveTickerInterval) {
        cancelAnimationFrame(liveTickerInterval);
        liveTickerInterval = null;
      }
      originalNavigate(page);
    };
  }
});
