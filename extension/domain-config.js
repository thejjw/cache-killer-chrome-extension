// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Domain configuration script
const DEBUG = true; // Set to false to disable debug logs

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Cache Killer Domain Config Debug]', ...args);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const domainInput = document.getElementById('domainInput');
  const addButton = document.getElementById('addButton');
  const domainList = document.getElementById('domainList');
  const saveButton = document.getElementById('saveButton');
  const cancelButton = document.getElementById('cancelButton');
  
  let domains = [];
  
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
  
  // Load existing domains
  const result = await chrome.storage.local.get(['cacheKillerDomains']);
  domains = result.cacheKillerDomains || [];
  debugLog('Loaded existing domains:', domains);
  updateDomainList();
  
  // Add domain on button click or Enter key
  addButton.addEventListener('click', addDomain);
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addDomain();
    }
  });
  
  // Save and close
  saveButton.addEventListener('click', async () => {
    debugLog('Saving domains:', domains);
    await chrome.storage.local.set({ cacheKillerDomains: domains });
    debugLog('Domains saved successfully');
    window.close();
  });
  
  // Cancel and close
  cancelButton.addEventListener('click', () => {
    window.close();
  });
  
  function addDomain() {
    const domain = domainInput.value.trim();
    debugLog('Attempting to add domain:', domain);
    
    if (domain && !domains.includes(domain)) {
      domains.push(domain);
      debugLog('Domain added. New domains array:', domains);
      domainInput.value = '';
      updateDomainList();
    } else if (domains.includes(domain)) {
      debugLog('Domain already exists in list');
    } else {
      debugLog('Empty domain, not adding');
    }
  }
  
  function removeDomain(domain) {
    debugLog('Attempting to remove domain:', domain);
    const index = domains.indexOf(domain);
    if (index > -1) {
      domains.splice(index, 1);
      debugLog('Domain removed. New domains array:', domains);
      updateDomainList();
    } else {
      debugLog('Domain not found in list');
    }
  }
  
  function updateDomainList() {
    if (domains.length === 0) {
      domainList.innerHTML = '<div class="empty-message">No domains configured</div>';
      return;
    }
    
    domainList.innerHTML = domains.map(domain => `
      <div class="domain-item">
        <div class="domain-text">${escapeHtml(domain)}</div>
        <button class="remove-button" data-domain="${escapeHtml(domain)}">Remove</button>
      </div>
    `).join('');
    
    // Add event listeners for remove buttons
    domainList.querySelectorAll('.remove-button').forEach(button => {
      button.addEventListener('click', (e) => {
        removeDomain(e.target.dataset.domain);
      });
    });
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});
