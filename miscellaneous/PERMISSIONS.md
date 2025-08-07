# Permissions required

## Cache Killer Extension - Permission

This document provides a detailed explanation for each permission requested by the Cache Killer extension.

---

## Host Permissions

### `<all_urls>`
**Justification:** The extension requests access to all URLs so it can control cache behavior on any website you visit. This is necessary to intercept and modify HTTP requests and to clear cache for all sites.

**Technical necessity:** The extension must be able to apply cache-killing logic (header modification and cache clearing) to every website, regardless of domain, to fulfill its purpose.

---

## API Permissions

### `browsingData`
**Justification:** Required to clear the browser cache programmatically. This ensures that, when enabled, the browser does not serve cached content and always fetches fresh data from the server.

**Technical necessity:** Uses `chrome.browsingData.removeCache()` to clear the cache at regular intervals while the extension is active.

### `webRequest`
**Justification:** Required to intercept outgoing HTTP requests and modify their headers to prevent caching. This is a core part of the extension’s cache-killing functionality.

**Technical necessity:** Uses `chrome.webRequest.onBeforeSendHeaders` to add `Cache-Control`, `Pragma`, and `Expires` headers to all requests.

### `storage`
**Justification:** Required to store user preferences, including the enabled/disabled state, selected mode (all/inclusive/exclusive), and the list of user-configured URLs or patterns.

**Technical necessity:** Uses `chrome.storage.local` to persist extension settings and user configuration across browser sessions.

### `activeTab`
**Justification:** Required to reload the current tab with cache bypass when the extension is enabled or disabled, ensuring immediate effect for the user.

**Technical necessity:** Uses `chrome.tabs.reload(tabId, { bypassCache: true })` to force a fresh reload of the current page.

### `tabs`
**Justification:** Required to open the URL configuration popup window and to query the current active tab for status display in the popup.

**Technical necessity:** Uses `chrome.tabs.query()` to determine the current tab and `chrome.windows.create()` to open the configuration interface.

---