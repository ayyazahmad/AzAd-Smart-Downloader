// AzAd Smart Downloader - Instagram Scraper
(() => {

  if (!location.hostname.includes("instagram.com")) return;

  const results = new Map();

  function getBest(img) {
    if (img.srcset) {
      const set = img.srcset.split(",")
        .map(s => s.trim().split(" ")[0]);
      return set[set.length - 1];
    }
    return img.src;
  }

  document.querySelectorAll("img").forEach(img => {
    const src = getBest(img);
    if (!src) return;

    if (src.includes("cdninstagram.com")) {
      results.set(src, {
        url: src,
        type: "images",
        filename: src.split("?")[0].split("/").pop()
      });
    }
  });

  chrome.runtime.sendMessage({
    type: "SCAN_RESULTS",
    items: Array.from(results.values())
  });

})();
