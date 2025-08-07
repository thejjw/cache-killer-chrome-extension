// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Background script for Cache Killer extension
let isEnabled = false;
let mode = 'all';
let urls = [];

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  // Set default state
  chrome.storage.local.set({ 
    cacheKillerEnabled: false,
    cacheKillerMode: 'all',
    cacheKillerUrls: []
  });
  updateIcon(false);
});

// Listen for storage changes to update state
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.cacheKillerEnabled) {
      isEnabled = changes.cacheKillerEnabled.newValue;
      updateIcon(isEnabled);
      
      if (isEnabled) {
        enableCacheKilling();
      } else {
        disableCacheKilling();
      }
    }
    
    if (changes.cacheKillerMode) {
      mode = changes.cacheKillerMode.newValue;
      // Update icon to reflect new mode
      if (isEnabled) {
        updateIcon(true);
      }
    }
    
    if (changes.cacheKillerUrls) {
      urls = changes.cacheKillerUrls.newValue || [];
    }
  }
});

// Load initial state
chrome.storage.local.get(['cacheKillerEnabled', 'cacheKillerMode', 'cacheKillerUrls'], (result) => {
  isEnabled = result.cacheKillerEnabled || false;
  mode = result.cacheKillerMode || 'all';
  urls = result.cacheKillerUrls || [];
  
  updateIcon(isEnabled);
  
  if (isEnabled) {
    enableCacheKilling();
  }
});

function enableCacheKilling() {
  // Method 1: Modify request headers to prevent caching
  chrome.webRequest.onBeforeSendHeaders.addListener(
    modifyRequestHeaders,
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"]
  );
  
  // Method 2: Clear cache periodically (as backup)
  startCacheClearing();
}

function disableCacheKilling() {
  // Remove the request header listener
  if (chrome.webRequest.onBeforeSendHeaders.hasListener(modifyRequestHeaders)) {
    chrome.webRequest.onBeforeSendHeaders.removeListener(modifyRequestHeaders);
  }
  
  // Stop cache clearing
  stopCacheClearing();
}

function modifyRequestHeaders(details) {
  if (!isEnabled) return;
  
  // Check if URL should be processed based on mode
  if (!shouldProcessUrl(details.url)) return;
  
  // Add no-cache headers to prevent caching
  const headers = details.requestHeaders || [];
  
  // Remove existing cache-related headers
  const filteredHeaders = headers.filter(header => 
    !['if-modified-since', 'if-none-match', 'cache-control'].includes(header.name.toLowerCase())
  );
  
  // Add no-cache headers
  filteredHeaders.push(
    { name: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
    { name: 'Pragma', value: 'no-cache' },
    { name: 'Expires', value: '0' }
  );
  
  return { requestHeaders: filteredHeaders };
}

function shouldProcessUrl(url) {
  if (mode === 'all') {
    return true;
  }
  
  const matches = urls.some(pattern => matchesPattern(url, pattern));
  
  if (mode === 'inclusive') {
    return matches; // Only process if URL matches the include list
  } else if (mode === 'exclusive') {
    return !matches; // Only process if URL does NOT match the exclude list
  }
  
  return true; // Default fallback
}

function matchesPattern(url, pattern) {
  // Convert pattern to regex
  // Escape special regex characters except * and ?
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  const regex = new RegExp('^' + escapedPattern + '$', 'i');
  return regex.test(url);
}

// Function to check if cache killer is active for a given URL
// This can be called from popup to show current page status
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkPageStatus') {
    const isActive = isEnabled && shouldProcessUrl(request.url);
    sendResponse({
      isActive: isActive,
      isEnabled: isEnabled,
      mode: mode,
      urlMatches: isEnabled ? shouldProcessUrl(request.url) : false
    });
  }
});

let cacheCleanInterval;

function startCacheClearing() {
  // Clear cache every 5 seconds when enabled
  cacheCleanInterval = setInterval(() => {
    if (isEnabled) {
      chrome.browsingData.removeCache({
        since: Date.now() - 1000 * 60 * 5 // Last 5 minutes
      });
    }
  }, 5000);
}

function stopCacheClearing() {
  if (cacheCleanInterval) {
    clearInterval(cacheCleanInterval);
    cacheCleanInterval = null;
  }
}

function updateIcon(enabled) {
  const iconPath = enabled ? {
    "16": "icons/icon16-active.png",
    "48": "icons/icon48-active.png", 
    "128": "icons/icon128-active.png"
  } : {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  };
  
  chrome.action.setIcon({ path: iconPath });
  
  // Set badge text with mode indicator
  let badgeText = '';
  if (enabled) {
    const modeIndicator = mode === 'all' ? 'A' : (mode === 'inclusive' ? 'I' : 'E');
    badgeText = `ON(${modeIndicator})`;
  }
  
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? '#ff4444' : '#000000' });
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  const result = await chrome.storage.local.get(['cacheKillerEnabled']);
  const currentState = result.cacheKillerEnabled || false;
  const newState = !currentState;
  
  await chrome.storage.local.set({ cacheKillerEnabled: newState });
  
  // Reload the active tab to apply changes immediately
  if (newState) {
    chrome.tabs.reload(tab.id, { bypassCache: true });
  }
});
