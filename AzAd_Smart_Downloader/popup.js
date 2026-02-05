async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

const scanBtn = document.getElementById("scanBtn");
const loader = document.getElementById("loader");

const MAX_SCRIPT_TIMEOUT = 20000; // Prevent hanging

scanBtn.onclick = async () => {
  try {
    scanBtn.disabled = true;
    loader.classList.remove("hidden");

    const tab = await getActiveTab();
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Clear old scan data
    await chrome.storage.local.remove(["lastScan", "scanReady"]);

    // Determine which scrapers to inject based on hostname
    const scripts = ["content/autoScroll.js"];
    
    const hostname = new URL(tab.url).hostname;
    
    if (hostname.includes("instagram.com")) {
      scripts.push("content/scrapers/instagram.js");
    }
    if (hostname.includes("facebook.com")) {
      scripts.push("content/scrapers/facebook.js");
    }
    if (hostname.includes("clipchamp.com")) {
      scripts.push("content/scrapers/clipchamp.js");
    }
    
    // Always run generic scanner last
    scripts.push("content/scanner.js");

    // Inject all scripts sequentially
    const scriptPromise = (async () => {
      for (const file of scripts) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [file]
        });
      }
    })();
    
    // Timeout after 20 seconds
    await Promise.race([
      scriptPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Script timeout')), MAX_SCRIPT_TIMEOUT))
    ]);

    await chrome.storage.local.set({ scanReady: true });

    // Open panel
    chrome.tabs.create({
      url: chrome.runtime.getURL("panel.html")
    });

    window.close();

  } catch (e) {
    scanBtn.disabled = false;
    loader.classList.add("hidden");
    alert("Scan failed: " + (e.message || "Unknown error"));
    console.error('Scan error:', e);
  }
};
