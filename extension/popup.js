// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Popup script for Cache Killer extension
const DEBUG = false; // Set to false to disable debug logs

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Cache Killer Popup Debug]', ...args);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const status = document.getElementById('status');
  const configureUrlsButton = document.getElementById('configureUrls');
  const urlCount = document.getElementById('urlCount');
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const pageStatus = document.getElementById('pageStatus');
  const periodicCacheClearingCheckbox = document.getElementById('periodicCacheClearing');
  const manualCacheClearButton = document.getElementById('manualCacheClear');
  const wildcardFallbackCheckbox = document.getElementById('wildcardFallbackAllCache');
  const advancedOptionsToggle = document.getElementById('advancedOptionsToggle');
  const advancedContent = document.getElementById('advancedContent');
  const toggleIcon = document.getElementById('toggleIcon');
  const periodicCacheTimeInput = document.getElementById('periodicCacheTime');
  const manualCacheTimeInput = document.getElementById('manualCacheTime');
  const resetAllSettingsButton = document.getElementById('resetAllSettings');
  
  // Load extension version and populate footer
  try {
    const manifest = chrome.runtime.getManifest();
    const versionSpan = document.getElementById('version');
    if (versionSpan && manifest.version) {
      versionSpan.textContent = `v${manifest.version}`;
    }
  } catch (error) {
    console.log('Could not load extension version:', error);
  }
  
  // Load current state
  const result = await chrome.storage.local.get([
    'cacheKillerEnabled', 
    'cacheKillerMode', 
    'cacheKillerDomains',
    'periodicCacheClearing',
    'wildcardFallbackAllCache',
    'periodicCacheTimeMinutes',
    'manualCacheTimeHours'
  ]);
  
  const isEnabled = result.cacheKillerEnabled || false;
  const mode = result.cacheKillerMode || 'all';
  const domains = result.cacheKillerDomains || [];
  const periodicClearing = result.periodicCacheClearing || false;
  const wildcardFallback = result.wildcardFallbackAllCache || false;
  const periodicCacheTime = result.periodicCacheTimeMinutes || 5;
  const manualCacheTime = result.manualCacheTimeHours || 24;
  
  debugLog('Popup loaded with state:', { isEnabled, mode, domains, periodicClearing, wildcardFallback, periodicCacheTime, manualCacheTime });
  
  // Update UI
  toggleSwitch.checked = isEnabled;
  updateStatus(isEnabled);
  updateDomainCount(domains.length);
  periodicCacheClearingCheckbox.checked = periodicClearing;
  wildcardFallbackCheckbox.checked = wildcardFallback;
  periodicCacheTimeInput.value = periodicCacheTime;
  manualCacheTimeInput.value = manualCacheTime;
  
  // Set mode radio button
  const selectedModeRadio = document.querySelector(`input[name="mode"][value="${mode}"]`);
  if (selectedModeRadio) {
    selectedModeRadio.checked = true;
  }
  
  // Update mode section visibility
  updateModeSection(isEnabled);
  
  // Check and update current page status
  updatePageStatus();
  
  // Handle toggle changes
  toggleSwitch.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    
    // Save new state
    await chrome.storage.local.set({ cacheKillerEnabled: enabled });
    
    // Update UI
    updateStatus(enabled);
    updateModeSection(enabled);
    updatePageStatus();
  });
  
  // Handle mode changes
  modeRadios.forEach(radio => {
    radio.addEventListener('change', async (event) => {
      const newMode = event.target.value;
      await chrome.storage.local.set({ cacheKillerMode: newMode });
      // Update page status when mode changes
      setTimeout(updatePageStatus, 100);
    });
  });
  
  // Handle periodic cache clearing checkbox
  periodicCacheClearingCheckbox.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ periodicCacheClearing: enabled });
    debugLog('Periodic cache clearing set to:', enabled);
  });
  
  // Handle wildcard fallback checkbox
  wildcardFallbackCheckbox.addEventListener('change', async (event) => {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ wildcardFallbackAllCache: enabled });
    debugLog('Wildcard fallback to all cache set to:', enabled);
  });
  
  // Handle manual cache clear button
  manualCacheClearButton.addEventListener('click', async () => {
    try {
      manualCacheClearButton.disabled = true;
      manualCacheClearButton.textContent = 'Clearing...';
      
      // Send message to background script to clear cache
      await chrome.runtime.sendMessage({ action: 'clearCacheNow' });
      
      manualCacheClearButton.textContent = 'Cleared!';
      setTimeout(() => {
        manualCacheClearButton.textContent = 'Clear Cache Now';
        manualCacheClearButton.disabled = false;
      }, 1500);
      
    } catch (error) {
      console.error('Error clearing cache manually:', error);
      manualCacheClearButton.textContent = 'Error';
      setTimeout(() => {
        manualCacheClearButton.textContent = 'Clear Cache Now';
        manualCacheClearButton.disabled = false;
      }, 1500);
    }
  });
  
  // Handle URL configuration button
  configureUrlsButton.addEventListener('click', () => {
    chrome.windows.create({
      url: chrome.runtime.getURL('domain-config.html'),
      type: 'popup',
      width: 450,
      height: 550
    });
  });
  
  // Listen for storage changes to update domain count
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.cacheKillerDomains) {
      const newDomains = changes.cacheKillerDomains.newValue || [];
      updateDomainCount(newDomains.length);
    }
  });
  
  // Handle click on Advanced Cache Options to toggle main advanced section
  advancedOptionsToggle.addEventListener('click', () => {
    const isHidden = advancedContent.style.display === 'none';
    advancedContent.style.display = isHidden ? 'block' : 'none';
    toggleIcon.textContent = isHidden ? '▲' : '▼';
  });
  
  // Handle time range changes
  periodicCacheTimeInput.addEventListener('change', async (event) => {
    const value = parseInt(event.target.value);
    if (value >= 1 && value <= 60) {
      await chrome.storage.local.set({ periodicCacheTimeMinutes: value });
    } else {
      event.target.value = periodicCacheTime; // Revert to previous value
    }
  });
  
  manualCacheTimeInput.addEventListener('change', async (event) => {
    const value = parseInt(event.target.value);
    if (value >= 1 && value <= 168) {
      await chrome.storage.local.set({ manualCacheTimeHours: value });
    } else {
      event.target.value = manualCacheTime; // Revert to previous value
    }
  });
  
  // Handle reset all settings
  resetAllSettingsButton.addEventListener('click', async () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      try {
        const response = await chrome.runtime.sendMessage({
          action: 'resetAllSettings'
        });
        
        if (response.success) {
          // Reload the popup to reflect changes
          window.location.reload();
        } else {
          alert('Failed to reset settings: ' + (response.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error resetting settings:', error);
        alert('Failed to reset settings.');
      }
    }
  });
  
  function updateStatus(enabled) {
    status.textContent = enabled ? 'Enabled' : 'Disabled';
    status.className = enabled ? 'status enabled' : 'status';
  }
  
  function updateDomainCount(count) {
    urlCount.textContent = `${count} domain${count !== 1 ? 's' : ''} configured`;
  }
  
  function updateModeSection(enabled) {
    const modeSection = document.querySelector('.mode-section');
    if (enabled) {
      modeSection.classList.remove('disabled');
    } else {
      modeSection.classList.add('disabled');
    }
  }
  
  async function updatePageStatus() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        debugLog('No active tab or URL found');
        pageStatus.textContent = 'Cannot determine page status';
        pageStatus.className = 'page-status inactive';
        return;
      }
      
      debugLog('Checking page status for tab:', tab.url);
      
      // Ask background script about current page status
      const response = await chrome.runtime.sendMessage({
        action: 'checkPageStatus',
        url: tab.url
      });
      
      debugLog('Received response from background:', response);
      
      if (response.isActive) {
        // Provide specific reason why cache killer is active
        let reason = '';
        if (response.mode === 'all') {
          reason = ' (all sites mode)';
        } else if (response.mode === 'inclusive') {
          reason = ' (in include list)';
        } else if (response.mode === 'exclusive') {
          reason = ' (not in exclude list)';
        }
        pageStatus.textContent = `Cache killer is active on this page${reason}`;
        pageStatus.className = 'page-status active';
      } else if (response.isEnabled) {
        // Extension is on but not affecting this page
        const mode = response.mode;
        let reason = '';
        if (mode === 'inclusive') {
          reason = ' (not in include list)';
        } else if (mode === 'exclusive') {
          reason = ' (in exclude list)';
        }
        pageStatus.textContent = `Cache killer is not active on this page${reason}`;
        pageStatus.className = 'page-status inactive';
      } else {
        pageStatus.textContent = 'Cache killer is disabled';
        pageStatus.className = 'page-status inactive';
      }
    } catch (error) {
      debugLog('Error checking page status:', error);
      pageStatus.textContent = 'Cannot determine page status';
      pageStatus.className = 'page-status inactive';
    }
  }
});
