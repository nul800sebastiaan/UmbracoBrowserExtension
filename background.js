// Background service worker for Umbraco Power Tools extension
// Currently minimal - can be extended for additional features

chrome.runtime.onInstalled.addListener(() => {
  // Set default preferences using local storage (more reliable in Firefox)
  chrome.storage.local.set({
    openInNewTab: true,
    themeMode: 'auto'
  });
});
