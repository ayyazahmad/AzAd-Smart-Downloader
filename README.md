AzAd Smart Downloader — Docs image sync

Run the included PowerShell script to copy optimized images from the repository root into the GitHub Pages `docs` site folder.

Usage (PowerShell):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-docs-images.ps1
```

Add `-Force` to overwrite without confirmation.

This keeps `docs/assets/images` populated with the optimized images from `Graphic Assets` and `Screeshots` so the GitHub Pages site uses the optimized assets.
