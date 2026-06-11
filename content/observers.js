/**
 * Observer System for LinkedIn Fresh Jobs Intelligence
 * Real-time detection of new jobs and page changes using MutationObserver & IntersectionObserver
 */

class JobObserverManager {
  constructor() {
    this.mutationObserver = null;
    this.intersectionObserver = null;
    this.scanCallback = null;
    this.visibilityCallback = null;
    this.isActive = false;
    this.debounceTimer = null;
    this.debounceDelay = 300; // ms
    this.observedElements = new WeakSet();
    this.lastScanTime = 0;
  }

  /**
   * Initialize observers
   * @param {Function} onNewJobs - Callback when new jobs detected
   * @param {Function} onJobVisible - Callback when job becomes visible
   */
  initialize(onNewJobs, onJobVisible) {
    this.scanCallback = onNewJobs;
    this.visibilityCallback = onJobVisible;
    this.setupMutationObserver();
    this.setupIntersectionObserver();
    this.isActive = true;
    logger?.info('Job observers initialized');
  }

  /**
   * Setup MutationObserver for DOM changes
   * @private
   */
  setupMutationObserver() {
    const config = {
      childList: true,        // Watch for added/removed nodes
      subtree: true,          // Watch entire subtree
      characterData: false,   // Don't watch text changes
      attributes: false,      // Don't watch attribute changes
      attributeOldValue: false,
      characterDataOldValue: false
    };

    this.mutationObserver = new MutationObserver((mutations) => {
      // Check if any mutations added new job cards
      const hasNewCards = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node =>
          this.isJobCard(node)
        );
      });

      if (hasNewCards) {
        this.debounceScan();
      }
    });

    // Observe the job feed container
    const feedContainer = safeQuery(SELECTORS.feedContainer);
    if (feedContainer) {
      this.mutationObserver.observe(feedContainer, config);
      logger?.info('MutationObserver attached to feed container');
    } else {
      logger?.warn('Could not find feed container for MutationObserver');
    }
  }

  /**
   * Setup IntersectionObserver for viewport visibility
   * @private
   */
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px', // Start loading before visible
      threshold: 0.1      // 10% of element visible
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Job card is visible in viewport
          if (this.visibilityCallback) {
            this.visibilityCallback(entry.target);
          }
        }
      });
    }, options);

    logger?.info('IntersectionObserver initialized');
  }

  /**
   * Check if element is a job card
   * @private
   * @param {Node} node - Node to check
   * @returns {boolean} True if node is a job card
   */
  isJobCard(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    
    const selectors = SELECTORS.jobCard;
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    
    return selectorArray.some(selector => {
      try {
        return node.matches?.(selector);
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Start observing job cards for visibility
   * @param {Array<Element>} elements - Job card elements
   */
  observeJobCards(elements = []) {
    if (!this.intersectionObserver) {
      logger?.warn('IntersectionObserver not initialized');
      return;
    }

    elements.forEach(element => {
      if (!this.observedElements.has(element)) {
        this.intersectionObserver.observe(element);
        this.observedElements.add(element);
      }
    });

    logger?.debug(`Observing ${elements.length} job cards`);
  }

  /**
   * Stop observing job card
   * @param {Element} element - Job card element
   */
  unobserveJobCard(element) {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  /**
   * Debounced scan trigger
   * @private
   */
  debounceScan() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.scanCallback) {
        const jobs = this.scanCallback();
        logger?.info(`Debounced scan completed: ${jobs?.length || 0} jobs`);
      }
    }, this.debounceDelay);
  }

  /**
   * Force immediate scan
   */
  forceScan() {
    clearTimeout(this.debounceTimer);
    if (this.scanCallback) {
      return this.scanCallback();
    }
    return [];
  }

  /**
   * Enable/disable observers
   * @param {boolean} enabled - True to enable
   */
  setEnabled(enabled) {
    if (enabled && !this.isActive) {
      this.mutationObserver?.observe(
        safeQuery(SELECTORS.feedContainer) || document.body,
        { childList: true, subtree: true }
      );
      this.isActive = true;
      logger?.info('Observers enabled');
    } else if (!enabled && this.isActive) {
      this.mutationObserver?.disconnect();
      this.intersectionObserver?.disconnect();
      this.isActive = false;
      logger?.info('Observers disabled');
    }
  }

  /**
   * Get observer status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isActive: this.isActive,
      hasMutationObserver: !!this.mutationObserver,
      hasIntersectionObserver: !!this.intersectionObserver,
      debounceDelay: this.debounceDelay,
      lastScanTime: this.lastScanTime
    };
  }

  /**
   * Update debounce delay
   * @param {number} ms - Delay in milliseconds
   */
  setDebounceDelay(ms) {
    this.debounceDelay = Math.max(100, Math.min(1000, ms)); // Clamp 100-1000ms
  }

  /**
   * Cleanup observers
   */
  destroy() {
    clearTimeout(this.debounceTimer);
    this.mutationObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.isActive = false;
    this.scanCallback = null;
    this.visibilityCallback = null;
    logger?.info('Job observers destroyed');
  }
}

/**
 * Automatic scroll detection
 */
class ScrollWatcher {
  constructor() {
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.scrollCallback = null;
    this.lastScrollPosition = 0;
    this.scrollThreshold = 100; // pixels
  }

  /**
   * Initialize scroll watcher
   * @param {Function} callback - Called on scroll
   */
  initialize(callback) {
    this.scrollCallback = callback;
    this.attachScrollListener();
  }

  /**
   * Attach scroll event listener
   * @private
   */
  attachScrollListener() {
    const handleScroll = throttle(() => {
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      const scrollDelta = Math.abs(scrollPosition - this.lastScrollPosition);

      if (scrollDelta > this.scrollThreshold) {
        this.isScrolling = true;
        if (this.scrollCallback) {
          this.scrollCallback(scrollPosition, scrollDelta);
        }

        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
          this.isScrolling = false;
        }, 500);

        this.lastScrollPosition = scrollPosition;
      }
    }, 200); // Throttle scroll events

    window.addEventListener('scroll', handleScroll, { passive: true });
    logger?.info('Scroll watcher attached');
  }

  /**
   * Get scroll status
   * @returns {Object} Status
   */
  getStatus() {
    return {
      isScrolling: this.isScrolling,
      lastScrollPosition: this.lastScrollPosition
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    clearTimeout(this.scrollTimeout);
    // Note: Can't easily remove throttled listener, so just clear refs
    this.scrollCallback = null;
  }
}

/**
 * Page visibility watcher (tab focus)
 */
class PageVisibilityWatcher {
  constructor() {
    this.isVisible = true;
    this.visibilityCallback = null;
  }

  /**
   * Initialize page visibility watcher
   * @param {Function} callback - Called on visibility change
   */
  initialize(callback) {
    this.visibilityCallback = callback;
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.visibilityCallback) {
        this.visibilityCallback(this.isVisible);
      }
      logger?.info(`Page visibility changed: ${this.isVisible ? 'visible' : 'hidden'}`);
    });
  }

  /**
   * Get visibility status
   * @returns {boolean} True if page is visible
   */
  isPageVisible() {
    return this.isVisible;
  }
}

// Create global instances
const jobObserverManager = new JobObserverManager();
const scrollWatcher = new ScrollWatcher();
const pageVisibilityWatcher = new PageVisibilityWatcher();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    JobObserverManager,
    ScrollWatcher,
    PageVisibilityWatcher,
    jobObserverManager,
    scrollWatcher,
    pageVisibilityWatcher
  };
}
