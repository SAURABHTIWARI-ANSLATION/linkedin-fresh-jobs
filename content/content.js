/**
 * Main Content Script for LinkedIn Fresh Jobs Intelligence
 * Orchestrates all modules and manages the extension lifecycle
 */

class ContentScriptManager {
  constructor() {
    this.isInitialized = false;
    this.isScanning = false;
    this.scanCount = 0;
    this.lastScanTime = 0;
  }

  /**
   * Initialize the extension
   */
  async initialize() {
    if (this.isInitialized) {
      logger?.warn('Extension already initialized');
      return;
    }

    try {
      logger?.info('🚀 LinkedIn Fresh Jobs Intelligence starting up');

      // 1. Load user settings
      await this.loadSettings();

      // 2. Initialize UI
      uiManager.initialize();
      uiManager.applyTheme(filterEngine.currentFilter);

      // 3. Inject UI into page
      uiManager.injectFilterBar();
      dashboard.initialize();

      // 4. Setup observers for real-time detection
      this.setupObservers();

      // 5. Perform initial scan
      await this.performScan();

      // 6. Setup event listeners
      this.setupEventListeners();

      // 7. Setup background messaging
      this.setupBackgroundMessaging();

      this.isInitialized = true;
      logger?.info('✅ Extension initialized successfully');

      uiManager.showNotification('🔍 LinkedIn Fresh Jobs loaded!', 'success', 3000);
    } catch (error) {
      logger?.error('Failed to initialize extension', error);
      uiManager.showNotification('❌ Failed to initialize', 'error', 5000);
    }
  }

  /**
   * Load user settings from storage
   */
  async loadSettings() {
    try {
      const settings = await storage.getAll();
      
      // Apply filter
      const filter = settings.selectedFilter || '2h';
      filterEngine.setFilter(filter, settings.customMinutes || 120);
      logger?.info('Settings loaded', { filter });

      // Apply theme
      if (settings.theme) {
        uiManager.applyTheme(settings.theme);
      }
    } catch (error) {
      logger?.error('Failed to load settings', error);
    }
  }

  /**
   * Setup real-time observers
   */
  setupObservers() {
    // Setup job observer for new jobs
    jobObserverManager.initialize(
      () => this.performScan(),
      (element) => this.handleJobVisible(element)
    );

    // Setup scroll watcher
    scrollWatcher.initialize((position, delta) => {
      logger?.debug('Page scrolled', { position, delta });
    });

    // Setup page visibility watcher
    pageVisibilityWatcher.initialize((isVisible) => {
      if (isVisible) {
        logger?.info('Page is now visible, rescanning');
        this.performScan();
      }
    });

    logger?.info('Observers setup complete');
  }

  /**
   * Perform page scan
   */
  async performScan() {
    if (this.isScanning) {
      logger?.debug('Scan already in progress');
      return;
    }

    this.isScanning = true;
    const startTime = performance.now();

    try {
      // Scan for jobs
      const allJobs = jobScanner.scanAllJobs();
      logger?.info(`Scan found ${allJobs.length} jobs`);

      // Get filtered jobs
      const filteredJobs = filterEngine.filterJobs(
        allJobs,
        filterEngine.currentFilter,
        filterEngine.customMinutes
      );

      // Update UI
      uiManager.highlightFreshJobs(allJobs);
      uiManager.updateJobVisibility(allJobs, filteredJobs);
      
      // Observe new jobs for visibility
      jobObserverManager.observeJobCards(
        allJobs.map(j => j.element).filter(Boolean)
      );

      // Update dashboard
      dashboard.updateContent(allJobs, filteredJobs);

      this.scanCount++;
      this.lastScanTime = Date.now();

      const duration = performance.now() - startTime;
      logger?.performance('Full scan cycle', duration);

    } catch (error) {
      logger?.error('Scan error', error);
      uiManager.showNotification('❌ Scan failed', 'error', 3000);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Handle job visibility
   */
  handleJobVisible(element) {
    const jobCard = safeQuery(SELECTORS.jobCard, element);
    if (jobCard) {
      logger?.debug('Job card visible');
      // Could trigger analytics or additional processing here
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Filter changed event
    window.addEventListener('ljf-filter-changed', async (e) => {
      const filter = e.detail.filter;
      filterEngine.setFilter(filter);
      uiManager.currentFilter = filter;
      uiManager.updateFilterButtonStates();
      
      // Save to storage
      await storage.setValue('selectedFilter', filter);
      
      // Rescan with new filter
      await this.performScan();
      
      logger?.info('Filter applied:', filter);
    });

    // Filter reset event
    window.addEventListener('ljf-filter-reset', async () => {
      filterEngine.setFilter('2h', 120);
      await storage.setValue('selectedFilter', '2h');
      await this.performScan();
      logger?.info('Filters reset');
    });

    // Settings clicked
    window.addEventListener('ljf-settings-click', () => {
      logger?.info('Settings clicked');
      uiManager.showNotification('⚙️ Settings coming soon', 'info', 2000);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+L - Toggle dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        dashboard.toggle();
        logger?.info('Dashboard toggled');
      }

      // Ctrl+Shift+R - Reset filters
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('ljf-filter-reset', {}));
        logger?.info('Reset shortcut activated');
      }

      // Ctrl+Shift+T - Toggle theme
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        uiManager.toggleDarkMode();
        logger?.info('Theme toggled');
      }
    });

    // Re-scan on scroll (for infinite scroll pages)
    window.addEventListener('scroll', throttle(() => {
      if (pageVisibilityWatcher.isPageVisible()) {
        // Trigger debounced rescan
        jobObserverManager.forceScan();
      }
    }, 1000));

    logger?.info('Event listeners attached');
  }

  /**
   * Setup communication with background service worker
   */
  setupBackgroundMessaging() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      logger?.info('Message from background:', message.type);

      if (message.type === 'PERFORM_SCAN') {
        this.performScan();
        sendResponse({ success: true });
      } else if (message.type === 'GET_STATE') {
        sendResponse({
          isInitialized: this.isInitialized,
          scanCount: this.scanCount,
          lastScanTime: this.lastScanTime,
          jobsCount: jobScanner.getCachedJobs().length
        });
      }
    });
  }

  /**
   * Get current state
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      isScanning: this.isScanning,
      scanCount: this.scanCount,
      lastScanTime: this.lastScanTime,
      totalJobs: jobScanner.getCachedJobs().length,
      filteredJobs: jobScanner.getFilteredJobs().length,
      currentFilter: filterEngine.currentFilter,
      uiState: uiManager.getState(),
      dashboardState: dashboard.getState(),
      observerStatus: jobObserverManager.getStatus()
    };
  }

  /**
   * Cleanup on page unload
   */
  destroy() {
    logger?.info('🛑 Shutting down LinkedIn Fresh Jobs');
    
    jobObserverManager.destroy();
    scrollWatcher.destroy();
    dashboard.stopAutoUpdate();
    uiManager.clear();
    jobScanner.clearCache();
    
    this.isInitialized = false;
    logger?.info('Extension cleaned up');
  }
}

// ============================================
// Initialize Extension
// ============================================

// Create global manager
const manager = new ContentScriptManager();

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    manager.initialize();
  });
} else {
  manager.initialize();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  manager.destroy();
});

// Make manager available globally for debugging
window.__linkedInFreshJobs = {
  manager,
  logger,
  storage,
  jobScanner,
  filterEngine,
  timeParser,
  uiManager,
  dashboard,
  jobObserverManager
};

logger?.info('Content script loaded');
