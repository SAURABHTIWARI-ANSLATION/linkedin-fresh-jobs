/**
 * Popup Script for LinkedIn Fresh Jobs Intelligence
 * Handles popup UI and communication with content script
 */

class PopupManager {
  constructor() {
    this.currentTab = null;
    this.stats = null;
    this.updateInterval = null;
  }

  /**
   * Initialize popup
   */
  async initialize() {
    try {
      // Get current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tabs[0];

      // Load settings
      await this.loadSettings();

      // Setup event listeners
      this.setupEventListeners();

      // Update stats
      await this.updateStats();

      // Start auto-update
      this.startAutoUpdate();

      logger?.info('Popup initialized');
    } catch (error) {
      logger?.error('Failed to initialize popup', error);
    }
  }

  /**
   * Load and display user settings
   */
  async loadSettings() {
    try {
      // Render dynamic preset buttons
      this.renderPresets();

      const settings = await storage.getAll();

      // Theme
      const themeSelect = document.getElementById('themeSelect');
      if (themeSelect && settings.theme) {
        themeSelect.value = settings.theme;
      }

      // Panel position
      const positionSelect = document.getElementById('positionSelect');
      if (positionSelect && settings.panelPosition) {
        positionSelect.value = settings.panelPosition;
      }

      // Auto scan
      const autoScanToggle = document.getElementById('autoScanToggle');
      if (autoScanToggle) {
        autoScanToggle.checked = settings.enableAutoScan !== false;
      }

      // Update current filter display
      const filter = settings.activeRangeId || 'all';
      const customMin = settings.customMin !== undefined ? settings.customMin : 0;
      const customMax = settings.customMax !== undefined ? settings.customMax : 60;
      
      const customMinInput = document.getElementById('customMinInput');
      const customMaxInput = document.getElementById('customMaxInput');
      if (customMinInput) customMinInput.value = customMin;
      if (customMaxInput) customMaxInput.value = customMax;

      this.updateFilterDisplay(filter, customMin, customMax);
    } catch (error) {
      logger?.error('Failed to load settings', error);
    }
  }

  /**
   * Render preset buttons dynamically
   */
  renderPresets() {
    const container = document.getElementById('presetButtonsContainer');
    if (!container) return;
    container.innerHTML = '';

    // Add Range Buttons dynamically
    TIME_RANGE_FILTERS.forEach(range => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.dataset.preset = range.id;
      btn.style.display = 'flex';
      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.padding = '8px';
      
      const emoji = range.id === 'now' ? '🔥' :
                    range.id === '0-10' ? '🔥' :
                    range.id === '10-30' ? '⚡' :
                    range.id === '30-60' ? '🟢' :
                    range.id === '60-120' ? '🟡' : '🟠';

      btn.innerHTML = `
        <span class="preset-emoji">${emoji}</span>
        <span class="preset-name">${range.label}</span>
      `;
      btn.addEventListener('click', () => this.applyPreset(range.id));
      container.appendChild(btn);
    });

    // Also add a Show All/Reset button
    const btnAll = document.createElement('button');
    btnAll.className = 'preset-btn';
    btnAll.dataset.preset = 'all';
    btnAll.style.display = 'flex';
    btnAll.style.flexDirection = 'column';
    btnAll.style.alignItems = 'center';
    btnAll.style.justifyContent = 'center';
    btnAll.style.padding = '8px';
    btnAll.innerHTML = `
      <span class="preset-emoji">📋</span>
      <span class="preset-name">Show All</span>
    `;
    btnAll.addEventListener('click', () => this.applyPreset('all'));
    container.appendChild(btnAll);
  }

  updateFilterDisplay(filter, customMin = null, customMax = null) {
    const filterName = document.getElementById('filterName');
    const filterDesc = document.getElementById('filterDesc');

    if (filter === 'custom') {
      const min = customMin !== null ? customMin : 0;
      const max = customMax !== null ? customMax : 60;
      if (filterName) {
        filterName.textContent = `Custom (${min}-${max}m)`;
        if (filterDesc) filterDesc.textContent = `Custom range: ${min} to ${max} minutes`;
      }
    } else {
      const range = TIME_RANGE_FILTERS.find(r => r.id === filter);
      if (filterName) {
        filterName.textContent = range ? range.label : 'Show All';
        if (filterDesc) filterDesc.textContent = range ? (range.description || `${range.label} range`) : 'Showing all jobs';
      }
    }

    // Update active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => {
      const preset = btn.dataset.preset;
      if (preset === filter || (filter === 'all' && preset === 'all')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme select
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', async (e) => {
        try {
          await storage.setValue('theme', e.target.value);
          await this.sendMessageToContent({ type: 'THEME_CHANGED', theme: e.target.value });
        } catch (error) {
          logger?.error('Failed to apply theme', error);
        }
      });
    }

    // Position select
    const positionSelect = document.getElementById('positionSelect');
    if (positionSelect) {
      positionSelect.addEventListener('change', async (e) => {
        try {
          await storage.setValue('panelPosition', e.target.value);
          await this.sendMessageToContent({ type: 'POSITION_CHANGED', position: e.target.value });
        } catch (error) {
          logger?.error('Failed to apply position change', error);
        }
      });
    }

    // Auto scan toggle
    const autoScanToggle = document.getElementById('autoScanToggle');
    if (autoScanToggle) {
      autoScanToggle.addEventListener('change', async (e) => {
        try {
          await storage.setValue('enableAutoScan', e.target.checked);
          await this.sendMessageToContent({ type: 'AUTOSCAN_CHANGED', enabled: e.target.checked });
        } catch (error) {
          logger?.error('Failed to change auto-scan setting', error);
        }
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.requestScan());
    }

    // Custom range filter apply button
    const applyCustomBtn = document.getElementById('applyCustomBtn');
    if (applyCustomBtn) {
      applyCustomBtn.addEventListener('click', async () => {
        const minVal = parseInt(document.getElementById('customMinInput').value) || 0;
        const maxVal = parseInt(document.getElementById('customMaxInput').value) || 60;
        await this.applyCustomRange(minVal, maxVal);
      });
    }

    // Shortcuts button
    const openDocsBtn = document.getElementById('openDocsBtn');
    if (openDocsBtn) {
      openDocsBtn.addEventListener('click', () => this.showShortcutsModal());
    }

    // Modal close
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideShortcutsModal());
    }

    // Click modal to close
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideShortcutsModal();
        }
      });
    }
  }

  /**
   * Apply custom range filter
   */
  async applyCustomRange(min, max) {
    try {
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max <= min) {
        this.showError('Invalid custom range');
        return;
      }

      // Save filter details
      await storage.setValue('activeRangeId', 'custom');
      await storage.setValue('customMin', min);
      await storage.setValue('customMax', max);

      // Update display
      this.updateFilterDisplay('custom', min, max);

      // Notify content script
      await this.sendMessageToContent({
        type: 'APPLY_FILTER',
        filter: 'custom',
        customMin: min,
        customMax: max
      });

      logger?.info('Custom preset applied', { min, max });
    } catch (error) {
      logger?.error('Failed to apply custom preset', error);
    }
  }

  /**
   * Apply preset filter
   */
  async applyPreset(presetName) {
    try {
      const activeRangeId = presetName === 'all' ? null : presetName;

      // Save filter
      await storage.setValue('activeRangeId', activeRangeId);

      // Update display
      this.updateFilterDisplay(presetName);

      // Notify content script
      await this.sendMessageToContent({
        type: 'APPLY_FILTER',
        filter: activeRangeId
      });

      logger?.info('Preset applied:', presetName);
    } catch (error) {
      logger?.error('Failed to apply preset', error);
    }
  }

  /**
   * Request page scan
   */
  async requestScan() {
    try {
      await this.sendMessageToContent({ type: 'PERFORM_SCAN' });
      logger?.info('Scan requested');
    } catch (error) {
      logger?.error('Failed to request scan', error);
    }
  }

  /**
   * Update connection status indicator
   */
  updateConnectionStatus(status, text) {
    const dot = document.getElementById('connectionStatus');
    const label = document.getElementById('statusText');
    if (!dot || !label) return;

    label.textContent = text;
    dot.className = 'status-indicator';

    if (status === 'connected') {
      dot.style.color = '#00dd00'; // Green
      label.style.color = '';
    } else if (status === 'warning') {
      dot.style.color = '#ff8c00'; // Orange
      label.style.color = '#ff8c00';
    } else {
      dot.style.color = '#ff4444'; // Red
      label.style.color = '#ff4444';
    }
  }

  /**
   * Update statistics display
   */
  async updateStats() {
    try {
      const response = await this.sendMessageToContent({ type: 'GET_STATE' });
      if (response) {
        if (!response.isInitialized) {
          this.updateConnectionStatus('warning', 'Navigate to Jobs');
          document.getElementById('statTotal').textContent = '—';
          document.getElementById('statFiltered').textContent = '—';
          document.getElementById('statNow').textContent = '—';
          document.getElementById('stat0to10').textContent = '—';
          return;
        }

        this.updateConnectionStatus('connected', 'Connected');
        const autoScanToggle = document.getElementById('autoScanToggle');
        if (autoScanToggle && typeof response.enableAutoScan === 'boolean') {
          autoScanToggle.checked = response.enableAutoScan;
        }
        document.getElementById('statTotal').textContent =
          response.totalJobs !== undefined && response.totalJobs !== null ? response.totalJobs : '—';
        document.getElementById('statFiltered').textContent =
          response.filteredJobs !== undefined && response.filteredJobs !== null ? response.filteredJobs : '—';
        document.getElementById('statNow').textContent =
          response.stats?.countByCategory?.now !== undefined && response.stats?.countByCategory?.now !== null ? response.stats.countByCategory.now : '—';
        document.getElementById('stat0to10').textContent =
          response.stats?.countByCategory?.['0-10'] !== undefined && response.stats?.countByCategory?.['0-10'] !== null ? response.stats.countByCategory['0-10'] : '—';
      } else {
        this.updateConnectionStatus('disconnected', 'Disconnected');
      }
    } catch (error) {
      logger?.debug('Could not fetch stats:', error.message);
      this.updateConnectionStatus('disconnected', 'Open LinkedIn');
      document.getElementById('statTotal').textContent = '—';
      document.getElementById('statFiltered').textContent = '—';
      document.getElementById('statNow').textContent = '—';
      document.getElementById('stat0to10').textContent = '—';
    }
  }

  /**
   * Start auto-update interval
   */
  startAutoUpdate() {
    this.updateInterval = setInterval(() => this.updateStats(), 2000);
  }

  /**
   * Send message to content script
   */
  sendMessageToContent(message) {
    return new Promise((resolve, reject) => {
      if (!this.currentTab?.id) {
        reject(new Error('No active tab'));
        return;
      }

      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Show shortcuts modal
   */
  showShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
      modal.classList.add('visible');
    }
  }

  /**
   * Hide shortcuts modal
   */
  hideShortcutsModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const statusText = document.getElementById('statusText');
    if (statusText) {
      const originalText = statusText.textContent;
      statusText.textContent = message;
      statusText.style.color = '#ff4444';

      setTimeout(() => {
        statusText.textContent = originalText;
        statusText.style.color = '';
      }, 3000);
    }
  }

  /**
   * Cleanup on popup close
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// ============================================
// Initialize Popup
// ============================================

const popup = new PopupManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    popup.initialize();
  });
} else {
  popup.initialize();
}

// Cleanup on window close
window.addEventListener('beforeunload', () => {
  popup.destroy();
});

logger?.info('Popup script loaded');
