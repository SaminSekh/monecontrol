// ============================================
// utils.js — Formatting & Calculation Helpers
// ============================================

// ---- Indian Currency Formatting ----
function formatINR(amount, decimals = 0) {
  const num = parseFloat(amount) || 0;
  if (isNaN(num)) return '₹0';
  return '₹' + Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatINRSigned(amount, decimals = 0) {
  const num = parseFloat(amount) || 0;
  const sign = num < 0 ? '-' : '';
  return sign + formatINR(Math.abs(num), decimals);
}

function formatINRCompact(amount) {
  const num = parseFloat(amount) || 0;
  if (num >= 10000000) return '₹' + (num / 10000000).toFixed(1) + 'Cr';
  if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + 'K';
  return formatINR(num);
}

// ---- Date Formatting ----
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - now) / (1000 * 60 * 60 * 24));
}

function daysAgo(dateStr) {
  return -daysUntil(dateStr);
}

function greetingText() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning sekh';
  if (h < 17) return 'Good Afternoon sekh';
  return 'Good Evening sekh';
}

function monthName(monthIndex, year) {
  const d = new Date(year || new Date().getFullYear(), monthIndex || new Date().getMonth(), 1);
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function currentMonthLabel() {
  return new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

// ---- Number Parsing ----
function parseAmount(str) {
  if (typeof str === 'number') return str;
  return parseFloat((str || '').replace(/[₹,\s]/g, '')) || 0;
}

// ---- Status Labels ----
function loanStatusBadge(status) {
  const map = {
    active: { cls: 'badge-info', label: 'Active' },
    partial: { cls: 'badge-warning', label: 'Partially Paid' },
    paid: { cls: 'badge-success', label: 'Fully Paid' },
    overdue: { cls: 'badge-danger', label: 'Overdue' }
  };
  return map[status] || { cls: 'badge-gray', label: status };
}

function paymentStatusBadge(status) {
  const map = {
    upcoming: { cls: 'badge-info', label: 'Upcoming' },
    paid: { cls: 'badge-success', label: 'Paid' },
    overdue: { cls: 'badge-danger', label: 'Overdue' },
    active: { cls: 'badge-primary', label: 'Active' },
    completed: { cls: 'badge-success', label: 'Completed' }
  };
  return map[status] || { cls: 'badge-gray', label: status };
}

function insuranceTypeMeta(type) {
  const map = {
    life: { icon: 'fa-heart-pulse', color: '#EF4444', bg: '#FEF2F2' },
    health: { icon: 'fa-hospital', color: '#3B82F6', bg: '#EFF6FF' },
    vehicle: { icon: 'fa-car', color: '#F59E0B', bg: '#FFFBEB' },
    other: { icon: 'fa-shield-halved', color: '#6366F1', bg: '#EEF2FF' }
  };
  return map[type] || map.other;
}

function accountTypeMeta(type) {
  const map = {
    cash: { icon: 'fa-money-bills', color: '#22C55E', bg: '#F0FDF4', label: 'Cash' },
    bank: { icon: 'fa-building-columns', color: '#3B82F6', bg: '#EFF6FF', label: 'Bank Account' },
    savings: { icon: 'fa-piggy-bank', color: '#6366F1', bg: '#EEF2FF', label: 'Savings Account' },
    other: { icon: 'fa-wallet', color: '#F59E0B', bg: '#FFFBEB', label: 'Other' }
  };
  return map[type] || map.other;
}

function paymentCategoryMeta(cat) {
  const map = {
    emi: { icon: 'fa-motorcycle', color: '#6366F1', bg: '#EEF2FF', label: 'EMI' },
    insurance: { icon: 'fa-shield-halved', color: '#3B82F6', bg: '#EFF6FF', label: 'Insurance' },
    loan: { icon: 'fa-hand-holding-dollar', color: '#F59E0B', bg: '#FFFBEB', label: 'Loan' },
    subscription: { icon: 'fa-rotate', color: '#8B5CF6', bg: '#F5F3FF', label: 'Subscription' },
    utility: { icon: 'fa-bolt', color: '#EF4444', bg: '#FEF2F2', label: 'Utility' },
    other: { icon: 'fa-calendar-check', color: '#64748B', bg: '#F1F5F9', label: 'Other' }
  };
  return map[cat] || map.other;
}

function txnTypeMeta(type) {
  const map = {
    income: { icon: 'fa-arrow-down-left', color: '#22C55E', bg: '#F0FDF4' },
    expense: { icon: 'fa-arrow-up-right', color: '#EF4444', bg: '#FEF2F2' },
    transfer: { icon: 'fa-arrows-left-right', color: '#3B82F6', bg: '#EFF6FF' },
    emi: { icon: 'fa-calendar-check', color: '#6366F1', bg: '#EEF2FF' },
    lent: { icon: 'fa-hand-holding-dollar', color: '#F59E0B', bg: '#FFFBEB' },
    repayment_received: { icon: 'fa-hand-holding-dollar', color: '#22C55E', bg: '#F0FDF4' },
    borrowed: { icon: 'fa-hand-receiving', color: '#F59E0B', bg: '#FFFBEB' },
    repayment_made: { icon: 'fa-money-bill-transfer', color: '#EF4444', bg: '#FEF2F2' }
  };
  return map[type] || { icon: 'fa-circle', color: '#64748B', bg: '#F1F5F9' };
}

function dueBadgeHtml(days) {
  if (days === null) return '';
  if (days < 0) return `<span class="due-badge due-overdue"><i class="fas fa-exclamation-circle"></i> Overdue ${Math.abs(days)}d</span>`;
  if (days === 0) return `<span class="due-badge due-soon"><i class="fas fa-bell"></i> Due Today</span>`;
  if (days <= 7) return `<span class="due-badge due-soon"><i class="fas fa-clock"></i> ${days}d left</span>`;
  return `<span class="due-badge due-ok"><i class="fas fa-calendar"></i> ${days}d left</span>`;
}

// ---- Percent ----
function pct(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

// ---- Avatar initials ----
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ---- Escape HTML ----
function esc(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

// ---- Deep clone ----
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
