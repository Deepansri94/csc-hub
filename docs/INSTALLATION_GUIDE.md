# CSC-HUB Installation & Desktop App (.exe) Guide

This guide explains how to obtain and install the **CSC-HUB Windows Desktop Application (`CSC-HUB-Setup.exe`)**.

---

## 📥 Option 1: Download `.exe` from GitHub Actions Artifacts (Recommended)

Every push to the `main` branch automatically triggers the **Build Windows Desktop App (.exe)** workflow on GitHub Actions.

1. Go to your GitHub repository: [https://github.com/Deepansri94/csc-hub](https://github.com/Deepansri94/csc-hub)
2. Click on the **Actions** tab at the top.
3. In the left sidebar, click **Build Windows Desktop App (.exe)**.
4. Click on the latest completed workflow run (green checkmark).
5. Scroll down to the **Artifacts** section at the bottom of the summary page.
6. Click **`CSC-HUB-Windows-Setup-exe`** to download.
7. Extract the downloaded zip file to find **`CSC-HUB-Setup.exe`**.
8. Double-click **`CSC-HUB-Setup.exe`** to install the application on Windows.

> **Note on `github-pages` vs `CSC-HUB-Windows-Setup-exe`**:
> - The artifact named `github-pages` is only the static web build (HTML/CSS/JS).
> - The artifact named **`CSC-HUB-Windows-Setup-exe`** contains the actual Windows desktop installer executable (`.exe`).

---

## 🛠️ Option 2: Build the `.exe` Locally on Windows

If you have Node.js installed locally on a Windows PC:

```bash
# 1. Clone repository
git clone https://github.com/Deepansri94/csc-hub.git
cd csc-hub

# 2. Install dependencies
npm install

# 3. Build Web & Desktop NSIS Installer (.exe)
npm run electron:build
```

The compiled installer will be saved directly in the `./release/` directory as:
```text
release/CSC-HUB-Setup.exe
```

---

## 🖥️ First-Time Launch & Configuration

1. Launch **CSC-HUB** from the Desktop shortcut or Start Menu.
2. In the setup modal:
   - Enter your **License Key** (issued by the Web Admin) or upload `csc_license_*.json`.
   - Import your **Master Pricing Catalog** (`csc_master_catalog_2026.json`) for TN e-District and Xerox service rates.
3. Start fast counter billing, instant thermal receipts, customer ledger management, and Xerox rate calculations 100% offline!
