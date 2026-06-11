/**
 * DOM Scanner for LinkedIn Fresh Jobs Intelligence
 * Detects and extracts job card data from the LinkedIn jobs page
 */

class JobScanner {
  constructor() {
    this.scannedJobs = new Map(); // Cache of scanned job cards by element
    this.jobDataCache = [];
    this.lastScanTime = 0;
    this.scanCount = 0;
  }

  /**
   * Scan the page for all job cards
   * @returns {Array<Element>} Array of job card elements
   */
  scanJobCards() {
    const elements = safeQueryAll(SELECTORS.jobCard);
    logger?.info(`Found ${elements.length} job cards`);
    return elements;
  }

  /**
   * Get job cards in a specific container
   * @param {Element} container - Container to search
   * @returns {Array<Element>} Job card elements
   */
  getJobCardsInContainer(container = document) {
    return safeQueryAll(SELECTORS.jobCard, container);
  }

  /**
   * Extract data from a single job card element
   * @param {Element} element - Job card element
   * @param {string} jobId - Optional job ID
   * @returns {Object|null} Job data or null if extraction fails
   */
  extractJobData(element, jobId = null) {
    if (!element || !element.getBoundingClientRect) {
      return null;
    }

    try {
      // Extract basic info
      const title = getElementText(element, SELECTORS.jobTitle);
      const company = getElementText(element, SELECTORS.companyName);
      const location = getElementText(element, SELECTORS.location);
      
      // Parse posted time
      const minutes = timeParser.getTimeFromJobCard(element);

      // Generate or use provided job ID
      const id = jobId || `job-${Date.now()}-${Math.random()}`;

      // Create normalized job object
      return this.normalizeJobObject({
        id,
        element,
        title,
        company,
        location,
        minutes,
        timeText: this.extractTimeText(element),
        url: this.extractJobUrl(element),
        postedTime: new Date(Date.now() - minutes * 60000),
        scannedAt: Date.now()
      });
    } catch (error) {
      logger?.error('Error extracting job data', error);
      return null;
    }
  }

  /**
   * Extract time text from job card
   * @private
   * @param {Element} element - Job card element
   * @returns {string} Time text
   */
  extractTimeText(element) {
    const timeEl = safeQuery(SELECTORS.timeText, element);
    return timeEl ? timeEl.textContent.trim() : '';
  }

  /**
   * Extract job URL from card
   * @private
   * @param {Element} element - Job card element
   * @returns {string|null} Job URL or null
   */
  extractJobUrl(element) {
    try {
      const link = element.querySelector('a[href*="/jobs/"]');
      if (link && link.href) {
        return link.href;
      }
    } catch (e) {
      // Ignore errors
    }
    return null;
  }

  /**
   * Normalize job object to consistent structure
   * @private
   * @param {Object} data - Raw job data
   * @returns {Object} Normalized job object
   */
  normalizeJobObject(data) {
    return {
      id: data.id,
      title: data.title?.trim() || 'Unknown Title',
      company: data.company?.trim() || 'Unknown Company',
      location: data.location?.trim() || 'Unknown Location',
      minutes: data.minutes,
      timeText: data.timeText,
      url: data.url,
      postedTime: data.postedTime,
      scannedAt: data.scannedAt,
      element: data.element, // Keep reference for DOM updates
      score: 0, // Will be calculated by filter engine
      label: null // Will be set by filter engine
    };
  }

  /**
   * Scan all jobs on page and return job data array
   * @returns {Array<Object>} Array of job objects
   */
  scanAllJobs() {
    const startTime = performance.now();
    const jobElements = this.scanJobCards();
    const jobs = [];

    jobElements.forEach((element, index) => {
      // Check if we've already scanned this element
      const cachedJob = this.scannedJobs.get(element);
      if (cachedJob && Date.now() - cachedJob.scannedAt < 5000) {
        jobs.push(cachedJob);
        return;
      }

      // Extract new job data
      const jobData = this.extractJobData(element, `job-${index}`);
      if (jobData) {
        jobs.push(jobData);
        this.scannedJobs.set(element, jobData);
      }
    });

    // Enrich jobs with scores and labels
    const enrichedJobs = filterEngine.enrichJobs(jobs);
    
    // Cache results
    this.jobDataCache = enrichedJobs;
    this.lastScanTime = Date.now();
    this.scanCount++;

    const duration = performance.now() - startTime;
    logger?.performance('Scan all jobs', duration);
    logger?.info(`Scanned ${enrichedJobs.length} jobs`, {
      average: (duration / enrichedJobs.length).toFixed(2) + 'ms per job'
    });

    return enrichedJobs;
  }

  /**
   * Get jobs matching current filter
   * @returns {Array<Object>} Filtered jobs
   */
  getFilteredJobs() {
    const filterInfo = filterEngine.getCurrentFilterInfo();
    return filterEngine.filterJobs(
      this.jobDataCache,
      filterInfo.name,
      filterInfo.minutes
    );
  }

  /**
   * Get cached job data
   * @returns {Array<Object>} Cached jobs
   */
  getCachedJobs() {
    return this.jobDataCache;
  }

  /**
   * Clear scan cache
   */
  clearCache() {
    this.scannedJobs.clear();
    this.jobDataCache = [];
    this.lastScanTime = 0;
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {Object|null} Job object or null
   */
  getJobById(jobId) {
    return this.jobDataCache.find(job => job.id === jobId) || null;
  }

  /**
   * Get job element by ID
   * @param {string} jobId - Job ID
   * @returns {Element|null} Job element or null
   */
  getJobElementById(jobId) {
    const job = this.getJobById(jobId);
    return job?.element || null;
  }

  /**
   * Find jobs by company
   * @param {string} company - Company name
   * @returns {Array<Object>} Matching jobs
   */
  findJobsByCompany(company) {
    return this.jobDataCache.filter(job =>
      job.company.toLowerCase().includes(company.toLowerCase())
    );
  }

  /**
   * Find jobs by title keywords
   * @param {string} keyword - Keyword to search
   * @returns {Array<Object>} Matching jobs
   */
  findJobsByTitle(keyword) {
    return this.jobDataCache.filter(job =>
      job.title.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Get jobs posted in time window
   * @param {number} minutes - Time window in minutes
   * @returns {Array<Object>} Jobs within time window
   */
  getJobsInTimeWindow(minutes) {
    return this.jobDataCache.filter(job => job.minutes <= minutes);
  }

  /**
   * Get statistics about scanned jobs
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalScanned: this.jobDataCache.length,
      scanCount: this.scanCount,
      lastScanTime,
      filteredCount: this.getFilteredJobs().length,
      stats: filterEngine.getStatistics(this.jobDataCache)
    };
  }

  /**
   * Detect changes in jobs (new, removed, updated)
   * @param {Array<Object>} previousJobs - Previous scan results
   * @returns {Object} Changes {added, removed, updated}
   */
  detectChanges(previousJobs = []) {
    const newJobs = this.jobDataCache;
    const prevIds = new Set(previousJobs.map(j => j.id));
    const newIds = new Set(newJobs.map(j => j.id));

    const added = newJobs.filter(j => !prevIds.has(j.id));
    const removed = previousJobs.filter(j => !newIds.has(j.id));
    const updated = newJobs.filter(j => {
      const prevJob = previousJobs.find(pj => pj.id === j.id);
      return prevJob && prevJob.minutes !== j.minutes;
    });

    return { added, removed, updated };
  }

  /**
   * Get most recent jobs
   * @param {number} count - Number of jobs to return
   * @returns {Array<Object>} Most recent jobs
   */
  getMostRecentJobs(count = 10) {
    return this.jobDataCache
      .sort((a, b) => a.minutes - b.minutes)
      .slice(0, count);
  }

  /**
   * Get hottest jobs (highest score)
   * @param {number} count - Number of jobs to return
   * @returns {Array<Object>} Hottest jobs
   */
  getHottestJobs(count = 10) {
    return this.jobDataCache
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }
}

// Create global scanner instance
const jobScanner = new JobScanner();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JobScanner, jobScanner };
}
