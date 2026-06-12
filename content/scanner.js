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
   * Helper: extract jobId from URL string
   */
  extractJobIdFromUrl(url) {
    if (!url) return null;
    try {
      const decoded = decodeURIComponent(url);
      const viewMatch = decoded.match(/\/jobs\/view\/(\d+)/);
      if (viewMatch) return viewMatch[1];
      const queryMatch = decoded.match(/currentJobId=(\d+)/);
      if (queryMatch) return queryMatch[1];
    } catch (e) {
      // Ignore
    }
    return null;
  }

  /**
   * Helper: check if element belongs to extension UI
   */
  isExtensionElement(element) {
    if (!element) return false;
    const id = element.id || '';
    const className = typeof element.className === 'string' ? element.className : '';
    if (id.includes('ljf-') || className.includes('ljf-')) {
      return true;
    }
    if (element.closest('#ljf-dashboard-root') || element.closest('.ljf-filter-bar')) {
      return true;
    }
    return false;
  }

  /**
   * Helper: checks if element is a valid card container candidate
   */
  isProbablyJobCard(element) {
    if (!element) return false;
    const tagName = element.tagName?.toLowerCase();
    if (['html', 'body', 'main', 'header', 'nav', 'footer'].includes(tagName)) {
      return false;
    }
    if (this.isExtensionElement(element)) {
      return false;
    }
    return true;
  }

  /**
   * Helper: require a job identity signal and a useful parent score before treating an element as a card.
   */
  isValidJobCardCandidate(element) {
    if (!this.isProbablyJobCard(element)) {
      return false;
    }

    const hasDataId = Boolean(
      element.getAttribute('data-job-id') ||
      element.getAttribute('data-occludable-job-id') ||
      element.getAttribute('data-entity-urn')?.includes('jobPosting')
    );
    const hasJobLink = Boolean(element.querySelector('a[href*="/jobs/view/"], a[href*="currentJobId="]'));
    const textLength = (element.textContent || '').trim().length;

    if (!hasDataId && !hasJobLink) {
      return false;
    }

    if (textLength > 2500) {
      return false;
    }

    return this.scoreParentElement(element) > 0;
  }

  /**
   * Helper: score parent elements to find best job card representation
   */
  scoreParentElement(element) {
    if (!element) return -999;
    const tagName = element.tagName?.toLowerCase();
    if (['html', 'body', 'main', 'header', 'nav', 'footer'].includes(tagName)) {
      return -999;
    }
    if (this.isExtensionElement(element)) {
      return -999;
    }

    let score = 0;
    
    // +30 if contains /jobs/view/ or currentJobId=
    const hasJobLink = element.querySelector('a[href*="/jobs/view/"], a[href*="currentJobId="]');
    if (hasJobLink) {
      score += 30;
    }

    const text = element.textContent || '';
    const textLength = text.length;

    // +20 if text contains minutes/hour/day/ago/just now/reposted
    const timeKeywords = /(?:minute|hour|day|week|month|year|second|ago|just\s+now|just\s+posted|just\s+published|reposted|promoted|actively\s+hiring|hiring|h\b|m\b|d\b|w\b)/i;
    if (timeKeywords.test(text)) {
      score += 20;
    }

    // +20 if text length between 80 and 1500
    if (textLength >= 80 && textLength <= 1500) {
      score += 20;
    }

    // +15 if contains location/company indicators
    const hasLocationClass = element.querySelector('[class*="location"], [class*="metadata"]');
    if (hasLocationClass || text.includes(',') || textLength > 150) {
      score += 15;
    }

    // -20 if element text is too large (likely whole page/large list container)
    if (textLength > 2000) {
      score -= 20;
    }

    return score;
  }

  /**
   * Find the best job card DOM container starting from a job link
   */
  findBestJobCardFromLink(link) {
    if (!link) return null;

    // Try standard parent containers first
    const containers = [
      link.closest('[data-occludable-job-id]'),
      link.closest('[data-view-name*="job"]'),
      link.closest('li'),
      link.closest('article')
    ];

    for (const container of containers) {
      if (container && this.isProbablyJobCard(container)) {
        if (this.scoreParentElement(container) > 0) {
          return container;
        }
      }
    }

    // Climbing parent element up to 8 levels and score each parent
    let current = link;
    let bestParent = null;
    let highestScore = -999;

    for (let i = 0; i < 8; i++) {
      current = current.parentElement;
      if (!current) break;
      
      const score = this.scoreParentElement(current);
      if (score > highestScore) {
        highestScore = score;
        bestParent = current;
      }
    }

    if (bestParent && highestScore > 0) {
      return bestParent;
    }

    return null;
  }

  /**
   * Deduplicate cards list to avoid duplicates during scroll
   */
  dedupeJobCards(cards) {
    const uniqueCards = [];
    const seenIds = new Set();
    const seenHashes = new Set();

    cards.forEach(card => {
      if (!card) return;

      const dataJobId = card.getAttribute('data-job-id');
      const dataOccludable = card.getAttribute('data-occludable-job-id');
      
      let entityUrnId = null;
      const urn = card.getAttribute('data-entity-urn');
      if (urn) {
        const match = urn.match(/jobPosting:(\d+)/);
        if (match) entityUrnId = match[1];
      }

      let urlJobId = null;
      const link = card.querySelector('a[href*="/jobs/view/"], a[href*="currentJobId="]');
      if (link) {
        urlJobId = this.extractJobIdFromUrl(link.href);
      }

      const ids = [dataJobId, dataOccludable, entityUrnId, urlJobId].filter(Boolean);
      let isDuplicate = false;

      for (const id of ids) {
        if (seenIds.has(id)) {
          isDuplicate = true;
          break;
        }
      }

      const text = card.textContent || '';
      const textHash = text.trim().substring(0, 150).replace(/\s+/g, ' ').toLowerCase();
      if (seenHashes.has(textHash)) {
        isDuplicate = true;
      }

      if (!isDuplicate) {
        ids.forEach(id => seenIds.add(id));
        if (textHash) {
          seenHashes.add(textHash);
        }
        uniqueCards.push(card);
      }
    });

    return uniqueCards;
  }

  /**
   * Scan the page for all job cards using multi-stage detection
   * @returns {Array<Element>} Array of job card elements
   */
  scanJobCards() {
    let standardCards = [];
    let fallbackCards = [];
    const selectors = [
      '.jobs-search-results__list-item',
      '[data-job-id]',
      '.job-card-container',
      '[data-view-name*="job"]',
      '[data-occludable-job-id]'
    ];

    // Stage 1: Standard selectors
    selectors.forEach(sel => {
      try {
        const found = document.querySelectorAll(sel);
        found.forEach(el => {
          if (this.isValidJobCardCandidate(el)) {
            standardCards.push(el);
          }
        });
      } catch (e) {
        // Ignore bad selector errors
      }
    });

    // Stage 2: Anchor-based fallback. Always combine it with standard selectors
    // because LinkedIn often moves the useful container one or two levels up.
    const links = Array.from(document.querySelectorAll('a[href*="/jobs/view/"], a[href*="currentJobId="]'));
    links.forEach(link => {
      const card = this.findBestJobCardFromLink(link);
      if (card && this.isValidJobCardCandidate(card)) {
        fallbackCards.push(card);
      }
    });

    const finalCards = [...standardCards, ...fallbackCards];

    // Deduplicate
    const uniqueCards = this.dedupeJobCards(finalCards);

    // Logging & diagnostics
    const sampleIds = uniqueCards.map(c => this.extractRealJobId(c)).filter(Boolean).slice(0, 5);
    logger?.info(`[Scanner] Standard selector cards: ${standardCards.length}`);
    logger?.info(`[Scanner] Job links found: ${links.length}`);
    logger?.info(`[Scanner] Anchor fallback cards: ${fallbackCards.length}`);
    logger?.info(`[Scanner] Final unique cards: ${uniqueCards.length}`);
    logger?.info(`[Scanner] Sample job ids: [${sampleIds.join(', ')}]`);

    return uniqueCards;
  }

  /**
   * Get job cards in a specific container
   * @param {Element} container - Container to search
   * @returns {Array<Element>} Job card elements
   */
  getJobCardsInContainer(container = document) {
    if (container === document) {
      return this.scanJobCards();
    }
    // Search within container
    const allCards = this.scanJobCards();
    return allCards.filter(card => container.contains(card));
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
      const title = (getElementText(element, SELECTORS.jobTitle) || this.extractTitleText(element))?.trim();
      const company = getElementText(element, SELECTORS.companyName)?.trim();
      const location = getElementText(element, SELECTORS.location)?.trim();
      const url = this.extractJobUrl(element);

      // Validate critical properties to filter out fake cards (ads, placeholders, etc.)
      if (!title || !url) {
        logger?.debug('Discarding element due to missing critical title or url', { title, url });
        return null;
      }
      
      // Parse posted time
      const timeParsed = timeParser.getTimeFromJobCard(element);
      const minutesAgo = timeParsed.minutesAgo;

      // Generate or use provided job ID
      const id = this.extractRealJobId(element) || jobId || `job-${Date.now()}-${Math.random()}`;

      // Create normalized job object
      return this.normalizeJobObject({
        id,
        element,
        title,
        company: company || 'Unknown Company',
        location: location || 'Unknown Location',
        minutes: minutesAgo,
        minutesAgo: minutesAgo,
        isParseable: timeParsed.isParseable,
        isNow: timeParsed.isNow,
        timeParsed: timeParsed,
        timeText: timeParsed.rawText || this.extractTimeText(element),
        url,
        postedTime: minutesAgo !== null ? new Date(Date.now() - minutesAgo * 60000) : null,
        scannedAt: Date.now()
      });
    } catch (error) {
      logger?.error('Error extracting job data', error);
      return null;
    }
  }

  /**
   * Extract job title from the primary link if LinkedIn's title classes changed.
   * @private
   * @param {Element} element - Job card element
   * @returns {string} Title text
   */
  extractTitleText(element) {
    const link = element?.querySelector?.('a[href*="/jobs/view/"], a[href*="currentJobId="]');
    return link?.textContent?.trim() || '';
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
    if (!element) return null;
    try {
      const link = element.querySelector('a[href*="/jobs/view/"], a[href*="currentJobId="]');
      if (link && link.href) {
        return link.href;
      }
      
      const fallbackLink = element.querySelector('a[href*="/jobs/"]');
      if (fallbackLink && fallbackLink.href) {
        return fallbackLink.href;
      }
    } catch (e) {
      // Ignore
    }
    return null;
  }

  /**
   * Extract unique job ID from card
   * @private
   * @param {Element} element - Job card element
   * @returns {string|null} Job ID or null
   */
  extractRealJobId(element) {
    if (!element) return null;

    try {
      const dataJobId = element.getAttribute('data-job-id');
      if (dataJobId) return dataJobId;

      const dataOccludable = element.getAttribute('data-occludable-job-id');
      if (dataOccludable) return dataOccludable;

      const urn = element.getAttribute('data-entity-urn');
      if (urn) {
        const match = urn.match(/jobPosting:(\d+)/);
        if (match) return match[1];
      }

      const link = element.querySelector('a[href*="/jobs/view/"], a[href*="currentJobId="], a[href*="/jobs/"]');
      if (link && link.href) {
        const id = this.extractJobIdFromUrl(link.href);
        if (id) return id;
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
      minutesAgo: data.minutesAgo,
      isParseable: data.isParseable,
      isNow: data.isNow,
      timeParsed: data.timeParsed,
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
      const cachedJob = this.scannedJobs.get(element);
      if (cachedJob && Date.now() - cachedJob.scannedAt < 5000) {
        jobs.push(cachedJob);
        return;
      }

      const jobData = this.extractJobData(element, `job-${index}`);
      if (jobData) {
        jobs.push(jobData);
        this.scannedJobs.set(element, jobData);
      }
    });

    const enrichedJobs = filterEngine.enrichJobs(jobs);
    
    this.jobDataCache = enrichedJobs;
    this.lastScanTime = Date.now();
    this.scanCount++;

    const duration = performance.now() - startTime;
    logger?.performance('Scan all jobs', duration);
    const avgMs = enrichedJobs.length > 0 ? (duration / enrichedJobs.length).toFixed(2) : '0.00';
    logger?.info(`Scanned ${enrichedJobs.length} jobs`, {
      average: `${avgMs}ms per job`
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
   * Get jobs in a specific time range
   */
  getJobsInTimeRange(minMinutes, maxMinutes) {
    return this.jobDataCache.filter(job => {
      if (typeof job.minutesAgo !== 'number') return false;
      return job.minutesAgo >= minMinutes && job.minutesAgo < maxMinutes;
    });
  }

  /**
   * Get statistics about scanned jobs
   * @returns {Object} Statistics
   */
  getStatistics() {
    return {
      totalScanned: this.jobDataCache.length,
      scanCount: this.scanCount,
      lastScanTime: this.lastScanTime,
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
