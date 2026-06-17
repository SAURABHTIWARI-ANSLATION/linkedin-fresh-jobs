/**
 * Freshness Filter & Scoring Engine for LinkedIn Fresh Jobs Intelligence
 * Calculates freshness scores and filters jobs based on time windows
 */

class FilterEngine {
  constructor() {
    this.activeRangeId = null;
    this.activeRange = null;
    this.jobs = [];
  }

  /**
   * Calculate freshness score (0-100) based on minutes elapsed
   * Higher score = fresher job
   * @param {number} minutes - Minutes since posting
   * @returns {number} Freshness score 0-100
   */
  calculateFreshnessScore(minutes) {
    if (minutes === null || minutes < 0 || typeof minutes !== 'number') {
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
   * Check if a job's time is in range
   */
  isJobInTimeRange(job, range) {
    if (!job || !range) return false;

    const minutesAgo = job.minutesAgo;

    if (typeof minutesAgo !== "number") {
      return false;
    }

    return minutesAgo >= range.minMinutes && minutesAgo < range.maxMinutes;
  }

  /**
   * Check if job is published "now"
   */
  isNowJob(job) {
    return job.isNow === true || job.minutesAgo === 0;
  }

  /**
   * Check if a job should be shown based on current filter
   * @param {Object} job - Job data
   * @param {Object|string} activeRange - Selected range ID or object
   * @returns {boolean} True if job should be shown
   */
  shouldShowJob(job, activeRange = this.activeRange) {
    let range = activeRange;
    if (typeof activeRange === 'string') {
      if (activeRange === 'custom') {
        range = this.activeRange;
      } else {
        range = TIME_RANGE_FILTERS.find(r => r.id === activeRange) || null;
      }
    }

    if (!range) return true; // Reset / null shows all jobs

    if (range.id === "now") {
      return this.isNowJob(job);
    }

    return this.isJobInTimeRange(job, range);
  }

  /**
   * Filter jobs array based on criteria
   */
  filterJobs(jobs, rangeId = this.activeRangeId) {
    if (!Array.isArray(jobs)) {
      return [];
    }

    let range = null;
    if (rangeId === 'custom') {
      range = this.activeRange;
    } else {
      range = TIME_RANGE_FILTERS.find(r => r.id === rangeId) || null;
    }

    return jobs.filter(job => {
      return this.shouldShowJob(job, range);
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
        countByCategory: this.getTimeRangeCounts([])
      };
    }

    const scores = jobs.map(j => j.score);
    const minutes = jobs.filter(j => typeof j.minutesAgo === 'number').map(j => j.minutesAgo);

    return {
      total: jobs.length,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      averageMinutes: minutes.length > 0 ? minutes.reduce((a, b) => a + b, 0) / minutes.length : 0,
      newestMinutes: minutes.length > 0 ? Math.min(...minutes) : 0,
      oldestMinutes: minutes.length > 0 ? Math.max(...minutes) : 0,
      countByCategory: this.getTimeRangeCounts(jobs)
    };
  }

  /**
   * Apply job enrichment (add scores, labels, etc.)
   * @param {Array<Object>} jobs - Jobs to enrich
   * @returns {Array<Object>} Enriched jobs
   */
  enrichJobs(jobs) {
    return jobs.map(job => {
      const score = this.calculateFreshnessScore(job.minutesAgo);
      const label = this.getFreshnessLabel(score);

      return {
        ...job,
        score,
        label,
        formattedTime: timeParser.formatTime(job.minutesAgo),
        isVeryFresh: score >= FRESHNESS_CONFIG.scoreThresholds.hot
      };
    });
  }

  /**
   * Get exact time range counts for dashboard and UI
   */
  getTimeRangeCounts(jobs) {
    const counts = {
      now: 0,
      "0-10": 0,
      "10-30": 0,
      "30-60": 0,
      "60-120": 0,
      "120-180": 0,
      older: 0,
      unknown: 0
    };

    if (!Array.isArray(jobs)) return counts;

    jobs.forEach(job => {
      const minutesAgo = job.minutesAgo;

      if (minutesAgo === null || typeof minutesAgo !== 'number') {
        counts.unknown++;
      } else if (job.isNow === true || minutesAgo === 0) {
        counts.now++;
      } else if (minutesAgo > 0 && minutesAgo < 10) {
        counts["0-10"]++;
      } else if (minutesAgo >= 10 && minutesAgo < 30) {
        counts["10-30"]++;
      } else if (minutesAgo >= 30 && minutesAgo < 60) {
        counts["30-60"]++;
      } else if (minutesAgo >= 60 && minutesAgo < 120) {
        counts["60-120"]++;
      } else if (minutesAgo >= 120 && minutesAgo < 180) {
        counts["120-180"]++;
      } else {
        counts.older++;
      }
    });

    return counts;
  }

  /**
   * Get recommended filter based on jobs available
   */
  getRecommendedFilter(jobs) {
    return 'all';
  }

  /**
   * Set current filter range
   * @param {string} rangeId - Filter range ID
   */
  setFilter(rangeId, customMin = null, customMax = null) {
    this.activeRangeId = rangeId;
    if (rangeId === 'custom') {
      const minMinutes = customMin !== null ? Number(customMin) : 0;
      const maxMinutes = customMax !== null ? Number(customMax) : 60;
      this.activeRange = {
        id: 'custom',
        label: `Custom (${minMinutes}-${maxMinutes}m)`,
        minMinutes,
        maxMinutes,
        description: `Custom range: ${minMinutes} to ${maxMinutes} minutes`
      };
    } else {
      this.activeRange = TIME_RANGE_FILTERS.find(r => r.id === rangeId) || null;
    }
  }

  /**
   * Get current filter info
   * @returns {Object} Filter information
   */
  getCurrentFilterInfo() {
    const range = this.activeRange;

    return {
      name: this.activeRangeId || 'all',
      minutes: range ? range.maxMinutes : Infinity,
      minMinutes: range ? range.minMinutes : 0,
      maxMinutes: range ? range.maxMinutes : Infinity,
      description: range ? (range.description || `${range.label} range`) : 'All jobs',
      isCustom: this.activeRangeId === 'custom'
    };
  }
}

// Create global filter engine instance
const filterEngine = new FilterEngine();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FilterEngine, filterEngine };
}
