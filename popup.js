// Popup script for Umbraco Power Tools extension

const toggleButton = document.getElementById('toggleButton');
const goToRootButton = document.getElementById('goToRoot');
const statusDiv = document.getElementById('status');

// Load settings and apply theme
let openInNewTabSetting = true; // Default value

chrome.storage.local.get(['themeMode', 'openInNewTab'], (result) => {
  // Store openInNewTab setting
  openInNewTabSetting = result.openInNewTab !== undefined ? result.openInNewTab : true;

  // Apply theme mode
  const themeMode = result.themeMode || 'auto';
  applyTheme(themeMode);
});

// Apply theme to the popup
function applyTheme(mode) {
  if (mode === 'light') {
    document.body.setAttribute('data-theme', 'light');
  } else if (mode === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    // Auto mode - remove attribute to use CSS media query
    document.body.removeAttribute('data-theme');
  }
}

// Show status message
function showStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 3000);
}

// Navigate to URL
function navigateToUrl(url, openInNewTab) {
  if (openInNewTab) {
    chrome.tabs.create({ url: url, active: true });
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.update(tabs[0].id, { url: url });
      }
    });
  }
}

// Toggle to Umbraco admin
toggleButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      showStatus('No active tab found', 'error');
      return;
    }

    const currentUrl = new URL(tabs[0].url);
    const pathname = currentUrl.pathname;

    // Check if already on /umbraco/*
    if (pathname.startsWith('/umbraco')) {
      showStatus('Already on Umbraco admin', 'info');
      return;
    }

    // Navigate to /umbraco
    const umbracoUrl = `${currentUrl.origin}/umbraco`;
    navigateToUrl(umbracoUrl, openInNewTabSetting);

    if (!openInNewTabSetting) {
      showStatus('Navigating to Umbraco...', 'success');
    }
  });
});

// Go to site root
goToRootButton.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) {
      showStatus('No active tab found', 'error');
      return;
    }

    const currentUrl = new URL(tabs[0].url);
    const rootUrl = currentUrl.origin + '/';

    navigateToUrl(rootUrl, openInNewTabSetting);

    if (!openInNewTabSetting) {
      showStatus('Navigating to root...', 'success');
    }
  });
});

// Cache helpers
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

async function getCachedData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      const cached = result[key];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        resolve(cached.data);
      } else {
        resolve(null);
      }
    });
  });
}

async function setCachedData(key, data) {
  return new Promise((resolve) => {
    chrome.storage.local.set({
      [key]: {
        data: data,
        timestamp: Date.now()
      }
    }, resolve);
  });
}

// Fetch and display forum posts
async function loadForumPosts() {
  const forumPostsContainer = document.getElementById('forumPosts');

  try {
    // Check cache first
    let topics = await getCachedData('forumPosts');

    if (!topics) {
      // Fetch fresh data
      const response = await fetch('https://forum.umbraco.com/latest.json');

      if (!response.ok) {
        throw new Error('Failed to fetch forum posts');
      }

      const data = await response.json();
      topics = data.topic_list.topics.slice(0, 5);

      // Cache the data
      await setCachedData('forumPosts', topics);
    }

    // Clear loading message
    forumPostsContainer.innerHTML = '';

    if (topics.length === 0) {
      forumPostsContainer.innerHTML = '<div class="forum-loading">No posts found</div>';
      return;
    }

    // Display each topic
    topics.forEach(topic => {
      const postElement = document.createElement('a');
      postElement.className = 'forum-post';
      postElement.href = `https://forum.umbraco.com/t/${topic.slug}/${topic.id}`;
      postElement.target = '_blank';

      const titleElement = document.createElement('div');
      titleElement.className = 'forum-post-title';
      titleElement.textContent = topic.title;

      const metaElement = document.createElement('div');
      metaElement.className = 'forum-post-meta';

      // Format the date (use last activity time)
      const date = new Date(topic.last_posted_at || topic.bumped_at);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo;
      if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }

      metaElement.textContent = `${timeAgo} • ${topic.posts_count} replies`;

      postElement.appendChild(titleElement);
      postElement.appendChild(metaElement);
      forumPostsContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error('Error loading forum posts:', error);
    forumPostsContainer.innerHTML = '<div class="forum-loading">Failed to load posts</div>';
  }
}

// Fetch and display Mastodon posts
async function loadMastodonPosts() {
  const mastodonPostsContainer = document.getElementById('mastodonPosts');

  try {
    // Check cache first
    let posts = await getCachedData('mastodonPosts');

    if (!posts) {
      // Fetch fresh data
      const response = await fetch('https://umbracocommunity.social/api/v1/timelines/tag/umbraco?limit=5');

      if (!response.ok) {
        throw new Error('Failed to fetch Mastodon posts');
      }

      posts = await response.json();

      // Cache the data
      await setCachedData('mastodonPosts', posts);
    }

    // Clear loading message
    mastodonPostsContainer.innerHTML = '';

    if (posts.length === 0) {
      mastodonPostsContainer.innerHTML = '<div class="mastodon-loading">No posts found</div>';
      return;
    }

    // Display each post
    posts.forEach(post => {
      const postElement = document.createElement('a');
      postElement.className = 'mastodon-post';
      postElement.href = post.url;
      postElement.target = '_blank';

      // Strip HTML tags from content using DOMParser (safer than innerHTML)
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const textContent = doc.body.textContent || '';

      const contentElement = document.createElement('div');
      contentElement.className = 'mastodon-post-content';
      contentElement.textContent = textContent;

      const metaElement = document.createElement('div');
      metaElement.className = 'mastodon-post-meta';

      // Format the date
      const date = new Date(post.created_at);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo;
      if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }

      metaElement.textContent = `@${post.account.username} • ${timeAgo}`;

      postElement.appendChild(contentElement);
      postElement.appendChild(metaElement);
      mastodonPostsContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error('Error loading Mastodon posts:', error);
    mastodonPostsContainer.innerHTML = '<div class="mastodon-loading">Failed to load posts</div>';
  }
}

// Load forum posts and Mastodon posts when popup opens
loadForumPosts();
loadMastodonPosts();
