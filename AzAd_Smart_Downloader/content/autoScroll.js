// AzAd Smart Downloader - Auto Scroll Helper (Optimized)
(async () => {
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const MAX_SCROLL_TIME = 30000; // 30 second limit to prevent infinite scroll
  const startTime = Date.now();
  
  let lastHeight = 0;
  let sameCount = 0;

  while (sameCount < 3 && Date.now() - startTime < MAX_SCROLL_TIME) {
    window.scrollTo(0, document.body.scrollHeight);
    await delay(1500);

    const newHeight = document.body.scrollHeight;
    if (newHeight === lastHeight) {
      sameCount++;
    } else {
      sameCount = 0;
      lastHeight = newHeight;
    }
  }
  
  // Cleanup
  window.scrollTo(0, 0);
})();
