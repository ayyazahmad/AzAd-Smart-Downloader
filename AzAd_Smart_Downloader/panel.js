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
downloadBtn.onclick = () => {
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

  // ZIP toggle is UI-only for now (safe)
  const useZip = zipToggle?.checked === true;

  chrome.runtime.sendMessage({
    type: "ENQUEUE_DOWNLOADS",
    items: selected.map(item => ({
      url: item.url,
      filename: `${location.hostname}/${item.type}/${item.filename}`,
      zip: useZip
    }))
  });
  
  // Clear memory after successful download queue
  setTimeout(() => { allItems = []; }, 5000);
};

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
      
      const img = document.createElement("img");
      img.className = "preview-thumb";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.alt = "preview";
      img.src = item.url || "";

      // Fallback to emoji on error
      img.onerror = function() {
        this.style.display = 'none';
        const span = document.createElement('span');
        span.className = 'preview-icon';
        span.textContent = getPreviewIcon(item.type);
        tdPreview.appendChild(span);
      };

      link.appendChild(img);
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
