# Quick Start Guide - LinkedIn Fresh Jobs Intelligence 🚀

Get the extension running in **5 minutes**!

---

## ⚡ Installation (5 min)

### 1️⃣ Get the Files
```bash
# Option A: Clone with Git
git clone https://github.com/yourusername/linkedin-fresh-jobs.git
cd linkedin-fresh-jobs

# Option B: Download ZIP and extract
# Download from: https://github.com/yourusername/linkedin-fresh-jobs/archive/main.zip
```

### 2️⃣ Open Chrome Extensions
```
Chrome Menu (⋮) → More tools → Extensions
OR
chrome://extensions/
```

### 3️⃣ Enable Developer Mode
- Toggle **Developer mode** (top-right)
- Blue buttons should appear

### 4️⃣ Load Extension
- Click **Load unpacked**
- Select the extension folder
- Click **Open**

### 5️⃣ Verify Installation ✅
- Go to: https://www.linkedin.com/jobs/search/
- You should see:
  - 🎯 Filter bar at the top
  - 📊 Dashboard widget (bottom-right)
  - 🟦 Colored job cards

---

## 🎯 First Use

### Click a Filter Button
```
Top filter bar:
🔥 Super Fresh (30m)  |  ⚡ Competitive (2h)  |  🟢 Today (24h)  |  📋 All
```

### Watch Jobs Filter
- Fresh jobs show with colored highlights
- Stale jobs hide or fade out
- Dashboard shows live counts

### Read the Badges
```
🔥 VERY HOT     ← Posted < 5 minutes ago
⚡ HOT          ← Posted < 30 minutes ago  
🟢 FRESH        ← Posted < 2 hours ago
🟡 RECENT       ← Posted < 24 hours ago
🔴 STALE        ← Posted > 24 hours ago
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+L` | Toggle Dashboard |
| `Ctrl+Shift+R` | Reset Filters |
| `Ctrl+Shift+T` | Toggle Dark Mode |

*Mac users: Replace `Ctrl` with `Cmd`*

---

## 🎮 Main Controls

### Filter Bar (Top)
- **🔍 Fresh Jobs** - Extension title
- **30m, 1h, 2h, 3h, 6h, 12h, 24h** - Quick presets
- **all** - Show all jobs
- **custom** - Set custom time
- **⚙️** - Settings (future use)

### Dashboard (Bottom-Right)
- **Drag header** to move widget
- **×** button to close
- Shows statistics:
  - Total jobs found
  - Filtered count
  - Hot jobs count
  - Fresh jobs count
  - Newest & oldest job ages

### Popup Menu
- Click extension icon → Popup appears
- Quick presets
- Statistics
- Settings (Theme, Position, Auto-scan)
- Keyboard shortcuts reference

---

## 🔧 Settings

### Theme
- **Dark** - Modern dark UI (default)
- **Light** - Clean light theme
- **Auto** - Follows system preference

### Panel Position
- **Bottom-right** (default)
- **Bottom-left**
- **Top-right**
- **Top-left**

### Auto Scan
- ✅ On (default) - Auto-detect new jobs
- ❌ Off - Manual refresh only

### Custom Time
- Set any time in minutes
- Example: Enter "45" for 45 minutes ago
- Click "Apply" to activate

---

## 🚨 Troubleshooting

### Nothing appears on LinkedIn
```
Solution: Hard refresh
- Windows: Ctrl+Shift+R
- Mac: Cmd+Shift+R
```

### Filter bar is missing
```
Solution: Refresh extension
- Go to chrome://extensions/
- Click ↻ (Refresh) button
- Go back to LinkedIn jobs page
```

### Dashboard is off-screen
```
Solution: Drag it back
- Click and drag the dashboard header
- Or open Settings → Panel Position
```

### Jobs aren't filtering
```
Solutions:
1. Click a filter button again
2. Scroll to load more jobs
3. Hard refresh the page
4. Check console (F12 → Console)
```

### Freshness seems wrong
```
Possible causes:
- LinkedIn changed timestamp format
- Job timestamp is ambiguous
- Browser time is incorrect
Check: Settings → Refresh browser time
```

---

## 📊 What Each Badge Means

```
🔥 VERY HOT
└─ Newest opportunity! Posted 0-5 min ago
   └─ Check immediately - highest competition

⚡ HOT
└─ Very fresh posting! Posted 5-30 min ago
   └─ Apply soon - less competition than VERY HOT

🟢 FRESH
└─ Recently posted! Posted 30min-2 hours ago
   └─ Good opportunity, still fresh

🟡 RECENT  
└─ Posted today! Posted 2-24 hours ago
   └─ Worth reviewing, may have less competition

🔴 STALE
└─ Older posting! Posted > 24 hours ago
   └─ Already widespread, harder to stand out

⬜ ANCIENT
└─ Very old posting! Posted > 1 week ago
   └─ Likely already filled
```

---

## 💡 Pro Tips

### Speed Up Job Discovery
1. Use **🔥 Super Fresh** filter first
2. Scroll down slowly to let jobs load
3. Watch the dashboard count increase
4. When slowing down, try next filter

### Smart Filtering Strategy
- **Morning**: Use 🔥 Super Fresh (catch overnight posts)
- **Afternoon**: Use ⚡ Competitive (check last 2 hours)
- **Evening**: Use 🟢 Today (review full day of posts)
- **Long sessions**: Use 📋 All (see everything)

### Mass Apply Workflow
1. Filter to 🔥 Super Fresh
2. Apply to top 3-5 jobs
3. Wait 30 seconds
4. Refresh (F5) to see new posts
5. Repeat

### Research Companies
- Use ⚡ Competitive filter
- Scroll down to group jobs by company
- See how many roles each company opened

---

## 🐛 Debug Console

### Open Developer Tools
```
F12 or Ctrl+Shift+I
```

### View Extension Logs
```
Console tab → Look for:
[LinkedIn Fresh Jobs]   ← Main logs
[DEBUG]                 ← Detailed logs
[ERROR]                 ← Errors
```

### Access Extension API
```javascript
// In console, you can access:
window.__linkedInFreshJobs.manager
window.__linkedInFreshJobs.jobScanner
window.__linkedInFreshJobs.filterEngine

// Example: Get all scanned jobs
window.__linkedInFreshJobs.jobScanner.getCachedJobs()

// Get current state
window.__linkedInFreshJobs.manager.getState()

// Force scan
window.__linkedInFreshJobs.manager.performScan()
```

---

## ✨ Next Steps

1. ✅ Installation complete!
2. 🎯 Try each filter preset
3. 💾 Customize theme/position in Settings
4. ⌨️ Learn keyboard shortcuts
5. 🚀 Start finding fresh jobs!

---

## ❓ Common Questions

**Q: Does this slow down LinkedIn?**
A: No. Uses debouncing and efficient selectors. Minimal CPU impact.

**Q: Is my data safe?**
A: 100% safe. Zero external connections. All processing local.

**Q: Will it work after LinkedIn updates?**
A: Yes. Multiple fallback selectors handle changes.

**Q: Can I uninstall it anytime?**
A: Yes. Remove from chrome://extensions/. No residue left.

**Q: Can I use this with other extensions?**
A: Yes. Fully compatible with other Chrome extensions.

---

## 🎉 You're Ready!

**Next step:** Go to LinkedIn Jobs and try it out!

```
https://www.linkedin.com/jobs/search/?keywords=your+desired+job
```

---

## 📞 Need Help?

1. **Check README.md** - Full documentation
2. **Check INSTALLATION.md** - Detailed setup guide
3. **Open console** - F12 → Console for error messages
4. **Try hard refresh** - Ctrl+Shift+R

---

**Happy job hunting! 🚀**

*Built to help you find opportunities faster*
