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
    'cacheKillerDomains'
  ]);
  
  const isEnabled = result.cacheKillerEnabled || false;
  const mode = result.cacheKillerMode || 'all';
  const domains = result.cacheKillerDomains || [];
  
  debugLog('Popup loaded with state:', { isEnabled, mode, domains });
  
  // Update UI
  toggleSwitch.checked = isEnabled;
  updateStatus(isEnabled);
  updateDomainCount(domains.length);
  
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
        pageStatus.textContent = 'Cache killer is active on this page';
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
