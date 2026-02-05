// AzAd Smart Downloader - Instagram Scraper
// Handles modern Instagram image loading and media extraction
(() => {

  if (!location.hostname.includes("instagram.com")) return;

  const results = new Map();

  function getBest(img) {
    if (img.srcset) {
      const set = img.srcset.split(",")
        .map(s => s.trim().split(" ")[0])
        .filter(Boolean);
      return set[set.length - 1] || img.src;
    }
    return img.src;
  }

  function collectImages() {
    // Collect from img tags with various Instagram CDN formats
    document.querySelectorAll("img").forEach(img => {
      const src = getBest(img);
      if (!src) return;

      // Instagram CDN URLs
      if (src.includes("cdninstagram.com") || 
          src.includes("scontent.cdninstagram.com") ||
          src.includes("scontent.") && src.includes("instagram")) {
        results.set(src, {
          url: src,
          type: "images",
          filename: src.split("?")[0].split("/").pop() || "instagram-image"
        });
      }
      
      // Profile pictures and other image formats
      if (src.includes("instagram.com") && 
          (src.includes("/p/") || src.includes("/reel/") || 
           src.match(/\.(jpg|jpeg|png|webp)/i))) {
        results.set(src, {
          url: src,
          type: "images",
          filename: src.split("?")[0].split("/").pop() || "instagram-image"
        });
      }
    });

    // Collect from picture elements (modern responsive images)
    document.querySelectorAll("picture source").forEach(source => {
      const src = source.srcSet || source.src;
      if (src && (src.includes("cdninstagram") || src.includes("scontent"))) {
        const url = src.split(",")[0].split(" ")[0].trim();
        if (url) {
          results.set(url, {
            url: url,
            type: "images",
            filename: url.split("?")[0].split("/").pop() || "instagram-image"
          });
        }
      }
    });

    // Collect from canvas render attempts (some posts might use canvas)
    document.querySelectorAll("video").forEach(video => {
      if (video.poster) {
        const poster = video.poster;
        if (poster.includes("cdninstagram") || poster.includes("scontent")) {
          results.set(poster, {
            url: poster,
            type: "images",
            filename: poster.split("?")[0].split("/").pop() || "instagram-video-poster"
          });
        }
      }
      video.querySelectorAll("source").forEach(s => {
        if (s.src && s.type.includes("video")) {
          results.set(s.src, {
            url: s.src,
            type: "video",
            filename: s.src.split("?")[0].split("/").pop() || "instagram-video"
          });
        }
      });
    });
  }

  // Collect images immediately
  collectImages();

  // Wait a bit for any lazy-loaded images and collect again
  setTimeout(() => {
    collectImages();
    
    // Send results via message
    chrome.runtime.sendMessage({
      type: "SCAN_RESULTS",
      items: Array.from(results.values())
    }).catch(() => {
      // Silently fail if background isn't listening
    });
  }, 1000);

})();
