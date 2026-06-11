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
      if (autoScanToggle && settings.enableAutoScan !== undefined) {
        autoScanToggle.checked = settings.enableAutoScan;
      }

      // Custom minutes
      const customMinutes = document.getElementById('customMinutes');
      if (customMinutes && settings.customMinutes) {
        customMinutes.value = settings.customMinutes;
      }

      // Update current filter display
      const filter = settings.selectedFilter || '2h';
      this.updateFilterDisplay(filter);
    } catch (error) {
      logger?.error('Failed to load settings', error);
    }
  }

  /**
   * Update filter display
   */
  updateFilterDisplay(filter) {
    const preset = FILTER_PRESETS[filter];
    const filterName = document.getElementById('filterName');
    const filterDesc = document.getElementById('filterDesc');

    if (filterName && preset) {
      filterName.textContent = preset.name.replace(/[🔥⚡🟢📋]/g, '').trim();
      filterDesc.textContent = preset.description;
    }

    // Update active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => {
      const preset = btn.dataset.preset;
      if (preset === filter) {
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
    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset));
    });

    // Theme select
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', (e) => {
        storage.setValue('theme', e.target.value);
        this.sendMessageToContent({ type: 'THEME_CHANGED', theme: e.target.value });
      });
    }

    // Position select
    const positionSelect = document.getElementById('positionSelect');
    if (positionSelect) {
      positionSelect.addEventListener('change', (e) => {
        storage.setValue('panelPosition', e.target.value);
        this.sendMessageToContent({ type: 'POSITION_CHANGED', position: e.target.value });
      });
    }

    // Auto scan toggle
    const autoScanToggle = document.getElementById('autoScanToggle');
    if (autoScanToggle) {
      autoScanToggle.addEventListener('change', (e) => {
        storage.setValue('enableAutoScan', e.target.checked);
      });
    }

    // Custom time apply button
    const applyCustomBtn = document.getElementById('applyCustomBtn');
    if (applyCustomBtn) {
      applyCustomBtn.addEventListener('click', () => this.applyCustomTime());
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.requestScan());
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
   * Apply preset filter
   */
  async applyPreset(presetName) {
    try {
      const preset = FILTER_PRESETS[presetName];
      if (!preset) return;

      // Save filter
      await storage.setValue('selectedFilter', presetName);
      await storage.setValue('customMinutes', preset.minutes);

      // Update display
      this.updateFilterDisplay(presetName);

      // Notify content script
      this.sendMessageToContent({
        type: 'APPLY_FILTER',
        filter: presetName,
        minutes: preset.minutes
      });

      logger?.info('Preset applied:', presetName);
    } catch (error) {
      logger?.error('Failed to apply preset', error);
    }
  }

  /**
   * Apply custom time filter
   */
  async applyCustomTime() {
    try {
      const input = document.getElementById('customMinutes');
      const minutes = parseInt(input.value, 10);

      if (isNaN(minutes) || minutes < 1) {
        this.showError('Please enter a valid time in minutes');
        return;
      }

      // Save filter
      await storage.setValue('selectedFilter', 'custom');
      await storage.setValue('customMinutes', minutes);

      // Update display
      this.updateFilterDisplay('custom');

      // Notify content script
      this.sendMessageToContent({
        type: 'APPLY_FILTER',
        filter: 'custom',
        minutes: minutes
      });

      logger?.info('Custom filter applied:', minutes);
    } catch (error) {
      logger?.error('Failed to apply custom time', error);
      this.showError('Failed to apply custom time');
    }
  }

  /**
   * Request page scan
   */
  requestScan() {
    this.sendMessageToContent({ type: 'PERFORM_SCAN' });
    logger?.info('Scan requested');
  }

  /**
   * Update statistics display
   */
  async updateStats() {
    try {
      const response = await this.sendMessageToContent({ type: 'GET_STATE' });
      if (response) {
        document.getElementById('statTotal').textContent =
          response.totalJobs || '—';
        document.getElementById('statFiltered').textContent =
          response.filteredJobs || '—';
        document.getElementById('statHot').textContent =
          response.stats?.countByCategory?.hot || '—';
        document.getElementById('statFresh').textContent =
          response.stats?.countByCategory?.fresh || '—';
      }
    } catch (error) {
      // Content script might not be ready yet
      logger?.debug('Could not fetch stats:', error.message);
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
