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
    '.job-card-container',
    '.jobs-search-results__list-item',
    'div.base-card.job-search-card',
    '.base-search-card',
    '[data-job-id]',
    '[data-entity-urn*="jobPosting"]'
  ],

  // Posted time text - multiple variations (time tag is key in MV3/modern LinkedIn)
  timeText: [
    'time',
    '.job-card-list__footer-item',
    '.job-card-container__footer-item',
    '.job-card-container__metadata-item',
    '.job-search-card__listdate',
    '.job-result-card__listdate',
    '[class*="listdate"]',
    '[class*="footer-item"]',
    '.job-search-card__metadata-item:first-child',
    '[data-public-jobs-feed-item-posted-time]',
    '[aria-label*="ago"]',
    '.metadata-entry--highlight',
    'span[data-posted-time]',
    '.description[data-tooltip]'
  ],

  // Job title
  jobTitle: [
    '.job-card-list__title',
    '.job-card-container__link',
    '.base-search-card__title',
    '[data-job-card-container-headline]',
    'h3[dir="ltr"]',
    '.job-search-card__title'
  ],

  // Company name
  companyName: [
    '.job-card-container__company-name',
    '.job-card-container__primary-description',
    '.job-card-container__company-link',
    '.base-search-card__subtitle',
    '.job-search-card__company-name',
    '[data-job-card-container-company-name]',
    '.company-name'
  ],

  // Job location
  location: [
    '.job-card-container__metadata-item',
    '.job-card-container__metadata-wrapper',
    '.job-search-card__location',
    '[data-job-card-container-location]',
    '.location'
  ],

  // Results container
  resultsContainer: [
    'ul.scaffold-layout__list-container',
    'ul.jobs-search-results__list',
    '.jobs-search-results__list-item',
    '[data-jobs-search-results__container-id]',
    '.base-card'
  ],

  // Job feed container
  feedContainer: [
    '.jobs-search-results-list',
    '.jobs-search-results',
    '.jobs-search__results-list',
    '[data-jobs-search-results__container-id]',
    '[aria-label*="job"]',
    'main'
  ]
};

// ============================================
// Time Parsing Regex Patterns
// ============================================
const TIME_REGEX = {
  // "Just now", "now", "posted now", "just posted", "just published"
  justNow: /just\s+now|^now$|posted\s+now|just\s+posted|just\s+published/i,

  // "X seconds ago" / "Xs"
  seconds: /(\d+)\s*(?:secs?|seconds?|s)\b(?:\s+ago)?/i,
  
  // "X minutes ago" / "Xm"
  minutes: /(\d+)\s*(?:mins?|minutes?|m)\b(?:\s+ago)?/i,
  
  // "X hours ago" / "Xh"
  hours: /(\d+)\s*(?:hrs?|hours?|h)\b(?:\s+ago)?/i,
  
  // "X days ago" / "Xd"
  days: /(\d+)\s*(?:days?|d)\b(?:\s+ago)?/i,
  
  // "X weeks ago" / "Xw"
  weeks: /(\d+)\s*(?:weeks?|w)\b(?:\s+ago)?/i,

  // "X months ago" / "Xmo"
  months: /(\d+)\s*(?:months?|mo)\b(?:\s+ago)?/i,

  // "X years ago" / "Xy"
  years: /(\d+)\s*(?:years?|y)\b(?:\s+ago)?/i,
  
  // "Just hired" or "Actively hiring"
  activelyHiring: /actively\s+hiring|just\s+hired|urgently\s+hiring/i,
  
  // "Reposted" or "Promoted"
  reposted: /reposted|promoted/i,
  
  // Specific dates (fallback)
  specificDate: /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,
  
  // LinkedIn specific patterns
  linkedinPatterns: /(\d+)\s*(second|minute|hour|day|week|m|h|d|w)s?\s+ago/i
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
  activeRangeId: 'activeRangeId',
  activeRange: 'activeRange',
  theme: 'theme',
  panelPosition: 'panelPosition',
  collapsedState: 'collapsedState',
  enableAutoScan: 'enableAutoScan',
  lastScanTime: 'lastScanTime',
  jobsCache: 'jobsCache'
};

// ============================================
// Default Settings
// ============================================
const DEFAULT_SETTINGS = {
  activeRangeId: null,
  activeRange: null,
  theme: 'dark',
  panelPosition: 'bottom-right',
  collapsedState: false,
  enableAutoScan: true
};

// ============================================
// Presets
// ============================================
const TIME_RANGE_FILTERS = [
  {
    id: "now",
    label: "Now",
    minMinutes: 0,
    maxMinutes: 1,
    description: "Just published jobs"
  },
  {
    id: "0-10",
    label: "0–10 min",
    minMinutes: 0,
    maxMinutes: 10
  },
  {
    id: "10-30",
    label: "10–30 min",
    minMinutes: 10,
    maxMinutes: 30
  },
  {
    id: "30-60",
    label: "30–60 min",
    minMinutes: 30,
    maxMinutes: 60
  },
  {
    id: "60-120",
    label: "1–2 h",
    minMinutes: 60,
    maxMinutes: 120,
    description: "Posted 1 to 2 hours ago"
  },
  {
    id: "120-180",
    label: "2–3 h",
    minMinutes: 120,
    maxMinutes: 180,
    description: "Posted 2 to 3 hours ago"
  }
];

// Keep FILTER_PRESETS for backward compatibility but redirect to new range presets where needed
const FILTER_PRESETS = TIME_RANGE_FILTERS.reduce((acc, current) => {
  acc[current.id] = {
    name: current.label,
    minutes: current.maxMinutes,
    minMinutes: current.minMinutes,
    description: current.description || `${current.label} timeframe`
  };
  return acc;
}, {});

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
    TIME_RANGE_FILTERS,
    SHORTCUTS,
    ERRORS,
    LOG_LEVELS
  };
}
