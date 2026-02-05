# Changelog

All notable changes to the AzAd Smart Downloader Chrome extension are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-05

### Added
- Dynamic scraper injection based on current website domain
- Improved Instagram scraper with support for modern Instagram CDN formats
  - Detects scontent.cdninstagram.com and multiple Instagram CDN variations
  - Supports picture elements and video sources
  - Extracts video posters and canvas renders
  - Lazy-loading support with 1-second collection retry
- Improved Facebook scraper with better media detection
  - Support for multiple Facebook CDN formats (fbcdn.net, scontent)
  - Video tag and poster thumbnail extraction
  - Inline style background image detection
  - Better filtering of UI elements vs. actual media
- New Clipchamp scraper for video editing platform
  - Media asset extraction from videos and images
  - Canvas export capture
  - Support for picture elements and background images
  - Filtering of UI elements and non-media assets

### Improved
- Popup now injects site-specific scrapers before running generic scanner
- Better media detection on dynamic/SPA websites
- Enhanced filtering to reduce false positives (UI icons, avatars, logos)

## [1.0.2] - 2024-01-16

### Fixed
- Header logo visibility on hover (text changes to yellow)
- Relative icon paths for local development

## [1.0.1] - 2024-01-15

### Added
- Build script for Chrome Web Store packaging
- Image sync script for GitHub Pages documentation
- Comprehensive README with installation and usage guide

## [1.0.0] - 2024-01-15

### Added
- Initial release of AzAd Smart Downloader
- Smart file scanning across images, links, media tags, and inline styles
- Image preview thumbnails with fallback emoji support
- Multi-file filtering by type (images, documents, videos, archives)
- Bulk download functionality with smart filename organization
- Files organized by hostname and file type automatically
- Configurable concurrency level (default: 3 parallel downloads)
- Configurable retry attempts (default: 2)
- Configurable request timeout (default: 5000ms)
- Pop-up UI for easy access and page scanning
- Download panel UI with progress tracking
- Options page for advanced settings
- Facebook-specific scraper for better media detection
- Instagram-specific scraper for better media detection
- Privacy-first design with local-only processing
- Auto-scroll functionality for dynamic content loading
- ZIP file creation support for batched downloads
- MIME type mapping for accurate file categorization
- Extension icons for toolbar and context menus

### Features
- **Smart Scanning** — Automatically detects downloadable files on any webpage
- **Preview & Filter** — See image previews and filter by file type before downloading
- **Organized Downloads** — Files grouped by source website and file type
- **Fast & Efficient** — Parallel downloads with timeout protection
- **Privacy-Focused** — All operations remain local to your browser

## Planned Features

### [1.2.0] - Upcoming
- [ ] Support for additional social media platforms (TikTok, Twitter, Pinterest)
- [ ] Custom download location selection
- [ ] Download history tracking
- [ ] File size filtering options

### [1.3.0] - Upcoming
- [ ] Batch scheduling for large downloads
- [ ] Download resume capability
- [ ] Progress notifications
- [ ] Download statistics dashboard

---

## How to Report Issues

Found a bug or have a feature request? Please:
- Check existing [issues](https://github.com/ayyazahmad/AzAd-Smart-Downloader/issues) to avoid duplicates
- [Create a new issue](https://github.com/ayyazahmad/AzAd-Smart-Downloader/issues/new) with detailed description
- Include steps to reproduce for bugs
- Specify your Chrome version and OS

## Contributors

- [Ayyaz Ahmad](https://github.com/ayyazahmad) - Creator & Maintainer
