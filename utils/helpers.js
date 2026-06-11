/**
 * Utility helper functions for LinkedIn Fresh Jobs Intelligence
 * Contains common utilities like debounce, throttle, DOM helpers, etc.
 */

/**
 * Debounce function - delays execution until after calls stop
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits function execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sleep/delay helper
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safe querySelector with fallback selectors
 * @param {string|Array} selectors - Single selector or array of selectors to try
 * @param {Element} context - Context element (defaults to document)
 * @returns {Element|null} First matching element or null
 */
function safeQuery(selectors, context = document) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  
  for (const selector of selectorArray) {
    try {
      const element = context.querySelector(selector);
      if (element) return element;
    } catch (e) {
      // Invalid selector, try next
      continue;
    }
  }
  
  return null;
}

/**
 * Safe querySelectorAll with fallback selectors
 * @param {string|Array} selectors - Single selector or array of selectors to try
 * @param {Element} context - Context element (defaults to document)
 * @returns {Array} Array of matching elements
 */
function safeQueryAll(selectors, context = document) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  
  for (const selector of selectorArray) {
    try {
      const elements = context.querySelectorAll(selector);
      if (elements.length > 0) {
        return Array.from(elements);
      }
    } catch (e) {
      // Invalid selector, try next
      continue;
    }
  }
  
  return [];
}

/**
 * Get text content from element with fallback selectors
 * @param {Element} element - Element to search
 * @param {string|Array} selectors - Selectors to try
 * @returns {string} Text content or empty string
 */
function getElementText(element, selectors) {
  const foundElement = safeQuery(selectors, element);
  return foundElement ? foundElement.textContent.trim() : '';
}

/**
 * Get attribute from element with fallback selectors
 * @param {Element} element - Element to search
 * @param {string|Array} selectors - Selectors to try
 * @param {string} attr - Attribute name to get
 * @returns {string|null} Attribute value or null
 */
function getElementAttribute(element, selectors, attr) {
  const foundElement = safeQuery(selectors, element);
  return foundElement ? foundElement.getAttribute(attr) : null;
}

/**
 * Check if element is visible in viewport
 * @param {Element} element - Element to check
 * @param {number} offset - Pixel offset for visibility check
 * @returns {boolean} True if element is visible
 */
function isElementVisible(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Create element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param {string|Element|Array} content - Element content
 * @returns {Element} Created element
 */
function createElement(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key === 'style') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (content) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (Array.isArray(content)) {
      content.forEach(child => element.appendChild(child));
    } else {
      element.appendChild(content);
    }
  }
  
  return element;
}

/**
 * Add CSS class to element
 * @param {Element} element - Element to modify
 * @param {string} className - Class name to add
 */
function addClass(element, className) {
  if (element && element.classList) {
    element.classList.add(className);
  }
}

/**
 * Remove CSS class from element
 * @param {Element} element - Element to modify
 * @param {string} className - Class name to remove
 */
function removeClass(element, className) {
  if (element && element.classList) {
    element.classList.remove(className);
  }
}

/**
 * Toggle CSS class on element
 * @param {Element} element - Element to modify
 * @param {string} className - Class name to toggle
 * @returns {boolean} True if class is now added
 */
function toggleClass(element, className) {
  if (element && element.classList) {
    return element.classList.toggle(className);
  }
  return false;
}

/**
 * Check if element has CSS class
 * @param {Element} element - Element to check
 * @param {string} className - Class name to check
 * @returns {boolean} True if element has class
 */
function hasClass(element, className) {
  return element && element.classList && element.classList.contains(className);
}

/**
 * Get computed style value
 * @param {Element} element - Element to check
 * @param {string} property - CSS property name
 * @returns {string} Computed style value
 */
function getComputedStyleValue(element, property) {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Parse integer safely
 * @param {string} value - Value to parse
 * @param {number} defaultValue - Default if parsing fails
 * @returns {number} Parsed integer or default
 */
function safeParseInt(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} True if object is empty
 */
function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function mergeObjects(target, source) {
  const result = { ...target };
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeObjects(result[key] || {}, value);
    } else {
      result[key] = value;
    }
  });
  return result;
}

/**
 * Get unique values from array
 * @param {Array} array - Input array
 * @returns {Array} Array with unique values
 */
function getUnique(array) {
  return [...new Set(array)];
}

/**
 * Check if user prefers dark mode
 * @returns {boolean} True if dark mode is preferred
 */
function prefersDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get current URL parameters
 * @param {string} url - URL to parse (defaults to current)
 * @returns {Object} Parameters object
 */
function getUrlParams(url = window.location.href) {
  const params = new URL(url).searchParams;
  const result = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Measure execution time
 * @param {Function} func - Function to measure
 * @param {string} label - Label for measurement
 * @returns {*} Function return value
 */
async function measurePerformance(func, label = 'Operation') {
  const start = performance.now();
  const result = await func();
  const duration = performance.now() - start;
  logger?.performance(label, duration);
  return result;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debounce,
    throttle,
    sleep,
    safeQuery,
    safeQueryAll,
    getElementText,
    getElementAttribute,
    isElementVisible,
    createElement,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    getComputedStyleValue,
    escapeHtml,
    safeParseInt,
    isEmpty,
    mergeObjects,
    getUnique,
    prefersDarkMode,
    getUrlParams,
    measurePerformance
  };
}
