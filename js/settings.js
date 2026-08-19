// ============================================
// settings.js — Settings Page
// ============================================

function renderSettings() {
  const settings = Settings.get();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // Count records
  const totalRecords =
    Accounts.list().length +
    LoansLent.list().length +
    LoansBorrowed.list().length +
    Payments.list().length +
    Insurance.list().length +
    FreelanceClients.list().length +
    FreelanceTxns.list().length;

  document.getElementById('page-settings').innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2>Settings</h2>
        <p>App preferences and data management</p>
      </div>
    </div>

    <!-- Appearance -->
    <div class="settings-section">
      <div class="settings-section-title">Appearance</div>
      <div class="settings-item" id="settings-dark-mode">
        <div class="settings-icon" style="background:#EEF2FF;color:#6366F1"><i class="fas fa-moon"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Dark Mode</div>
          <div class="settings-item-sub">${isDark ? 'Enabled' : 'Disabled'} — tap to toggle</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="dark-mode-checkbox" ${isDark ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- Data Summary -->
    <div class="settings-section">
      <div class="settings-section-title">Data Summary</div>
      <div class="settings-item">
        <div class="settings-icon" style="background:#F0FDF4;color:#22C55E"><i class="fas fa-database"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Stored Records</div>
          <div class="settings-item-sub">${totalRecords} records across all sections</div>
        </div>
        <div class="settings-item-right"><span class="badge badge-success">${totalRecords}</span></div>
      </div>
      <div class="settings-item">
        <div class="settings-icon" style="background:#EFF6FF;color:#3B82F6"><i class="fas fa-wallet"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Accounts</div>
          <div class="settings-item-sub">${Accounts.list().length} accounts</div>
        </div>
        <div class="settings-item-right"><span class="badge badge-info">${Accounts.list().length}</span></div>
      </div>
      <div class="settings-item">
        <div class="settings-icon" style="background:#FFFBEB;color:#F59E0B"><i class="fas fa-hand-holding-dollar"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Loans</div>
          <div class="settings-item-sub">${LoansLent.list().length} lent, ${LoansBorrowed.list().length} borrowed</div>
        </div>
      </div>
      <div class="settings-item">
        <div class="settings-icon" style="background:#F5F3FF;color:#8B5CF6"><i class="fas fa-laptop-code"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Freelance</div>
          <div class="settings-item-sub">${FreelanceClients.list().length} clients, ${FreelanceTxns.list().length} transactions</div>
        </div>
      </div>
    </div>

    <!-- Backup & Restore -->
    <div class="settings-section">
      <div class="settings-section-title">Backup & Restore</div>
      <div class="settings-item" id="settings-export">
        <div class="settings-icon" style="background:#F0FDF4;color:#22C55E"><i class="fas fa-file-export"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Export Data</div>
          <div class="settings-item-sub">Download all your data as a JSON backup file</div>
        </div>
        <div class="settings-item-right"><i class="fas fa-download"></i></div>
      </div>
      <div class="settings-item" id="settings-import">
        <div class="settings-icon" style="background:#EFF6FF;color:#3B82F6"><i class="fas fa-file-import"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Import Data</div>
          <div class="settings-item-sub">Restore from a previously exported JSON file</div>
        </div>
        <div class="settings-item-right"><i class="fas fa-upload"></i></div>
      </div>
    </div>

    <!-- PWA Info -->
    <div class="settings-section">
      <div class="settings-section-title">App Info</div>
      <div class="settings-item">
        <div class="settings-icon" style="background:#EEF2FF;color:#6366F1"><i class="fas fa-mobile-screen"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Install as App</div>
          <div class="settings-item-sub">Use your browser's "Add to Home Screen" option to install</div>
        </div>
        <div class="settings-item-right"><i class="fas fa-arrow-up-from-bracket"></i></div>
      </div>
      <div class="settings-item">
        <div class="settings-icon" style="background:#F0FDF4;color:#22C55E"><i class="fas fa-wifi-slash" style="font-size:13px"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Offline Support</div>
          <div class="settings-item-sub">App works offline after first load</div>
        </div>
        <span class="badge badge-success">Active</span>
      </div>
      <div class="settings-item">
        <div class="settings-icon" style="background:#F5F3FF;color:#8B5CF6"><i class="fas fa-code"></i></div>
        <div class="settings-item-text">
          <div class="settings-item-title">Money Manager</div>
          <div class="settings-item-sub">Version 1.0 · Built with HTML/CSS/JS · Local Storage</div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="danger-zone">
      <h4><i class="fas fa-triangle-exclamation"></i> Danger Zone</h4>
      <p>Clearing all data will permanently remove all your accounts, loans, payments, insurance, and freelance records. This action cannot be undone.</p>
      <button class="btn btn-danger" id="settings-clear-all">
        <i class="fas fa-trash-can"></i> Clear All Data
      </button>
    </div>

    <!-- Hidden file input for import -->
    <input type="file" id="import-file-input" accept=".json" style="display:none">
  `;

  // Dark mode toggle
  const darkCheckbox = document.getElementById('dark-mode-checkbox');
  darkCheckbox?.addEventListener('change', () => {
    applyTheme(darkCheckbox.checked ? 'dark' : 'light');
    renderSettings();
  });
  document.getElementById('settings-dark-mode')?.addEventListener('click', (e) => {
    if (e.target !== darkCheckbox && !e.target.closest('.toggle')) {
      darkCheckbox.checked = !darkCheckbox.checked;
      applyTheme(darkCheckbox.checked ? 'dark' : 'light');
      renderSettings();
    }
  });

  // Export
  document.getElementById('settings-export')?.addEventListener('click', () => {
    try {
      const data = DataManager.exportAll();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `money-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully!', 'success');
    } catch (e) {
      showToast('Export failed: ' + e.message, 'error');
    }
  });

  // Import
  document.getElementById('settings-import')?.addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });

  document.getElementById('import-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        confirmDialog({
          title: 'Import Data?',
          message: 'This will overwrite all existing data with the imported backup. Are you sure?',
          confirmText: 'Import & Overwrite',
          confirmClass: 'btn-warning',
          onConfirm: () => {
            DataManager.importAll(ev.target.result);
            showToast('Data imported successfully!', 'success');
            setTimeout(() => {
              navigate('dashboard');
              renderSettings();
            }, 500);
          }
        });
      } catch (err) {
        showToast('Import failed: Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  });

  // Clear all
  document.getElementById('settings-clear-all')?.addEventListener('click', () => {
    confirmDialog({
      title: 'Clear All Data?',
      message: 'This will permanently delete ALL your data including accounts, loans, payments, insurance, and freelance records. This CANNOT be undone!',
      confirmText: 'Yes, Delete Everything',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        DataManager.clearAll();
        showToast('All data cleared', 'info');
        navigate('dashboard');
      }
    });
  });
}
