// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Background script for Cache Killer extension
const DEBUG = true; // Set to false to disable debug logs

let isEnabled = false;
let mode = 'all';
let urls = [];

// Rule ID for declarativeNetRequest
const CACHE_KILLER_RULE_ID = 1;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Cache Killer Debug]', ...args);
  }
}

// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  debugLog('Extension installed/updated');
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
    debugLog('Storage changed:', changes);
    
    if (changes.cacheKillerEnabled) {
      isEnabled = changes.cacheKillerEnabled.newValue;
      debugLog('Extension enabled changed to:', isEnabled);
      updateIcon(isEnabled);
      
      if (isEnabled) {
        enableCacheKilling();
      } else {
        disableCacheKilling();
      }
    }
    
    if (changes.cacheKillerMode) {
      mode = changes.cacheKillerMode.newValue;
      debugLog('Mode changed to:', mode);
      // Update rules when mode changes
      if (isEnabled) {
        updateCacheKillingRules();
        updateIcon(true);
      }
    }
    
    if (changes.cacheKillerUrls) {
      urls = changes.cacheKillerUrls.newValue || [];
      debugLog('URLs changed to:', urls);
      // Update rules when URLs change
      if (isEnabled) {
        updateCacheKillingRules();
      }
    }
  }
});

// Load initial state
chrome.storage.local.get(['cacheKillerEnabled', 'cacheKillerMode', 'cacheKillerUrls'], (result) => {
  isEnabled = result.cacheKillerEnabled || false;
  mode = result.cacheKillerMode || 'all';
  urls = result.cacheKillerUrls || [];
  
  debugLog('Initial state loaded:', { isEnabled, mode, urls });
  
  updateIcon(isEnabled);
  
  if (isEnabled) {
    enableCacheKilling();
  }
});

function enableCacheKilling() {
  debugLog('Enabling cache killing...');
  // Use declarativeNetRequest API to modify headers
  updateCacheKillingRules();
  
  // Also clear cache periodically (as backup)
  startCacheClearing();
}

function disableCacheKilling() {
  // Remove all declarativeNetRequest rules
  const ruleIdsToRemove = [];
  for (let i = 1; i <= 100; i++) { // Remove up to 100 rules
    ruleIdsToRemove.push(i);
  }
  
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIdsToRemove
  });
  
  // Stop cache clearing
  stopCacheClearing();
}

function updateCacheKillingRules() {
  debugLog('Updating cache killing rules for mode:', mode, 'with URLs:', urls);
  
  // Remove all existing cache killer rules (we'll use multiple rule IDs)
  const ruleIdsToRemove = [];
  for (let i = 1; i <= 100; i++) { // Remove up to 100 rules
    ruleIdsToRemove.push(i);
  }
  
  const newRules = createCacheKillerRules();
  debugLog('Creating rules:', newRules);
  
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIdsToRemove,
    addRules: newRules
  }).then(() => {
    debugLog('Rules updated successfully');
  }).catch((error) => {
    debugLog('Error updating rules:', error);
  });
}

function createCacheKillerRules() {
  const rules = [];
  
  debugLog('Creating rules for mode:', mode, 'URLs:', urls);
  
  if (mode === 'inclusive' && urls.length > 0) {
    // Create a rule for each URL pattern in inclusive mode
    urls.forEach((pattern, index) => {
      const rule = createBaseCacheKillerRule(index + 1);
      
      // Convert wildcard pattern to declarativeNetRequest format
      if (pattern.includes('*')) {
        rule.condition.urlFilter = pattern;
        debugLog(`Rule ${index + 1} for pattern "${pattern}": urlFilter = "${pattern}"`);
      } else {
        // For exact matches, ensure we match the full domain
        rule.condition.urlFilter = `*${pattern}*`;
        debugLog(`Rule ${index + 1} for pattern "${pattern}": urlFilter = "*${pattern}*"`);
      }
      
      rules.push(rule);
    });
  } else {
    // For 'all' or 'exclusive' mode, create one rule that applies to all URLs
    const rule = createBaseCacheKillerRule(1);
    rule.condition.urlFilter = "*";
    debugLog('Rule 1 for mode:', mode, 'urlFilter = "*"');
    rules.push(rule);
  }
  
  debugLog('Total rules created:', rules.length);
  return rules;
}

function createBaseCacheKillerRule(ruleId) {
  return {
    id: ruleId,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: "Cache-Control", operation: "set", value: "no-cache, no-store, must-revalidate" },
        { header: "Pragma", operation: "set", value: "no-cache" },
        { header: "Expires", operation: "set", value: "0" },
        { header: "If-Modified-Since", operation: "remove" },
        { header: "If-None-Match", operation: "remove" }
      ]
    },
    condition: {
      resourceTypes: ["main_frame", "sub_frame", "script", "stylesheet", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"]
    }
  };
}

function shouldProcessUrl(url) {
  debugLog('Checking shouldProcessUrl for:', url, 'mode:', mode, 'urls:', urls);
  
  if (mode === 'all') {
    debugLog('Mode is "all", returning true');
    return true;
  }
  
  const matches = urls.some(pattern => {
    const result = matchesPattern(url, pattern);
    debugLog(`Pattern "${pattern}" matches "${url}":`, result);
    return result;
  });
  
  debugLog('Any pattern matches:', matches);
  
  if (mode === 'inclusive') {
    debugLog('Mode is "inclusive", returning:', matches);
    return matches; // Only process if URL matches the include list
  } else if (mode === 'exclusive') {
    debugLog('Mode is "exclusive", returning:', !matches);
    return !matches; // Only process if URL does NOT match the exclude list
  }
  
  debugLog('Default fallback, returning true');
  return true; // Default fallback
}

function matchesPattern(url, pattern) {
  debugLog(`matchesPattern: checking "${url}" against pattern "${pattern}"`);
  
  // Convert pattern to regex
  // Escape special regex characters except * and ?
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  debugLog(`Escaped pattern: "${escapedPattern}"`);
  
  const regex = new RegExp('^' + escapedPattern + '$', 'i');
  const result = regex.test(url);
  
  debugLog(`Regex test result: ${result}`);
  return result;
}

// Function to check if cache killer is active for a given URL
// This can be called from popup to show current page status
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkPageStatus') {
    debugLog('Checking page status for URL:', request.url);
    debugLog('Current state - isEnabled:', isEnabled, 'mode:', mode, 'urls:', urls);
    
    const isActive = isEnabled && shouldProcessUrl(request.url);
    const response = {
      isActive: isActive,
      isEnabled: isEnabled,
      mode: mode,
      urlMatches: isEnabled ? shouldProcessUrl(request.url) : false
    };
    
    debugLog('Sending response:', response);
    sendResponse(response);
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
