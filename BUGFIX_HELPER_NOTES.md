# 🛠️ CSC-HUB — Bug Fix Helper Notes
> **Read this BEFORE touching any code for bug fixes.**
> Generated after full project review. Keep this file updated as fixes are applied.

---

## 📦 Project Overview (Quick Reference)

| Item | Detail |
|------|--------|
| **App Name** | CSC-HUB (Common Service Centre Hub) |
| **Version** | 0.0.0 (package.json) |
| **Type** | Dual-mode: Web Admin Portal + Electron Desktop App |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Desktop Runtime** | Electron 44 + electron-builder |
| **Backend** | Node.js + Express (server.ts) |
| **WhatsApp Gateway** | @whiskeysockets/baileys (server/whatsappService.ts) |
| **Storage** | localStorage (Web) / Electron IPC bridge (Desktop) |
| **PDF/Print** | jsPDF + html2canvas |
| **Icons/Motion** | lucide-react + motion (Framer Motion) |
| **AI Integration** | @google/genai |
| **Logging** | pino |
| **Build Output** | dist/ (web), release/ (Electron .exe/.dmg/.AppImage) |

---

## 🗂️ Project Structure — Key Files

```
csc-hub/
├── src/
│   ├── components/         ← All UI components (React)
│   ├── services/
│   │   └── storageService.ts  ← SINGLE SOURCE OF TRUTH for all data
│   ├── types/
│   │   └── index.ts           ← ALL TypeScript interfaces/types
│   ├── hooks/
│   │   ├── useOnlineStatus.ts
│   │   └── usePWAInstall.ts
│   ├── App.tsx                ← Root component, routing logic
│   └── main.tsx               ← React entry point
├── server/
│   └── whatsappService.ts     ← Express routes for WhatsApp (Baileys)
├── server.ts                  ← Main Express server entry (dev + prod)
├── main.js                    ← Electron main process
├── preload.js                 ← Electron preload (IPC bridge)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🧠 Architecture Rules — MUST KNOW Before Fixing Bugs

### 1. Dual Storage System
- **Web/Browser mode**: Uses `localStorage` directly.
- **Electron/Desktop mode**: Uses `window.electronAPI.storage.save/load` (IPC bridge via `preload.js`).
- `StorageService` in `storageService.ts` handles BOTH automatically via:
  ```ts
  if ((window as any).electronAPI) { /* Electron path */ }
  else { /* localStorage path */ }
  ```
- ⚠️ **Bug Risk**: `storageRemove()` is NOT fully implemented for Electron. It only calls `localStorage.removeItem()`. If you fix anything related to data clearing/reset in Electron mode, this is broken.

### 2. Event-Driven Cross-Tab Sync
- Data changes fire custom `window.dispatchEvent(new Event('csc_*'))` events.
- Components listen to these events to re-render.
- **Key events**: `csc_data_changed`, `csc_invoices_changed`, `csc_customers_changed`, `csc_khata_changed`, `csc_transactions_changed`, `csc_settings_changed`, `csc_license_changed`, `csc_operator_changed`, `csc_templates_changed`, `csc_messages_changed`.
- ⚠️ **Bug Risk**: If a fix saves data but forgets to dispatch the right event, the UI will NOT update reactively.

### 3. Backward Compatibility Aliases
- `CustomerKhata` = alias for `Customer`
- `KhataTransaction` = alias for `Transaction`
- `KhataTxType` = alias for `TxType`
- `getKhataTransactions()` = alias for `getTransactions()`
- `addKhataTransaction()` = alias for `addTransaction()`
- `recordKhataCreditFromInvoice()` = alias for `recordCreditFromInvoice()`
- Transactions are stored in TWO keys simultaneously: `csc_transactions` AND `csc_khata_transactions` (legacy).
- ⚠️ **Bug Risk**: When reading transactions, always check BOTH keys. When writing, always write to BOTH.

### 4. Storage Keys (All 14 Keys)
```ts
OPERATORS:        'csc_operators'
CURRENT_OPERATOR: 'csc_current_operator'
KIOSK_SETTINGS:   'csc_kiosk_settings'
SERVICES:         'csc_services'
INVOICES:         'csc_invoices'
CUSTOMERS:        'csc_customers'
TRANSACTIONS:     'csc_transactions'       // + legacy: 'csc_khata_transactions'
TEMPLATES:        'csc_wa_templates'
MESSAGES:         'csc_messages'
CASH_TALLIES:     'csc_cash_tallies'       // defined but no getter/setter yet!
LICENSES:         'csc_desktop_licenses'
ACTIVE_LICENSE:   'csc_active_license'
AUDIT_REPORTS:    'csc_audit_reports'
ERROR_LOGS:       'csc_client_error_logs'
// Extra legacy key:
'csc_machine_hardware_id'
```
- ⚠️ **Bug Risk**: `CASH_TALLIES` key is defined in `STORAGE_KEYS` but has NO getter/setter methods in `StorageService`. If `DailyCashTally` features are broken, this is why.

---

## 🔴 Security Issues Found (From Full Code Review)

> Fix these carefully — they affect production security.

| # | File | Line | Issue | Severity |
|---|------|------|-------|----------|
| 1 | `server.ts` | 37–38 | **Log Injection (CWE-117)**: User input logged without sanitization | 🔴 High |
| 2 | `server/whatsappService.ts` | 84–85 | **CSRF Missing Protection (CWE-352)**: POST routes have no CSRF token validation | 🔴 High |
| 3 | `server/whatsappService.ts` | 84–85 | **CSRF Disabled (CWE-1275)**: CSRF protection explicitly disabled | 🔴 High |
| 4 | `main.js` | 89–90 | **Path Traversal (CWE-22/23)**: File paths built from untrusted input | 🔴 High |
| 5 | `main.js` | 36–37, 107–108 | **SSRF (CWE-918)**: Untrusted URLs used in network requests without validation | 🔴 High |
| 6 | `scripts/update_icons.ts` | 55–56 | **Log Injection (CWE-117)**: Unsanitized input in logs | 🔴 High |
| 7 | `package-lock.json` | 8214–8215 | **sprintf-js vulnerability**: Unbounded precision causes RangeError DoS | 🟡 Medium |
| 8 | `preload.js` | 0–1 | **Lazy module loading**: Modules imported inside functions, not at top | 🟡 Medium |
| 9 | `package-lock.json` | 15–16 | **qs/express prototype pollution** (withdrawn CVE, low real risk) | 🟢 Low |

---

## ⚠️ Known Code-Level Issues & Gotchas

### storageService.ts
- `storageRemove()` is a **stub** for Electron — it only removes from `localStorage`, NOT from Electron's IPC storage. `resetToDefault()` and `clearLiveData()` will NOT fully work in Electron mode.
- `getMachineFingerprint()` uses `Math.random()` — it is NOT a real hardware fingerprint. It's just a random ID stored in localStorage. Clearing localStorage = new machine ID = license lock bypass.
- `activateLicenseWithKey()` auto-creates a license for any key starting with `CSC-2026-`. This is a security gap — anyone can self-activate.
- `generateInitialInvoices()` uses `Date.now()` at module load time. Dates in seed data are relative to when `init()` is first called.
- `importFullBackup()` silently swallows all errors (`catch {}`). If import fails, the user gets no feedback.

### main.js (Electron)
- Uses `loadURL` with a URL that could be user-influenced (SSRF risk, line 36–37).
- File path construction at line 89–90 is vulnerable to path traversal.
- Always validate and sanitize paths using `path.resolve()` + check they stay within `app.getPath('userData')`.

### server.ts / whatsappService.ts
- No CSRF protection on any POST routes.
- User-provided data (phone numbers, messages) is logged directly via `pino` without sanitization.
- Before fixing WhatsApp bugs, understand that Baileys manages its own session state in the filesystem. Session files are stored separately and must not be deleted during a fix.

### preload.js
- Modules are imported lazily (inside functions). This can cause timing issues in Electron's preload context. Move all `require()` calls to the top of the file.

---

## 🧩 Component Map (src/components/)

| Component | Purpose | Key Dependencies |
|-----------|---------|-----------------|
| `App.tsx` | Root, tab navigation, auth gate | StorageService, all components |
| `AuthModal.tsx` | PIN-based operator login | StorageService.getOperators() |
| `POSBilling.tsx` | Main POS counter billing | StorageService (invoices, services, customers) |
| `XeroxCalculator.tsx` | Xerox/print job calculator | StorageService (services) |
| `InvoiceModal.tsx` | Invoice creation/view/print | jsPDF, html2canvas, StorageService |
| `InvoicesList.tsx` | Invoice history & search | StorageService.getInvoices() |
| `CustomerBook.tsx` | Customer ledger (Khata) | StorageService (customers, transactions) |
| `WhatsAppHub.tsx` | WhatsApp messaging UI | StorageService (templates, messages), server API |
| `AdminModule.tsx` | Admin panel (licenses, audit) | StorageService (licenses, audit reports) |
| `AnalyticsDashboard.tsx` | Revenue charts & stats | StorageService (invoices, customers) |
| `SettingsModal.tsx` | Kiosk settings editor | StorageService.getSettings/saveSettings() |
| `ClientSetupModal.tsx` | License activation & setup | StorageService.activateLicenseWithKey() |
| `ClientSupportModal.tsx` | Diagnostic ticket generator | StorageService.generateDiagnosticTicket() |
| `Header.tsx` | Top bar, operator display | StorageService.getCurrentOperator() |
| `Navigation.tsx` | Tab/module navigation | App state |
| `OfflineIndicator.tsx` | PWA offline banner | useOnlineStatus hook |
| `PWAInstallButton.tsx` | PWA install prompt | usePWAInstall hook |

---

## 💾 Data Flow — Invoice Creation (Critical Path)

```
POSBilling → InvoiceModal
  → StorageService.addInvoice(invoice)
    → saveInvoices()                    ← fires 'csc_invoices_changed'
    → if (balanceDue > 0 && customerId)
        → recordCreditFromInvoice()
          → addTransaction()
            → updates Customer.balanceDue  ← fires 'csc_customers_changed'
            → saves to BOTH transaction keys
            → fires 'csc_transactions_changed' + 'csc_khata_changed'
```
⚠️ If you fix invoice bugs, trace this entire chain. A bug in any step breaks the ledger.

---

## 🔑 License System Notes

- License keys follow format: `CSC-2026-XXXX-XXXX`
- Plans: `trial` | `standard` | `enterprise`
- Status: `active` | `suspended` | `expired`
- Machine lock: stored as `machineId` on the license object
- First activation binds the license to the machine permanently
- Admin can reset machine lock via `resetLicenseMachineLock(licenseId)`
- `AdminRepairPatch` can remotely: issue new license, reset machine lock, update catalog, clear error logs

---

## 🚀 Dev Commands

```bash
npm run dev           # Start Express + Baileys + Vite (full stack dev)
npm run build         # Build web bundle → dist/
npm run electron:dev  # Vite on :3000 + Electron side-by-side
npm run electron:build # Build .exe / .dmg / .AppImage → release/
npm test              # Run tsx scripts/run_test.ts
npm run lint          # TypeScript type check only (no ESLint configured)
```

---

## 📋 Pre-Bug-Fix Checklist

Before starting ANY bug fix, confirm:

- [ ] **Which mode is affected?** Web browser only, Electron only, or both?
- [ ] **Is it a storage bug?** Check if both `localStorage` and Electron IPC paths are affected.
- [ ] **Does the fix involve data writes?** Ensure the correct `window.dispatchEvent` events are fired after saving.
- [ ] **Does the fix touch transactions?** Write to BOTH `csc_transactions` AND `csc_khata_transactions`.
- [ ] **Does the fix touch invoices?** Trace the full invoice → customer ledger chain above.
- [ ] **Is it a UI-only bug?** Check if the component is listening to the right storage event.
- [ ] **Does the fix touch Electron IPC?** Remember `storageRemove()` is broken in Electron — don't rely on it.
- [ ] **Does the fix touch server.ts or whatsappService.ts?** Sanitize all user inputs before logging or using in requests.
- [ ] **Does the fix touch main.js?** Validate all file paths with `path.resolve()` and check bounds.
- [ ] **Run `npm run lint`** before and after the fix to catch TypeScript errors.
- [ ] **Test in both Web and Electron modes** if the fix touches StorageService.

---

## 🗒️ Notes & Reminders

1. **No ESLint is configured** — only TypeScript type checking via `tsc --noEmit`. Code style is not enforced automatically.
2. **No test framework** — `scripts/run_test.ts` is a custom script, not Jest/Vitest. Add proper tests if fixing critical logic.
3. **Tamil language strings** are used throughout (UI labels, service names, WhatsApp templates). Do NOT accidentally break Unicode/Tamil text rendering.
4. **GST is set to 0%** by default — CSC government services are typically GST-exempt. Don't add GST logic without confirming the service category.
5. **Default seed data** (operators, customers, invoices) is hardcoded in `storageService.ts`. It uses real-looking Tamil Nadu data (Omalur, Salem). This is demo data — don't treat it as production.
6. **Default admin PIN is `1234`** and operator PIN is `0000`** — these are in the seed data. Security-sensitive.
7. **`sprintf-js` dependency** has a known DoS vulnerability (unbounded precision). Update it when possible: `npm update sprintf-js`.
8. **Vite version is 8.x** and React is 19.x — both are very recent. Check changelogs if you hit unexpected build issues.
9. **Tailwind CSS v4** is used (not v3). The config approach is different — uses `@tailwindcss/vite` plugin, not `tailwind.config.js`.
10. **PWA is configured** via `vite-plugin-pwa`. Service worker and manifest are auto-generated. Don't manually edit `dist/` PWA files.

---

*Last updated: After full project code review. Update this file whenever a significant bug is fixed or new patterns are introduced.*
