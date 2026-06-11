# LinkedIn Fresh Jobs Intelligence 🔍

A powerful Chrome Extension that transforms LinkedIn Jobs into a real-time job freshness dashboard. Filter jobs by how recently they were posted and spot opportunities at a glance.

## Features ⭐

### Core Features
- **Real-time Freshness Filtering**: Filter jobs by posting time (30m, 1h, 2h, 3h, 6h, 12h, 24h, or custom)
- **Intelligent Job Detection**: Automatically scans LinkedIn jobs pages and detects new postings
- **Visual Freshness Indicators**: Color-coded badges showing job freshness (🔥 Very Hot, ⚡ Hot, 🟢 Fresh, 🟡 Recent, 🔴 Stale)
- **Floating Dashboard**: Real-time statistics widget with job counts, freshness distribution, and more
- **Smart Observers**: Uses MutationObserver & IntersectionObserver for real-time detection as you scroll
- **Dark Mode**: Modern dark UI that follows your system preferences
- **Privacy-First**: 100% browser-side processing - zero external API calls or data collection

### Advanced Features
- **Quick Presets**: One-click filters for common scenarios (Super Fresh, Competitive, Today Only)
- **Custom Time Filters**: Set any custom time window in minutes
- **Intelligent Scoring**: Non-linear freshness scoring algorithm that prioritizes new jobs
- **Duplicate Detection**: Identifies repeat job postings from the same company
- **Job Grouping**: Group jobs by company, location, or seniority level
- **Keyboard Shortcuts**: Fast navigation with customizable keyboard commands
- **Persistent Settings**: Your preferences are saved across sessions

## Installation 📦

### Method 1: Manual Installation (For Development)

1. **Download the Extension**
   - Clone or download this repository
   - Extract the files to a folder on your computer

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer Mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the extension folder
   - The extension should now appear in your extensions list

3. **Verify Installation**
   - Navigate to any LinkedIn Jobs page
   - Look for the filter bar at the top with freshness options
   - Click the extension icon to open the popup menu

### Method 2: From Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store for easy one-click installation.

## Usage Guide 🚀

### Getting Started

1. **Navigate to LinkedIn Jobs**
   - Go to https://www.linkedin.com/jobs/search/?keywords=your+keyword
   - The extension automatically initializes on any LinkedIn jobs page

2. **Use Filter Bar**
   - Click any preset button (🔥 Super Fresh, ⚡ Competitive, etc.)
   - Or select a custom time window
   - Jobs are instantly filtered to show only those posted within your selected timeframe

3. **Read the Dashboard**
   - Located in bottom-right corner (draggable)
   - Shows total jobs, filtered count, and freshness distribution
   - Updates in real-time as you scroll and filter

### Keyboard Shortcuts

- `Ctrl + Shift + L` - Toggle Dashboard visibility
- `Ctrl + Shift + R` - Reset all filters
- `Ctrl + Shift + T` - Toggle dark/light theme

### Quick Tips

- **Very Hot (🔥)**: Jobs posted < 5 minutes ago - highest priority!
- **Hot (⚡)**: Jobs posted < 30 minutes ago - very fresh
- **Fresh (🟢)**: Jobs posted < 2 hours ago - good opportunities
- **Recent (🟡)**: Jobs posted < 24 hours ago - consider checking
- **Stale (🔴)**: Jobs posted > 24 hours ago - older postings
- Hover over job cards to see exact posting time
- Use "Actively Hiring" filter for newly opened positions

## File Structure 📁

```
linkedin-fresh-jobs/
├── manifest.json              # Extension manifest (Manifest V3)
├── background.js              # Background service worker
├── content/
│   ├── content.js            # Main orchestrator
│   ├── parser.js             # Time parsing engine
│   ├── filters.js            # Freshness scoring & filtering
│   ├── scanner.js            # DOM job card detection
│   ├── observers.js          # Real-time change detection
│   ├── ui.js                 # UI injection & management
│   ├── dashboard.js          # Statistics widget
│   └── styles.css            # Content script styles
├── popup/
│   ├── popup.html            # Popup UI
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── utils/
│   ├── constants.js          # Configuration & selectors
│   ├── logger.js             # Logging utility
│   ├── helpers.js            # DOM & utility helpers
│   └── storage.js            # Chrome storage API wrapper
└── README.md                 # This file
```

## Technical Details 🔧

### Architecture

The extension uses a modular architecture with clear separation of concerns:

- **Parser** (`parser.js`): Converts LinkedIn timestamp text to minutes elapsed
- **Filter Engine** (`filters.js`): Calculates freshness scores and filtering logic
- **Scanner** (`scanner.js`): Detects job cards and extracts job data
- **Observers** (`observers.js`): Watches for new jobs and visibility changes
- **UI Manager** (`ui.js`): Injects and manages extension UI
- **Dashboard** (`dashboard.js`): Floating statistics panel

### Time Parsing

The parser handles various LinkedIn timestamp formats:
- "Just now" → 0 minutes
- "3 minutes ago" → 3 minutes
- "2 hours ago" → 120 minutes
- "1 day ago" → 1440 minutes
- "Actively hiring" → 15 minutes (estimated)
- Special patterns like "Reposted" and "Promoted"

### Freshness Scoring

Non-linear scoring algorithm:
- 0-5 min: 100 points (🔥 Very Hot)
- 5-30 min: 70-100 points (⚡ Hot)
- 30 min-2h: 50-70 points (🟢 Fresh)
- 2-24h: 20-50 points (🟡 Recent)
- 1-7 days: 5-20 points (🔴 Stale)
- 7+ days: 0-5 points (⬜ Ancient)

### Performance Optimizations

- **Debounced Scanning** (300ms) - Prevents excessive re-analysis
- **DOM Caching** - Remembers scanned job cards to avoid re-parsing
- **Weak Set Tracking** - Efficiently tracks highlighted elements
- **Efficient Selectors** - Multiple selector fallbacks for LinkedIn's dynamic classes
- **Batch DOM Updates** - Groups style changes to minimize reflows
- **RequestAnimationFrame** - Smooth animations without jank

## Privacy & Security 🔒

✅ **Zero External API Calls** - All processing happens locally in your browser
✅ **No Data Collection** - We don't track, log, or transmit your data
✅ **No Ads or Analytics** - Clean, ad-free experience
✅ **No Network Requests** - Extension works entirely offline
✅ **Chrome Storage Only** - Settings saved only on your machine
✅ **Open Source** - Code is transparent and auditable

## Debugging 🐛

### Enable Debug Mode

The extension logs extensively to the browser console. Open DevTools (`F12`) while on a LinkedIn jobs page and check the console for:

```javascript
// Access extension internals
window.__linkedInFreshJobs.manager
window.__linkedInFreshJobs.logger
window.__linkedInFreshJobs.jobScanner
window.__linkedInFreshJobs.filterEngine
```

### Common Issues

**Problem**: Filter bar doesn't appear
- **Solution**: Refresh the page or hard refresh (Ctrl+Shift+R)

**Problem**: Jobs not detected
- **Solution**: Scroll down to load more jobs, or manually trigger refresh via popup

**Problem**: Freshness scores seem off
- **Solution**: Check browser console for parsing errors, LinkedIn may have changed timestamp format

**Problem**: Dashboard widget appears off-screen
- **Solution**: Drag it back into view or use the settings to reset position

## Compatibility 🌐

- **Browser**: Google Chrome/Chromium (version 90+)
- **OS**: Windows, Mac, Linux
- **LinkedIn**: Works on all LinkedIn jobs pages (search, saved, recommended, etc.)

## Limitations ⚠️

- LinkedIn limits how frequently pages update - some jobs may show as "X minutes ago" for several minutes
- The extension only sees jobs currently in the DOM - jobs that haven't scrolled into view may not be detected
- LinkedIn occasionally changes CSS class names, which may temporarily break selectors (we have fallbacks)
- Cannot access job details beyond what's visible on the search page

## Future Roadmap 🗺️

- [ ] Chrome Web Store publication
- [ ] Firefox extension support
- [ ] Alert system for matching jobs
- [ ] Saved job filtering
- [ ] Company watchlist
- [ ] Salary range filtering
- [ ] Remote/hybrid filtering
- [ ] Export job data
- [ ] Integration with job tracking apps

## Contributing 🤝

Contributions are welcome! Please:

1. Test thoroughly on actual LinkedIn jobs pages
2. Follow the existing code style and patterns
3. Add comments for complex logic
4. Test on different screen sizes
5. Verify dark mode works
6. Update README if adding features

## Troubleshooting 🔧

### Extension stops working after LinkedIn update
- LinkedIn occasionally changes CSS selectors
- We have multiple fallback selectors built in
- Check the console for errors: `F12 → Console tab`
- Try refreshing the page

### Performance is slow with 1000+ jobs
- The extension uses debouncing (300ms) to handle this
- Scroll more slowly to let jobs load gradually
- Try filtering to a narrower time window

### Storage issues
- Extension uses Chrome's sync storage (limited to ~100KB)
- Clear old data: Right-click extension → Options (if available)
- Or reset: `chrome.storage.sync.clear()` in console

## Support 💬

For issues or suggestions:
- Check the console for detailed error messages (`F12`)
- Look for similar issues in the repository
- Provide step-by-step reproduction instructions
- Include browser version and extension version

## License 📄

This extension is open source and available for personal use.

## Changelog 📝

### Version 1.0.0 (Initial Release)
- Core time parsing engine
- Freshness scoring algorithm
- Real-time job detection
- Filter bar UI
- Dashboard widget
- Popup interface
- Full keyboard shortcut support
- Dark mode support
- Comprehensive documentation

---

**Made with ❤️ for job seekers everywhere**

Happy job hunting! 🚀
