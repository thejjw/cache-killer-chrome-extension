# Permissions Required

## Cache Killer Extension - Permissions

This document provides a detailed explanation for each permission requested by the Cache Killer extension.

---

## Host Permissions

### `<all_urls>`
**Justification:** The extension requests access to all URLs so it can control cache behavior on any website you visit. This is necessary to intercept and modify HTTP requests and to clear cache for all sites.

**Technical necessity:** The extension must be able to apply cache-killing logic (header modification and cache clearing) to every website, regardless of domain, to fulfill its purpose.

---

## API Permissions

### `browsingData`
**Justification:** Required to clear the browser cache programmatically. This ensures that, when enabled, the browser does not serve cached content and always fetches fresh data from the server. Cache clearing respects the configured domain lists when possible.

**Technical necessity:** Uses `chrome.browsingData.removeCache()` and `chrome.browsingData.remove()` with the `origins` parameter to clear cache either globally or for specific domains, depending on the selected mode and domain configuration.

### `declarativeNetRequest`
**Justification:** Required to intercept and modify HTTP request headers to prevent caching. This permission allows the extension to add no-cache headers to requests using Chrome's modern Manifest V3 API.

**Technical necessity:** Uses `chrome.declarativeNetRequest.updateDynamicRules()` to create rules that add `Cache-Control`, `Pragma`, and `Expires` headers to requests, and remove existing cache-related headers like `If-Modified-Since` and `If-None-Match`.

### `storage`
**Justification:** Required to store user preferences, including the enabled/disabled state, selected mode (all/inclusive/exclusive), and the list of user-configured domains.

**Technical necessity:** Uses `chrome.storage.local` to persist extension settings and user configuration across browser sessions.

### `tabs`
**Justification:** Required to open the domain configuration popup window and to query the current active tab for status display in the popup.

**Technical necessity:** Uses `chrome.tabs.query()` to determine the current tab's URL for status checking and `chrome.windows.create()` to open the configuration interface.

---
