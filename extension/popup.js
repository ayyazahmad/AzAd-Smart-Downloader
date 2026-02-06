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
    scanBtn.textContent = "Scrolling...";

    const tab = await getActiveTab();
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // Clear old scan data
    await chrome.storage.local.remove(["lastScan", "scanReady"]);

    // Setup listener for scroll completion
    const scrollCompletePromise = new Promise((resolve) => {
      const listener = (msg) => {
        if (msg.type === "SCROLL_DONE") {
          chrome.runtime.onMessage.removeListener(listener);
          resolve();
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      // Fallback timeout handles case where script fails to send message
      setTimeout(resolve, 12000); 
    });

    // 1. Inject Auto Scroll
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content/autoScroll.js"]
    });

    // Wait for scroll to finish
    await scrollCompletePromise;

    scanBtn.textContent = "Scanning...";

    // 2. Inject Scanner (generic or specific)
    const isFacebook = tab.url.includes("facebook.com");
    const isInstagram = tab.url.includes("instagram.com");
    
    // We run the generic scanner first as it is most robust now
    const scriptsToRun = ["content/scanner.js"];
    
    // If specific scrapers are needed, they can be added here
    // but scanner.js should cover most cases now with relaxed checks.
    // if (isFacebook) scriptsToRun.push("content/scrapers/facebook.js");
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: scriptsToRun
    });
    
    // Give scanner a moment to write to storage
    await new Promise(r => setTimeout(r, 1000));

    await chrome.storage.local.set({ scanReady: true });

    // Open panel
    chrome.tabs.create({
      url: chrome.runtime.getURL("panel.html")
    });

    window.close();

  } catch (e) {
    scanBtn.disabled = false;
    loader.classList.add("hidden");
    scanBtn.textContent = "Start Scan"; 
    alert("Scan failed: " + (e.message || "Unknown error"));
    console.error('Scan error:', e);
  }
};
