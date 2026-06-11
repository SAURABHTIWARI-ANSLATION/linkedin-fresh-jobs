/**
 * Global constants for LinkedIn Fresh Jobs Intelligence
 * Contains selectors, regex patterns, and configuration values
 */

// ============================================
// LinkedIn DOM Selectors (with fallbacks)
// ============================================
const SELECTORS = {
  // Job card containers - primary and fallbacks
  jobCard: [
    '[data-job-id]',
    '.base-card',
    '[data-entity-urn*="jobPosting"]',
    '.jobs-search-results__list-item'
  ],

  // Posted time text - multiple variations
  timeText: [
    '.job-search-card__metadata-item:first-child',
    '[data-public-jobs-feed-item-posted-time]',
    '[aria-label*="ago"]',
    '.metadata-entry--highlight',
    'span[data-posted-time]',
    '.description[data-tooltip]'
  ],

  // Job title
  jobTitle: [
    '.base-search-card__title',
    '[data-job-card-container-headline]',
    'h3[dir="ltr"]',
    '.job-search-card__title'
  ],

  // Company name
  companyName: [
    '.base-search-card__subtitle',
    '.job-search-card__company-name',
    '[data-job-card-container-company-name]',
    '.company-name'
  ],

  // Job location
  location: [
    '.job-search-card__location',
    '[data-job-card-container-location]',
    '.location'
  ],

  // Results container
  resultsContainer: [
    '.jobs-search-results__list-item',
    '[data-jobs-search-results__container-id]',
    '.base-card',
    'ul.jobs-search-results__list'
  ],

  // Job feed container
  feedContainer: [
    '[data-jobs-search-results__container-id]',
    '.jobs-search-results',
    '[aria-label*="job"]'
  ]
};

// ============================================
// Time Parsing Regex Patterns
// ============================================
const TIME_REGEX = {
  // "Just now" or "1 minute ago"
  justNow: /just\s+now/i,
  
  // "X minutes ago"
  minutes: /(\d+)\s*(?:mins?|minutes?)\s+ago/i,
  
  // "X hours ago"
  hours: /(\d+)\s*(?:hrs?|hours?)\s+ago/i,
  
  // "X days ago"
  days: /(\d+)\s*(?:days?)\s+ago/i,
  
  // "X weeks ago"
  weeks: /(\d+)\s*(?:weeks?)\s+ago/i,
  
  // "Just hired" or "Actively hiring"
  activelyHiring: /actively\s+hiring|just\s+hired|urgently\s+hiring/i,
  
  // "Reposted" or "Promoted"
  reposted: /reposted|promoted/i,
  
  // Specific dates (fallback)
  specificDate: /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
  
  // LinkedIn specific patterns
  linkedinPatterns: /(\d+)\s*(second|minute|hour|day|week)s?\s+ago/i
};

// ============================================
// Freshness Score Configuration
// ============================================
const FRESHNESS_CONFIG = {
  // Score thresholds (0-100)
  scoreThresholds: {
    veryHot: 85,    // < 5 minutes
    hot: 70,        // < 30 minutes
    fresh: 50,      // < 2 hours
    recent: 30,     // < 24 hours
    stale: 10,      // older than 24 hours
    ancient: 0      // very old
  },

  // Label definitions
  labels: {
    veryHot: { emoji: '🔥', text: 'VERY HOT', color: '#ff4444' },
    hot: { emoji: '⚡', text: 'HOT', color: '#ff8c00' },
    fresh: { emoji: '🟢', text: 'FRESH', color: '#00dd00' },
    recent: { emoji: '🟡', text: 'RECENT', color: '#ffdd00' },
    stale: { emoji: '🔴', text: 'STALE', color: '#dd4444' },
    ancient: { emoji: '⬜', text: 'ANCIENT', color: '#999999' }
  },

  // Time windows in minutes
  timeWindows: {
    '30m': 30,
    '1h': 60,
    '2h': 120,
    '3h': 180,
    '6h': 360,
    '12h': 720,
    '24h': 1440,
    'all': Infinity,
    'custom': null // User-defined
  },

  // Score decay rate
  decayRate: 0.5 // How quickly scores decrease over time
};

// ============================================
// UI Configuration
// ============================================
const UI_CONFIG = {
  // Filter bar position and appearance
  filterBar: {
    position: 'top',
    height: '48px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    darkModeBackground: 'rgba(30, 30, 30, 0.95)',
    backdropBlur: '10px',
    zIndex: 1000,
    padding: '8px 16px'
  },

  // Dashboard widget
  dashboard: {
    width: '320px',
    position: 'bottom-right',
    zIndex: 999,
    collapsible: true,
    draggable: true,
    updateInterval: 500 // ms
  },

  // Animations
  animations: {
    pulseInterval: 2000, // ms
    transitionDuration: 300, // ms
    highlightFadeDuration: 200 // ms
  },

  // Colors (will be overridden by theme)
  colors: {
    light: {
      background: '#ffffff',
      text: '#000000',
      border: '#e5e5e5',
      accent: '#0a66c2',
      hover: '#f2f2f2'
    },
    dark: {
      background: '#1e1e1e',
      text: '#ffffff',
      border: '#404040',
      accent: '#0a66c2',
      hover: '#2a2a2a'
    }
  }
};

// ============================================
// Storage Keys
// ============================================
const STORAGE_KEYS = {
  selectedFilter: 'selectedFilter',
  customMinutes: 'customMinutes',
  theme: 'theme',
  panelPosition: 'panelPosition',
  collapsedState: 'collapsedState',
  enableAutoScan: 'enableAutoScan',
  presets: 'presets',
  lastScanTime: 'lastScanTime',
  jobsCache: 'jobsCache'
};

// ============================================
// Default Settings
// ============================================
const DEFAULT_SETTINGS = {
  selectedFilter: '2h',
  customMinutes: 60,
  theme: 'dark',
  panelPosition: 'bottom-right',
  collapsedState: false,
  enableAutoScan: true,
  presets: {
    superFresh: 30,
    competitive: 120,
    todayOnly: 1440
  }
};

// ============================================
// Presets
// ============================================
const FILTER_PRESETS = {
  superFresh: {
    name: '🔥 Super Fresh',
    minutes: 30,
    description: 'Posted in last 30 minutes'
  },
  competitive: {
    name: '⚡ Competitive',
    minutes: 120,
    description: 'Posted in last 2 hours'
  },
  todayOnly: {
    name: '🟢 Today Only',
    minutes: 1440,
    description: 'Posted today'
  },
  recent: {
    name: '🟡 Recent',
    minutes: 360,
    description: 'Posted in last 6 hours'
  },
  all: {
    name: '📋 All Jobs',
    minutes: Infinity,
    description: 'Show all jobs'
  }
};

// ============================================
// Keyboard Shortcuts
// ============================================
const SHORTCUTS = {
  toggleDashboard: 'Ctrl+Shift+L',
  resetFilters: 'Ctrl+Shift+R',
  toggleTheme: 'Ctrl+Shift+T'
};

// ============================================
// Error Messages
// ============================================
const ERRORS = {
  noJobsFound: 'No jobs found on this page. Try scrolling or refreshing.',
  invalidTimeFormat: 'Could not parse job posting time.',
  storageError: 'Failed to save settings. Please try again.',
  selectionError: 'Could not select job element.'
};

// ============================================
// Log Levels
// ============================================
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SELECTORS,
    TIME_REGEX,
    FRESHNESS_CONFIG,
    UI_CONFIG,
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    FILTER_PRESETS,
    SHORTCUTS,
    ERRORS,
    LOG_LEVELS
  };
}
