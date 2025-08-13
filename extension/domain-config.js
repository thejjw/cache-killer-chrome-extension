// SPDX-License-Identifier: zlib-acknowledgement
// Copyright (c) 2025 @thejjw

// Domain configuration script
const DEBUG = false; // Set to false to disable debug logs

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Cache Killer Domain Config Debug]', ...args);
  }
}

// Domain validation function based on RFC standards
function isValidDomain(domain) {
  // Remove leading/trailing whitespace
  domain = domain.trim();
  
  // Empty domains are invalid
  if (!domain) return false;
  
  // Handle wildcard domains (*.example.com)
  const isWildcard = domain.startsWith('*.');
  if (isWildcard) {
    domain = domain.substring(2); // Remove *. prefix for validation
  }
  
  // Basic domain format checks
  // Domain length: 1-253 characters (RFC 1035)
  if (domain.length < 1 || domain.length > 253) return false;
  
  // Cannot start or end with dot
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  
  // Cannot have consecutive dots
  if (domain.includes('..')) return false;
  
  // Split into labels (parts separated by dots)
  const labels = domain.split('.');
  
  // Must have at least one label (for localhost, etc.)
  if (labels.length === 0) return false;
  
  // Validate each label
  for (const label of labels) {
    // Label length: 1-63 characters (RFC 1035)
    if (label.length < 1 || label.length > 63) return false;
    
    // Cannot start or end with hyphen
    if (label.startsWith('-') || label.endsWith('-')) return false;
    
    // Only allow alphanumeric characters and hyphens
    if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
  }
  
  return true;
}

document.addEventListener('DOMContentLoaded', async () => {
  const domainInput = document.getElementById('domainInput');
  const addButton = document.getElementById('addButton');
  const domainList = document.getElementById('domainList');
  const saveButton = document.getElementById('saveButton');
  const cancelButton = document.getElementById('cancelButton');
  const exportButton = document.getElementById('exportButton');
  const importButton = document.getElementById('importButton');
  const importFileInput = document.getElementById('importFileInput');
  
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

  // Export domains to text file
  exportButton.addEventListener('click', () => {
    if (domains.length === 0) {
      alert('No domains to export');
      return;
    }
    
    const content = domains.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cache-killer-domains.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    debugLog('Exported domains:', domains);
  });
  
  // Import domains from text file
  importButton.addEventListener('click', () => {
    importFileInput.click();
  });
  
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#')); // Allow comments starting with #
        
        if (lines.length === 0) {
          alert('No valid lines found in file');
          return;
        }
        
        // Validate and filter domains
        const validDomains = [];
        const invalidLines = [];
        
        lines.forEach((line, index) => {
          if (isValidDomain(line)) {
            validDomains.push(line);
          } else {
            invalidLines.push(`Line ${index + 1}: "${line}"`);
            debugLog('Invalid domain rejected:', line);
          }
        });
        
        if (validDomains.length === 0) {
          alert('No valid domains found in file. Please check the format.');
          if (invalidLines.length > 0 && DEBUG) {
            console.log('Invalid lines found:', invalidLines);
          }
          return;
        }
        
        // Show validation summary if there were invalid lines
        let message = `Found ${validDomains.length} valid domains in file.`;
        if (invalidLines.length > 0) {
          message += `\n\n${invalidLines.length} invalid entries were ignored.`;
          if (invalidLines.length <= 5) {
            message += `\nIgnored: ${invalidLines.join(', ')}`;
          }
        }
        message += '\n\nClick OK to REPLACE current domains, or Cancel to MERGE with existing domains.';
        
        const replace = confirm(message);
        
        if (replace) {
          domains = [...new Set(validDomains)]; // Remove duplicates
        } else {
          domains = [...new Set([...domains, ...validDomains])]; // Merge and remove duplicates
        }
        
        updateDomainList();
        debugLog('Imported valid domains:', validDomains, 'Final domains:', domains);
        
        let successMessage = `Successfully imported ${validDomains.length} valid domains. Total domains: ${domains.length}`;
        if (invalidLines.length > 0) {
          successMessage += `\n\n${invalidLines.length} invalid entries were ignored.`;
        }
        alert(successMessage);
        
      } catch (error) {
        console.error('Import error:', error);
        alert('Error reading file. Please make sure it\'s a valid text file.');
      }
    };
    
    reader.readAsText(file);
    // Clear the input so the same file can be selected again
    e.target.value = '';
  });
  
  function addDomain() {
    const domain = domainInput.value.trim();
    debugLog('Attempting to add domain:', domain);
    
    if (!domain) {
      debugLog('Empty domain, not adding');
      return;
    }
    
    if (!isValidDomain(domain)) {
      alert('Invalid domain format. Please enter a valid domain name (e.g., example.com or *.example.com)');
      debugLog('Invalid domain rejected:', domain);
      return;
    }
    
    if (domains.includes(domain)) {
      alert('Domain already exists in the list');
      debugLog('Domain already exists in list');
      return;
    }
    
    domains.push(domain);
    debugLog('Domain added. New domains array:', domains);
    domainInput.value = '';
    updateDomainList();
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
