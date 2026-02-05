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

    // Inject scripts with timeout protection
    const scriptPromise = Promise.all([
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/autoScroll.js"]
      }),
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/scanner.js"]
      })
    ]);
    
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
