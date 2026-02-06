# Agent Instructions for AzAd Smart Downloader

## Project Overview
This is a Chrome Extension (Manifest V3) designed to download media/files from websites using a "smart" scanning approach.
- **Repository**: `AzAd-Smart-Downloader`
- **Tech Stack**: Vanilla JavaScript, HTML, CSS (No build step like Webpack/Vite currently, though `Build-Extension.ps1` exists for packaging).
- **Permissions**: Uses `activeTab` and `scripting` to avoid broad host permissions (`<all_urls>`).

## Structure
- **Root**: Extension source code.
- `AzAd_Smart_Downloader/`: Main extension files (manifest, popup, background).
- `content/`: Content scripts injected into pages (`scanner.js`, `autoScroll.js`).
- `docs/`: The public documentation/landing page (GitHub Pages).
- `libs/`: Third-party libraries (e.g., `jszip.min.js`).

## Workflow Guidelines
1.  **Manifest V3**: Always ensure code is compliant with MV3 (service workers instead of background pages, no remote code injection).
2.  **Permissions**: Minimize permission requests. Use `activeTab` where possible.
3.  **Strict Separation**: The `docs/` folder (GitHub Pages) and the Extension source code must be treated as separate projects. **NEVER modify extension code when the task is related to the documentation site**, and vice versa. This prevents accidental regressions in the live extension while editing the website.
4.  **Changelog**: Maintain `CHANGELOG.md` in the root. Always place the latest version entry at the top of the list. Only include changes affecting the extension binary/user experience, not the marketing site.
5.  **Build**: Use `Build-Extension.ps1` (or request power shell execution) to package the `.zip` file. The output follows `AzAd_Smart_Downloader_vX.X.X.zip` format.
6.  **Coding**: Use modern ES6+ syntax but ensure browser compatibility (Chrome).

## Git Workflow - Confirmation Required
**IMPORTANT**: After making code changes, **DO NOT** automatically:
- Commit changes
- Push to remote
- Build the extension (create `.zip`)

Instead:
1. Make the requested changes and show a summary of what was modified
2. **Wait for explicit confirmation** from the user before proceeding with commit/push/build
3. Only commit, push, or build when the user explicitly says "commit and push" or similar confirmation

This ensures the user can review changes and run tests before they go live to the repository.

## Development Notes
- `popup.js` controls the main UI flow.
- `panel.js` handles the results view and ZIP generation.
- Dynamic sites (SPAs) require `autoScroll.js` to trigger loading before `scanner.js` runs.
