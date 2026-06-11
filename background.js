/**
 * Background Service Worker for LinkedIn Fresh Jobs Intelligence
 * Handles extension lifecycle, messaging, and background tasks
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[LinkedIn Fresh Jobs] Extension installed');
    // Open welcome page or settings
    chrome.tabs.create({ url: 'chrome://extensions/?id=' + chrome.runtime.id });
  } else if (details.reason === 'update') {
    console.log('[LinkedIn Fresh Jobs] Extension updated');
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message);

  if (message.type === 'SCAN_PAGE') {
    // Request from content script to scan page
    sendResponse({ success: true, message: 'Scan started' });
  } else if (message.type === 'GET_SETTINGS') {
    // Request for settings
    chrome.storage.sync.get(null, (settings) => {
      sendResponse({ settings });
    });
    return true; // Will respond asynchronously
  } else if (message.type === 'SAVE_SETTINGS') {
    // Save settings
    chrome.storage.sync.set(message.data, () => {
      sendResponse({ success: true });
    });
    return true; // Will respond asynchronously
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('linkedin.com/jobs')) {
    console.log('[Background] LinkedIn Jobs page loaded:', tab.url);
    // Optional: Send notification to content script
  }
});

console.log('[LinkedIn Fresh Jobs] Background service worker loaded');
