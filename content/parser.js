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
      return {
        rawText: '',
        minutesAgo: null,
        isParseable: false,
        isNow: false,
        type: 'unknown'
      };
    }

    // Check cache first
    const cached = this.cache.get(timeText);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    // Normalize text
    const normalized = timeText.toLowerCase().trim();

    let minutesAgo = null;
    let isParseable = false;
    let isNow = false;
    let type = 'unknown';

    const secondsAgo = this.parseSecondsAgo(normalized);

    // 1. Seconds ago
    if (secondsAgo !== null) {
      minutesAgo = secondsAgo;
      isParseable = true;
      isNow = true;
      type = 'seconds';
    }
    // 2. Just now
    else if (this.parseJustNow(normalized) !== null) {
      minutesAgo = 0;
      isParseable = true;
      isNow = true;
      type = 'now';
    } 
    // 3. Minutes ago
    else {
      const min = this.parseMinutesAgo(normalized);
      if (min !== null) {
        minutesAgo = min;
        isParseable = true;
        isNow = (min === 0);
        type = 'minutes';
      } 
      // 4. Hours ago
      else {
        const hr = this.parseHoursAgo(normalized);
        if (hr !== null) {
          minutesAgo = hr;
          isParseable = true;
          type = 'hours';
        } 
        // 5. Days ago
        else {
          const dy = this.parseDaysAgo(normalized);
          if (dy !== null) {
            minutesAgo = dy;
            isParseable = true;
            type = 'days';
          } 
          // 6. Weeks ago
          else {
            const wk = this.parseWeeksAgo(normalized);
            if (wk !== null) {
              minutesAgo = wk;
              isParseable = true;
              type = 'weeks';
            } 
            // 7. Months ago
            else {
              const mo = this.parseMonthsAgo(normalized);
              if (mo !== null) {
                minutesAgo = mo;
                isParseable = true;
                type = 'months';
              } 
              // 8. Years ago
              else {
                const yr = this.parseYearsAgo(normalized);
                if (yr !== null) {
                  minutesAgo = yr;
                  isParseable = true;
                  type = 'years';
                } 
                // 9. Special cases
                else {
                  const sp = this.parseSpecialCases(normalized);
                  if (sp !== null) {
                    if (sp >= 0) {
                      minutesAgo = sp;
                      isParseable = true;
                      type = 'special';
                    } else {
                      minutesAgo = null;
                      isParseable = false;
                      type = 'promoted';
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // 10. Fallback: check general linkedinPatterns
    if (minutesAgo === null && !isParseable) {
      const patternMatch = normalized.match(TIME_REGEX.linkedinPatterns);
      if (patternMatch) {
        const value = safeParseInt(patternMatch[1], 0);
        const unit = patternMatch[2].toLowerCase();
        if (unit.startsWith('second')) {
          minutesAgo = 0;
          isNow = true;
        } else if (unit.startsWith('minute') || unit === 'm') {
          minutesAgo = value;
          isNow = (value === 0);
        } else if (unit.startsWith('hour') || unit === 'h') {
          minutesAgo = value * 60;
        } else if (unit.startsWith('day') || unit === 'd') {
          minutesAgo = value * 24 * 60;
        } else if (unit.startsWith('week') || unit === 'w') {
          minutesAgo = value * 7 * 24 * 60;
        }
        if (minutesAgo !== null) {
          isParseable = true;
          type = 'linkedinPatterns';
        }
      }
    }

    // 11. Fallback: specificDate
    if (minutesAgo === null && !isParseable) {
      const dateMatch = normalized.match(TIME_REGEX.specificDate);
      if (dateMatch) {
        const month = parseInt(dateMatch[1]) - 1;
        const day = parseInt(dateMatch[2]);
        let year = parseInt(dateMatch[3]);
        if (year < 100) year += 2000;
        const parsedDate = new Date(year, month, day);
        const diffMs = Date.now() - parsedDate.getTime();
        if (diffMs > 0) {
          minutesAgo = Math.floor(diffMs / 60000);
          isParseable = true;
          type = 'specificDate';
        }
      }
    }

    const result = {
      rawText: timeText,
      minutesAgo,
      isParseable,
      isNow,
      type
    };

    // Cache result
    this.cache.set(timeText, {
      result,
      timestamp: Date.now()
    });

    return result;
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
   * Parse "X seconds ago" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseSecondsAgo(text) {
    const match = text.match(TIME_REGEX.seconds);
    if (match) {
      return 0;
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
   * Parse "X months ago" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseMonthsAgo(text) {
    const match = text.match(TIME_REGEX.months);
    if (match) {
      const months = safeParseInt(match[1], 0);
      return months * 30 * 24 * 60;
    }
    return null;
  }

  /**
   * Parse "X years ago" timestamp
   * @private
   * @param {string} text - Normalized text
   * @returns {number|null} Minutes elapsed or null
   */
  parseYearsAgo(text) {
    const match = text.match(TIME_REGEX.years);
    if (match) {
      const years = safeParseInt(match[1], 0);
      return years * 365 * 24 * 60;
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

    // "Reposted" or "Promoted" - get the time before/after it when present.
    if (TIME_REGEX.reposted.test(text)) {
      const cleaned = text.replace(TIME_REGEX.reposted, '').replace(/[·•|-]+/g, ' ').trim();
      if (cleaned) {
        const parsed = this.parseTime(cleaned);
        return parsed.isParseable ? parsed.minutesAgo : null;
      }
      // If it is purely a promoted ad (e.g. text is just "promoted"), return -1 so we mark it unparseable.
      if (text.includes('promoted')) {
        return -1;
      }
      return 60; // Default to 1 hour ago if reposted with no time
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
    if (minutes === null || minutes === undefined || typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) {
      return 'Unknown';
    }
    if (minutes === 0) return 'Just now';
    if (minutes < 60) return `${Math.floor(minutes)}m ago`;
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
   * @returns {Array<{text: string, result: Object}>} Found timestamps
   */
  extractAllTimestamps(element) {
    const timestamps = [];
    const seen = new Set();
    const potentialElements = safeQueryAll(SELECTORS.timeText, element);

    const addCandidate = (text) => {
      const cleanText = text?.trim();
      if (!cleanText || seen.has(cleanText)) return;
      seen.add(cleanText);
      const result = this.parseTime(cleanText);
      timestamps.push({ text: cleanText, result });
    };

    potentialElements.forEach(el => {
      addCandidate(el.textContent);
      addCandidate(el.getAttribute?.('aria-label'));
      addCandidate(el.getAttribute?.('title'));
      addCandidate(el.getAttribute?.('datetime'));
      addCandidate(el.getAttribute?.('data-posted-time'));
      addCandidate(el.getAttribute?.('data-public-jobs-feed-item-posted-time'));
    });

    if (timestamps.length === 0) {
      const text = element?.textContent || '';
      const inlineMatches = text.match(/\b(?:just\s+now|just\s+posted|posted\s+now|\d+\s*(?:secs?|seconds?|mins?|minutes?|hrs?|hours?|days?|weeks?|months?|years?|s|m|h|d|w|mo|y)\b(?:\s+ago)?)\b/gi);
      inlineMatches?.forEach(addCandidate);
    }

    return timestamps;
  }

  /**
   * Get the parsed timestamp details from a job card
   * @param {Element} element - Job card element
   * @returns {Object} Parsed timestamp object
   */
  getTimeFromJobCard(element) {
    const timestamps = this.extractAllTimestamps(element);
    
    if (timestamps.length === 0) {
      return {
        rawText: '',
        minutesAgo: null,
        isParseable: false,
        isNow: false,
        type: 'unknown'
      };
    }

    // Find the first valid (parseable) timestamp
    for (const ts of timestamps) {
      if (ts.result.isParseable) {
        return ts.result;
      }
    }

    // If all failed to parse, return the first one's result
    return timestamps[0].result;
  }
}

// Create global parser instance
const timeParser = new TimeParser();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimeParser, timeParser };
}
