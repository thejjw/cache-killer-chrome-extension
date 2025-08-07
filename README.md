# Cache Killer Extension

A Chrome extension that disables browser cache to ensure pages always load fresh content from the server instead of using cached versions.

## Features

- **Toggle On/Off**: Easy toggle functionality via extension popup or icon click
- **Multiple Operation Modes**:
  - **All Sites**: Disables cache on all websites (default)
  - **Include List**: Only disables cache on specified domains
  - **Exclude List**: Disables cache on all sites except specified domains
- **Domain Pattern Configuration**: Add specific domains or wildcard patterns for targeted cache control
- **Visual Indicators**: Icon changes color and shows badge when enabled
- **Badge Mode Indicator**: Badge shows "ON(A)", "ON(I)", or "ON(E)" for All, Include, or Exclude mode
- **Current Page Status in Popup**: Popup displays if cache killer is active on the current tab, and why/why not
- **Automatic Cache Prevention**: Uses multiple methods to prevent caching:
  - Modifies HTTP request headers to add no-cache directives
  - Periodically clears browser cache when enabled
- **Immediate Effect**: Reloads current tab when enabled to apply changes

## How It Works

The extension uses two main approaches to disable caching:

1. **Header Modification**: Intercepts HTTP requests and adds cache-control headers:
   - `Cache-Control: no-cache, no-store, must-revalidate`
   - `Pragma: no-cache`
   - `Expires: 0`

2. **Periodic Cache Clearing**: Automatically clears browser cache every 5 seconds when enabled using the `chrome.browsingData.removeCache()` API

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

## Usage

1. **Click the extension icon** in the toolbar to toggle on/off
2. **Use the popup interface**: 
   - Toggle the main switch to enable/disable cache killing
   - Select operation mode:
     - **All Sites**: Works on every website
     - **Include List**: Only works on domains you specify
     - **Exclude List**: Works on all sites except domains you specify
   - Click "Configure Domain List" to add/remove domains and patterns
   - All user preferences (enabled state, mode, domain list, etc.) are local and will not follow the user to other Chrome installations.
3. **Domain Configuration**:
   - Add specific domains: `example.com`, `localhost`
   - Use wildcards for subdomains: `*.google.com`, `*.wikipedia.org`
   - Local development: `localhost`, `*.local`
4. **Visual feedback**: 
   - When enabled: Icon turns red with mode badge ("ON(A)", "ON(I)", or "ON(E)")
   - When disabled: Icon is gray with no badge
   - Domain count shown in popup
   - The popup will tell you if the extension is affecting the current page
5. **Automatic reload**: When enabling, the current tab will automatically reload to apply changes

## Permissions Required

- `browsingData`: To clear browser cache
- `storage`: To save extension settings (enabled state, mode, domain list)
- `declarativeNetRequest`: To modify HTTP headers
- `activeTab`: To reload tabs when toggling
- `tabs`: To create URL configuration window
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

3. **Request Header Modification**: Intercepts HTTP requests and modifies headers to prevent caching
4. **Active Cache Clearing**: When enabled, clears the cache every 5 seconds to ensure no cached content remains
5. **Bypass Cache on Reload**: When toggling on, reloads the current tab with `bypassCache: true`
6. **Badge and Popup Status Logic**:
   - The badge text updates to reflect the current mode (All, Include, Exclude)
   - The popup queries the background script to determine if the current page is affected and displays a status message

## Troubleshooting

- **Extension doesn't work**: Make sure you've granted all required permissions
- **Still seeing cached content**: Try disabling and re-enabling the extension, then refresh the page
- **Performance issues**: The extension clears cache frequently when enabled, which may slightly impact browsing performance

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

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/default-yellow.png)](https://www.buymeacoffee.com/jwjeon)