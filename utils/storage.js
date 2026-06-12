/**
 * Chrome storage wrapper for LinkedIn Fresh Jobs Intelligence
 * Provides unified interface for chrome.storage API
 */

class StorageManager {
  /**
   * Initialize storage manager
   */
  constructor() {
    this.storage = (typeof chrome !== 'undefined' && chrome.storage?.sync) ? chrome.storage.sync : {};
    this.cache = {};
    this.listeners = [];
  }

  /**
   * Get value from storage
   * @param {string|Array} keys - Key or array of keys to retrieve
   * @returns {Promise<Object>} Retrieved values
   */
  async get(keys) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.storage.get) {
          logger?.warn('Chrome storage API not available');
          resolve({});
          return;
        }

        this.storage.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            logger?.error('Storage get error', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            // Update cache
            if (typeof keys === 'string') {
              this.cache[keys] = result[keys];
            } else if (Array.isArray(keys)) {
              keys.forEach(key => {
                this.cache[key] = result[key];
              });
            }
            resolve(result);
          }
        });
      } catch (error) {
        logger?.error('Storage get exception', error);
        reject(error);
      }
    });
  }

  /**
   * Get single value from storage
   * @param {string} key - Key to retrieve
   * @param {*} defaultValue - Default value if not found
   * @returns {Promise<*>} Retrieved value or default
   */
  async getValue(key, defaultValue = null) {
    try {
      const result = await this.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      logger?.error(`Failed to get ${key} from storage`, error);
      return defaultValue;
    }
  }

  /**
   * Set value in storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async set(items) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.storage.set) {
          logger?.warn('Chrome storage API not available');
          // Update cache locally
          Object.assign(this.cache, items);
          resolve();
          return;
        }

        this.storage.set(items, () => {
          if (chrome.runtime.lastError) {
            logger?.error('Storage set error', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            // Update cache
            Object.assign(this.cache, items);
            // Notify listeners
            this.notifyListeners(items);
            resolve();
          }
        });
      } catch (error) {
        logger?.error('Storage set exception', error);
        reject(error);
      }
    });
  }

  /**
   * Set single value in storage
   * @param {string} key - Key to set
   * @param {*} value - Value to store
   * @returns {Promise<void>}
   */
  async setValue(key, value) {
    return this.set({ [key]: value });
  }

  /**
   * Remove value from storage
   * @param {string|Array} keys - Key or array of keys to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    return new Promise((resolve, reject) => {
      try {
        if (!this.storage.remove) {
          logger?.warn('Chrome storage API not available');
          // Remove from cache
          const keysArray = Array.isArray(keys) ? keys : [keys];
          keysArray.forEach(key => delete this.cache[key]);
          resolve();
          return;
        }

        this.storage.remove(keys, () => {
          if (chrome.runtime.lastError) {
            logger?.error('Storage remove error', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            // Remove from cache
            const keysArray = Array.isArray(keys) ? keys : [keys];
            keysArray.forEach(key => delete this.cache[key]);
            resolve();
          }
        });
      } catch (error) {
        logger?.error('Storage remove exception', error);
        reject(error);
      }
    });
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.storage.clear) {
          logger?.warn('Chrome storage API not available');
          this.cache = {};
          resolve();
          return;
        }

        this.storage.clear(() => {
          if (chrome.runtime.lastError) {
            logger?.error('Storage clear error', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            this.cache = {};
            resolve();
          }
        });
      } catch (error) {
        logger?.error('Storage clear exception', error);
        reject(error);
      }
    });
  }

  /**
   * Get all storage
   * @returns {Promise<Object>} All stored values
   */
  async getAll() {
    return new Promise((resolve, reject) => {
      try {
        if (!this.storage.get) {
          logger?.warn('Chrome storage API not available');
          resolve({});
          return;
        }

        this.storage.get(null, (result) => {
          if (chrome.runtime.lastError) {
            logger?.error('Storage getAll error', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            this.cache = result;
            resolve(result);
          }
        });
      } catch (error) {
        logger?.error('Storage getAll exception', error);
        reject(error);
      }
    });
  }

  /**
   * Listen for storage changes
   * @param {Function} callback - Callback function(changes, areaName)
   * @returns {Function} Unsubscribe function
   */
  onChanged(callback) {
    if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
      logger?.warn('Chrome storage change listener not available');
      return () => {};
    }

    const listener = (changes, areaName) => {
      if (areaName === 'sync') {
        callback(changes, areaName);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      chrome.storage.onChanged.removeListener(listener);
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify storage change listeners (local only)
   * @param {Object} changes - Changes object
   * @private
   */
  notifyListeners(changes) {
    this.listeners.forEach(listener => {
      listener(changes, 'sync');
    });
  }

  /**
   * Get from cache (synchronous, no promises)
   * @param {string} key - Key to get
   * @param {*} defaultValue - Default value
   * @returns {*} Cached value or default
   */
  getFromCache(key, defaultValue = null) {
    return this.cache[key] !== undefined ? this.cache[key] : defaultValue;
  }

  /**
   * Set in cache (synchronous, local only)
   * @param {string} key - Key to set
   * @param {*} value - Value to store
   */
  setInCache(key, value) {
    this.cache[key] = value;
  }

  /**
   * Invalidate cache for key
   * @param {string} key - Key to invalidate
   */
  invalidateCache(key) {
    delete this.cache[key];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {};
  }
}

// Create global storage instance
const storage = new StorageManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, storage };
}
