/**
 * Logging utility for LinkedIn Fresh Jobs Intelligence
 * Provides consistent logging with timestamps and log levels
 */

class Logger {
  constructor(moduleName = 'Extension') {
    this.moduleName = moduleName;
    this.isDevelopment = true; // Set to false for production
  }

  /**
   * Get formatted timestamp
   * @returns {string} Formatted time string
   */
  getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  /**
   * Get log prefix
   * @param {string} level - Log level
   * @returns {string} Formatted prefix
   */
  getPrefix(level) {
    return `[${this.getTimestamp()}] [${this.moduleName}] [${level}]`;
  }

  /**
   * Log debug message
   * @param {string} message - Message to log
   * @param {*} data - Additional data to log
   */
  debug(message, data = null) {
    if (this.isDevelopment) {
      const prefix = this.getPrefix('DEBUG');
      console.log(`%c${prefix} ${message}`, 'color: #999; font-weight: bold;', data || '');
    }
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   * @param {*} data - Additional data to log
   */
  info(message, data = null) {
    const prefix = this.getPrefix('INFO');
    console.log(`%c${prefix} ${message}`, 'color: #0066cc; font-weight: bold;', data || '');
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   * @param {*} data - Additional data to log
   */
  warn(message, data = null) {
    const prefix = this.getPrefix('WARN');
    console.warn(`%c${prefix} ${message}`, 'color: #ff8800; font-weight: bold;', data || '');
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Error} error - Error object
   */
  error(message, error = null) {
    const prefix = this.getPrefix('ERROR');
    console.error(`%c${prefix} ${message}`, 'color: #ff0000; font-weight: bold;', error || '');
  }

  /**
   * Log table data
   * @param {Array} data - Data to log as table
   */
  table(data) {
    console.table(data);
  }

  /**
   * Log group
   * @param {string} groupName - Name of the group
   */
  group(groupName) {
    console.group(`%c${groupName}`, 'color: #0066cc; font-weight: bold;');
  }

  /**
   * End log group
   */
  groupEnd() {
    console.groupEnd();
  }

  /**
   * Log performance measurement
   * @param {string} label - Measurement label
   * @param {number} duration - Duration in milliseconds
   */
  performance(label, duration) {
    const prefix = this.getPrefix('PERF');
    const color = duration > 100 ? '#ff8800' : '#00cc00';
    console.log(
      `%c${prefix} ${label}: ${duration.toFixed(2)}ms`,
      `color: ${color}; font-weight: bold;`
    );
  }
}

// Create global logger instance
const logger = new Logger('LinkedIn Fresh Jobs');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, logger };
}
