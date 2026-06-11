/**
 * Time Parser Engine for LinkedIn Fresh Jobs Intelligence
 * Parses various LinkedIn timestamp formats into minutes elapsed
 */

class TimeParser {
  constructor() {
    this.cache = new Map();
    this.lastUpdateTime = Date.now();
    this.cacheExpiry = 30000; // 30 seconds
  }

  /**
   * Parse LinkedIn timestamp text into minutes elapsed
   * @param {string} timeText - Raw timestamp text from LinkedIn
   * @returns {number} Minutes elapsed since posting
   */
  parseTime(timeText) {
    if (!timeText || typeof timeText !== 'string') {
      return -1; // Error code: could not parse
    }

    // Check cache first
    const cached = this.cache.get(timeText);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.minutes;
    }

    // Normalize text
    const normalized = timeText.toLowerCase().trim();

    // Try parsing in order of specificity
    let minutes = this.parseJustNow(normalized);
    if (minutes !== null) return this.cacheResult(timeText, minutes);

    minutes = this.parseMinutesAgo(normalized);
    if (minutes !== null) return this.cacheResult(timeText, minutes);

    minutes = this.parseHoursAgo(normalized);
    if (minutes !== null) return this.cacheResult(timeText, minutes);

    minutes = this.parseDaysAgo(normalized);
    if (minutes !== null) return this.cacheResult(timeText, minutes);

    minutes = this.parseWeeksAgo(normalized);
    if (minutes !== null) return this.cacheResult(timeText, minutes);

    minutes = this.parseSpecialCases(normalized);
    if (minutes !== null) return this.cacheResult(timeText, minutes);

    // Fallback: assume old if we can't parse
    logger?.warn('Could not parse timestamp:', timeText);
    return this.cacheResult(timeText, -1);
  }

  /**
   * Parse "Just now" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseJustNow(text) {
    if (TIME_REGEX.justNow.test(text)) {
      return 0; // Just posted
    }
    return null;
  }

  /**
   * Parse "X minutes ago" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseMinutesAgo(text) {
    const match = text.match(TIME_REGEX.minutes);
    if (match) {
      const minutes = safeParseInt(match[1], 0);
      return Math.min(minutes, 59); // Cap at 59 minutes
    }
    return null;
  }

  /**
   * Parse "X hours ago" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseHoursAgo(text) {
    const match = text.match(TIME_REGEX.hours);
    if (match) {
      const hours = safeParseInt(match[1], 0);
      return hours * 60;
    }
    return null;
  }

  /**
   * Parse "X days ago" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseDaysAgo(text) {
    const match = text.match(TIME_REGEX.days);
    if (match) {
      const days = safeParseInt(match[1], 0);
      return days * 24 * 60;
    }
    return null;
  }

  /**
   * Parse "X weeks ago" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseWeeksAgo(text) {
    const match = text.match(TIME_REGEX.weeks);
    if (match) {
      const weeks = safeParseInt(match[1], 0);
      return weeks * 7 * 24 * 60;
    }
    return null;
  }

  /**
   * Parse special LinkedIn cases
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseSpecialCases(text) {
    // "Actively hiring" or "Just hired" - assume very fresh
    if (TIME_REGEX.activelyHiring.test(text)) {
      return 15; // Assume posted ~15 minutes ago
    }

    // "Reposted" or "Promoted" - get the time before it
    if (TIME_REGEX.reposted.test(text)) {
      // Remove "reposted" and try parsing remainder
      const cleaned = text.replace(TIME_REGEX.reposted, '').trim();
      if (cleaned) {
        return this.parseTime(cleaned);
      }
      return 60; // Default to 1 hour ago if promoted
    }

    return null;
  }

  /**
   * Cache parsing result
   * @private
   * @param {string} key - Text key
   * @param {number} minutes - Parsed minutes
   * @returns {number} Minutes elapsed
   */
  cacheResult(key, minutes) {
    this.cache.set(key, {
      minutes,
      timestamp: Date.now()
    });
    return minutes;
  }

  /**
   * Invalidate cache (call periodically)
   */
  invalidateCache() {
    this.cache.clear();
    this.lastUpdateTime = Date.now();
  }

  /**
   * Get a human-readable representation of minutes
   * @param {number} minutes - Minutes elapsed
   * @returns {string} Human-readable time
   */
  formatTime(minutes) {
    if (minutes < 0) return 'Unknown';
    if (minutes === 0) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    }
    const days = Math.floor(minutes / 1440);
    return `${days}d ago`;
  }

  /**
   * Validate that minutes is a sensible value
   * @param {number} minutes - Minutes to validate
   * @returns {boolean} True if valid
   */
  isValidMinutes(minutes) {
    return typeof minutes === 'number' && !isNaN(minutes) && minutes >= 0;
  }

  /**
   * Get all timestamps from a job card element
   * @param {Element} element - Job card element
   * @returns {Array<{text: string, minutes: number}>} Found timestamps
   */
  extractAllTimestamps(element) {
    const timestamps = [];
    const potentialElements = safeQueryAll(SELECTORS.timeText, element);

    potentialElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text) {
        const minutes = this.parseTime(text);
        timestamps.push({ text, minutes });
      }
    });

    return timestamps;
  }

  /**
   * Get the most likely timestamp from a job card
   * @param {Element} element - Job card element
   * @returns {number} Minutes elapsed
   */
  getTimeFromJobCard(element) {
    const timestamps = this.extractAllTimestamps(element);
    
    if (timestamps.length === 0) {
      return -1;
    }

    // Find the first valid (parseable) timestamp
    for (const ts of timestamps) {
      if (ts.minutes >= 0) {
        return ts.minutes;
      }
    }

    // If all failed to parse, return error
    return -1;
  }
}

// Create global parser instance
const timeParser = new TimeParser();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimeParser, timeParser };
}
