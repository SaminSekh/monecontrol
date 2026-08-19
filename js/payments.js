// ============================================
// payments.js — EMI & Recurring Payments Page
// ============================================

let paymentsFilter = 'all';

function renderPayments() {
  const payments = Payments.list();
  const upcoming = Payments.upcoming(30);
  const totalUpcomingAmt = upcoming.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  document.getElementById('page-payments').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Payments & EMI</h2>
        <p>Track recurring payments and installments</p>
      </div>
      <button class="btn btn-primary" id="btn-add-payment"><i class="fas fa-plus"></i> Add Payment</button>
    </div>

    <!-- Summary -->
    <div class="grid grid-3 section-gap">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#EEF2FF;color:#6366F1"><i class="fas fa-rotate"></i></div>
        <div class="stat-card-label">Active Payments</div>
        <div class="stat-card-value">${payments.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#FFFBEB;color:#F59E0B"><i class="fas fa-clock"></i></div>
        <div class="stat-card-label">Due This Month</div>
        <div class="stat-card-value">${upcoming.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#FEF2F2;color:#EF4444"><i class="fas fa-rupee-sign"></i></div>
        <div class="stat-card-label">Upcoming Total</div>
        <div class="stat-card-value">${formatINRCompact(totalUpcomingAmt)}</div>
      </div>
    </div>

    ${payments.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-calendar-check"></i></div>
        <h3>No Payments Added</h3>
        <p>Track your bike EMI, subscriptions, insurance installments, and other recurring payments.</p>
        <button class="btn btn-primary" onclick="document.getElementById('btn-add-payment').click()">Add First Payment</button>
      </div>
    ` : `
      <div class="section-header">
        <h3>Your Payment Plans</h3>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        ${payments.map(p => renderEmiCard(p)).join('')}
      </div>
    `}
  `;

  document.getElementById('btn-add-payment').addEventListener('click', () => openPaymentModal());

  document.querySelectorAll('[data-payment-action]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handlePaymentAction(el.dataset.paymentAction, el.dataset.paymentId);
    });
  });
}

function renderEmiCard(payment) {
  const cat = paymentCategoryMeta(payment.category);
  const installments = Payments.installments(payment.id);
  const completed = parseInt(payment.completedInstallments) || 0;
  const total = parseInt(payment.totalInstallments) || 1;
  const remaining = total - completed;
  const totalPaid = parseFloat(payment.totalPaid) || completed * parseFloat(payment.emiAmount);
  const totalRemaining = remaining * parseFloat(payment.emiAmount);
  const completePct = pct(completed, total);

  // Find next upcoming
  const nextDue = installments.find(i => i.status !== 'paid');
  const days = nextDue ? daysUntil(nextDue.dueDate) : null;

  // Bank balance check
  let bankCheck = null;
  if (nextDue) {
    const accId = nextDue.accountId || payment.linkedAccountId;
    if (accId) {
      const acc = Accounts.find(accId);
      if (acc) {
        const bal = parseFloat(acc.balance) || 0;
        const amt = parseFloat(nextDue.amount) || 0;
        bankCheck = { ok: bal >= amt, balance: bal, amount: amt, shortfall: Math.max(0, amt - bal), name: acc.name };
      }
    }
  }

  return `<div class="emi-card">
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div class="upcoming-icon" style="background:${cat.bg};color:${cat.color}"><i class="fas ${cat.icon}"></i></div>
        <div>
          <div class="emi-title">${esc(payment.name)}</div>
          <div class="emi-category">${cat.label}</div>
          ${nextDue ? dueBadgeHtml(days) : '<span class="badge badge-success">Completed</span>'}
        </div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="btn btn-ghost btn-icon-sm" title="Edit" data-payment-action="edit" data-payment-id="${payment.id}"><i class="fas fa-pen"></i></button>
        <button class="btn btn-ghost btn-icon-sm" title="Delete" style="color:var(--danger)" data-payment-action="delete" data-payment-id="${payment.id}"><i class="fas fa-trash"></i></button>
        <button class="btn btn-ghost btn-icon-sm" title="Timeline" data-payment-action="timeline" data-payment-id="${payment.id}"><i class="fas fa-list-ol"></i></button>
      </div>
    </div>

    <!-- EMI Meta -->
    <div class="emi-meta">
      <div class="emi-meta-item">
        <div class="emi-meta-label">Monthly EMI</div>
        <div class="emi-meta-value text-danger">${formatINR(payment.emiAmount)}</div>
      </div>
      <div class="emi-meta-item">
        <div class="emi-meta-label">Total Amount</div>
        <div class="emi-meta-value">${formatINR(payment.totalAmount)}</div>
      </div>
      <div class="emi-meta-item">
        <div class="emi-meta-label">Paid So Far</div>
        <div class="emi-meta-value text-success">${formatINR(totalPaid)}</div>
      </div>
      <div class="emi-meta-item">
        <div class="emi-meta-label">Remaining</div>
        <div class="emi-meta-value text-danger">${formatINR(totalRemaining)}</div>
      </div>
    </div>

    <!-- Progress -->
    <div class="progress-wrapper">
      <div class="progress-label">
        <span>${completed} / ${total} paid</span>
        <span>${completePct}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill ${completePct >= 75 ? 'success' : completePct >= 40 ? '' : 'warning'}" style="width:${completePct}%"></div>
      </div>
    </div>

    <!-- Bank Balance Check -->
    ${bankCheck ? `
      <div class="bank-status ${bankCheck.ok ? 'ok' : 'fail'}">
        <span><i class="fas ${bankCheck.ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${esc(bankCheck.name)}: ${formatINR(bankCheck.balance)}</span>
        <span>${bankCheck.ok ? `✓ Sufficient` : `⚠ Short by ${formatINR(bankCheck.shortfall)}`}</span>
      </div>
    ` : ''}

    <!-- Next Payment + Mark Paid -->
    ${nextDue ? `
      <div style="display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap">
        <span style="font-size:13px;color:var(--text-muted)">Next: #${nextDue.installmentNumber} — ${formatDate(nextDue.dueDate)}</span>
        <button class="btn btn-success btn-sm" data-payment-action="mark-paid" data-payment-id="${nextDue.id}" style="margin-left:auto">
          <i class="fas fa-check"></i> Mark Paid
        </button>
      </div>
    ` : ''}
  </div>`;
}

function handlePaymentAction(action, paymentId) {
  const payment = Payments.find(paymentId);

  switch (action) {
    case 'edit':
      if (payment) openPaymentModal(payment);
      break;
    case 'delete':
      if (payment) {
        confirmDialog({
          title: 'Delete Payment Plan?',
          message: `This will delete "${payment.name}" and all its installment records.`,
          onConfirm: () => {
            Payments.delete(paymentId);
            showToast('Payment plan deleted', 'success');
            renderPayments();
            updateNotificationBadge();
          }
        });
      }
      break;
    case 'timeline':
      if (payment) openTimelineModal(payment);
      break;
    case 'mark-paid': {
      // paymentId here is actually installmentId
      const inst = dbFind(DB_KEYS.paymentInstallments, paymentId);
      if (!inst) return;
      const p = Payments.find(inst.paymentId);
      const accId = inst.accountId || p?.linkedAccountId;
      Payments.markInstallmentPaid(paymentId, accId);
      showToast(`Installment #${inst.installmentNumber} marked as paid!`, 'success');
      renderPayments();
      refreshDashboardWidget();
      updateNotificationBadge();
      break;
    }
  }
}

function openPaymentModal(payment = null) {
  const isEdit = !!payment;
  const overlay = openModal({
    title: isEdit ? 'Edit Payment Plan' : 'Add Payment / EMI',
    icon: 'fa-calendar-check',
    size: 'modal-lg',
    body: `
      <form id="payment-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Payment Name <span class="required">*</span></label>
            <input type="text" name="name" class="form-control" placeholder="e.g. Bike EMI, Netflix" required value="${esc(payment?.name || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select name="category" class="form-control">
              <option value="emi" ${payment?.category === 'emi' ? 'selected' : ''}>EMI</option>
              <option value="insurance" ${payment?.category === 'insurance' ? 'selected' : ''}>Insurance</option>
              <option value="loan" ${payment?.category === 'loan' ? 'selected' : ''}>Loan</option>
              <option value="subscription" ${payment?.category === 'subscription' ? 'selected' : ''}>Subscription</option>
              <option value="utility" ${payment?.category === 'utility' ? 'selected' : ''}>Utility</option>
              <option value="other" ${payment?.category === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Total Amount (₹) <span class="required">*</span></label>
            <input type="number" name="totalAmount" class="form-control" placeholder="e.g. 162000" required min="0" step="0.01" value="${payment?.totalAmount || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">EMI Amount / Month (₹) <span class="required">*</span></label>
            <input type="number" name="emiAmount" class="form-control" placeholder="e.g. 4500" required min="0" step="0.01" value="${payment?.emiAmount || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Total Installments <span class="required">*</span></label>
            <input type="number" name="totalInstallments" class="form-control" placeholder="e.g. 36" required min="1" max="360" value="${payment?.totalInstallments || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Completed Installments</label>
            <input type="number" name="completedInstallments" class="form-control" placeholder="0" min="0" value="${payment?.completedInstallments || 0}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" name="startDate" class="form-control" value="${formatDateInput(payment?.startDate) || todayStr()}">
          </div>
          <div class="form-group">
            <label class="form-label">First Payment Date</label>
            <input type="date" name="firstPaymentDate" class="form-control" value="${formatDateInput(payment?.firstPaymentDate) || todayStr()}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Frequency</label>
            <select name="frequency" class="form-control">
              <option value="monthly" ${payment?.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
              <option value="quarterly" ${payment?.frequency === 'quarterly' ? 'selected' : ''}>Quarterly</option>
              <option value="yearly" ${payment?.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
              <option value="weekly" ${payment?.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Linked Bank Account</label>
            <select name="linkedAccountId" class="form-control">
              ${accountSelectOptions(payment?.linkedAccountId)}
            </select>
          </div>
        </div>
        <div class="form-group">
          <div class="toggle-group">
            <div>
              <label>Auto-Debit Enabled</label>
              <span>Automatically deducted from account</span>
            </div>
            <label class="toggle">
              <input type="checkbox" name="autoDebit" ${payment?.autoDebit ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="form-control" rows="2" placeholder="Additional details...">${esc(payment?.notes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-payment-btn">${isEdit ? 'Save Changes' : 'Add Payment'}</button>
    `
  });

  document.getElementById('save-payment-btn').addEventListener('click', () => {
    const form = document.getElementById('payment-form');
    if (!validateForm(form)) { showToast('Please fill required fields', 'warning'); return; }
    const data = formData(form);
    data.totalAmount = parseFloat(data.totalAmount) || 0;
    data.emiAmount = parseFloat(data.emiAmount) || 0;
    data.totalInstallments = parseInt(data.totalInstallments) || 1;
    data.completedInstallments = parseInt(data.completedInstallments) || 0;
    data.totalPaid = data.completedInstallments * data.emiAmount;

    if (isEdit) {
      Payments.update(payment.id, data);
      showToast('Payment updated!', 'success');
    } else {
      Payments.create(data);
      showToast('Payment plan added!', 'success');
    }
    closeModal();
    renderPayments();
    updateNotificationBadge();
    refreshDashboardWidget();
  });
}

function openTimelineModal(payment) {
  const installments = Payments.installments(payment.id);
  const completed = installments.filter(i => i.status === 'paid').length;
  const remaining = installments.length - completed;

  openModal({
    title: `${payment.name} — Timeline`,
    icon: 'fa-list-ol',
    size: 'modal-lg',
    body: `
      <div class="info-grid mb-3">
        <div class="info-item">
          <div class="info-label">Monthly EMI</div>
          <div class="info-value danger">${formatINR(payment.emiAmount)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total</div>
          <div class="info-value">${formatINR(payment.totalAmount)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Completed</div>
          <div class="info-value success">${completed} / ${installments.length}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Remaining</div>
          <div class="info-value">${remaining} installments</div>
        </div>
      </div>

      <div style="overflow-y:auto;max-height:400px">
        ${installments.map(inst => {
          const days = daysUntil(inst.dueDate);
          const isPaid = inst.status === 'paid';
          const isNext = !isPaid && installments.filter(i => i.status !== 'paid')[0]?.id === inst.id;
          return `<div class="list-item" style="align-items:center">
            <div class="timeline-dot ${isPaid ? 'paid' : isNext ? 'current' : 'upcoming'}">
              ${isPaid ? '<i class="fas fa-check" style="font-size:10px"></i>' : inst.installmentNumber}
            </div>
            <div class="list-content">
              <div class="list-title">Installment #${inst.installmentNumber}</div>
              <div class="list-sub">
                ${isPaid ? `Paid on ${formatDate(inst.paidDate)}` : `Due ${formatDate(inst.dueDate)} ${isNext ? dueBadgeHtml(days) : ''}`}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-weight:700;font-size:13px">${formatINR(inst.amount)}</span>
              ${isPaid
                ? `<button class="btn btn-ghost btn-icon-sm" title="Undo Paid" data-inst-action="undo" data-inst-id="${inst.id}"><i class="fas fa-undo" style="font-size:10px"></i></button>`
                : isNext
                  ? `<button class="btn btn-success btn-sm" data-inst-action="pay" data-inst-id="${inst.id}"><i class="fas fa-check"></i> Pay</button>`
                  : ''
              }
            </div>
          </div>`;
        }).join('')}
      </div>
    `
  });

  setTimeout(() => {
    document.querySelectorAll('[data-inst-action]').forEach(el => {
      el.addEventListener('click', () => {
        const { instAction, instId } = el.dataset;
        if (instAction === 'pay') {
          const inst = dbFind(DB_KEYS.paymentInstallments, instId);
          const p = inst ? Payments.find(inst.paymentId) : null;
          const accId = (inst && p) ? (inst.accountId || p.linkedAccountId) : null;
          Payments.markInstallmentPaid(instId, accId);
          showToast(`Installment #${inst?.installmentNumber} marked paid!`, 'success');
        } else if (instAction === 'undo') {
          Payments.markInstallmentUnpaid(instId);
          showToast('Installment marked as unpaid', 'info');
        }
        closeModal();
        renderPayments();
        refreshDashboardWidget();
        updateNotificationBadge();
      });
    });
  }, 100);
}
