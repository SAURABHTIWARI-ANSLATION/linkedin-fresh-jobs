/**
 * Dashboard Widget for LinkedIn Fresh Jobs Intelligence
 * Floating statistics and monitoring panel
 */

class Dashboard {
  constructor() {
    this.element = null;
    this.contentElement = null;
    this.isCollapsed = false;
    this.position = 'bottom-right';
    this.updateInterval = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  /**
   * Initialize dashboard
   */
  initialize() {
    this.loadPosition();
    this.create();
    this.attachEventListeners();
    this.startAutoUpdate();
    logger?.info('Dashboard initialized');
  }

  /**
   * Create dashboard element
   */
  create() {
    // Remove existing dashboard if present
    const existing = document.getElementById('ljf-dashboard-root');
    if (existing) {
      existing.remove();
    }

    // Create main container
    this.element = createElement('div', {
      className: `ljf-dashboard ljf-${this.position}`,
      id: 'ljf-dashboard-root'
    });

    // Create header
    const header = createElement('div', { className: 'ljf-dashboard-header' });
    
    const title = createElement('div', { className: 'ljf-dashboard-title' }, '📊 Dashboard');
    header.appendChild(title);

    const closeBtn = createElement('button', {
      className: 'ljf-dashboard-close',
      title: 'Close dashboard'
    }, '×');

    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    this.element.appendChild(header);

    // Create content area
    this.contentElement = createElement('div', {
      className: 'ljf-dashboard-content ljf-visible ljf-container'
    });

    this.element.appendChild(this.contentElement);

    // Inject into page
    document.body.appendChild(this.element);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.element) return;

    const header = this.element.querySelector('.ljf-dashboard-header');
    if (header) {
      header.addEventListener('mousedown', (e) => this.startDrag(e));
    }

    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.endDrag());
  }

  /**
   * Start dragging dashboard
   */
  startDrag(e) {
    if (e.target.closest('.ljf-dashboard-close')) return;

    this.isDragging = true;
    const rect = this.element.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
  }

  /**
   * Drag dashboard
   */
  drag(e) {
    if (!this.isDragging || !this.element) return;

    this.element.style.left = (e.clientX - this.dragOffset.x) + 'px';
    this.element.style.top = (e.clientY - this.dragOffset.y) + 'px';
    this.element.style.bottom = 'auto';
    this.element.style.right = 'auto';
  }

  /**
   * End dragging dashboard
   */
  endDrag() {
    this.isDragging = false;
  }

  /**
   * Update dashboard content
   * @param {Array<Object>} jobs - All jobs
   * @param {Array<Object>} filteredJobs - Filtered jobs
   */
  updateContent(jobs, filteredJobs) {
    if (!this.contentElement) return;

    const stats = filterEngine.getStatistics(jobs);
    const filteredStats = filterEngine.getStatistics(filteredJobs);

    this.contentElement.innerHTML = `
      <div class="ljf-stat-row">
        <span class="ljf-stat-label">📋 Total Jobs</span>
        <span class="ljf-stat-value">${stats.total}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">✅ Filtered</span>
        <span class="ljf-stat-value">${filteredStats.total}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🔥 Very Hot</span>
        <span class="ljf-stat-value">${stats.countByCategory.veryHot}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">⚡ Hot</span>
        <span class="ljf-stat-value">${stats.countByCategory.hot}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🟢 Fresh</span>
        <span class="ljf-stat-value">${stats.countByCategory.fresh}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🟡 Recent</span>
        <span class="ljf-stat-value">${stats.countByCategory.recent}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">⏱️ Newest</span>
        <span class="ljf-stat-value">${timeParser.formatTime(stats.newestMinutes)}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">📅 Oldest</span>
        <span class="ljf-stat-value">${timeParser.formatTime(stats.oldestMinutes)}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">📊 Avg. Score</span>
        <span class="ljf-stat-value">${stats.averageScore.toFixed(0)}</span>
      </div>

      ${jobs.length > 0 ? `
        <div class="ljf-stat-row ljf-text-muted">
          <span>Last updated: ${new Date().toLocaleTimeString()}</span>
        </div>
      ` : `
        <div class="ljf-error">
          No jobs found. Try scrolling or refreshing the page.
        </div>
      `}
    `;
  }

  /**
   * Start auto-update interval
   */
  startAutoUpdate() {
    this.updateInterval = setInterval(() => {
      const jobs = jobScanner.getCachedJobs();
      const filteredJobs = jobScanner.getFilteredJobs();
      this.updateContent(jobs, filteredJobs);
    }, UI_CONFIG.dashboard.updateInterval);
  }

  /**
   * Stop auto-update interval
   */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Toggle dashboard visibility
   */
  toggle() {
    if (this.element) {
      if (this.hasClass(this.element, 'ljf-hidden')) {
        this.element.classList.remove('ljf-hidden');
        this.isCollapsed = false;
      } else {
        this.element.classList.add('ljf-hidden');
        this.isCollapsed = true;
      }
      this.savePosition();
    }
  }

  /**
   * Show dashboard
   */
  show() {
    if (this.element) {
      this.element.classList.remove('ljf-hidden');
      this.isCollapsed = false;
    }
  }

  /**
   * Hide/close dashboard
   */
  close() {
    if (this.element) {
      this.element.style.animation = 'slideOut 300ms ease-in';
      setTimeout(() => {
        this.element?.remove();
        this.element = null;
        this.contentElement = null;
      }, 300);
      this.stopAutoUpdate();
    }
  }

  /**
   * Change dashboard position
   * @param {string} position - Position name (e.g., 'bottom-right')
   */
  changePosition(position) {
    if (!this.element) return;

    const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
    if (!validPositions.includes(position)) return;

    // Remove old position class
    validPositions.forEach(pos => {
      this.element.classList.remove(`ljf-${pos}`);
    });

    // Add new position class
    this.element.classList.add(`ljf-${position}`);
    this.element.style.left = 'auto';
    this.element.style.top = 'auto';
    this.element.style.right = 'auto';
    this.element.style.bottom = 'auto';

    this.position = position;
    this.savePosition();
  }

  /**
   * Load position from storage
   */
  loadPosition() {
    storage.get('panelPosition').then(result => {
      if (result.panelPosition) {
        this.position = result.panelPosition;
      }
    });
  }

  /**
   * Save position to storage
   */
  savePosition() {
    storage.setValue('panelPosition', this.position);
  }

  /**
   * Helper method: check if element has class
   * @private
   */
  hasClass(element, className) {
    return element?.classList?.contains(className) || false;
  }

  /**
   * Get dashboard state
   * @returns {Object} State
   */
  getState() {
    return {
      visible: !!this.element && !this.isCollapsed,
      position: this.position,
      isDragging: this.isDragging
    };
  }
}

// Create global dashboard instance
const dashboard = new Dashboard();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Dashboard, dashboard };
}
