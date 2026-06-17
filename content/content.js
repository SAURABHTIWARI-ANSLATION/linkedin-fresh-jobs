/**
 * Main Content Script for LinkedIn Fresh Jobs Intelligence
 * Orchestrates all modules and manages the extension lifecycle
 */

class ContentScriptManager {
  constructor() {
    this.isInitialized = false;
    this.isActivating = false;
    this.isScanning = false;
    this.scanCount = 0;
    this.lastScanTime = 0;
    this.urlCheckInterval = null;
    this.lastUrl = window.location.href;
    this.enableAutoScan = true;
    this.lastSelectionJobId = null;
    this.selectionScrollTimers = [];
  }

  initialize() {
    logger?.info('🚀 LinkedIn Fresh Jobs Intelligence Content Script loaded');
    
    // 1. Setup background messaging (always open, even if not on jobs page)
    this.setupBackgroundMessaging();
    
    // 2. Monitor URL changes (SPA transitions)
    this.setupUrlMonitoring();
    
    // 3. Setup event listeners (once globally)
    this.setupEventListeners();
    
    // 4. Initial routing check
    this.checkUrlRoute();
  }

  /**
   * Monitor URL changes for SPA navigation
   */
  setupUrlMonitoring() {
    // Listen to popstate (back/forward browser navigation)
    window.addEventListener('popstate', () => this.checkUrlRoute());
    
    // Polling fallback checks for navigation changes
    this.urlCheckInterval = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastUrl) {
        this.lastUrl = currentUrl;
        this.checkUrlRoute();
        this.handleSelectionChangeFromUrl();
      }
    }, 1000);
  }

  /**
   * Check if current route is a jobs section and activate/deactivate
   */
  checkUrlRoute() {
    const isJobsPage = window.location.pathname.includes('/jobs');
    
    if (isJobsPage) {
      if (!this.isInitialized) {
        this.activate();
      }
    } else {
      if (this.isInitialized) {
        this.deactivate();
      }
    }
  }

  /**
   * Activate jobs filtering and dashboard features
   */
  async activate() {
    if (this.isInitialized || this.isActivating) return;
    this.isActivating = true;

    try {
      logger?.info('🔍 Activating Fresh Jobs filters and UI');

      // 1. Initialize UI first to setup default theme
      uiManager.initialize();

      // 2. Load user settings (will override default theme if custom setting exists)
      await this.loadSettings();

      // 3. Inject UI into page
      uiManager.injectFilterBar();
      await dashboard.initialize();

      // 4. Setup observers for real-time detection
      this.setupObservers();

      // 5. Perform initial scan
      await this.performScan();

      this.isInitialized = true;
      logger?.info('✅ Jobs features activated successfully');

      uiManager.showNotification('🔍 LinkedIn Fresh Jobs loaded!', 'success', 3000);
    } catch (error) {
      logger?.error('Failed to activate jobs features', error);
      uiManager.showNotification('❌ Failed to load filters', 'error', 5000);
    } finally {
      this.isActivating = false;
    }
  }

  /**
   * Load user settings from storage
   */
  async loadSettings() {
    try {
      const settings = await storage.getAll();
      
      let activeRangeId = settings.activeRangeId || null;
      let customMin = settings.customMin !== undefined ? settings.customMin : 0;
      let customMax = settings.customMax !== undefined ? settings.customMax : 60;
      this.enableAutoScan = settings.enableAutoScan !== false;
      
      filterEngine.setFilter(activeRangeId, customMin, customMax);
      uiManager.activeRangeId = activeRangeId;
      uiManager.updateFilterButtonStates();
      logger?.info('Settings loaded', { activeRangeId, customMin, customMax, enableAutoScan: this.enableAutoScan });

      // Apply theme
      uiManager.applyTheme(settings.theme || uiManager.theme);
    } catch (error) {
      logger?.error('Failed to load settings', error);
    }
  }

  /**
   * Setup real-time observers
   */
  setupObservers() {
    jobObserverManager.destroy();
    scrollWatcher.destroy();
    pageVisibilityWatcher.destroy();

    if (!this.enableAutoScan) {
      logger?.info('Auto-scan disabled; mutation and scroll observers skipped');
      return;
    }

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
        if (this.enableAutoScan) {
          logger?.info('Page is now visible, rescanning');
          this.performScan();
        } else {
          logger?.debug('Page visible but auto-scan is disabled');
        }
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
      const filteredJobs = filterEngine.filterJobs(allJobs, filterEngine.activeRangeId);

      // Update UI
      uiManager.highlightFreshJobs(allJobs);
      this.prepareJobLinksForSearchPage(allJobs);
      uiManager.updateJobVisibility(allJobs, filteredJobs);
      uiManager.updateFilterCounts(filterEngine.getTimeRangeCounts(allJobs));
      
      // Observe new jobs for visibility
      if (this.enableAutoScan) {
        jobObserverManager.observeJobCards(
          allJobs.map(j => j.element).filter(Boolean)
        );
      }

      // Update dashboard
      dashboard.updateContent(allJobs, filteredJobs);
      this.handleSelectionChangeFromUrl();

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
   * Keep search-result clicks inside LinkedIn's split search page. Some LinkedIn
   * renders expose /jobs/view links that can leave the search results page when
   * clicked directly.
   */
  prepareJobLinksForSearchPage(jobs) {
    if (!this.isLinkedInJobsSearchPage() || !Array.isArray(jobs)) {
      return;
    }

    jobs.forEach(job => {
      if (!job?.element || !document.contains(job.element)) return;
      this.rewriteSearchResultLinks(job.element);
    });
  }

  rewriteSearchResultLinks(root) {
    const links = root.querySelectorAll?.('a[href*="/jobs/view/"], a[href*="currentJobId="]') || [];
    links.forEach(link => this.rewriteSearchResultLink(link));
  }

  rewriteSearchResultLink(link) {
    if (!this.isSearchResultJobLink(link)) {
      return null;
    }

    try {
      const jobId = jobScanner.extractJobIdFromUrl(link.href);
      if (!jobId) return null;

      if (!link.dataset.ljfOriginalHref) {
        link.dataset.ljfOriginalHref = link.href;
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = '/jobs/search/';
      nextUrl.searchParams.set('currentJobId', jobId);
      link.href = nextUrl.toString();
      link.removeAttribute('target');
      link.target = '_self';
      return link;
    } catch (error) {
      logger?.debug('Failed to rewrite search result link', error);
      return null;
    }
  }

  isSearchResultJobLink(link) {
    if (!link || !this.isLinkedInJobsSearchPage()) return false;
    if (!link.href || !/\/jobs\/view\/|currentJobId=/.test(link.href)) return false;

    const detailsPane = link.closest(
      '.jobs-search__job-details, .jobs-details, .jobs-unified-top-card, .jobs-description, [class*="jobs-details"]'
    );
    if (detailsPane) return false;

    return Boolean(link.closest(
      '.jobs-search-results__list-item, .job-card-container, [data-occludable-job-id], [data-job-id], [data-view-name*="job"]'
    ));
  }

  isLinkedInJobsSearchPage() {
    return window.location.hostname.includes('linkedin.com') && window.location.pathname.includes('/jobs/search');
  }

  prepareClickedJobLink(target) {
    const element = target instanceof Element ? target : null;
    const link = element?.closest?.('a[href*="/jobs/view/"], a[href*="currentJobId="]');
    return link ? this.rewriteSearchResultLink(link) : null;
  }

  handleSelectionChangeFromUrl() {
    const selectedJobId = jobScanner.extractJobIdFromUrl(window.location.href);
    if (!selectedJobId) {
      this.lastSelectionJobId = null;
      return;
    }

    if (selectedJobId !== this.lastSelectionJobId) {
      this.lastSelectionJobId = selectedJobId;
      this.scrollJobDetailsToTopSoon();
    }
  }

  scrollJobDetailsToTopSoon() {
    this.clearSelectionScrollTimers();
    [100, 350, 800, 1400].forEach(delay => {
      const timerId = setTimeout(() => {
        this.scrollJobDetailsToTop();
      }, delay);
      this.selectionScrollTimers.push(timerId);
    });
  }

  clearSelectionScrollTimers() {
    this.selectionScrollTimers.forEach(timerId => clearTimeout(timerId));
    this.selectionScrollTimers = [];
  }

  scrollJobDetailsToTop() {
    const selectors = [
      '.jobs-search__job-details--container',
      '.jobs-search__job-details',
      '.jobs-details__main-content',
      '.jobs-details',
      '.jobs-unified-top-card',
      '[class*="jobs-search__job-details"]',
      '[class*="jobs-details"]'
    ];

    const candidates = [];
    const seen = new Set();

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => {
        if (!seen.has(element)) {
          seen.add(element);
          candidates.push(element);
        }
      });
    });

    candidates.forEach(element => {
      if (this.isScrollableElement(element)) {
        element.scrollTop = 0;
      }
    });

    const topCard = document.querySelector('.jobs-unified-top-card, .jobs-details__main-content');
    topCard?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  }

  isScrollableElement(element) {
    if (!element || element === document.documentElement || element === document.body) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY);
    return canScrollY && element.scrollHeight > element.clientHeight + 10;
  }

  setupEventListeners() {
    const prepareLinkBeforeLinkedInHandlesIt = (event) => {
      const link = this.prepareClickedJobLink(event.target);
      if (link && event.type === 'click') {
        this.scrollJobDetailsToTopSoon();
      }
    };

    document.addEventListener('pointerdown', prepareLinkBeforeLinkedInHandlesIt, true);
    document.addEventListener('click', prepareLinkBeforeLinkedInHandlesIt, true);

    // Filter changed event
    window.addEventListener('ljf-filter-changed', async (e) => {
      if (!this.isInitialized) return;
      const rangeId = e.detail.rangeId;
      
      filterEngine.setFilter(rangeId);
      uiManager.activeRangeId = rangeId;
      uiManager.updateFilterButtonStates();
      
      // Save to storage
      await storage.setValue('activeRangeId', rangeId);

      // Apply the filter in-page instantly. We intentionally do NOT navigate
      // LinkedIn via f_TPR here: LinkedIn ignores sub-hour values, which made
      // the filter look broken (full reload, unchanged/empty result set).
      await this.performScan();

      logger?.info('Filter applied:', rangeId);
    });

    // Filter reset event
    window.addEventListener('ljf-filter-reset', async () => {
      if (!this.isInitialized) return;
      
      filterEngine.setFilter(null);
      uiManager.activeRangeId = null;
      uiManager.updateFilterButtonStates();
      
      await storage.setValue('activeRangeId', null);
      // Reset in-page (show all jobs) without reloading the LinkedIn page.
      await this.performScan();
      logger?.info('Filters reset');
    });

    // Settings clicked
    window.addEventListener('ljf-settings-click', () => {
      if (!this.isInitialized) return;
      logger?.info('Settings clicked');
      uiManager.showNotification('⚙️ Settings coming soon', 'info', 2000);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isInitialized) return;
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

    logger?.info('Event listeners attached');
  }

  /**
   * Setup communication with background service worker
   */
  setupBackgroundMessaging() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      logger?.info('Message received:', message.type);

      if (message.type === 'URL_CHANGED') {
        this.checkUrlRoute();
        sendResponse({ success: true });
        return true;
      }

      // Exit early if features are not active (e.g. not on /jobs page)
      if (!this.isInitialized) {
        if (message.type === 'GET_STATE') {
          sendResponse({ isInitialized: false });
        } else {
          sendResponse({ success: false, error: 'Extension not active on this page' });
        }
        return true;
      }

      if (message.type === 'PERFORM_SCAN') {
        this.performScan();
        sendResponse({ success: true });
      } else if (message.type === 'GET_STATE') {
        sendResponse(this.getState());
      } else if (message.type === 'APPLY_FILTER') {
        const filter = message.filter;
        const customMin = message.customMin !== undefined ? message.customMin : null;
        const customMax = message.customMax !== undefined ? message.customMax : null;

        filterEngine.setFilter(filter, customMin, customMax);
        uiManager.activeRangeId = filter;
        uiManager.updateFilterButtonStates();
        storage.setValue('activeRangeId', filter);
        if (filter === 'custom') {
          storage.setValue('customMin', customMin !== null ? customMin : 0);
          storage.setValue('customMax', customMax !== null ? customMax : 60);
        }
        
        // Apply the filter in-page instantly (no LinkedIn reload).
        this.performScan();
        sendResponse({ success: true, navigating: false });
      } else if (message.type === 'THEME_CHANGED') {
        uiManager.applyTheme(message.theme);
        sendResponse({ success: true });
      } else if (message.type === 'POSITION_CHANGED') {
        dashboard.changePosition(message.position);
        sendResponse({ success: true });
      } else if (message.type === 'AUTOSCAN_CHANGED') {
        this.setAutoScan(message.enabled !== false);
        sendResponse({ success: true, enabled: this.enableAutoScan });
      }
      return true; // Keep message channel open for async responses
    });
  }

  /**
   * Enable or disable automatic rescans at runtime.
   */
  setAutoScan(enabled) {
    this.enableAutoScan = enabled;
    storage.setValue('enableAutoScan', enabled);

    if (enabled) {
      this.setupObservers();
      this.performScan();
      uiManager.showNotification('Auto-scan enabled', 'success', 2000);
    } else {
      jobObserverManager.destroy();
      scrollWatcher.destroy();
      pageVisibilityWatcher.destroy();
      uiManager.showNotification('Auto-scan disabled', 'info', 2000);
    }

    logger?.info('Auto-scan changed', { enabled });
  }

  /**
   * Get current state
   */
  getState() {
    if (!this.isInitialized) {
      return { isInitialized: false };
    }
    const cachedJobs = jobScanner.getCachedJobs();
    return {
      isInitialized: this.isInitialized,
      isScanning: this.isScanning,
      scanCount: this.scanCount,
      lastScanTime: this.lastScanTime,
      enableAutoScan: this.enableAutoScan,
      totalJobs: cachedJobs.length,
      filteredJobs: jobScanner.getFilteredJobs().length,
      activeRangeId: filterEngine.activeRangeId,
      uiState: uiManager.getState(),
      dashboardState: dashboard.getState(),
      observerStatus: jobObserverManager.getStatus(),
      stats: filterEngine.getStatistics(cachedJobs)
    };
  }

  /**
   * Get a matching local bucket from LinkedIn's f_TPR URL parameter.
   */
  getFilterFromUrl() {
    try {
      const value = new URL(window.location.href).searchParams.get('f_TPR');
      const seconds = value?.match(/^r(\d+)$/)?.[1];
      if (!seconds) return null;

      const minutes = Number(seconds) / 60;
      const range = TIME_RANGE_FILTERS.find(item => item.maxMinutes === minutes);
      return range?.id || null;
    } catch (error) {
      logger?.warn('Failed to read filter from URL', error);
      return null;
    }
  }

  /**
   * Update LinkedIn's date-posted URL filter and reload when the backend result set must change.
   * LinkedIn accepts f_TPR=r<seconds> for "posted within the last N seconds".
   */
  updateUrlForFilter(filter, customMin = null, customMax = null) {
    try {
      if (!window.location.pathname.includes('/jobs')) {
        return false;
      }

      const url = new URL(window.location.href);

      if (!filter) {
        url.searchParams.delete('f_TPR');
      } else if (filter === 'custom') {
        const maxMinutes = customMax !== null ? Number(customMax) : 60;
        if (!Number.isFinite(maxMinutes) || maxMinutes <= 0) {
          return false;
        }

        const seconds = Math.max(60, Math.ceil(maxMinutes * 60));
        url.searchParams.set('f_TPR', `r${seconds}`);
        url.searchParams.set('sortBy', 'DD');
      } else {
        const range = TIME_RANGE_FILTERS.find(item => item.id === filter);
        if (!range || !Number.isFinite(range.maxMinutes)) {
          return false;
        }

        const seconds = Math.max(60, Math.ceil(range.maxMinutes * 60));
        url.searchParams.set('f_TPR', `r${seconds}`);
        url.searchParams.set('sortBy', 'DD');
      }

      // LinkedIn paginates with start; changing freshness should restart at page 1.
      url.searchParams.delete('start');
      url.searchParams.delete('currentJobId');

      const nextUrl = url.toString();
      if (nextUrl === window.location.href) {
        return false;
      }

      try {
        uiManager.showNotification('Loading matching LinkedIn jobs...', 'info', 1500);
      } catch (notificationError) {
        logger?.debug('Skipping URL update notification', notificationError);
      }
      window.location.assign(nextUrl);
      return true;
    } catch (error) {
      logger?.warn('Failed to update LinkedIn URL filter', error);
      return false;
    }
  }

  /**
   * Deactivate jobs filtering and UI
   */
  deactivate() {
    if (!this.isInitialized) return;

    logger?.info('🛑 Deactivating LinkedIn Fresh Jobs (navigated away)');
    
    try {
      jobObserverManager.destroy();
      scrollWatcher.destroy();
      pageVisibilityWatcher.destroy();
      dashboard.close();
      uiManager.clear();
      jobScanner.clearCache();
      this.clearSelectionScrollTimers();
      this.lastSelectionJobId = null;
    } catch (e) {
      logger?.error('Error during deactivation', e);
    }
    
    this.isInitialized = false;
    this.isActivating = false;
  }

  /**
   * Global cleanup on page unload
   */
  destroy() {
    if (this.urlCheckInterval) {
      clearInterval(this.urlCheckInterval);
      this.urlCheckInterval = null;
    }
    this.clearSelectionScrollTimers();
    this.deactivate();
    logger?.info('Extension globally destroyed');
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
