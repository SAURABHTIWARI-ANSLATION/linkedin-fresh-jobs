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
  async initialize() {
    await this.loadPosition();
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
    const counts = stats.countByCategory;
    const activeRange = filterEngine.activeRange;
    const activeFilterLabel = activeRange ? activeRange.label : 'Reset / Show All';
    
    const visibleCount = filteredJobs.length;
    const hiddenCount = jobs.length - visibleCount;

    this.contentElement.innerHTML = `
      <div class="ljf-stat-row">
        <span class="ljf-stat-label">📋 Total Scanned</span>
        <span class="ljf-stat-value">${jobs.length}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">⚙️ Active Filter</span>
        <span class="ljf-stat-value" style="font-weight: bold; color: #0a66c2;">${activeFilterLabel}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">👁️ Visible Jobs</span>
        <span class="ljf-stat-value" style="color: #00dd00; font-weight: bold;">${visibleCount}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🙈 Hidden Jobs</span>
        <span class="ljf-stat-value" style="color: #ff4444;">${hiddenCount}</span>
      </div>

      <div class="ljf-divider" style="margin: 8px 0; border-top: 1px solid rgba(0,0,0,0.1); border-color: var(--ljf-border);"></div>
      <div style="font-size: 11px; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; color: var(--ljf-text-secondary);">Fresh Job Buckets:</div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🔥 Now</span>
        <span class="ljf-stat-value">${counts.now}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🔥 0–10 min</span>
        <span class="ljf-stat-value">${counts["0-10"]}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">⚡ 10–30 min</span>
        <span class="ljf-stat-value">${counts["10-30"]}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🟢 30–60 min</span>
        <span class="ljf-stat-value">${counts["30-60"]}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🟡 60–90 min</span>
        <span class="ljf-stat-value">${counts["60-90"]}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🟠 90–120 min</span>
        <span class="ljf-stat-value">${counts["90-120"]}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🔵 120–150 min</span>
        <span class="ljf-stat-value">${counts["120-150"]}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">🟣 150–180 min</span>
        <span class="ljf-stat-value">${counts["150-180"]}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">⚫ Older</span>
        <span class="ljf-stat-value">${counts.older}</span>
      </div>

      <div class="ljf-stat-row">
        <span class="ljf-stat-label">❔ Unknown / Promoted</span>
        <span class="ljf-stat-value">${counts.unknown}</span>
      </div>

      ${jobs.length > 0 ? `
        <div class="ljf-stat-row ljf-text-muted" style="margin-top: 8px; font-size: 11px;">
          <span>Last updated: ${new Date().toLocaleTimeString()}</span>
        </div>
      ` : `
        <div class="ljf-error" style="margin-top: 8px;">
          No jobs found. Scroll to scan.
        </div>
      `}
    `;
  }

  /**
   * Start auto-update interval
   */
  startAutoUpdate() {
    this.stopAutoUpdate();
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

  async loadPosition() {
    try {
      const result = await storage.get('panelPosition');
      if (result.panelPosition) {
        this.position = result.panelPosition;
      }
    } catch (e) {
      logger?.warn('Failed to load dashboard position', e);
    }
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
