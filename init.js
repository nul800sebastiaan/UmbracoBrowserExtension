// Apply theme as early as possible (before popup.js loads)
chrome.storage.local.get(['themeMode'], (result) => {
  const themeMode = result.themeMode || 'auto';
  if (themeMode !== 'auto') {
    // Wait for body to exist
    const checkBody = setInterval(() => {
      if (document.body) {
        document.body.setAttribute('data-theme', themeMode);
        clearInterval(checkBody);
      }
    }, 1);
  }
});
