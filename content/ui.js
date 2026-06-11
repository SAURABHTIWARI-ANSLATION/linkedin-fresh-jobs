/**
 * UI Injection Layer for LinkedIn Fresh Jobs Intelligence
 * Handles DOM manipulation, filter bar, and job highlighting
 */

class UIManager {
  constructor() {
    this.filterBar = null;
    this.filterButtons = new Map();
    this.currentFilter = '2h';
    this.theme = 'dark';
    this.highlightedJobs = new WeakSet();
  }

  /**
   * Initialize UI Manager
   */
  initialize() {
    this.theme = prefersDarkMode() ? 'dark' : 'light';
    logger?.info('UI Manager initialized', { theme: this.theme });
  }

  /**
   * Create filter bar element
   * @returns {Element} Filter bar element
   */
  createFilterBar() {
    const bar = createElement('div', {
      className: 'ljf-filter-bar',
      id: 'ljf-filter-bar-root'
    });

    // Title
    const title = createElement('div', { className: 'ljf-filter-title' }, '🔍 Fresh Jobs');
    bar.appendChild(title);

    // Filter buttons
    const filterOptions = ['30m', '1h', '2h', '3h', '6h', '12h', '24h', 'all', 'custom'];
    filterOptions.forEach(filterName => {
      const preset = FILTER_PRESETS[filterName];
      const label = preset?.name || filterName.toUpperCase();
      
      const btn = createElement('button', {
        className: 'ljf-filter-btn',
        id: `ljf-filter-${filterName}`,
        title: preset?.description || ''
      }, label);

      btn.addEventListener('click', () => this.handleFilterClick(filterName));
      bar.appendChild(btn);
      this.filterButtons.set(filterName, btn);
    });

    // Reset button
    const resetBtn = createElement('button', {
      className: 'ljf-filter-btn',
      id: 'ljf-filter-reset',
      title: 'Reset all filters'
    }, '↻ Reset');

    resetBtn.addEventListener('click', () => this.handleResetClick());
    bar.appendChild(resetBtn);

    // Settings button
    const settingsBtn = createElement('button', {
      className: 'ljf-filter-btn',
      id: 'ljf-settings-btn',
      title: 'Settings'
    }, '⚙️');

    settingsBtn.addEventListener('click', () => this.handleSettingsClick());
    bar.appendChild(settingsBtn);

    return bar;
  }

  /**
   * Inject filter bar into page
   */
  injectFilterBar() {
    // Remove existing filter bar if present
    const existing = document.getElementById('ljf-filter-bar-root');
    if (existing) {
      existing.remove();
    }

    // Create and inject new filter bar
    this.filterBar = this.createFilterBar();
    document.body.insertBefore(this.filterBar, document.body.firstChild);

    // Add margin to body to account for fixed filter bar
    document.body.style.paddingTop = '48px';

    logger?.info('Filter bar injected');
  }

  /**
   * Handle filter button click
   * @param {string} filterName - Filter name
   */
  handleFilterClick(filterName) {
    this.currentFilter = filterName;
    this.updateFilterButtonStates();

    // Dispatch event for content script to handle
    window.dispatchEvent(new CustomEvent('ljf-filter-changed', {
      detail: { filter: filterName }
    }));

    logger?.info('Filter changed to:', filterName);
  }

  /**
   * Handle reset button click
   */
  handleResetClick() {
    this.currentFilter = '2h';
    this.updateFilterButtonStates();

    window.dispatchEvent(new CustomEvent('ljf-filter-reset', {}));
    logger?.info('Filters reset');
  }

  /**
   * Handle settings button click
   */
  handleSettingsClick() {
    window.dispatchEvent(new CustomEvent('ljf-settings-click', {}));
    logger?.info('Settings clicked');
  }

  /**
   * Update filter button active states
   */
  updateFilterButtonStates() {
    this.filterButtons.forEach((btn, filterName) => {
      if (filterName === this.currentFilter) {
        addClass(btn, 'active');
      } else {
        removeClass(btn, 'active');
      }
    });
  }

  /**
   * Highlight fresh jobs with visual indicators
   * @param {Array<Object>} jobs - Jobs to highlight
   */
  highlightFreshJobs(jobs) {
    jobs.forEach(job => {
      if (!job.element) return;

      try {
        // Remove existing classes
        removeClass(job.element, 'ljf-job-card');
        removeClass(job.element, 'ljf-very-hot');
        removeClass(job.element, 'ljf-hot');
        removeClass(job.element, 'ljf-fresh');
        removeClass(job.element, 'ljf-recent');
        removeClass(job.element, 'ljf-stale');

        // Add new classes
        addClass(job.element, 'ljf-job-card');

        // Add freshness class
        const label = job.label;
        if (label) {
          const freshnessClass = `ljf-${label.text.toLowerCase()}`;
          addClass(job.element, freshnessClass);
        }

        // Add badge if not already present
        if (!job.element.querySelector('.ljf-badge')) {
          this.addFreshnessBadge(job);
        }

        this.highlightedJobs.add(job.element);
      } catch (error) {
        logger?.error('Error highlighting job', error);
      }
    });
  }

  /**
   * Add freshness badge to job card
   * @param {Object} job - Job object
   */
  addFreshnessBadge(job) {
    if (!job.element || !job.label) return;

    try {
      // Find or create badge container
      let container = job.element.querySelector('.ljf-badges-container');
      if (!container) {
        container = createElement('div', {
          className: 'ljf-flex',
          style: {
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: '10',
            gap: '4px'
          }
        });
        job.element.style.position = 'relative';
        job.element.insertBefore(container, job.element.firstChild);
      }

      // Create badge
      const badge = createElement('span', {
        className: `ljf-badge ljf-${job.label.text.toLowerCase()}`,
        title: job.formattedTime
      }, `${job.label.emoji} ${job.label.text}`);

      container.appendChild(badge);
    } catch (error) {
      logger?.error('Error adding badge', error);
    }
  }

  /**
   * Update job visibility based on filter
   * @param {Array<Object>} allJobs - All jobs
   * @param {Array<Object>} visibleJobs - Jobs that match filter
   */
  updateJobVisibility(allJobs, visibleJobs) {
    const visibleSet = new Set(visibleJobs.map(j => j.id));

    allJobs.forEach(job => {
      if (!job.element) return;

      if (visibleSet.has(job.id)) {
        removeClass(job.element, 'ljf-hidden');
      } else {
        addClass(job.element, 'ljf-hidden');
      }
    });

    logger?.info(`Visibility updated: ${visibleJobs.length}/${allJobs.length} shown`);
  }

  /**
   * Apply theme
   * @param {string} theme - 'light' or 'dark'
   */
  applyTheme(theme) {
    this.theme = theme;

    if (theme === 'dark') {
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }

    logger?.info('Theme applied:', theme);
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.theme);
    
    // Save preference
    storage.setValue('theme', this.theme);
  }

  /**
   * Show notification
   * @param {string} message - Message to show
   * @param {string} type - 'info', 'success', 'error', 'warning'
   * @param {number} duration - Duration in ms (0 = sticky)
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = createElement('div', {
      className: `ljf-notification ljf-notification-${type}`,
      style: {
        position: 'fixed',
        top: '64px',
        right: '20px',
        background: this.getNotificationColor(type),
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        zIndex: '2000',
        animation: 'slideIn 300ms ease-out',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '14px',
        fontWeight: '500'
      }
    }, message);

    document.body.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => {
        notification.style.animation = 'slideOut 300ms ease-in';
        setTimeout(() => notification.remove(), 300);
      }, duration);
    }
  }

  /**
   * Get notification color
   * @private
   * @param {string} type - Notification type
   * @returns {string} Color value
   */
  getNotificationColor(type) {
    const colors = {
      info: '#0a66c2',
      success: '#00dd00',
      error: '#ff4444',
      warning: '#ff8c00'
    };
    return colors[type] || colors.info;
  }

  /**
   * Show loading indicator
   * @returns {Element} Loading indicator element
   */
  showLoading() {
    const loader = createElement('div', {
      className: 'ljf-loading-spinner',
      style: {
        position: 'fixed',
        top: '60px',
        right: '20px',
        width: '24px',
        height: '24px',
        border: '2px solid rgba(10, 102, 194, 0.3)',
        borderTop: '2px solid #0a66c2',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        zIndex: '2000'
      }
    });

    // Add animation
    if (!document.getElementById('ljf-spin-animation')) {
      const style = createElement('style', {}, `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `);
      document.head.appendChild(style);
    }

    document.body.appendChild(loader);
    return loader;
  }

  /**
   * Clear all UI enhancements
   */
  clear() {
    // Remove filter bar
    this.filterBar?.remove();
    
    // Remove badges and highlighting
    Array.from(document.querySelectorAll('.ljf-job-card')).forEach(el => {
      removeClass(el, 'ljf-job-card');
      removeClass(el, 'ljf-very-hot');
      removeClass(el, 'ljf-hot');
      removeClass(el, 'ljf-fresh');
      removeClass(el, 'ljf-recent');
      removeClass(el, 'ljf-stale');
    });

    // Remove badges
    document.querySelectorAll('.ljf-badge').forEach(el => el.remove());

    // Restore body padding
    document.body.style.paddingTop = '';

    logger?.info('UI cleared');
  }

  /**
   * Get current UI state
   * @returns {Object} UI state
   */
  getState() {
    return {
      filterBar: !!this.filterBar,
      currentFilter: this.currentFilter,
      theme: this.theme,
      highlightedJobsCount: this.highlightedJobs.size
    };
  }
}

// Create global UI manager instance
const uiManager = new UIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIManager, uiManager };
}
