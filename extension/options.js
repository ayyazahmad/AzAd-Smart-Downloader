const defaults = {
  concurrency: 4,
  retries: 2,
  enableZip: true
};

const $ = id => document.getElementById(id);

chrome.storage.local.get(["settings"], (res) => {
  const s = { ...defaults, ...(res.settings || {}) };

  $("concurrency").value = s.concurrency;
  $("retries").value = s.retries;
  $("enableZip").checked = s.enableZip;
});

$("saveBtn").onclick = () => {
  const settings = {
    concurrency: Math.max(1, Math.min(10, Number($("concurrency").value))),
    retries: Math.max(0, Math.min(5, Number($("retries").value))),
    enableZip: $("enableZip").checked
  };

  chrome.storage.local.set({ settings });
  chrome.runtime.sendMessage({ type: "UPDATE_SETTINGS", settings }).catch(() => {});

  alert("Settings saved.");
};

$("openChromeSettings").onclick = () => {
  chrome.tabs.create({ url: "chrome://settings/downloads" });
};
