// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// URL configuration script
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
    await chrome.storage.local.set({ cacheKillerUrls: urls });
    window.close();
  });
  
  // Cancel and close
  cancelButton.addEventListener('click', () => {
    window.close();
  });
  
  function addUrl() {
    const url = urlInput.value.trim();
    if (url && !urls.includes(url)) {
      urls.push(url);
      urlInput.value = '';
      updateUrlList();
    }
  }
  
  function removeUrl(url) {
    const index = urls.indexOf(url);
    if (index > -1) {
      urls.splice(index, 1);
      updateUrlList();
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
