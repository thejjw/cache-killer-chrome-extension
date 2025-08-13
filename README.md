# Cache Killer Extension

A Chrome extension that disables browser cache to ensure pages always load fresh content from the server instead of using cached versions.

## Features

- **Toggle On/Off**: Easy toggle functionality via extension popup (icon click)
- **Multiple Operation Modes**:
  - **All Sites**: Disables cache on all websites (default)
  - **Include List**: Only disables cache on specified domains
  - **Exclude List**: Disables cache on all sites except specified domains
- **Domain Pattern Configuration**: Add specific domains or wildcard patterns for targeted cache control
- **Import/Export Domains**: Import domain lists from text files or export current configuration (access from domain list configuration page)
- **Advanced Options**: Collapsible section with optional features
- **Visual Indicators**: Icon changes color and shows badge when enabled
- **Badge Mode Indicator**: Badge shows "ON(A)", "ON(I)", or "ON(E)" for All, Include, or Exclude mode
- **Current Page Status in Popup**: Popup displays if cache killer is active on the current tab, and why/why not
- **Automatic Cache Prevention**: Uses multiple methods to prevent caching:
  - **Primary Method**: Modifies HTTP request headers to add no-cache directives (always reliable)
  - **Optional**: Force cache clearing features (advanced option, configurable time ranges, wildcard handling)
- **Domain-Specific Cache Clearing**: Smart cache clearing that targets specific domains when possible

## How It Works

The extension uses two main approaches to disable caching:

1. **Header Modification** (Primary method): Intercepts HTTP requests and adds cache-control headers:
   - `Cache-Control: no-cache, no-store, must-revalidate`
   - `Pragma: no-cache`
   - `Expires: 0`

2. **Force Cache Clearing** (Optional): When enabled in advanced settings:
   - **Domain-specific clearing**: Uses Chrome's origins API to clear cache for specific domains
   - **Wildcard handling**: Smart handling of wildcard patterns with user-configurable fallback
   - **Configurable time ranges**: Expert settings allow customization of periodic (1-60 minutes) and manual (1-168 hours) cache clearing time ranges
   - **Fallback behavior**: For wildcard patterns, can either skip clearing or clear all cache (user choice)

## Installation

### Method 1: Load as Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the folder containing this extension
5. The extension should now appear in your extensions list

### Method 2: Pack and Install

1. In Chrome extensions page (`chrome://extensions/`), click "Pack extension"
2. Select the extension folder as the root directory
3. Click "Pack Extension" to create a `.crx` file
4. Install the `.crx` file by dragging it to the extensions page

**Alternatively, install from the [Chrome Web Store](https://chromewebstore.google.com/detail/jhpfoicanffigcjoogcgihhjikmcpopf)**  
_(Note: The Chrome Web Store version may not always have the latest updates.)_

## Usage

1. **Click the extension icon** in the toolbar to toggle on/off
2. **Use the popup interface**: 
   - Toggle the main switch to enable/disable cache killing
   - Select operation mode:
     - **All Sites**: Works on every website
     - **Include List**: Only works on domains you specify
     - **Exclude List**: Works on all sites except domains you specify
   - Click "Configure Domain List" to add/remove domains and patterns
   - **Advanced Cache Options** (click to expand): 
     - Enable "Periodic cache clearing" for automatic force cache clearing
     - Enable "Clear all cache for wildcards" to change wildcard behavior
     - Manual "Clear Cache Now" button
     - **Expert Settings** (double-click to access): Configure cache clearing time ranges and reset all settings
   - All user preferences are stored locally and persist across browser sessions
3. **Domain Configuration**:
   - Add specific domains: `example.com`, `localhost`
   - Use wildcards for subdomains: `*.google.com`, `*.wikipedia.org`
   - Local development: `localhost`, `*.local`
   - **Import/Export**: Import domain lists from text files or export current configuration
   - **Validation**: All domains are validated against RFC 1035 standards during import/manual entry
4. **Visual feedback**: 
   - When enabled: Icon turns red with mode badge ("ON(A)", "ON(I)", or "ON(E)")
   - When disabled: Icon is gray with no badge
   - Domain count shown in popup
   - The popup will tell you if the extension is affecting the current page

## Import/Export Domains

The domain configuration supports importing and exporting domain lists:

### Export
- Click "Export to File" in the domain configuration window
- Downloads a `cache-killer-domains.txt` file with one domain per line
- Simple text format for easy editing and backup

### Import
- Click "Import from File" to select a text file
- Supports one domain per line format
- Lines starting with `#` are treated as comments and ignored
- Choose to either **replace** existing domains or **merge** with current list
- Invalid domains are automatically filtered out with RFC-based validation
- Shows summary of imported vs. rejected entries

### Example Import File Format
```
# Development domains
localhost
127.0.0.1
192.168.1.100
dev.local

# Production sites
example.com
*.example.com
google.com

# Social media
*.facebook.com
*.twitter.com
```

## Permissions Required

- `browsingData`: To clear browser cache
- `storage`: To save extension settings (enabled state, mode, domain list)
- `declarativeNetRequest`: To modify HTTP headers
- `tabs`: To create domain configuration window
- `<all_urls>`: To work on all websites

## Files Structure

```
├── README.md            # This file
extension/
├── manifest.json          # Extension manifest (Chrome Extension Manifest V3)
├── background.js          # Service worker for background operations
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
├── domain-config.html    # Domain configuration interface
├── domain-config.js      # Domain configuration functionality
└── icons/                # Extension icons
    ├── icon16.png
    ├── icon48.png
    ├── icon128.png
    ├── icon16-active.png
    └── icon48-active.png
    └── icon128-active.png
```

## Technical Details

### Manifest V3 Compatibility

This extension is built using Chrome Extension Manifest V3, which means:
- Uses service worker instead of background pages
- Uses `chrome.action` instead of `chrome.browserAction`
- Follows modern extension security practices

### Cache Prevention Methods

1. **Smart Domain Filtering**: The extension now supports three modes:
   - **All Sites Mode**: Works on every website (original behavior)
   - **Include List Mode**: Only applies cache killing to domains matching your configured patterns
   - **Exclude List Mode**: Applies cache killing to all sites except those matching your patterns

2. **Domain Pattern Matching**: Uses wildcard patterns for flexible domain matching:
   - `*.example.com` matches all subdomains of example.com (mail.example.com, api.example.com) but not example.com itself
   - `example.com` matches exactly example.com
   - `localhost` matches the localhost domain

3. **Request Header Modification**: Intercepts HTTP requests and modifies headers to prevent caching (domain-specific, always works)
4. **Smart Cache Clearing**: When enabled, uses Chrome's browsingData API with origins parameter for domain-specific cache data clearing
5. **Configurable Time Ranges**: Expert settings allow customization of cache clearing time ranges:
   - Periodic clearing: 1-60 minutes (default: 5 minutes)
   - Manual clearing: 1-168 hours (default: 24 hours)
6. **Wildcard Handling**: Intelligent handling of wildcard patterns with user-configurable fallback behavior
7. **RFC-Based Domain Validation**: All domain entries validated against RFC 1035 standards
8. **Badge and Popup Status Logic**:
   - The badge text updates to reflect the current mode (All, Include, Exclude)
   - The popup queries the background script to determine if the current page is affected and displays a status message

## Troubleshooting

- **Extension doesn't work**: Make sure you've granted all required permissions
- **Still seeing cached content**: 
  - Try disabling and re-enabling the extension, then refresh the page
  - Check if the current page matches your domain configuration (Include/Exclude mode)
  - Use "Clear Cache Now" button in advanced options for immediate cache clearing
- **Wildcard patterns not working as expected**: 
  - Check the domain configuration page for wildcard usage examples
  - Enable "Clear all cache for wildcards" if you need aggressive cache clearing for wildcard patterns
- **Import not working**: 
  - Ensure text file uses one domain per line format
  - Check that domains follow valid format (no invalid characters, proper structure)
  - Lines starting with `#` are treated as comments
- **Performance issues**: Reduce periodic cache clearing frequency in expert settings or disable it entirely

## Development

To modify or extend this extension:

1. Edit the relevant files (`background.js`, `popup.js`, etc.)
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card to reload it
4. Test your changes

## License
See [LICENSE](LICENSE).

---

## Author
- Jaewoo Jeon [@thejjw](https://github.com/thejjw)

If you find this extension helpful, consider supporting its development:

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/default-yellow.png)](https://www.buymeacoffee.com/thejjw)
