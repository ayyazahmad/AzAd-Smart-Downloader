// AzAd Smart Downloader – Panel Logic (OPTIMIZED)

let allItems = [];
let completed = 0;
let sortColumn = "filename";
let sortAscending = true;

// Cache SVG icons to avoid regeneration
const SVG_ICONS = {
  up: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  down: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 12l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  neutral: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5-5 5 5M7 14l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/></svg>`
};

const tbody = document.querySelector("#resultsTable tbody");
const filter = document.getElementById("typeFilter");
const progressBar = document.getElementById("progressBar");
const downloadBtn = document.getElementById("downloadBtn");
const zipToggle = document.getElementById("zipToggle");
const selectAllCheckbox = document.getElementById("selectAllCheckbox");

// Chrome settings button
const openChromeSettingsBtn = document.getElementById("openChromeSettings");
if (openChromeSettingsBtn) {
  openChromeSettingsBtn.onclick = () => {
    chrome.tabs.create({ url: "chrome://settings/downloads" });
  };
}

/* ----------------------------
   Load scan data (safe retry)
----------------------------- */
async function loadScanData(retries = 12) {
  for (let i = 0; i < retries; i++) {
    const res = await chrome.storage.local.get("lastScan");

    if (res.lastScan && Array.isArray(res.lastScan.items)) {
      allItems = res.lastScan.items;
      render();
      return;
    }

    await new Promise(r => setTimeout(r, 300));
  }

  alert("No scan data found.\nPlease scan the page again.");
}

loadScanData();

/* ----------------------------
   UI controls
----------------------------- */
filter.onchange = render;

// Main checkbox for select/unselect all
selectAllCheckbox.onclick = () => {
  const isChecked = selectAllCheckbox.checked;
  document
    .querySelectorAll("#resultsTable tbody input[type=checkbox]")
    .forEach(cb => cb.checked = isChecked);
};

/* ----------------------------
   Sorting functionality
----------------------------- */
function updateSortIndicators() {
  document.querySelectorAll(".sortable").forEach(th => {
    const isActive = th.dataset.sort === sortColumn;
    const label = th.dataset.sort.toUpperCase();

    // Use cached SVG icons
    let iconHtml = SVG_ICONS.neutral;
    if (isActive) iconHtml = sortAscending ? SVG_ICONS.up : SVG_ICONS.down;

    th.innerHTML = `<div class="sort-content"><span class="sort-label">${label}</span><span class="sort-icon ${isActive ? 'active' : ''}">${iconHtml}</span></div>`;
  });
}

document.querySelectorAll(".sortable").forEach(th => {
  th.onclick = () => {
    const column = th.dataset.sort;
    
    if (sortColumn === column) {
      sortAscending = !sortAscending;
    } else {
      sortColumn = column;
      sortAscending = true;
    }
    
    updateSortIndicators();
    render();
  };
});

function sortItems() {
  allItems.sort((a, b) => {
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    // Handle numeric comparison for size
    if (sortColumn === "size") {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      // String comparison
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }

    if (aVal < bVal) return sortAscending ? -1 : 1;
    if (aVal > bVal) return sortAscending ? 1 : -1;
    return 0;
  });
}

/* ----------------------------
   Download handler
----------------------------- */
downloadBtn.onclick = async () => {
  const selected = [];

  document
    .querySelectorAll("#resultsTable tbody input[type=checkbox]:checked")
    .forEach(cb => {
      const idx = Number(cb.dataset.index);
      if (allItems[idx]) selected.push(allItems[idx]);
    });

  if (!selected.length) {
    alert("No files selected.");
    return;
  }

  completed = 0;
  progressBar.style.width = "0%";

  const useZip = zipToggle?.checked === true;

  if (useZip) {
    // ZIP download - handle in panel.js
    await downloadAsZip(selected);
  } else {
    // Individual downloads - send to background
    chrome.runtime.sendMessage({
      type: "ENQUEUE_DOWNLOADS",
      items: selected.map(item => ({
        url: item.url,
        filename: `${location.hostname}/${item.type}/${item.filename}`
      }))
    });
    
    // Clear memory after successful download queue
    setTimeout(() => { allItems = []; }, 5000);
  }
};

/* ----------------------------
   ZIP Download functionality
----------------------------- */
async function downloadAsZip(items) {
  if (typeof JSZip === 'undefined') {
    alert("ZIP library not loaded. Downloading files individually.");
    // Fallback to individual downloads
    chrome.runtime.sendMessage({
      type: "ENQUEUE_DOWNLOADS",
      items: items.map(item => ({
        url: item.url,
        filename: `${location.hostname}/${item.type}/${item.filename}`
      }))
    });
    return;
  }

  downloadBtn.disabled = true;
  downloadBtn.textContent = "Creating ZIP...";

  const zip = new JSZip();
  const total = items.length;
  let fetched = 0;
  let failed = 0;

  // Fetch files in parallel with concurrency limit
  const concurrency = 4;
  const queue = [...items];
  const active = [];

  async function fetchFile(item) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(item.url, {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      const folderPath = `${location.hostname}/${item.type}`;
      zip.folder(folderPath).file(item.filename, blob);

      fetched++;
    } catch (e) {
      console.warn(`Failed to fetch ${item.filename}:`, e.message);
      failed++;
    }

    // Update progress
    const progress = ((fetched + failed) / total) * 100;
    progressBar.style.width = progress + "%";
    downloadBtn.textContent = `Fetching ${fetched + failed}/${total}...`;
  }

  // Process queue with concurrency limit
  while (queue.length > 0 || active.length > 0) {
    while (active.length < concurrency && queue.length > 0) {
      const item = queue.shift();
      const promise = fetchFile(item).then(() => {
        active.splice(active.indexOf(promise), 1);
      });
      active.push(promise);
    }

    if (active.length > 0) {
      await Promise.race(active);
    }
  }

  // Generate and download ZIP
  if (fetched > 0) {
    downloadBtn.textContent = "Generating ZIP...";
    
    try {
      const zipBlob = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      }, (metadata) => {
        progressBar.style.width = metadata.percent + "%";
      });

      // Create download link with formatted filename
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
      const siteName = location.hostname.replace(/\./g, '-');
      const zipFilename = `AzAd-Smart-Downloader-${siteName}-${dateStr}-${timeStr}.zip`;

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      downloadBtn.textContent = `Done! ${fetched} files zipped${failed > 0 ? `, ${failed} failed` : ''}`;
    } catch (e) {
      console.error("ZIP generation failed:", e);
      alert("Failed to generate ZIP file. Try downloading fewer files or disable ZIP mode.");
      downloadBtn.textContent = "Start Download";
    }
  } else {
    alert("No files could be fetched. They may be blocked by CORS or the server.");
    downloadBtn.textContent = "Start Download";
  }

  downloadBtn.disabled = false;
  progressBar.style.width = "100%";

  // Clear memory after download
  setTimeout(() => { allItems = []; }, 5000);
}

/* ----------------------------
   Progress updates
----------------------------- */
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "DOWNLOAD_PROGRESS" && msg.status === "completed") {
    completed++;

    const total =
      document.querySelectorAll(
        "#resultsTable tbody input[type=checkbox]:checked"
      ).length || 1;

    progressBar.style.width =
      Math.min(100, (completed / total) * 100) + "%";
  }
});

/* ----------------------------
   Render table
----------------------------- */
function getPreviewIcon(type) {
  const icons = {
    images: '🖼️',
    docs: '📄',
    archives: '📦',
    audio: '🎵',
    video: '🎬'
  };
  return icons[type] || '📎';
}

function render() {
  sortItems();
  updateSortIndicators();
  tbody.innerHTML = "";

  allItems.forEach((item, index) => {
    if (filter.value !== "all" && item.type !== filter.value) return;

    const sizeText = item.size ? formatSize(item.size) : "—";

    const tr = document.createElement("tr");

    // Checkbox cell
    const tdCheck = document.createElement("td");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.index = index;
    cb.checked = true;
    tdCheck.appendChild(cb);

    // File name cell
      const tdFile = document.createElement("td");
      tdFile.title = item.url || "";
      const fileLink = document.createElement('a');
      fileLink.href = item.url || '#';
      fileLink.target = '_blank';
      fileLink.rel = 'noopener';
      fileLink.textContent = item.filename || item.url || 'file';
      tdFile.appendChild(fileLink);

    // Preview cell
    const tdPreview = document.createElement("td");
    tdPreview.className = "preview-cell";

    if (item.type === 'images') {
      const link = document.createElement('a');
      link.href = item.url || '#';
      link.target = '_blank';
      link.rel = 'noopener';
      
      // Check if it's an SVG file
      const isSvg = item.filename?.toLowerCase().endsWith('.svg') || 
                    item.url?.toLowerCase().includes('.svg');
      
      if (isSvg) {
        // Use object tag for SVG to handle CORS better
        const obj = document.createElement('object');
        obj.className = 'preview-thumb';
        obj.type = 'image/svg+xml';
        obj.data = item.url || '';
        obj.style.pointerEvents = 'none';
        
        // Fallback content inside object
        const fallback = document.createElement('span');
        fallback.className = 'preview-icon';
        fallback.textContent = getPreviewIcon(item.type);
        obj.appendChild(fallback);
        
        link.appendChild(obj);
      } else {
        const img = document.createElement('img');
        img.className = 'preview-thumb';
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';
        img.alt = 'preview';
        img.src = item.url || '';

        // Fallback to emoji on error
        img.onerror = function() {
          this.style.display = 'none';
          const span = document.createElement('span');
          span.className = 'preview-icon';
          span.textContent = getPreviewIcon(item.type);
          link.appendChild(span);
        };

        link.appendChild(img);
      }
      
      tdPreview.appendChild(link);
    } else {
      const span = document.createElement('span');
      span.className = 'preview-icon';
      span.textContent = getPreviewIcon(item.type);
      tdPreview.appendChild(span);
    }

    // Size cell
    const tdSize = document.createElement("td");
    tdSize.textContent = sizeText;

    // Type cell
    const tdType = document.createElement("td");
    tdType.textContent = item.type || "";

    tr.appendChild(tdCheck);
    tr.appendChild(tdFile);
    tr.appendChild(tdPreview);
    tr.appendChild(tdSize);
    tr.appendChild(tdType);

    tbody.appendChild(tr);
  });

  // Update main checkbox state
  updateSelectAllCheckbox();
}

/* ----------------------------
   Update select all checkbox state
----------------------------- */
function updateSelectAllCheckbox() {
  const allCheckboxes = document.querySelectorAll("#resultsTable tbody input[type=checkbox]");
  const checkedCheckboxes = document.querySelectorAll("#resultsTable tbody input[type=checkbox]:checked");
  
  if (allCheckboxes.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCheckboxes.length === allCheckboxes.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCheckboxes.length > 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  }
}

// Update select all checkbox when individual checkboxes change (with debounce)
let updateCheckboxTimeout;
document.addEventListener("change", (e) => {
  if (e.target.matches("#resultsTable tbody input[type=checkbox]")) {
    clearTimeout(updateCheckboxTimeout);
    updateCheckboxTimeout = setTimeout(updateSelectAllCheckbox, 50);
  }
});

// Cleanup on page close
window.addEventListener('beforeunload', () => {
  allItems = [];
  clearTimeout(updateCheckboxTimeout);
});

/* ----------------------------
   Helpers
----------------------------- */
function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + " KB";
  return (kb / 1024).toFixed(2) + " MB";
}
