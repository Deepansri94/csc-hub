# CSC e-Sevai Kiosk & Xerox Hub — Workflow & Roles Architecture Guide

This guide details the complete business and software workflow between the **Central Web Admin Module** and the **Client Desktop Application (Electron / Kiosk Counter)**.

---

## 1. Role Breakdown & Feature Matrix

### 👑 What the ADMIN Can Do (Web Admin Module)
The **Admin Module** runs on the central web portal (hosted on GitHub Pages / Cloud) and is managed exclusively by the software owner / administrator.

1. **Client & Store Registration**:
   - Register new kiosk centers, VLE owners, and franchise stores.
   - Issue offline-first **License Keys** (e.g. `CSC-2026-OMALUR-9481`).
   - Choose license tiers: **30-Day Trial**, **Standard (6 Months)**, or **Enterprise (1 Year)**.
   - Download standalone **Client License JSON files** (`csc_license_XXXX.json`) to distribute to clients.
   - Remotely pause, resume, or revoke kiosk licenses.

2. **Operator & Staff Management**:
   - Maintain authorized counter operators and staff credentials.
   - Assign roles (`admin` or `operator`) and 4-digit security PIN codes.
   - Activate or suspend operator access.

3. **Master Pricing & Service Catalog Control**:
   - Centrally configure official government fees and recommended kiosk service charges for:
     - Certificates (Community, Income, Nativity, First Graduate, etc.)
     - e-District & Revenue services (Patta / Chitta, Land records, Encumbrance)
     - UIDAI Aadhaar updates & PVC cards
     - PAN Card applications
     - TNEB bill payments, Smart Ration Card corrections, PM-Kisan
     - Xerox & Printing rates (B&W single/double side, Color print, Photo print, Lamination, Spiral binding)
   - Export the official **Master Catalog JSON Template** (`csc_master_catalog_2026.json`) for clients to load.

4. **Audit & Report Inspector (End-of-Day JSON Audits)**:
   - When clients export their end-of-day or monthly backup files (`csc_backup_....json`), the Admin can upload them into the **Audit Inspector**.
   - Instantly calculates:
     - Total invoices processed
     - Total revenue collected (Cash vs. UPI)
     - Outstanding customer credit balances
     - Registered customer count & operator productivity
   - Maintains an audit history trail of inspected stores without needing continuous cloud database connectivity.

5. **Desktop App Distribution**:
   - Provide direct download links for the packaged **Electron Desktop Application** (`.exe` for Windows, `.AppImage` for Linux, `.dmg` for macOS).

---

### 🖥️ What the CLIENT Can Do (Desktop Application / Kiosk Mode)
The **Client Application** is used offline at the counter by the VLE operator or shop counter staff on desktop PCs or laptops.

1. **Fast Counter POS Billing**:
   - Rapid service search with Tamil & English keyboard filtering.
   - 1-click addition of certificates, utility bills, and PVC prints to cart.
   - Instant token number generation (e.g. Token #42).
   - Multi-mode payments: **Cash**, **UPI (with dynamic QR code generator)**, and **Credit Khata**.
   - Thermal 80mm / 58mm POS receipt printing and A4/A5 PDF generation.

2. **Xerox & Print Calculator**:
   - Instant visual page & copy calculator for high-speed counter printing.
   - Automatic rate calculation for B&W (A4/A3/Legal), Color printouts, Photo glossy paper, Spiral binding, and Lamination.
   - 1-click "Add to Invoice" or "Quick Bill".

3. **Customer Book & Credit Ledger (Khata)**:
   - Maintain client accounts (Advocates, schools, regular citizens, contractors).
   - Track credit given, payments received (cash/UPI), and outstanding balance due.
   - Customer-level transaction history and ledger statements.

4. **WhatsApp Communication Hub**:
   - **Silent Background WhatsApp**: Uses local Baileys WebSocket protocol for direct silent sending without opening browser tabs.
   - **Direct WhatsApp Click-to-Chat (`wa.me`)**: 1-click launch with pre-filled payment reminders, due balance receipts, and public scheme news in Tamil, English, and Hindi.
   - Promotional broadcast with promotional flyers and certificate attachments.

5. **Daily Cash Tally & Financial Closing**:
   - End-of-day register closing comparing expected system cash vs. physical drawer cash.
   - Tracks cash differences, UPI receipts, and credit issued per operator shift.

6. **Offline Backup & Data Portability**:
   - 100% offline functionality — works without internet connection.
   - Full 1-click **JSON Backup Export** (`csc_backup_....json`) to submit to Admin for auditing or keep safe locally.

---

## 2. How the Client Gets the Application

```
+--------------------------+       Uploads .exe       +-----------------------------+
| GitHub Actions CI / CD   | -----------------------> | GitHub Releases Hub         |
| (builds Electron binary) |                          | (Deepansri94/csc-hub)       |
+--------------------------+                          +-----------------------------+
                                                                     |
                                                                     | Client downloads
                                                                     v
                                                      +-----------------------------+
                                                      | Client Counter PC (Windows) |
                                                      | Installs CSCKiosk-Setup.exe |
                                                      +-----------------------------+
```

1. **Option A: Standalone Windows Installer (`.exe`)**:
   - Admin sends the download link from GitHub Releases or provides the installer on a USB drive (`CSCKiosk-Setup.exe`).
   - Client double-clicks `CSCKiosk-Setup.exe`.
   - The installer installs the app, creates a desktop shortcut **"CSC e-Sevai Kiosk Hub"**, and configures the local background WhatsApp Baileys service.

2. **Option B: Web Version (PWA / Browser)**:
   - Client opens the GitHub Pages link: `https://deepansri94.github.io/csc-hub/`
   - Clicks the **"Install App"** button in the header to install as an offline desktop Progressive Web App.

---

## 3. How Admin Registers a Client

```
+------------------------------------+
| ADMIN PORTAL (Web)                 |
| 1. Navigate to "Admin Hub" tab     |
| 2. Click "Issue New License"       |
| 3. Enter Client Name, Center, Phone|
| 4. Select Plan (Trial / 1 Year)    |
| 5. System generates License Key    |
+------------------------------------+
                  |
                  | Admin shares Key or License JSON File
                  v
+------------------------------------+
| CLIENT (Omalur e-Sevai Kiosk)      |
| Receives:                          |
| - Key: CSC-2026-OMALUR-9481        |
| - File: csc_license_OMALUR.json    |
| - Catalog: csc_master_catalog.json |
+------------------------------------+
```

### Detailed Steps for Admin:
1. Open the web application and click the **Admin Hub** tab in the navigation bar.
2. Under the **Desktop Licenses** tab, click **"Issue New License"**.
3. Fill in:
   - **Kiosk / Center Name**: e.g., *Omalur Sri Balaji e-Sevai Kiosk*
   - **Client / Owner Name**: e.g., *S. Deepan*
   - **Phone Number**: e.g., *9842512345*
   - **Plan**: Select *Standard (6 Months)* or *Enterprise (1 Year)*.
4. Click **"Issue License"**.
5. The system automatically creates a unique encrypted license key:
   `CSC-2026-OMALUR-9481`
6. Click **"File"** to download the `csc_license_CSC-2026-OMALUR-9481.json` configuration file, or click **Copy** to send the license key via WhatsApp or Email to the client.

---

## 4. How Client Setup is Done (Step-by-Step)

```
[Step 1: Launch App] ---> [Step 2: Activate License] ---> [Step 3: Import Catalog] ---> [Step 4: Start Billing]
   CSCKiosk-Setup.exe       Enter Key or Upload File        Load Master Rates JSON        Ready for Customers
```

### Detailed Steps for Client:
1. **Launch Desktop App**:
   - Client launches **CSC e-Sevai Kiosk Hub** on their counter computer.
2. **Activate Store License**:
   - In the header or settings, client clicks **"Store & License Setup"** (or the activation badge).
   - Client inputs their License Key (e.g. `CSC-2026-OMALUR-9481`) OR uploads the `csc_license_OMALUR.json` file provided by the Admin.
   - The app verifies the license and unlocks all Enterprise counter features.
3. **Configure Kiosk Details & UPI ID**:
   - Client enters their UPI ID (e.g. `deepan@okhdfcbank` or Google Pay number) and Payee Business Name so invoice printouts have the live payment QR code.
   - Client enters center address and phone number for invoice headers.
4. **Import Master Catalog (Optional but Recommended)**:
   - In Settings → Services Catalog, client clicks **"Import Master Catalog"** and selects `csc_master_catalog_2026.json`.
   - All standard Tamil Nadu certificate rates and Xerox fees are instantly populated.
5. **Start Live Operations**:
   - Counter is ready for billing! All invoices, customer books, and cash registers function completely offline.
6. **End-of-Day Sync with Admin**:
   - At the end of the day or month, client goes to **Settings → Offline Backup & Restore** and clicks **"Export Backup JSON"**.
   - Client sends this backup file to the Admin, who uploads it in the Admin Hub **Audit Inspector** for financial auditing.

---

## 5. Security & Offline Guarantee

- **No Remote Database Lock-in**: All client data stays 100% on the client's local computer (`localStorage` / IndexedDB / local disk).
- **Zero Internet Required**: Daily counter billing, thermal receipts, and ledger updates never freeze or fail during internet outages.
- **Auditable via Standard JSON**: Admin and Client exchange clean, human-readable `.json` packages for licensing, rate synchronization, and audit reporting.

---

## 6. Single-Machine Commercial License & Anti-Resale Protection

### 🔒 The Anti-Piracy / Anti-Resale Principle
When selling commercial software licenses to individual kiosk owners, you want to guarantee that **one purchased license can only be used on one physical counter PC**, preventing the purchaser from copying or reselling your software to other shops.

```
+-----------------------------------------------------------------------------------+
| Purchaser PC #1 (Hardware ID: HWID-4829-AF91-B702)                                |
| - First activation binds license key strictly to this PC                          |
| - Status: 🟢 AUTHORIZED & ACTIVE                                                  |
+-----------------------------------------------------------------------------------+
                                        |
               Purchaser copies app to  |  (UNAUTHORIZED COPY / RESALE ATTEMPT)
               another friend's PC #2   v
+-----------------------------------------------------------------------------------+
| Other PC #2 (Hardware ID: HWID-9921-CC10-E451)                                    |
| - App detects Hardware Fingerprint Mismatch!                                      |
| - Status: 🛑 ACCESS DENIED (Hardware Lock Violation)                             |
| - Message: "This license key is locked to another computer. It cannot be used or  |
|             resold on this machine."                                              |
+-----------------------------------------------------------------------------------+
```

### How the Hardware Fingerprint Works:
1. **Hardware Fingerprint Generation**:
   - The desktop app extracts physical machine attributes (CPU Architecture, Motherboard Hostname, User Home, Operating System Profile).
   - Generates an encrypted unique Hardware Identifier: `HWID-XXXX-XXXX-XXXX`.
2. **First-Launch Activation Binding**:
   - When the client activates with their License Key, the software binds that key strictly to the current Machine ID.
   - The license status becomes `🔒 Locked to Machine: HWID-XXXX`.
3. **Copy Protection**:
   - If the client copies the desktop application folder or database to another computer or USB drive, the new machine generates a different Hardware ID.
   - The software detects the mismatch and immediately blocks access.
4. **Authorized PC Replacement (Admin Control)**:
   - If the purchaser legitimately buys a new computer or formats their operating system, they contact the Admin.
   - In the **Admin Hub**, Admin finds the client's record and clicks **"Unlock PC"**.
   - This clears the previous hardware lock and permits a single new activation on the purchaser's replacement computer.

---

## 7. Remote Client Monitoring, Troubleshooting & Support Hub

### Can Admin Monitor & Troubleshoot Client Kiosks?
**YES!** Offline desktop counter software vendors monitor and troubleshoot kiosks through structured **Diagnostic Tickets** and **1-Click Repair Patches**:

```
+-----------------------------------------------------------------------------------+
| CLIENT COUNTER KIOSK                                                              |
| 1. Client encounters doubt / error (e.g. printer margins cut off, WhatsApp QR)     |
| 2. Clicks "Help & Support" (LifeBuoy icon in header)                              |
| 3. Types description & clicks:                                                    |
|    - [💬 Send via WhatsApp to Admin] (pre-filled diagnostic snapshot)             |
|    - [📥 Download Support Ticket JSON] (`support_ticket_HWID.json`)               |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Shares ticket via WhatsApp/Email
                                         v
+-----------------------------------------------------------------------------------+
| CENTRAL ADMIN MODULE (Web or Desktop)                                             |
| 1. Admin opens "Diagnostics & Troubleshooting" tab                                |
| 2. Imports `support_ticket.json`                                                  |
| 3. Admin immediately sees:                                                        |
|    - Client Store Name, Owner, Phone, App Version, Hardware ID                    |
|    - Active License Plan & Expiry Date                                            |
|    - Database size (Invoices, Customers, Catalog Services)                        |
|    - Exact System Error Traceback & Client's question                             |
| 4. Admin Takes Action:                                                            |
|    - 1-Click WhatsApp Reply directly to client                                    |
|    - 1-Click "Unlock PC" (if Hardware Lock Mismatch)                              |
|    - 1-Click "Export Repair Patch JSON" (`repair_patch_HWID.json`)                |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Admin sends repair_patch.json
                                         v
+-----------------------------------------------------------------------------------+
| CLIENT COUNTER KIOSK                                                              |
| - Client opens "Help & Support" -> Clicks "Load Repair Patch"                     |
| - Software automatically resolves the issue, clears error logs, or updates rates  |
+-----------------------------------------------------------------------------------+
```

### Live Screen Sharing Option
If a client needs live hands-on assistance (e.g., configuring physical thermal printer drivers or COM ports):
- The Client Support modal provides quick instructions and links for **AnyDesk** or **RustDesk**.
- The client provides their 9-digit remote address to the Admin for a temporary secure live session.


