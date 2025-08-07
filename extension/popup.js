// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Popup script for Cache Killer extension
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
    'cacheKillerUrls'
  ]);
  
  const isEnabled = result.cacheKillerEnabled || false;
  const mode = result.cacheKillerMode || 'all';
  const urls = result.cacheKillerUrls || [];
  
  // Update UI
  toggleSwitch.checked = isEnabled;
  updateStatus(isEnabled);
  updateUrlCount(urls.length);
  
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
    
    // Get active tab and reload it if cache killer is enabled
    if (enabled) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          chrome.tabs.reload(tab.id, { bypassCache: true });
        }
      } catch (error) {
        console.error('Error reloading tab:', error);
      }
    }
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
      url: chrome.runtime.getURL('url-config.html'),
      type: 'popup',
      width: 450,
      height: 550
    });
  });
  
  // Listen for storage changes to update URL count
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.cacheKillerUrls) {
      const newUrls = changes.cacheKillerUrls.newValue || [];
      updateUrlCount(newUrls.length);
    }
  });
  
  function updateStatus(enabled) {
    status.textContent = enabled ? 'Enabled' : 'Disabled';
    status.className = enabled ? 'status enabled' : 'status';
  }
  
  function updateUrlCount(count) {
    urlCount.textContent = `${count} URL${count !== 1 ? 's' : ''} configured`;
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
        pageStatus.textContent = 'Cannot determine page status';
        pageStatus.className = 'page-status inactive';
        return;
      }
      
      // Ask background script about current page status
      const response = await chrome.runtime.sendMessage({
        action: 'checkPageStatus',
        url: tab.url
      });
      
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
      console.error('Error checking page status:', error);
      pageStatus.textContent = 'Cannot determine page status';
      pageStatus.className = 'page-status inactive';
    }
  }
});
