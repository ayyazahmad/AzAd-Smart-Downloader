// AzAd Smart Downloader - Universal Page Scanner
// Detects files + fetches size via HEAD where possible
// Saves results to chrome.storage.local for panel usage

(async () => {

  const EXT_REGEX = {
    images: /\.(jpe?g|png|webp|gif|svg)$/i,
    docs: /\.(pdf|docx?|xlsx?|pptx?|txt|csv)$/i,
    archives: /\.(zip|rar|7z|tar|gz)$/i,
    audio: /\.(mp3|wav|ogg|m4a)$/i,
    video: /\.(mp4|webm|ogv)$/i
  };

  function normalizeUrl(url) {
    try {
      return new URL(url, location.href).href;
    } catch {
      return null;
    }
  }

  function highestFromSrcset(srcset) {
    if (!srcset) return null;
    const parts = srcset
      .split(",")
      .map(p => p.trim().split(" ")[0])
      .filter(Boolean);
    return parts.length ? parts[parts.length - 1] : null;
  }

  async function fetchSize(url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch(url, { 
        method: "HEAD",
        signal: controller.signal
      });
      clearTimeout(timeout);
      const len = res.headers.get("content-length");
      return len ? Number(len) : null;
    } catch {
      return null;
    }
  }

  async function fetchSizesInParallel(items, maxConcurrent = 5) {
    const queue = [...items];
    const active = [];
    
    while (queue.length > 0 || active.length > 0) {
      while (active.length < maxConcurrent && queue.length > 0) {
        const item = queue.shift();
        const promise = fetchSize(item.url).then(size => {
          item.size = size;
          active.splice(active.indexOf(promise), 1);
        });
        active.push(promise);
      }
      
      if (active.length > 0) {
        await Promise.race(active);
      }
    }
  }

  async function scanPage() {
    const results = new Map();

    const add = (url, type) => {
      const u = normalizeUrl(url);
      if (!u || results.has(u)) return;

      results.set(u, {
        url: u,
        type,
        filename: u.split("/").pop().split("?")[0] || "file",
        size: null
      });
    };

    // Anchor links (PDFs, docs, archives)
    document.querySelectorAll("a[href]").forEach(a => {
      const href = a.href;
      Object.entries(EXT_REGEX).forEach(([type, rx]) => {
        if (rx.test(href)) add(href, type);
      });
    });

    // Images (highest resolution)
    document.querySelectorAll("img").forEach(img => {
      const src =
        highestFromSrcset(img.srcset) ||
        img.dataset.src ||
        img.dataset.original ||
        img.src;

      if (!src) return;

      // Trust the image tag - if it has a src, it's likely an image
      // even if it doesn't have an extension (CDN, dynamic chunks, etc)
      // We filter out base64 very small icons if needed, but for now scan all.
      // Explicitly allow blob: and data: (though data: might be handled separately)
      
      if (EXT_REGEX.images.test(src) || src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:image')) {
        add(src, "images");
      }
    });

    // Audio / Video
    document.querySelectorAll("audio, video").forEach(media => {
      if (media.src) add(media.src, media.tagName.toLowerCase());
      if (media.poster) add(media.poster, "images"); // capture video posters too
      media.querySelectorAll("source").forEach(s => {
        if (s.src) add(s.src, media.tagName.toLowerCase());
      });
    });

    // CSS background images (optimized: only check actual style attributes, not computed)
    // Skip expensive getComputedStyle() on all divs - instead check only inline styles
    document.querySelectorAll("[style*='background-image']").forEach(el => {
      if (results.size > 300) return; // Reduced limit for performance
      const style = el.getAttribute('style') || '';
      const match = style.match(/background-image\s*:\s*url\(['"]?([^'"()]+)['"]?\)/);
      if (match && match[1]) {
        const url = match[1];
        if (EXT_REGEX.images.test(url)) add(url, 'images');
      }
    });

    // Fetch file sizes in parallel (max 5 concurrent)
    const resultItems = Array.from(results.values());
    await fetchSizesInParallel(resultItems, 5);

    return Array.from(results.values());
  }

  // Set overall timeout for scan to prevent blocking page load
  const scanPromise = scanPage();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Scan timeout')), 15000)
  );
  
  try {
    const items = await Promise.race([scanPromise, timeoutPromise]);
    await chrome.storage.local.set({
      lastScan: {
        url: location.href,
        timestamp: Date.now(),
        items
      }
    });
  } catch (e) {
    // If scan times out, save at least what we have
    const partialItems = await scanPage();
    await chrome.storage.local.set({
      lastScan: {
        url: location.href,
        timestamp: Date.now(),
        items: partialItems.slice(0, 300)
      }
    });
  }

})();
