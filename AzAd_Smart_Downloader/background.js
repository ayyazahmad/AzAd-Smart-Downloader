// AzAd Smart Downloader - Background Service Worker (MV3)

let queue = [];
let activeCount = 0;
const activeListeners = new Map(); // Track listeners to prevent duplicates

// Default settings
let settings = {
  concurrency: 4,
  retryCount: 2,
  enableZip: true
};

// Load settings on startup (only once)
chrome.storage.local.get(["settings"], (res) => {
  if (res.settings) {
    settings = {
      concurrency: res.settings.concurrency ?? 4,
      retryCount: res.settings.retries ?? 2,
      enableZip: res.settings.enableZip ?? true
    };
  }
});

// Message handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === "ENQUEUE_DOWNLOADS") {
    enqueueDownloads(msg.items || []);
    sendResponse({ status: "queued", total: msg.items.length });
  }

  if (msg.type === "UPDATE_SETTINGS") {
    settings = {
      concurrency: msg.settings.concurrency ?? 4,
      retryCount: msg.settings.retries ?? 2,
      enableZip: msg.settings.enableZip ?? true
    };
    chrome.storage.local.set({ settings });
    sendResponse({ status: "settings-updated" });
  }

  return true;
});

// Queue handling
function enqueueDownloads(items) {
  items.forEach(item => {
    queue.push({
      ...item,
      retries: settings.retryCount
    });
  });
  processQueue();
}

function processQueue() {
  while (activeCount < settings.concurrency && queue.length > 0) {
    const item = queue.shift();
    startDownload(item);
  }
}

function startDownload(item) {
  activeCount++;

  chrome.downloads.download({
    url: item.url,
    filename: item.filename,
    conflictAction: "uniquify"
  }, (downloadId) => {

    if (!downloadId || chrome.runtime.lastError) {
      handleFailure(item);
      return;
    }

    const listener = (delta) => {
      if (delta.id !== downloadId) return;

      if (delta.state?.current === "complete") {
        chrome.downloads.onChanged.removeListener(listener);
        activeListeners.delete(downloadId);
        activeCount--;
        notify("completed", item);
        processQueue();
      }

      if (delta.state?.current === "interrupted") {
        chrome.downloads.onChanged.removeListener(listener);
        activeListeners.delete(downloadId);
        handleFailure(item);
      }
    };

    // Store listener reference to prevent duplicates
    activeListeners.set(downloadId, listener);
    chrome.downloads.onChanged.addListener(listener);
  });
}

function handleFailure(item) {
  activeCount--;

  if (item.retries > 0) {
    item.retries--;
    queue.push(item);
    notify("retrying", item);
  } else {
    notify("failed", item);
  }

  processQueue();
}

function notify(status, item) {
  try {
    chrome.runtime.sendMessage({
      type: "DOWNLOAD_PROGRESS",
      status,
      item
    });
  } catch (e) {
    // Panel may be closed, ignore silently
  }
}
