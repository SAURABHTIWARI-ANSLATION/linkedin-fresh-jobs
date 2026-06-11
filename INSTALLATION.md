# Installation Guide - LinkedIn Fresh Jobs Intelligence

## Quick Start (5 minutes)

### Step 1: Clone or Download
```bash
# Clone the repository
git clone https://github.com/yourusername/linkedin-fresh-jobs.git
cd linkedin-fresh-jobs

# Or download as ZIP and extract
# https://github.com/yourusername/linkedin-fresh-jobs/archive/refs/heads/main.zip
```

### Step 2: Open Chrome Extensions Page
1. Open **Google Chrome**
2. Click the **three dots menu** (⋮) in the top-right corner
3. Go to **More tools** → **Extensions**
4. Or navigate directly to: `chrome://extensions/`

### Step 3: Enable Developer Mode
- Toggle **Developer mode** (top-right corner)
- You should see blue buttons appear: "Load unpacked", "Pack extension", etc.

### Step 4: Load the Extension
1. Click **Load unpacked**
2. Navigate to the folder where you extracted the extension
3. Select the folder and click **Open**
4. ✅ The extension should now appear in your extensions list!

### Step 5: Verify Installation
1. Go to any LinkedIn Jobs page: https://www.linkedin.com/jobs/search/
2. You should see:
   - ✅ Filter bar at the top with preset buttons (🔥 Super Fresh, ⚡ Competitive, etc.)
   - ✅ Dashboard widget in bottom-right corner showing statistics
   - ✅ Purple/colored borders on fresh job cards
   - ✅ Freshness badges on each job (e.g., "🔥 VERY HOT", "⚡ HOT")
3. Click a filter button to test - jobs should instantly hide/show

## Troubleshooting Installation

### "Failed to load extension"
**Problem**: Error message when trying to load unpacked extension

**Solutions**:
1. Check that you selected the correct folder (should contain `manifest.json`)
2. Ensure `manifest.json` is valid JSON:
   - Open `manifest.json` in a text editor
   - Check for syntax errors (missing commas, quotes, brackets)
3. Try restarting Chrome completely
4. Check the console for specific errors (click on "Details")

### Extension appears but doesn't work on LinkedIn
**Problem**: You see the extension in your list, but nothing appears on LinkedIn

**Solutions**:
1. **Refresh the page**: Hard refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Check the console**:
   - Open DevTools: `F12` or `Ctrl+Shift+I`
   - Go to **Console** tab
   - Look for red errors starting with `[LinkedIn Fresh Jobs]`
3. **Verify you're on a jobs page**: Extension only works on `/jobs/` pages
4. **Check extension is enabled**: 
   - Go to `chrome://extensions/`
   - Ensure toggle switch is ON (blue) next to the extension

### Filter bar doesn't appear
**Problem**: You don't see the purple filter bar at the top of LinkedIn

**Solutions**:
1. Refresh the page: `F5` or `Ctrl+R`
2. Hard refresh to clear cache: `Ctrl+Shift+R`
3. Check DevTools console for errors: `F12 → Console`
4. Try a different LinkedIn jobs search: https://www.linkedin.com/jobs/search/

### Dashboard widget missing
**Problem**: No stats panel in bottom-right corner

**Solutions**:
1. It might be off-screen - check bottom-right corner carefully
2. Scroll down to load more jobs (dashboard updates when jobs are found)
3. Try clicking a filter button to trigger a scan
4. Check console for JavaScript errors

### "Content Security Policy" errors
**Problem**: Console shows CSP-related errors

**Solutions**:
1. These are expected and shouldn't affect functionality
2. The extension only uses inline scripts and styles
3. If the extension doesn't work, check for other errors in console

## Development & Testing

### Running Tests
```bash
# Open the browser console on any LinkedIn jobs page
F12  # or Ctrl+Shift+I

# You can interact with the extension directly:
window.__linkedInFreshJobs.manager.getState()
window.__linkedInFreshJobs.jobScanner.scanAllJobs()
window.__linkedInFreshJobs.filterEngine.calculateFreshnessScore(15)
window.__linkedInFreshJobs.logger.info('Test message')
```

### Debugging Console Output
The extension logs extensively. Filter logs by module:

```javascript
// In console, search for:
[LinkedIn Fresh Jobs]  // Main logs
[Background]           // Background worker logs
[DEBUG]                // Debug-level logs
[ERROR]                // Error logs

// Click filter icon in console to filter by text
```

### Making Changes

1. Edit the source files (`.js`, `.css`, `.html`)
2. Go to `chrome://extensions/`
3. Click the **↻ Refresh** button next to the extension
4. Refresh your LinkedIn job page: `Ctrl+R`
5. Changes should take effect immediately

## Advanced Setup

### Using Version Control

```bash
# Clone with git
git clone https://github.com/yourusername/linkedin-fresh-jobs.git

# Create a branch for your changes
git checkout -b feature/my-improvement

# Make changes, test, then:
git add .
git commit -m "Add my improvement"
git push origin feature/my-improvement

# Create a Pull Request on GitHub
```

### Building for Distribution

```bash
# Create a ZIP file for distribution
# Windows:
cd .. && tar -a -c -f linkedin-fresh-jobs.zip linkedin-fresh-jobs/

# Mac/Linux:
cd .. && zip -r linkedin-fresh-jobs.zip linkedin-fresh-jobs/ \
  -x "linkedin-fresh-jobs/.git/*" \
  -x "linkedin-fresh-jobs/.next/*" \
  -x "linkedin-fresh-jobs/node_modules/*"

# Now you can upload linkedin-fresh-jobs.zip to Chrome Web Store
```

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "LinkedIn Fresh Jobs Intelligence"
3. Click the **Remove** button
4. Confirm the removal
5. ✅ The extension is uninstalled

## Getting Help

### Check These First
1. **README.md** - General usage and troubleshooting
2. **Browser Console** - `F12 → Console tab` for error messages
3. **LinkedIn Page Source** - Check if LinkedIn's HTML changed

### Debug Steps
1. Open any LinkedIn jobs page
2. Open DevTools: `F12`
3. Go to **Console** tab
4. Filter messages by searching for errors
5. Post the error message + steps to reproduce in an issue

### Common Error Messages

**"Cannot find selector"**
- LinkedIn changed their HTML structure
- The extension has fallback selectors
- Try refreshing the page

**"Failed to get storage"**
- Chrome storage API not accessible
- Try restarting Chrome
- Check if extension has storage permission (it should)

**"Page not recognized"**
- Make sure you're on a LinkedIn jobs page
- Check the URL contains `/jobs/`

## Next Steps

After successful installation:
1. **Try the presets**: Click 🔥 Super Fresh to see jobs from last 30 minutes
2. **Drag the dashboard**: Click and drag to move the stats panel
3. **Use keyboard shortcuts**: `Ctrl+Shift+L` toggles the dashboard
4. **Visit the popup**: Click the extension icon to see more options
5. **Read the tips**: Hover over elements to see helpful tooltips

## Still Having Issues?

Please provide:
1. Chrome version: `chrome://version/`
2. Extension version: Check `chrome://extensions/`
3. Error message (copy from console)
4. Steps to reproduce
5. Screenshot if possible

---

**You're all set! Enjoy finding fresh job opportunities! 🚀**
