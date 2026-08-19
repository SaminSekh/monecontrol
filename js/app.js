// ============================================
// app.js — Router, Navigation, Toasts, Modals, Global UI
// ============================================

// ---- Current page state ----
let currentPage = 'dashboard';

// Pages shown via the 'More' sheet (not in main bottom nav)
const morePages = ['freelancing', 'insurance', 'reports', 'settings', 'live'];

// ---- Navigation ----
function navigate(page) {
  currentPage = page;

  // Update sidebar nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Update bottom nav items — highlight 'More' btn if on a more-page
  document.querySelectorAll('.bottom-nav-item').forEach(el => {
    if (el.id === 'more-nav-btn') {
      el.classList.toggle('active', morePages.includes(page));
    } else {
      el.classList.toggle('active', el.dataset.page === page);
    }
  });

  // Update page content
  document.querySelectorAll('.page').forEach(el => {
    el.classList.toggle('active', el.id === `page-${page}`);
  });

  // Update topbar title
  const titles = {
    dashboard: { title: 'Dashboard', sub: currentMonthLabel() },
    money: { title: 'My Money', sub: 'Accounts & Balances' },
    loans: { title: 'Loans', sub: 'Lent & Borrowed' },
    payments: { title: 'Payments & EMI', sub: 'Recurring Payments' },
    freelancing: { title: 'Freelancing', sub: 'Income & Expenses' },
    insurance: { title: 'Insurance', sub: 'Policies & Premiums' },
    reports: { title: 'Reports', sub: 'Financial Overview' },
    settings: { title: 'Settings', sub: 'App Preferences' },
    live: { title: 'Live Earnings', sub: 'Real-time Tracker' }
  };
  const t = titles[page] || { title: page, sub: '' };
  document.querySelector('.topbar-title h2').textContent = t.title;
  const subEl = document.querySelector('.topbar-title p'); if (subEl) subEl.textContent = t.sub;

  // Update mobile topbar
  const mobileTitle = document.querySelector('.mobile-topbar h2'); 
  if (mobileTitle) mobileTitle.textContent = t.title;

  // Render the page
  renderPage(page);
}

function renderPage(page) {
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'money': renderMoney(); break;
    case 'loans': renderLoans(); break;
    case 'payments': renderPayments(); break;
    case 'freelancing': renderFreelancing(); break;
    case 'insurance': renderInsurance(); break;
    case 'reports': renderReports(); break;
    case 'settings': renderSettings(); break;
    case 'live': renderLive(); break;
  }
}

// ---- Toast Notifications ----
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type] || icons.info}"></i>
    <span>${esc(message)}</span>
    <span class="toast-close"><i class="fas fa-xmark"></i></span>
  `;
  toastContainer.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  if (!toast.parentNode) return;
  toast.classList.add('removing');
  setTimeout(() => toast.remove(), 300);
}

// ---- Modal System ----
let activeModal = null;

function openModal({ title, icon = 'fa-circle', iconBg = '#EEF2FF', iconColor = '#6366F1', body, footer, size = '', onClose }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = `modal-overlay ${size}`;
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-icon" style="background:${iconBg};color:${iconColor}"><i class="fas ${icon}"></i></div>
        <span class="modal-title">${esc(title)}</span>
        <button class="modal-close" aria-label="Close"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  activeModal = { overlay, onClose };

  // Focus first input
  setTimeout(() => {
    const first = overlay.querySelector('input:not([type=hidden]), select, textarea');
    if (first) first.focus();
  }, 100);

  return overlay;
}

function closeModal() {
  if (!activeModal) return;
  const { overlay, onClose } = activeModal;
  overlay.classList.add('closing');
  overlay.querySelector('.modal')?.classList.add('closing');
  setTimeout(() => {
    overlay.remove();
    document.body.style.overflow = '';
    if (onClose) onClose();
  }, 200);
  activeModal = null;
}

// ---- Confirm Dialog ----
function confirmDialog({ title, message, confirmText = 'Delete', confirmClass = 'btn-danger', onConfirm }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay modal-sm';
  overlay.innerHTML = `
    <div class="confirm-dialog confirm-danger">
      <div class="confirm-icon"><i class="fas fa-trash-can"></i></div>
      <h3>${esc(title)}</h3>
      <p>${esc(message)}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn ${confirmClass}" id="confirm-ok">${esc(confirmText)}</button>
      </div>
    </div>
  `;
  overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ---- Form Helper ----
function formData(form) {
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });
  // Also get checkboxes
  form.querySelectorAll('input[type=checkbox]').forEach(cb => {
    data[cb.name] = cb.checked;
  });
  return data;
}

function populateForm(form, data) {
  Object.entries(data).forEach(([key, val]) => {
    const el = form.querySelector(`[name="${key}"]`);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!val;
    else el.value = val !== null && val !== undefined ? val : '';
  });
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(el => {
    if (!el.value.trim()) {
      el.classList.add('touched');
      valid = false;
    } else {
      el.classList.remove('touched');
    }
  });
  return valid;
}

// ---- Account Selector HTML ----
function accountSelectOptions(selectedId = '') {
  const accounts = Accounts.list();
  if (accounts.length === 0) return '<option value="">No accounts yet</option>';
  return '<option value="">— Select Account —</option>' +
    accounts.map(a => `<option value="${a.id}" ${a.id === selectedId ? 'selected' : ''}>${esc(a.name)} (${formatINR(a.balance)})</option>`).join('');
}

// ---- Refresh dashboard numbers ----
function refreshDashboardWidget() {
  if (currentPage === 'dashboard') renderDashboard();
}

// ---- FAB button ----
function initFab() {
  const fab = document.getElementById('fab-add');
  if (!fab) return;
  fab.addEventListener('click', () => showFabMenu());
}

function showFabMenu() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:340px">
      <div class="modal-header">
        <div class="modal-icon"><i class="fas fa-plus"></i></div>
        <span class="modal-title">Add Transaction</span>
        <button class="modal-close"><i class="fas fa-xmark"></i></button>
      </div>
      <div class="modal-body" style="padding:12px">
        ${[
          { page: 'money', action: 'add-expense', icon: 'fa-arrow-up-right-from-square', label: 'Add Expense', color: '#EF4444', bg: '#FEF2F2' },
          { page: 'money', action: 'add-income', icon: 'fa-arrow-down-long', label: 'Add Income', color: '#22C55E', bg: '#F0FDF4' },
          { page: 'money', action: 'add-account', icon: 'fa-wallet', label: 'Add Account', color: '#3B82F6', bg: '#EFF6FF' },
          { page: 'loans', action: 'add-lent', icon: 'fa-hand-holding-dollar', label: 'Money I Lent', color: '#F59E0B', bg: '#FFFBEB' },
          { page: 'loans', action: 'add-borrowed', icon: 'fa-sack-dollar', label: 'Money I Borrowed', color: '#EF4444', bg: '#FEF2F2' },
          { page: 'payments', action: 'add-payment', icon: 'fa-calendar-check', label: 'Add EMI / Payment', color: '#6366F1', bg: '#EEF2FF' },
          { page: 'insurance', action: 'add-insurance', icon: 'fa-shield-halved', label: 'Add Insurance', color: '#0EA5E9', bg: '#E0F2FE' },
          { page: 'freelancing', action: 'add-txn', icon: 'fa-laptop-code', label: 'Freelance Transaction', color: '#8B5CF6', bg: '#F5F3FF' }
        ].map(item => `
          <div class="settings-item" style="padding:12px;cursor:pointer;border-radius:var(--radius-sm);margin-bottom:4px"
               data-page="${item.page}" data-action="${item.action}">
            <div class="settings-icon" style="background:${item.bg};color:${item.color}"><i class="fas ${item.icon}"></i></div>
            <div class="settings-item-text"><div class="settings-item-title">${item.label}</div></div>
            <i class="fas fa-chevron-right text-muted" style="font-size:12px"></i>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => {
      overlay.remove();
      const { page, action } = el.dataset;
      navigate(page);
      setTimeout(() => {
        if (action === 'add-expense' || action === 'add-income') {
          openTransactionModal(action === 'add-income' ? 'income' : 'expense');
        } else {
          const btn = document.getElementById(`btn-${action}`);
          if (btn) btn.click();
        }
      }, 100);
    });
  });

  document.body.appendChild(overlay);
}

// ---- More Menu (Mobile) ----
function showMoreMenu() {
  const moreItems = [
    { page: 'freelancing', icon: 'fa-laptop-code', label: 'Freelancing', sub: 'Income & Expenses', color: '#8B5CF6', bg: '#F5F3FF' },
    { page: 'insurance',   icon: 'fa-shield-halved', label: 'Insurance', sub: 'Policies & Premiums', color: '#3B82F6', bg: '#EFF6FF' },
    { page: 'reports',     icon: 'fa-chart-pie', label: 'Reports', sub: 'Financial Overview', color: '#22C55E', bg: '#F0FDF4' },
    { page: 'settings',    icon: 'fa-gear', label: 'Settings', sub: 'Preferences & Backup', color: '#6366F1', bg: '#EEF2FF' },
    { page: 'live',        icon: 'fa-stopwatch', label: 'Live Earnings', sub: 'Real-time Income Tracker', color: '#F59E0B', bg: '#FFFBEB' }
  ];

  // Remove any existing more-menu
  document.getElementById('more-menu-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'more-menu-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;
    backdrop-filter:blur(3px);animation:fadeInOverlay 0.2s ease;
  `;

  const sheet = document.createElement('div');
  sheet.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;background:var(--surface);
    border-radius:20px 20px 0 0;z-index:1001;padding-bottom:calc(var(--bottom-nav-height) + 8px);
    box-shadow:0 -8px 32px rgba(0,0,0,0.15);animation:sheetUp 0.3s cubic-bezier(0.32,0.72,0,1);
  `;

  sheet.innerHTML = `
    <div style="width:36px;height:4px;background:var(--gray-200);border-radius:2px;margin:10px auto 4px;"></div>
    <div style="padding:10px 20px 14px;border-bottom:1px solid var(--border)">
      <div style="font-size:16px;font-weight:700;color:var(--text-primary)">More</div>
    </div>
    <div style="padding:8px 12px">
      ${moreItems.map(item => `
        <div class="settings-item more-menu-item" data-page="${item.page}"
          style="padding:14px 12px;border-radius:var(--radius);margin-bottom:4px;cursor:pointer">
          <div class="settings-icon" style="background:${item.bg};color:${item.color};width:44px;height:44px;border-radius:12px;font-size:18px">
            <i class="fas ${item.icon}"></i>
          </div>
          <div class="settings-item-text" style="margin-left:12px">
            <div class="settings-item-title" style="font-size:15px">${item.label}</div>
            <div class="settings-item-sub">${item.sub}</div>
          </div>
          <i class="fas fa-chevron-right" style="color:var(--text-muted);font-size:13px;margin-left:auto"></i>
        </div>
      `).join('')}
    </div>
  `;

  overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); sheet.remove(); } });

  sheet.querySelectorAll('.more-menu-item').forEach(el => {
    el.addEventListener('click', () => {
      overlay.remove();
      sheet.remove();
      navigate(el.dataset.page);
    });
  });

  document.body.appendChild(overlay);
  document.body.appendChild(sheet);
}

// ---- Dark Mode ----
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  Settings.set({ theme });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
  renderPage(currentPage);
}

// ---- Notifications / Badge ----
function updateNotificationBadge() {
  const upcoming = Payments.upcoming(7);
  const insUpcoming = Insurance.upcoming(7);
  const total = upcoming.length + insUpcoming.length;
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline' : 'none';
  }
}

// ---- App Init ----
function initApp() {
  // Apply saved theme
  const settings = Settings.get();
  applyTheme(settings.theme || 'light');

  // Setup navigation
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });

  // Dark mode toggle
  const darkToggle = document.getElementById('dark-mode-toggle');
  if (darkToggle) darkToggle.addEventListener('click', toggleTheme);

  // More menu button (mobile)
  const moreBtn = document.getElementById('more-nav-btn');
  if (moreBtn) moreBtn.addEventListener('click', showMoreMenu);

  // FAB
  initFab();

  // PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // Notification badge
  updateNotificationBadge();

  // Navigate to dashboard
  navigate('dashboard');
}

// Listen for Enter to submit forms in modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeModal) closeModal();
});

// Initialize after DOM ready
document.addEventListener('DOMContentLoaded', initApp);
