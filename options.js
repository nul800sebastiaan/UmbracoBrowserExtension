// Options script for Umbraco Power Tools extension

const themeModeSelect = document.getElementById('themeMode');
const openInNewTabCheckbox = document.getElementById('openInNewTab');
const statusDiv = document.getElementById('status');

// Load saved settings
chrome.storage.local.get(['themeMode', 'openInNewTab'], (result) => {
  themeModeSelect.value = result.themeMode || 'auto';
  openInNewTabCheckbox.checked = result.openInNewTab !== undefined ? result.openInNewTab : true;
});

// Show status message
function showStatus(message) {
  statusDiv.textContent = message;
  statusDiv.className = 'status success';
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 2000);
}

// Save settings when theme mode changes
themeModeSelect.addEventListener('change', () => {
  chrome.storage.local.set({
    themeMode: themeModeSelect.value
  }, () => {
    showStatus('Settings saved!');
  });
});

// Save settings when checkbox changes
openInNewTabCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({
    openInNewTab: openInNewTabCheckbox.checked
  }, () => {
    showStatus('Settings saved!');
  });
});
