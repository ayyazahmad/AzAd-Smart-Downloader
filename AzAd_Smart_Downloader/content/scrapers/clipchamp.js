// AzAd Smart Downloader - Clipchamp Scraper
// Extracts media assets from Clipchamp projects and editor
(() => {

  if (!location.hostname.includes("clipchamp.com")) return;

  const results = new Map();

  function collectMedia() {
    // Collect from img tags
    document.querySelectorAll("img").forEach(img => {
      const src = img.src || img.dataset.src || img.dataset.original;
      if (!src) return;

      // Filter for actual media assets (not UI icons)
      // Clipchamp stores media in specific CDN paths
      if (src.includes("clipchamp") || 
          src.includes("cdn") ||
          src.includes("assets") ||
          src.includes("media") ||
          src.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
        
        // Exclude small UI elements and logos
        if (!src.includes("logo") && 
            !src.includes("icon") && 
            !src.includes("avatar") &&
            !src.includes("ui/") &&
            !src.includes("static/")) {
          
          results.set(src, {
            url: src,
            type: "images",
            filename: src.split("?")[0].split("/").pop() || "clipchamp-image"
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
          filename: video.src.split("?")[0].split("/").pop() || "clipchamp-video"
        });
      }
      
      // Video sources
      video.querySelectorAll("source").forEach(source => {
        if (source.src) {
          results.set(source.src, {
            url: source.src,
            type: source.type.includes("video") ? "video" : "images",
            filename: source.src.split("?")[0].split("/").pop() || "clipchamp-media"
          });
        }
      });

      // Video poster/thumbnail
      if (video.poster) {
        results.set(video.poster, {
          url: video.poster,
          type: "images",
          filename: video.poster.split("?")[0].split("/").pop() || "clipchamp-thumbnail"
        });
      }
    });

    // Collect from background images in inline styles
    document.querySelectorAll("[style*='background']").forEach(el => {
      const style = el.getAttribute("style") || "";
      const match = style.match(/background[^:]*:\s*url\(['"]?([^'"()]+)['"]?\)/);
      if (match && match[1]) {
        const url = match[1];
        // Filter for media, not UI backgrounds
        if ((url.includes("clipchamp") || url.includes("cdn")) && 
            !url.includes("ui/") && 
            !url.match(/\.(svg|gif)$/i)) {
          results.set(url, {
            url: url,
            type: "images",
            filename: url.split("?")[0].split("/").pop() || "clipchamp-bg"
          });
        }
      }
    });

    // Collect from picture elements
    document.querySelectorAll("picture source").forEach(source => {
      const srcset = source.srcSet || source.src;
      if (srcset) {
        const url = srcset.split(",")[0].split(" ")[0].trim();
        if (url && (url.includes("clipchamp") || url.includes("cdn"))) {
          results.set(url, {
            url: url,
            type: "images",
            filename: url.split("?")[0].split("/").pop() || "clipchamp-media"
          });
        }
      }
    });

    // Try to extract from canvas if rendering
    document.querySelectorAll("canvas").forEach(canvas => {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        if (dataUrl && dataUrl !== "data:,") {
          results.set(dataUrl, {
            url: dataUrl,
            type: "images",
            filename: "clipchamp-canvas-export.png"
          });
        }
      } catch (e) {
        // Canvas might be origin-restricted
      }
    });
  }

  // Collect media immediately
  collectMedia();

  // Wait for any dynamic content and collect again
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
