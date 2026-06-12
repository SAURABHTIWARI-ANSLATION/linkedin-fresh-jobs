/**
 * UI Injection Layer for LinkedIn Fresh Jobs Intelligence
 * Handles DOM manipulation, filter bar, and job highlighting
 */

class UIManager {
  constructor() {
    this.filterBar = null;
    this.filterButtons = new Map();
    this.activeRangeId = null;
    this.theme = 'dark';
    this.highlightedJobs = new WeakSet();
    this.highlightedJobsCount = 0;
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

    // Filter range buttons
    TIME_RANGE_FILTERS.forEach(range => {
      const btn = createElement('button', {
        className: 'ljf-filter-btn',
        id: `ljf-filter-${range.id}`,
        title: range.description || `${range.label} range`
      }, range.label);

      btn.addEventListener('click', () => this.handleFilterClick(range.id));
      bar.appendChild(btn);
      this.filterButtons.set(range.id, btn);
    });

    // Reset button
    const resetBtn = createElement('button', {
      className: 'ljf-filter-btn',
      id: 'ljf-filter-reset',
      title: 'Reset all filters'
    }, '↻ Reset');

    resetBtn.addEventListener('click', () => this.handleResetClick());
    bar.appendChild(resetBtn);
    this.filterButtons.set('reset', resetBtn);

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
    this.updateFilterButtonStates();

    // Add margin to body to account for fixed filter bar
    document.body.style.paddingTop = '48px';

    logger?.info('Filter bar injected');
  }

  /**
   * Handle filter button click
   * @param {string} rangeId - Range ID
   */
  handleFilterClick(rangeId) {
    this.activeRangeId = rangeId;
    this.updateFilterButtonStates();

    // Dispatch event for content script to handle
    window.dispatchEvent(new CustomEvent('ljf-filter-changed', {
      detail: { rangeId }
    }));

    logger?.info('Filter changed to:', rangeId);
  }

  /**
   * Handle reset button click
   */
  handleResetClick() {
    this.activeRangeId = null;
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
    this.filterButtons.forEach((btn, id) => {
      if (id === 'reset') {
        if (this.activeRangeId === null) {
          addClass(btn, 'active');
        } else {
          removeClass(btn, 'active');
        }
      } else {
        if (id === this.activeRangeId) {
          addClass(btn, 'active');
        } else {
          removeClass(btn, 'active');
        }
      }
    });
  }

  /**
   * Update counts displayed on filter buttons
   */
  updateFilterCounts(counts) {
    if (!counts) return;

    // Now
    const nowBtn = this.filterButtons.get('now');
    if (nowBtn) {
      nowBtn.textContent = `Now (${counts.now || 0})`;
    }

    // Ranges
    const ranges = ["0-10", "10-30", "30-60", "60-90", "90-120", "120-150", "150-180"];
    ranges.forEach(rangeId => {
      const btn = this.filterButtons.get(rangeId);
      if (btn) {
        const range = TIME_RANGE_FILTERS.find(r => r.id === rangeId);
        btn.textContent = `${range.label} (${counts[rangeId] || 0})`;
      }
    });
  }

  /**
   * Highlight fresh jobs with visual indicators
   * @param {Array<Object>} jobs - Jobs to highlight
   */
  highlightFreshJobs(jobs) {
    this.highlightedJobsCount = 0;

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
        
        removeClass(job.element, 'ljf-range-now');
        removeClass(job.element, 'ljf-range-0-10');
        removeClass(job.element, 'ljf-range-10-30');
        removeClass(job.element, 'ljf-range-30-60');
        removeClass(job.element, 'ljf-range-60-90');
        removeClass(job.element, 'ljf-range-90-120');
        removeClass(job.element, 'ljf-range-120-150');
        removeClass(job.element, 'ljf-range-150-180');
        removeClass(job.element, 'ljf-range-unknown');
        removeClass(job.element, 'ljf-range-older');

        // Add base class
        addClass(job.element, 'ljf-job-card');

        // Add badge and card border highlight class based on the badge info class
        const badgeInfo = this.getBadgeInfoForJob(job);
        addClass(job.element, `ljf-range-${badgeInfo.class}`);

        // Add badge
        this.addFreshnessBadge(job);

        this.highlightedJobs.add(job.element);
        this.highlightedJobsCount++;
      } catch (error) {
        logger?.error('Error highlighting job', error);
      }
    });
  }

  /**
   * Add freshness badge to job card
   * @param {Object} job - Job object
   */
  getBadgeInfoForJob(job) {
    const minutes = job.minutesAgo;
    
    if (minutes === null || typeof minutes !== 'number') {
      return { text: '❔ UNKNOWN', class: 'unknown', style: { backgroundColor: '#999999', color: '#ffffff' } };
    }
    
    if (job.isNow === true || minutes === 0) {
      return { text: '🔥 JUST PUBLISHED', class: 'now', style: { backgroundColor: '#ff4444', color: '#ffffff', fontWeight: 'bold' } };
    }
    if (minutes > 0 && minutes < 10) {
      return { text: '🔥 0–10 MIN', class: '0-10', style: { backgroundColor: '#ff4444', color: '#ffffff' } };
    }
    if (minutes >= 10 && minutes < 30) {
      return { text: '⚡ 10–30 MIN', class: '10-30', style: { backgroundColor: '#ff8c00', color: '#ffffff' } };
    }
    if (minutes >= 30 && minutes < 60) {
      return { text: '🟢 30–60 MIN', class: '30-60', style: { backgroundColor: '#00dd00', color: '#ffffff' } };
    }
    if (minutes >= 60 && minutes < 90) {
      return { text: '🟡 60–90 MIN', class: '60-90', style: { backgroundColor: '#ffdd00', color: '#000000' } };
    }
    if (minutes >= 90 && minutes < 120) {
      return { text: '🟠 90–120 MIN', class: '90-120', style: { backgroundColor: '#ff9900', color: '#ffffff' } };
    }
    if (minutes >= 120 && minutes < 150) {
      return { text: '🔵 120–150 MIN', class: '120-150', style: { backgroundColor: '#0066ff', color: '#ffffff' } };
    }
    if (minutes >= 150 && minutes < 180) {
      return { text: '🟣 150–180 MIN', class: '150-180', style: { backgroundColor: '#9900ff', color: '#ffffff' } };
    }
    
    return { text: `❔ OLDER (${Math.floor(minutes/60)}h)`, class: 'older', style: { backgroundColor: '#666666', color: '#ffffff' } };
  }

  addFreshnessBadge(job) {
    if (!job.element) return;

    try {
      // Find or create badge container
      let container = job.element.querySelector('.ljf-badges-container');
      if (container) {
        container.remove();
      }
      
      container = createElement('div', {
        className: 'ljf-badges-container ljf-flex',
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

      const badgeInfo = this.getBadgeInfoForJob(job);

      // Create badge
      const badge = createElement('span', {
        className: `ljf-badge ljf-badge-${badgeInfo.class}`,
        title: job.formattedTime
      }, badgeInfo.text);
      
      // Apply custom background and color
      Object.assign(badge.style, badgeInfo.style);

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

    let resolvedTheme = theme;
    if (theme === 'auto') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isLinkedInDark = document.documentElement.classList.contains('theme--dark') || 
                             document.body.classList.contains('theme--dark-inverse') ||
                             document.querySelector('html').getAttribute('data-theme') === 'dark';
      resolvedTheme = (isSystemDark || isLinkedInDark) ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-ljf-theme', resolvedTheme);
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('ljf-dark-mode');
      document.documentElement.classList.remove('ljf-light-mode');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.add('ljf-light-mode');
      document.documentElement.classList.remove('ljf-dark-mode');
      document.documentElement.style.colorScheme = 'light';
    }

    logger?.info('Theme applied', { theme, resolvedTheme });
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
        zIndex: '902',
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
        zIndex: '902'
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
      
      removeClass(el, 'ljf-range-now');
      removeClass(el, 'ljf-range-0-10');
      removeClass(el, 'ljf-range-10-30');
      removeClass(el, 'ljf-range-30-60');
      removeClass(el, 'ljf-range-60-90');
      removeClass(el, 'ljf-range-90-120');
      removeClass(el, 'ljf-range-120-150');
      removeClass(el, 'ljf-range-150-180');
      removeClass(el, 'ljf-range-unknown');
      removeClass(el, 'ljf-range-older');
    });

    // Remove badges
    document.querySelectorAll('.ljf-badge').forEach(el => el.remove());
    document.querySelectorAll('.ljf-badges-container').forEach(el => el.remove());

    // Restore body padding
    document.body.style.paddingTop = '';
    this.highlightedJobsCount = 0;

    logger?.info('UI cleared');
  }

  /**
   * Get current UI state
   * @returns {Object} UI state
   */
  getState() {
    return {
      filterBar: !!this.filterBar,
      activeRangeId: this.activeRangeId,
      theme: this.theme,
      highlightedJobsCount: this.highlightedJobsCount
    };
  }
}

// Create global UI manager instance
const uiManager = new UIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UIManager, uiManager };
}
