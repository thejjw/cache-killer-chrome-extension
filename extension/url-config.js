// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// URL configuration script
const DEBUG = true; // Set to false to disable debug logs

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Cache Killer URL Config Debug]', ...args);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlInput = document.getElementById('urlInput');
  const addButton = document.getElementById('addButton');
  const urlList = document.getElementById('urlList');
  const saveButton = document.getElementById('saveButton');
  const cancelButton = document.getElementById('cancelButton');
  
  let urls = [];
  
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
  
  // Load existing URLs
  const result = await chrome.storage.local.get(['cacheKillerUrls']);
  urls = result.cacheKillerUrls || [];
  debugLog('Loaded existing URLs:', urls);
  updateUrlList();
  
  // Add URL on button click or Enter key
  addButton.addEventListener('click', addUrl);
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addUrl();
    }
  });
  
  // Save and close
  saveButton.addEventListener('click', async () => {
    debugLog('Saving URLs:', urls);
    await chrome.storage.local.set({ cacheKillerUrls: urls });
    debugLog('URLs saved successfully');
    window.close();
  });
  
  // Cancel and close
  cancelButton.addEventListener('click', () => {
    window.close();
  });
  
  function addUrl() {
    const url = urlInput.value.trim();
    debugLog('Attempting to add URL:', url);
    
    if (url && !urls.includes(url)) {
      urls.push(url);
      debugLog('URL added. New URLs array:', urls);
      urlInput.value = '';
      updateUrlList();
    } else if (urls.includes(url)) {
      debugLog('URL already exists in list');
    } else {
      debugLog('Empty URL, not adding');
    }
  }
  
  function removeUrl(url) {
    debugLog('Attempting to remove URL:', url);
    const index = urls.indexOf(url);
    if (index > -1) {
      urls.splice(index, 1);
      debugLog('URL removed. New URLs array:', urls);
      updateUrlList();
    } else {
      debugLog('URL not found in list');
    }
  }
  
  function updateUrlList() {
    if (urls.length === 0) {
      urlList.innerHTML = '<div class="empty-message">No URLs configured</div>';
      return;
    }
    
    urlList.innerHTML = urls.map(url => `
      <div class="url-item">
        <div class="url-text">${escapeHtml(url)}</div>
        <button class="remove-button" data-url="${escapeHtml(url)}">Remove</button>
      </div>
    `).join('');
    
    // Add event listeners for remove buttons
    urlList.querySelectorAll('.remove-button').forEach(button => {
      button.addEventListener('click', (e) => {
        removeUrl(e.target.dataset.url);
      });
    });
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
