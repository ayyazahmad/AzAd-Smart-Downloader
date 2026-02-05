# AzAd Smart Downloader

> **Bulk download images, documents, videos & archives from any webpage**

![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Published-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

A powerful Chrome extension that automatically scans web pages for media files and allows you to bulk download them with smart organization and filtering.

## ✨ Features

- **🔎 Smart Scanning** — Detects files across images, links, media tags, and inline styles
- **🖼️ Image Previews** — See thumbnails for quick selection
- **⚡ Fast & Safe** — Parallel fetches with timeouts; optimized to minimize page impact
- **📂 Organized Downloads** — Files are automatically grouped by hostname and file type
- **🔒 Privacy-First** — All scan results and settings remain local to your browser
- **⚙️ Configurable** — Adjust concurrency and retry settings to match your bandwidth

## 📦 Installation

### From Chrome Web Store
1. Visit the [AzAd Smart Downloader page](https://chrome.google.com/webstore) on Chrome Web Store
2. Click **Add to Chrome**
3. Confirm the installation

### From Source (Development)
1. Clone this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `AzAd_Smart_Downloader` folder
6. The extension will now appear in your Chrome toolbar

## 🚀 Quick Start

1. **Install & Pin** — Install the extension and pin it to your Chrome toolbar for easy access
2. **Configure Chrome** — Go to Chrome Settings → Downloads and uncheck "Ask where to save each file before downloading"
3. **Open & Scan** — Navigate to any webpage, click the ASD icon, then click **Scan This Page**
4. **Review Results** — A new tab opens with all detected files. Preview images and filter by type
5. **Download** — Select files and click **Download Selected**

All files are automatically organized in your Downloads folder by source and type.

## 📖 How to Use

### Scanning
- Click the ASD extension icon in your Chrome toolbar
- Click **Scan This Page** to detect all downloadable files on the current page
- The scanner automatically detects: images, documents, videos, audio files, and archives

### Filtering & Selection
- Use filters to show only specific file types (images, documents, videos, archives)
- Preview images before downloading
- Select individual files or use **Select All**

### Downloading
- Click **Download Selected** to start bulk downloading
- Files are automatically organized into folders by:
  - **Hostname** (the website source)
  - **File Type** (images, documents, videos, etc.)

### Advanced Settings (Options Page)
- Adjust **Concurrency Level** — Number of parallel downloads (default: 3)
- Adjust **Retry Attempts** — How many times to retry failed downloads (default: 2)
- Configure **Timeout** — Request timeout in milliseconds (default: 5000ms)

## 🏗️ Project Structure

```
AzAd_Smart_Downloader/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── popup.html/js          # Extension popup UI
├── panel.html/js          # Download panel UI
├── options.html/js        # Settings page
├── styles.css             # Global styles
├── content/
│   ├── scanner.js         # File detection logic
│   ├── autoScroll.js      # Auto-scroll functionality
│   └── scrapers/
│       ├── facebook.js    # Facebook-specific scraper
│       └── instagram.js   # Instagram-specific scraper
├── icons/                 # Extension icons
└── libs/
    ├── jszip.min.js       # ZIP file creation
    └── mime-map.js        # MIME type mapping
```

## 🛠️ Development

### Prerequisites
- Google Chrome (v88+)
- PowerShell 5.0+ (for build scripts)

### Building for Distribution

Run the included build script to create a zip file ready for Chrome Web Store upload:

```powershell
# Windows
.\Build-Extension.ps1

# Or use the batch wrapper
.\Build-Extension.bat
```

This creates a zip file named `AzAd_Smart_Downloader_v<version>.zip` containing all extension files.

### Syncing Docs Images

To update the GitHub Pages site with optimized images from the repository:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-docs-images.ps1
```

Add `-Force` to overwrite without confirmation.

## 📝 Use Cases

- **Portfolio Collections** — Download all images from artist portfolios or design galleries
- **Research & Learning** — Grab educational videos, PDFs, and resources in bulk
- **Media Backups** — Save photos from galleries, social media albums, and websites
- **Content Organization** — Automatically organized by source and file type
- **Offline Access** — Download and keep your own copies of important files

## 🔐 Privacy & Security

- ✅ **No data collection** — All scanning happens locally in your browser
- ✅ **No tracking** — We don't track your browsing activity
- ✅ **No remote servers** — Results never leave your machine
- ✅ **Open source** — Full transparency; inspect the code yourself

See our [Privacy Policy](https://ayyazahmad.github.io/AzAd-Smart-Downloader/privacy.html) for more details.

## ❓ Support & FAQ

For common questions, troubleshooting steps, and support, visit our [Support Page](https://ayyazahmad.github.io/AzAd-Smart-Downloader/support.html).

**Having issues?**
- 📧 Email: [info@azad.co](mailto:info@azad.co)
- 🐛 [Open an issue on GitHub](https://github.com/ayyazahmad/AzAd-Smart-Downloader/issues)
- 💬 Check the [Discussions](https://github.com/ayyazahmad/AzAd-Smart-Downloader/discussions)

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 👨‍💻 About

Built with ❤️ by [Ayyaz Ahmad](https://ayyazahmad.com)

- 🌐 [AzAd Solutions](https://azad.co)
- 💻 [GitHub Profile](https://github.com/ayyazahmad)
- 🔗 [Portfolio](https://ayyazahmad.com)

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs by opening an issue
- Suggest features via discussions
- Submit pull requests with improvements

---

**Enjoy bulk downloading! 📥**
