// AzAd Smart Downloader - Facebook Scraper
(() => {

  if (!location.hostname.includes("facebook.com")) return;

  const results = new Map();

  function highestSrc(img) {
    if (img.srcset) {
      const set = img.srcset.split(",")
        .map(s => s.trim().split(" ")[0]);
      return set[set.length - 1];
    }
    return img.src;
  }

  document.querySelectorAll("img").forEach(img => {
    const src = highestSrc(img);
    if (!src) return;

    if (src.includes("fbcdn.net")) {
      results.set(src, {
        url: src,
        type: "images",
        filename: src.split("?")[0].split("/").pop()
      });
    }
  });

  // Save to storage just like scanner.js
  chrome.storage.local.set({
    lastScan: {
      url: location.href,
      timestamp: Date.now(),
      items: Array.from(results.values())
    },
    scanReady: true
  });

})();
