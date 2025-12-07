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

// Helper function to format time ago
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

// Fetch and display all posts (forum and social mixed)
async function loadAllPosts() {
  const latestPostsContainer = document.getElementById('latestPosts');

  try {
    // Check cache first
    let forumTopics = await getCachedData('forumPosts');
    let mastodonPosts = await getCachedData('mastodonPosts');

    // Fetch forum posts if not cached
    if (!forumTopics) {
      const forumResponse = await fetch('https://forum.umbraco.com/latest.json');
      if (forumResponse.ok) {
        const data = await forumResponse.json();
        forumTopics = data.topic_list.topics.slice(0, 10);
        await setCachedData('forumPosts', forumTopics);
      } else {
        forumTopics = [];
      }
    }

    // Fetch Mastodon posts if not cached
    if (!mastodonPosts) {
      const mastodonResponse = await fetch('https://mastodon.social/api/v1/timelines/tag/umbraco?limit=10');
      if (mastodonResponse.ok) {
        mastodonPosts = await mastodonResponse.json();
        await setCachedData('mastodonPosts', mastodonPosts);
      } else {
        mastodonPosts = [];
      }
    }

    // Convert forum topics to unified format
    const forumItems = forumTopics.map(topic => ({
      type: 'forum',
      date: new Date(topic.last_posted_at || topic.bumped_at),
      title: topic.title,
      url: `https://forum.umbraco.com/t/${topic.slug}/${topic.id}`,
      meta: `${topic.posts_count} replies`,
      data: topic
    }));

    // Convert Mastodon posts to unified format
    const mastodonItems = mastodonPosts.map(post => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(post.content, 'text/html');
      const textContent = doc.body.textContent || '';

      return {
        type: 'mastodon',
        date: new Date(post.created_at),
        title: textContent,
        url: post.url,
        meta: `@${post.account.username}`,
        data: post
      };
    });

    // Combine and sort by date (most recent first)
    const allItems = [...forumItems, ...mastodonItems].sort((a, b) => b.date - a.date);

    // Take top 10
    const topItems = allItems.slice(0, 10);

    // Clear loading message
    latestPostsContainer.innerHTML = '';

    if (topItems.length === 0) {
      latestPostsContainer.innerHTML = '<div class="forum-loading">No posts found</div>';
      return;
    }

    // Display each item
    topItems.forEach(item => {
      const postElement = document.createElement('a');
      postElement.className = item.type === 'forum' ? 'forum-post' : 'mastodon-post';
      postElement.href = item.url;
      postElement.target = '_blank';

      const titleElement = document.createElement('div');
      titleElement.className = item.type === 'forum' ? 'forum-post-title' : 'mastodon-post-content';
      titleElement.textContent = item.title;

      const metaElement = document.createElement('div');
      metaElement.className = item.type === 'forum' ? 'forum-post-meta' : 'mastodon-post-meta';
      metaElement.textContent = `${item.meta} • ${formatTimeAgo(item.date)}`;

      postElement.appendChild(titleElement);
      postElement.appendChild(metaElement);
      latestPostsContainer.appendChild(postElement);
    });
  } catch (error) {
    console.error('Error loading posts:', error);
    latestPostsContainer.innerHTML = '<div class="forum-loading">Failed to load posts</div>';
  }
}

// Fetch and display calendar events
async function loadCalendarEvents() {
  const calendarEventsContainer = document.getElementById('calendarEvents');

  try {
    // Check cache first
    let events = await getCachedData('calendarEvents');

    if (!events) {
      // Fetch fresh data
      const response = await fetch('https://umbracalendar.com/meetup');

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const rssText = await response.text();

      // Parse RSS XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rssText, 'text/xml');

      // Get all item elements
      const items = xmlDoc.querySelectorAll('item');

      events = Array.from(items).slice(0, 10).map(item => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';

        // Extract start date from the raw XML text using regex
        const itemText = new XMLSerializer().serializeToString(item);
        const startDateMatch = itemText.match(/<ev:startdate[^>]*>(.*?)<\/ev:startdate>/);
        const startDate = startDateMatch ? startDateMatch[1] : '';

        const description = item.querySelector('description')?.textContent || '';

        console.log('Event:', title, 'Start date:', startDate); // Debug log

        return {
          title,
          link,
          startDateStr: startDate,
          description
        };
      });

      // Cache the data
      await setCachedData('calendarEvents', events);
    }

    // Clear loading message
    calendarEventsContainer.innerHTML = '';

    if (events.length === 0) {
      calendarEventsContainer.innerHTML = '<div class="calendar-loading">No events found</div>';
      return;
    }

    // Display each event
    events.forEach(event => {
      const eventElement = document.createElement('a');
      eventElement.className = 'calendar-event';
      eventElement.href = event.link;
      eventElement.target = '_blank';

      const titleElement = document.createElement('div');
      titleElement.className = 'calendar-event-title';
      titleElement.textContent = event.title;

      const metaElement = document.createElement('div');
      metaElement.className = 'calendar-event-meta';

      // Format the date
      if (event.startDateStr) {
        const date = new Date(event.startDateStr);
        const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        metaElement.textContent = dateStr;
      } else {
        metaElement.textContent = 'Date TBA';
      }

      eventElement.appendChild(titleElement);
      eventElement.appendChild(metaElement);
      calendarEventsContainer.appendChild(eventElement);
    });
  } catch (error) {
    console.error('Error loading calendar events:', error);
    calendarEventsContainer.innerHTML = '<div class="calendar-loading">Failed to load events</div>';
  }
}

// Settings button handler
const settingsButton = document.getElementById('settingsButton');
settingsButton.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Load all posts and calendar events when popup opens
loadAllPosts();
loadCalendarEvents();
