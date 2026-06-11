/**
 * Freshness Filter & Scoring Engine for LinkedIn Fresh Jobs Intelligence
 * Calculates freshness scores and filters jobs based on time windows
 */

class FilterEngine {
  constructor() {
    this.currentFilter = '2h';
    this.customMinutes = 120;
    this.jobs = [];
  }

  /**
   * Calculate freshness score (0-100) based on minutes elapsed
   * Higher score = fresher job
   * @param {number} minutes - Minutes since posting
   * @returns {number} Freshness score 0-100
   */
  calculateFreshnessScore(minutes) {
    if (minutes < 0) {
      return 0; // Invalid or unparseable time
    }

    // Very hot: 0-5 minutes = 100
    if (minutes <= 5) {
      return 100;
    }

    // Hot: 5-30 minutes = 70-100
    if (minutes <= 30) {
      return 100 - ((minutes - 5) / 25 * 30);
    }

    // Fresh: 30 min - 2 hours = 50-70
    if (minutes <= 120) {
      return 70 - ((minutes - 30) / 90 * 20);
    }

    // Recent: 2-24 hours = 20-50
    if (minutes <= 1440) {
      return 50 - ((minutes - 120) / 1320 * 30);
    }

    // Stale: 1-7 days = 5-20
    if (minutes <= 10080) {
      return 20 - ((minutes - 1440) / 8640 * 15);
    }

    // Ancient: 7+ days = 0-5
    return Math.max(0, 5 - (minutes / 100000));
  }

  /**
   * Get freshness label and emoji based on score
   * @param {number} score - Freshness score
   * @returns {Object} {emoji, text, color}
   */
  getFreshnessLabel(score) {
    if (score >= FRESHNESS_CONFIG.scoreThresholds.veryHot) {
      return FRESHNESS_CONFIG.labels.veryHot;
    }
    if (score >= FRESHNESS_CONFIG.scoreThresholds.hot) {
      return FRESHNESS_CONFIG.labels.hot;
    }
    if (score >= FRESHNESS_CONFIG.scoreThresholds.fresh) {
      return FRESHNESS_CONFIG.labels.fresh;
    }
    if (score >= FRESHNESS_CONFIG.scoreThresholds.recent) {
      return FRESHNESS_CONFIG.labels.recent;
    }
    if (score >= FRESHNESS_CONFIG.scoreThresholds.stale) {
      return FRESHNESS_CONFIG.labels.stale;
    }
    return FRESHNESS_CONFIG.labels.ancient;
  }

  /**
   * Check if a job should be shown based on current filter
   * @param {number} minutes - Minutes since job was posted
   * @param {string} filter - Filter name (e.g., '30m', '1h', 'custom')
   * @param {number} customMinutes - Custom minutes if filter is 'custom'
   * @returns {boolean} True if job should be shown
   */
  shouldShowJob(minutes, filter = this.currentFilter, customMinutes = this.customMinutes) {
    if (minutes < 0) {
      return true; // Show jobs we can't parse time for
    }

    // Get the time window in minutes
    let timeWindow = FRESHNESS_CONFIG.timeWindows[filter];
    
    if (filter === 'custom') {
      timeWindow = customMinutes;
    } else if (timeWindow === undefined) {
      logger?.warn('Unknown filter:', filter);
      return true; // Show by default if unknown filter
    }

    // Check if job is within time window
    return minutes <= timeWindow;
  }

  /**
   * Filter jobs array based on criteria
   * @param {Array<Object>} jobs - Jobs to filter
   * @param {string} filter - Filter name
   * @param {number} customMinutes - Custom minutes if filter is 'custom'
   * @returns {Array<Object>} Filtered jobs
   */
  filterJobs(jobs, filter = this.currentFilter, customMinutes = this.customMinutes) {
    if (!Array.isArray(jobs)) {
      return [];
    }

    return jobs.filter(job => {
      return this.shouldShowJob(job.minutes, filter, customMinutes);
    });
  }

  /**
   * Sort jobs by freshness (newest first)
   * @param {Array<Object>} jobs - Jobs to sort
   * @returns {Array<Object>} Sorted jobs
   */
  sortByFreshness(jobs) {
    return [...jobs].sort((a, b) => {
      // Newer (fewer minutes) comes first
      if (a.minutes !== b.minutes) {
        return a.minutes - b.minutes;
      }
      // Tie-breaker: by score
      return b.score - a.score;
    });
  }

  /**
   * Sort jobs by score (highest first)
   * @param {Array<Object>} jobs - Jobs to sort
   * @returns {Array<Object>} Sorted jobs
   */
  sortByScore(jobs) {
    return [...jobs].sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      // Tie-breaker: by freshness
      return a.minutes - b.minutes;
    });
  }

  /**
   * Sort jobs by company name
   * @param {Array<Object>} jobs - Jobs to sort
   * @returns {Array<Object>} Sorted jobs
   */
  sortByCompany(jobs) {
    return [...jobs].sort((a, b) => {
      const companyA = (a.company || '').toLowerCase();
      const companyB = (b.company || '').toLowerCase();
      return companyA.localeCompare(companyB);
    });
  }

  /**
   * Group jobs by company
   * @param {Array<Object>} jobs - Jobs to group
   * @returns {Object} Grouped jobs {company: [jobs]}
   */
  groupByCompany(jobs) {
    const groups = {};
    jobs.forEach(job => {
      const company = job.company || 'Unknown Company';
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(job);
    });
    return groups;
  }

  /**
   * Group jobs by location
   * @param {Array<Object>} jobs - Jobs to group
   * @returns {Object} Grouped jobs {location: [jobs]}
   */
  groupByLocation(jobs) {
    const groups = {};
    jobs.forEach(job => {
      const location = job.location || 'Unknown Location';
      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(job);
    });
    return groups;
  }

  /**
   * Detect duplicate jobs (same title + company + location)
   * @param {Array<Object>} jobs - Jobs to check
   * @returns {Array<Object>} Jobs marked with isDuplicate flag
   */
  detectDuplicates(jobs) {
    const seen = new Map();
    
    jobs.forEach(job => {
      const key = `${job.title}|${job.company}|${job.location}`.toLowerCase();
      
      if (seen.has(key)) {
        job.isDuplicate = true;
        seen.get(key).isDuplicate = true;
      } else {
        job.isDuplicate = false;
        seen.set(key, job);
      }
    });

    return jobs;
  }

  /**
   * Get statistics about jobs array
   * @param {Array<Object>} jobs - Jobs to analyze
   * @returns {Object} Statistics
   */
  getStatistics(jobs) {
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return {
        total: 0,
        averageScore: 0,
        averageMinutes: 0,
        newestMinutes: 0,
        oldestMinutes: 0,
        countByCategory: {
          veryHot: 0,
          hot: 0,
          fresh: 0,
          recent: 0,
          stale: 0,
          ancient: 0
        }
      };
    }

    const scores = jobs.map(j => j.score);
    const minutes = jobs.filter(j => j.minutes >= 0).map(j => j.minutes);
    const categories = {
      veryHot: 0,
      hot: 0,
      fresh: 0,
      recent: 0,
      stale: 0,
      ancient: 0
    };

    jobs.forEach(job => {
      const label = this.getFreshnessLabel(job.score);
      const key = label.text.toLowerCase();
      if (key === 'very hot') categories.veryHot++;
      else if (key === 'hot') categories.hot++;
      else if (key === 'fresh') categories.fresh++;
      else if (key === 'recent') categories.recent++;
      else if (key === 'stale') categories.stale++;
      else if (key === 'ancient') categories.ancient++;
    });

    return {
      total: jobs.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      averageMinutes: minutes.length > 0 ? minutes.reduce((a, b) => a + b, 0) / minutes.length : 0,
      newestMinutes: minutes.length > 0 ? Math.min(...minutes) : 0,
      oldestMinutes: minutes.length > 0 ? Math.max(...minutes) : 0,
      countByCategory: categories
    };
  }

  /**
   * Apply job enrichment (add scores, labels, etc.)
   * @param {Array<Object>} jobs - Jobs to enrich
   * @returns {Array<Object>} Enriched jobs
   */
  enrichJobs(jobs) {
    return jobs.map(job => {
      const score = this.calculateFreshnessScore(job.minutes);
      const label = this.getFreshnessLabel(score);

      return {
        ...job,
        score,
        label,
        formattedTime: timeParser.formatTime(job.minutes),
        isVeryFresh: score >= FRESHNESS_CONFIG.scoreThresholds.hot
      };
    });
  }

  /**
   * Get recommended filter based on jobs available
   * @param {Array<Object>} jobs - Available jobs
   * @returns {string} Recommended filter
   */
  getRecommendedFilter(jobs) {
    if (jobs.length === 0) return 'all';

    // Count jobs in different time windows
    const countIn30m = jobs.filter(j => j.minutes <= 30).length;
    const countIn2h = jobs.filter(j => j.minutes <= 120).length;
    const countIn24h = jobs.filter(j => j.minutes <= 1440).length;

    // Recommend the tightest window that still shows >5 jobs
    if (countIn30m >= 5) return '30m';
    if (countIn2h >= 5) return '2h';
    if (countIn24h >= 5) return '24h';
    return 'all';
  }

  /**
   * Set current filter
   * @param {string} filter - Filter name
   * @param {number} customMinutes - Custom minutes if applicable
   */
  setFilter(filter, customMinutes = 120) {
    this.currentFilter = filter;
    this.customMinutes = customMinutes;
  }

  /**
   * Get current filter info
   * @returns {Object} Filter information
   */
  getCurrentFilterInfo() {
    const timeWindow = FRESHNESS_CONFIG.timeWindows[this.currentFilter] || this.customMinutes;
    const preset = FILTER_PRESETS[this.currentFilter];

    return {
      name: this.currentFilter,
      minutes: timeWindow,
      description: preset?.description || `Last ${timeWindow} minutes`,
      isCustom: this.currentFilter === 'custom'
    };
  }
}

// Create global filter engine instance
const filterEngine = new FilterEngine();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterEngine, filterEngine };
}
