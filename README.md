# CSC-HUB (csc-hub)

An enterprise-grade, offline-first application architecture built for Common Service Centres (CSC / இ-சேவை மையம்), digital business kiosks, and Xerox/print centers in India.

The project features a **Dual-Mode System**:
1. 👑 **Web Admin Module**: Central management portal for user accounts, kiosk license issuance, master price catalog distribution, and JSON audit report inspection.
2. 🖥️ **Client Desktop Application (Electron)**: Offline-first counter application for instant POS billing, Xerox rate calculation, GST/token receipts, customer ledger, Baileys silent WhatsApp messaging, and daily cash tallies.

👉 **Complete Workflow & Installation Guide**: See [`docs/ADMIN_CLIENT_WORKFLOW.md`](docs/ADMIN_CLIENT_WORKFLOW.md) and [`docs/INSTALLATION_GUIDE.md`](docs/INSTALLATION_GUIDE.md) for full details on how Admin registers clients, sets up their store, and how to download/install the desktop app.

---

## 🌟 Architecture & Workflow Summary

```
                      +------------------------------------------+
                      |           CENTRAL WEB ADMIN HUB          |
                      | - Register Clients & Generate Licenses   |
                      | - Export Master Price Catalog (.json)    |
                      | - Inspect Client End-of-Day Audits       |
                      +------------------------------------------+
                                     |             ^
        Issues License & Rates JSON  |             |  Uploads Backup JSON
                                     v             |  for Auditing
                      +------------------------------------------+
                      |         CLIENT DESKTOP APPLICATION       |
                      | - 100% Offline POS & Xerox Calculator    |
                      | - Instant Token & Thermal Receipts       |
                      | - Customer Credit Book & Ledger          |
                      | - Silent WhatsApp Reminders (Baileys)    |
                      +------------------------------------------+
```

### 👑 1. What the Admin Does (Web Portal)
- **Manage Clients & Licenses**: Generate unique encrypted license keys (`CSC-2026-XXXX-XXXX`) and downloadable license files (`csc_license_*.json`) with Trial, 6-Month, or 1-Year plans.
- **Maintain Operators**: Configure operator names, mobile numbers, roles (`admin` / `operator`), and 4-digit PINs.
- **Master Pricing Distribution**: Update official Tamil Nadu e-District certificate fees, Aadhaar/PAN rates, and Xerox charges, then export `csc_master_catalog_2026.json`.
- **Audit Reports Inspector**: Upload client end-of-day JSON backups to inspect total revenue, cash vs UPI breakdown, invoices count, and customer credit ledger.

### 🖥️ 2. What the Client Does (Desktop Kiosk)
- **Install & Launch**: Install `CSC-HUB-Setup.exe` (Windows) or open via browser PWA.
- **Store & License Setup**: Enter the license key or upload `csc_license_*.json`, then import `csc_master_catalog_2026.json`.
- **Fast Counter Operations**: Rapid billing for certificates, utilities, and Xerox jobs with UPI dynamic QR code and thermal printing.
- **WhatsApp Hub**: Direct or silent background WhatsApp dispatches for balance reminders and public scheme notifications.
- **End-of-Day Backup**: Export `csc_backup_*.json` to submit to Admin for auditing or safe keeping.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS
- **Desktop Runtime**: Electron 44, Electron Builder
- **Background WhatsApp Gateway**: Node.js, Express, `@whiskeysockets/baileys`
- **Offline Storage**: LocalStorage with automatic event-driven cross-tab synchronization
- **CI/CD**: GitHub Actions workflow deploying to GitHub Pages

---

## 🚀 Commands & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Full-Stack Dev Server** (Express + Baileys + Vite):
   ```bash
   npm run dev
   ```

3. **Run Automated Test Suite**:
   ```bash
   npm test
   ```

4. **Build Production Web Bundle**:
   ```bash
   npm run build
   ```

5. **Package Electron Desktop Application** (`.exe` / `.AppImage` / `.dmg`):
   ```bash
   npm run electron:build
   ```

---

## 📖 Documentation
- [`docs/ADMIN_CLIENT_WORKFLOW.md`](docs/ADMIN_CLIENT_WORKFLOW.md) — Comprehensive guide covering Admin features, Client features, client registration, and store setup.
