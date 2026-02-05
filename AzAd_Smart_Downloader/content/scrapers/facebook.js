// AzAd Smart Downloader - Facebook Scraper
// Handles Facebook image and video extraction
(() => {

  if (!location.hostname.includes("facebook.com")) return;

  const results = new Map();

  function highestSrc(img) {
    if (img.srcset) {
      const set = img.srcset.split(",")
        .map(s => s.trim().split(" ")[0])
        .filter(Boolean);
      return set[set.length - 1] || img.src;
    }
    return img.src;
  }

  function collectMedia() {
    // Collect from img tags
    document.querySelectorAll("img").forEach(img => {
      const src = highestSrc(img);
      if (!src) return;

      // Facebook CDNs
      if (src.includes("fbcdn.net") || 
          src.includes("facebook.com") ||
          src.includes("scontent.") && src.includes("fbcdn")) {
        
        // Exclude UI elements and avatars
        if (!src.includes("avatar") || src.includes("/photos/")) {
          results.set(src, {
            url: src,
            type: "images",
            filename: src.split("?")[0].split("/").pop() || "facebook-image"
          });
        }
      }
    });

    // Collect from picture elements
    document.querySelectorAll("picture source").forEach(source => {
      const srcset = source.srcSet || source.src;
      if (srcset && (srcset.includes("fbcdn") || srcset.includes("scontent"))) {
        const url = srcset.split(",")[0].split(" ")[0].trim();
        if (url) {
          results.set(url, {
            url: url,
            type: "images",
            filename: url.split("?")[0].split("/").pop() || "facebook-image"
          });
        }
      }
    });

    // Collect from video tags
    document.querySelectorAll("video").forEach(video => {
      if (video.src) {
        results.set(video.src, {
          url: video.src,
          type: "video",
          filename: video.src.split("?")[0].split("/").pop() || "facebook-video"
        });
      }
      
      video.querySelectorAll("source").forEach(source => {
        if (source.src) {
          results.set(source.src, {
            url: source.src,
            type: "video",
            filename: source.src.split("?")[0].split("/").pop() || "facebook-video"
          });
        }
      });

      // Video poster thumbnail
      if (video.poster) {
        results.set(video.poster, {
          url: video.poster,
          type: "images",
          filename: video.poster.split("?")[0].split("/").pop() || "facebook-video-thumb"
        });
      }
    });

    // Collect background images
    document.querySelectorAll("[style*='background-image']").forEach(el => {
      const style = el.getAttribute("style") || "";
      const match = style.match(/background-image\s*:\s*url\(['"]?([^'"()]+)['"]?\)/);
      if (match && match[1]) {
        const url = match[1];
        if ((url.includes("fbcdn") || url.includes("scontent")) && 
            !url.includes("ui/")) {
          results.set(url, {
            url: url,
            type: "images",
            filename: url.split("?")[0].split("/").pop() || "facebook-bg"
          });
        }
      }
    });
  }

  // Collect media immediately
  collectMedia();

  // Wait for any lazy-loaded content and collect again
  setTimeout(() => {
    collectMedia();
    
    // Send results via message
    chrome.runtime.sendMessage({
      type: "SCAN_RESULTS",
      items: Array.from(results.values())
    }).catch(() => {
      // Silently fail if background isn't listening
    });
  }, 1000);

})();
