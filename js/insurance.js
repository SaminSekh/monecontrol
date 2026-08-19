// ============================================
// insurance.js — Insurance Management Page
// ============================================

function renderInsurance() {
  const policies = Insurance.list();
  const totalPremiums = policies.reduce((s, p) => s + (parseFloat(p.premiumAmount) || 0), 0);
  const active = policies.filter(p => p.status !== 'inactive').length;
  const upcoming = Insurance.upcoming(30);

  document.getElementById('page-insurance').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Insurance</h2>
        <p>Your policies and premium payments</p>
      </div>
      <button class="btn btn-primary" id="btn-add-insurance"><i class="fas fa-plus"></i> Add Policy</button>
    </div>

    <!-- Summary -->
    <div class="grid grid-3 section-gap">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#EFF6FF;color:#3B82F6"><i class="fas fa-shield-halved"></i></div>
        <div class="stat-card-label">Active Policies</div>
        <div class="stat-card-value">${active}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#FFFBEB;color:#F59E0B"><i class="fas fa-clock"></i></div>
        <div class="stat-card-label">Due This Month</div>
        <div class="stat-card-value">${upcoming.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#FEF2F2;color:#EF4444"><i class="fas fa-rupee-sign"></i></div>
        <div class="stat-card-label">Total Premium</div>
        <div class="stat-card-value">${formatINRCompact(totalPremiums)}</div>
      </div>
    </div>

    ${policies.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-shield-halved"></i></div>
        <h3>No Insurance Policies</h3>
        <p>Track your life, health, vehicle, and other insurance policies here. Never miss a premium payment.</p>
        <button class="btn btn-primary" onclick="document.getElementById('btn-add-insurance').click()">Add First Policy</button>
      </div>
    ` : `
      <div style="display:flex;flex-direction:column;gap:14px">
        ${policies.map(p => renderInsuranceCard(p)).join('')}
      </div>
    `}
  `;

  document.getElementById('btn-add-insurance').addEventListener('click', () => openInsuranceModal());

  document.querySelectorAll('[data-ins-action]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handleInsuranceAction(el.dataset.insAction, el.dataset.insId);
    });
  });
}

function renderInsuranceCard(policy) {
  const meta = insuranceTypeMeta(policy.type);
  const days = policy.nextPaymentDate ? daysUntil(policy.nextPaymentDate) : null;
  const renewalDays = policy.renewalDate ? daysUntil(policy.renewalDate) : null;

  const accId = policy.linkedAccountId;
  let bankCheck = null;
  if (accId) {
    const acc = Accounts.find(accId);
    if (acc) {
      const bal = parseFloat(acc.balance) || 0;
      const amt = parseFloat(policy.premiumAmount) || 0;
      bankCheck = { ok: bal >= amt, balance: bal, amount: amt, shortfall: Math.max(0, amt - bal), name: acc.name };
    }
  }

  return `<div class="insurance-card">
    <div class="insurance-header">
      <div class="insurance-type-icon" style="background:${meta.bg};color:${meta.color}">
        <i class="fas ${meta.icon}"></i>
      </div>
      <div class="insurance-info">
        <div class="insurance-name">${esc(policy.name)}</div>
        <div class="insurance-provider">${esc(policy.provider || 'Provider not set')}</div>
        ${policy.policyNumber ? `<div style="font-size:11px;color:var(--text-muted)"># ${esc(policy.policyNumber)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
        <span class="badge ${policy.status === 'active' ? 'badge-success' : 'badge-gray'}">${policy.status || 'active'}</span>
        ${days !== null ? dueBadgeHtml(days) : ''}
      </div>
    </div>

    <div class="divider" style="margin:10px 0"></div>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Premium</div>
        <div class="info-value danger">${formatINR(policy.premiumAmount)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Frequency</div>
        <div class="info-value">${policy.frequency || 'Monthly'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Next Payment</div>
        <div class="info-value ${days !== null && days < 7 ? 'warning' : ''}">${formatDate(policy.nextPaymentDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Renewal Date</div>
        <div class="info-value ${renewalDays !== null && renewalDays < 30 ? 'warning' : ''}">${formatDate(policy.renewalDate)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Total Paid</div>
        <div class="info-value success">${formatINR(policy.totalPremiumPaid || 0)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Renewal In</div>
        <div class="info-value">${renewalDays !== null ? `${Math.max(0, renewalDays)} days` : '—'}</div>
      </div>
    </div>

    ${bankCheck ? `
      <div class="bank-status ${bankCheck.ok ? 'ok' : 'fail'}" style="margin-top:10px">
        <span><i class="fas ${bankCheck.ok ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${esc(bankCheck.name)}: ${formatINR(bankCheck.balance)}</span>
        <span>${bankCheck.ok ? '✓ Sufficient' : `⚠ Short ${formatINR(bankCheck.shortfall)}`}</span>
      </div>
    ` : ''}

    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-success btn-sm" data-ins-action="pay-premium" data-ins-id="${policy.id}">
        <i class="fas fa-check"></i> Record Payment
      </button>
      <button class="btn btn-ghost btn-sm" data-ins-action="history" data-ins-id="${policy.id}">
        <i class="fas fa-history"></i> History
      </button>
      <button class="btn btn-ghost btn-sm" data-ins-action="edit" data-ins-id="${policy.id}">
        <i class="fas fa-pen"></i> Edit
      </button>
      <button class="btn btn-ghost btn-sm" style="color:var(--danger)" data-ins-action="delete" data-ins-id="${policy.id}">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>`;
}

function handleInsuranceAction(action, insId) {
  const policy = Insurance.find(insId);
  if (!policy) return;

  switch (action) {
    case 'pay-premium': openInsurancePaymentModal(policy); break;
    case 'history': openInsuranceHistoryModal(policy); break;
    case 'edit': openInsuranceModal(policy); break;
    case 'delete':
      confirmDialog({
        title: 'Delete Insurance Policy?',
        message: `This will delete "${policy.name}" and all its payment records.`,
        onConfirm: () => {
          Insurance.delete(insId);
          showToast('Policy deleted', 'success');
          renderInsurance();
        }
      });
      break;
  }
}

function openInsuranceModal(policy = null) {
  const isEdit = !!policy;
  openModal({
    title: isEdit ? 'Edit Insurance Policy' : 'Add Insurance Policy',
    icon: 'fa-shield-halved',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    size: 'modal-lg',
    body: `
      <form id="insurance-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Policy Name <span class="required">*</span></label>
            <input type="text" name="name" class="form-control" placeholder="e.g. LIC Jeevan Anand" required value="${esc(policy?.name || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Type</label>
            <select name="type" class="form-control">
              <option value="life" ${policy?.type === 'life' ? 'selected' : ''}>Life Insurance</option>
              <option value="health" ${policy?.type === 'health' ? 'selected' : ''}>Health Insurance</option>
              <option value="vehicle" ${policy?.type === 'vehicle' ? 'selected' : ''}>Vehicle Insurance</option>
              <option value="other" ${policy?.type === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Insurance Provider <span class="required">*</span></label>
            <input type="text" name="provider" class="form-control" placeholder="e.g. LIC, Star Health" required value="${esc(policy?.provider || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Policy Number</label>
            <input type="text" name="policyNumber" class="form-control" placeholder="Optional" value="${esc(policy?.policyNumber || '')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Premium Amount (₹) <span class="required">*</span></label>
            <input type="number" name="premiumAmount" class="form-control" placeholder="0" required min="0" step="0.01" value="${policy?.premiumAmount || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Payment Frequency</label>
            <select name="frequency" class="form-control">
              <option value="Monthly" ${policy?.frequency === 'Monthly' ? 'selected' : ''}>Monthly</option>
              <option value="Quarterly" ${policy?.frequency === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
              <option value="Half-Yearly" ${policy?.frequency === 'Half-Yearly' ? 'selected' : ''}>Half-Yearly</option>
              <option value="Yearly" ${policy?.frequency === 'Yearly' ? 'selected' : ''}>Yearly</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Next Payment Date</label>
            <input type="date" name="nextPaymentDate" class="form-control" value="${formatDateInput(policy?.nextPaymentDate) || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Renewal / Expiry Date</label>
            <input type="date" name="renewalDate" class="form-control" value="${formatDateInput(policy?.renewalDate) || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Linked Bank Account</label>
            <select name="linkedAccountId" class="form-control">
              ${accountSelectOptions(policy?.linkedAccountId)}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select name="status" class="form-control">
              <option value="active" ${(!policy || policy.status === 'active') ? 'selected' : ''}>Active</option>
              <option value="inactive" ${policy?.status === 'inactive' ? 'selected' : ''}>Inactive / Lapsed</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea name="notes" class="form-control" rows="2" placeholder="Coverage details, agent name, etc.">${esc(policy?.notes || '')}</textarea>
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" id="save-ins-btn">${isEdit ? 'Save Changes' : 'Add Policy'}</button>
    `
  });

  document.getElementById('save-ins-btn').addEventListener('click', () => {
    const form = document.getElementById('insurance-form');
    if (!validateForm(form)) { showToast('Please fill required fields', 'warning'); return; }
    const data = formData(form);
    data.premiumAmount = parseFloat(data.premiumAmount) || 0;

    if (isEdit) {
      Insurance.update(policy.id, data);
      showToast('Policy updated!', 'success');
    } else {
      Insurance.create({ ...data, totalPremiumPaid: 0 });
      showToast('Insurance policy added!', 'success');
    }
    closeModal();
    renderInsurance();
  });
}

function openInsurancePaymentModal(policy) {
  openModal({
    title: `Record Premium — ${policy.name}`,
    icon: 'fa-shield-halved',
    iconBg: '#EFF6FF',
    iconColor: '#3B82F6',
    body: `
      <div style="background:var(--gray-50);border-radius:var(--radius);padding:12px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-muted)">Premium Amount</div>
        <div style="font-size:22px;font-weight:800;color:var(--text-primary)">${formatINR(policy.premiumAmount)}</div>
        <div style="font-size:12px;color:var(--text-muted)">${policy.frequency} | ${policy.provider}</div>
      </div>
      <form id="ins-payment-form">
        <div class="form-group">
          <label class="form-label">Amount Paid (₹) <span class="required">*</span></label>
          <input type="number" name="amount" class="form-control" value="${policy.premiumAmount}" required min="0.01" step="0.01">
        </div>
        <div class="form-group">
          <label class="form-label">Payment Date</label>
          <input type="date" name="date" class="form-control" value="${todayStr()}">
        </div>
        <div class="form-group">
          <label class="form-label">Next Payment Date</label>
          <input type="date" name="nextPaymentDate" class="form-control" id="ins-next-date" value="${formatDateInput(policy.nextPaymentDate) || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <input type="text" name="notes" class="form-control" placeholder="Receipt number, etc.">
        </div>
      </form>
    `,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
      <button class="btn btn-success" id="save-ins-payment-btn"><i class="fas fa-check"></i> Record Payment</button>
    `
  });

  document.getElementById('save-ins-payment-btn').addEventListener('click', () => {
    const form = document.getElementById('ins-payment-form');
    if (!validateForm(form)) return;
    const d = formData(form);
    const amt = parseFloat(d.amount) || 0;

    Insurance.addPayment(policy.id, amt, d.date || todayStr(), d.notes);

    // Update next payment date if provided
    if (d.nextPaymentDate) {
      Insurance.update(policy.id, { nextPaymentDate: d.nextPaymentDate });
    }

    // Deduct from account if linked
    if (policy.linkedAccountId) {
      const acc = Accounts.find(policy.linkedAccountId);
      if (acc) {
        Accounts.update(policy.linkedAccountId, { balance: (parseFloat(acc.balance) || 0) - amt });
        Transactions.create({
          type: 'expense', category: 'insurance', amount: amt,
          accountId: policy.linkedAccountId,
          description: `${policy.name} premium`,
          date: d.date || todayStr(),
          referenceId: policy.id
        });
      }
    }

    showToast('Premium payment recorded!', 'success');
    closeModal();
    renderInsurance();
    refreshDashboardWidget();
  });
}

function openInsuranceHistoryModal(policy) {
  const payments = Insurance.payments(policy.id);
  openModal({
    title: `Payment History — ${policy.name}`,
    icon: 'fa-history',
    body: `
      <div class="info-grid mb-3">
        <div class="info-item">
          <div class="info-label">Premium</div>
          <div class="info-value">${formatINR(policy.premiumAmount)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Total Paid</div>
          <div class="info-value success">${formatINR(policy.totalPremiumPaid || 0)}</div>
        </div>
      </div>
      ${payments.length === 0
        ? `<div class="empty-state" style="padding:20px"><p>No payments recorded yet</p></div>`
        : payments.map(p => `
          <div class="list-item">
            <div class="list-icon" style="background:var(--success-bg);color:var(--success)"><i class="fas fa-shield-check"></i></div>
            <div class="list-content">
              <div class="list-title">${formatINR(p.amount)} paid</div>
              <div class="list-sub">${formatDate(p.date)}${p.notes ? ' · ' + esc(p.notes) : ''}</div>
            </div>
          </div>
        `).join('')
      }
    `
  });
}
