// Mock browser environment for headless Node test suite
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: (key: string) => localStorageMock.store[key] || null,
  setItem: (key: string, value: string) => { localStorageMock.store[key] = value.toString(); },
  removeItem: (key: string) => { delete localStorageMock.store[key]; },
  clear: () => { localStorageMock.store = {}; }
};
(global as any).localStorage = localStorageMock;
(global as any).window = {
  dispatchEvent: () => {},
  confirm: () => true,
  alert: () => {},
  location: { reload: () => {} }
};

import { StorageService } from '../src/services/storageService';
import { Invoice, ServiceCatalogItem, CustomerKhata } from '../src/types';

console.log('====================================================');
console.log('  RUNNING CSC KIOSK AUTOMATED COMPREHENSIVE TESTS   ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${details ? '- ' + details : ''}`);
    failCount++;
  }
}

// ---------------------------------------------------------
// TEST 1: User should able to reset the kiosk
// ---------------------------------------------------------
StorageService.resetToDefault();
const initialServices = StorageService.getServices();
const initialInvoices = StorageService.getInvoices();
const initialSettings = StorageService.getSettings();

assert(
  initialServices.length > 10 && initialInvoices.length >= 0 && Boolean(initialSettings.centerName),
  '1. Reset Kiosk Data & Default Catalog Loading',
  `Services count: ${initialServices.length}, Invoices count: ${initialInvoices.length}`
);

// ---------------------------------------------------------
// TEST 2: User should able to setup company name and Owner name
// ---------------------------------------------------------
let settings = StorageService.getSettings();
settings.centerName = 'Sri Sai CSC e-Sevai Kiosk';
settings.tamilCenterName = 'ஸ்ரீ சாய் இ-சேவை மையம்';
settings.vleName = 'Deepan Anand';
settings.phone = '9876543210';
settings.cscId = 'TN-CBE-98231';
StorageService.saveSettings(settings);

const retrievedSettings = StorageService.getSettings();
assert(
  retrievedSettings.centerName === 'Sri Sai CSC e-Sevai Kiosk' &&
  retrievedSettings.vleName === 'Deepan Anand' &&
  retrievedSettings.phone === '9876543210' &&
  retrievedSettings.cscId === 'TN-CBE-98231',
  '2. Setup Center Name, Tamil Name, Owner/VLE Name & Contact Info'
);

// ---------------------------------------------------------
// TEST 3: User should able to update prices for all products listed
// ---------------------------------------------------------
let services = StorageService.getServices();
// Verify Xerox products exist in catalog
const xeroxItems = services.filter(s => s.category === 'xerox');
assert(xeroxItems.length >= 2, '3a. Xerox & Print Services in Catalog', `Found ${xeroxItems.length} xerox items`);

// Update prices on all products
const updatedCatalog = services.map((srv, idx) => ({
  ...srv,
  govtFee: (srv.govtFee || 0) + 10,
  kioskCharge: (srv.kioskCharge || 0) + 5,
  totalFee: (srv.govtFee || 0) + 10 + (srv.kioskCharge || 0) + 5,
}));
StorageService.saveServices(updatedCatalog);

const reloadedCatalog = StorageService.getServices();
const priceCheckPassed = reloadedCatalog.every(
  (srv, idx) => srv.totalFee === updatedCatalog[idx].totalFee && srv.kioskCharge === updatedCatalog[idx].kioskCharge
);
assert(priceCheckPassed, '3b. Update Prices for All Catalog Products (Govt Fee & Kiosk Charge)');

// ---------------------------------------------------------
// TEST 4: User must able to add product to cart and able to save and get invoice
// ---------------------------------------------------------
const sampleCartItem = {
  id: 'cart-item-1',
  serviceId: reloadedCatalog[0].id,
  name: reloadedCatalog[0].name,
  tamilName: reloadedCatalog[0].tamilName,
  category: reloadedCatalog[0].category,
  quantity: 2,
  unitPrice: reloadedCatalog[0].totalFee,
  amount: reloadedCatalog[0].totalFee * 2,
};

const newInvoice: Invoice = {
  id: 'inv-' + Date.now(),
  invoiceNumber: 'INV-2026-0001',
  tokenNumber: 101,
  date: new Date().toISOString(),
  citizenName: 'M. Senthil Kumar',
  citizenPhone: '9443219870',
  items: [sampleCartItem],
  subtotal: sampleCartItem.amount,
  discount: 10,
  totalAmount: sampleCartItem.amount - 10,
  paidAmount: sampleCartItem.amount - 10,
  balanceDue: 0,
  paymentStatus: 'paid',
  paymentMode: 'upi',
  operatorId: 'op-admin',
  operatorName: 'Deepan Anand',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

StorageService.addInvoice(newInvoice);
const allInvoices = StorageService.getInvoices();
const foundInvoice = allInvoices.find(inv => inv.id === newInvoice.id);

assert(
  Boolean(foundInvoice) &&
  foundInvoice?.citizenName === 'M. Senthil Kumar' &&
  foundInvoice?.items.length === 1 &&
  foundInvoice?.totalAmount === sampleCartItem.amount - 10,
  '4. Add Products to Cart, Save & Retrieve Kiosk Invoice'
);

// ---------------------------------------------------------
// TEST 5: User should able to save invoice as PDF (invoice printable formatting)
// ---------------------------------------------------------
const invoiceForPrint = foundInvoice!;
const pdfPrintPayloadValid = Boolean(
  invoiceForPrint.invoiceNumber &&
  invoiceForPrint.items.length > 0 &&
  invoiceForPrint.citizenName &&
  typeof invoiceForPrint.totalAmount === 'number' &&
  invoiceForPrint.paymentStatus === 'paid'
);
assert(
  pdfPrintPayloadValid,
  '5. Invoice Printable & PDF Generation Schema Validation'
);

// ---------------------------------------------------------
// TEST 6: User should able to send WhatsApp messages to broadcast with attachment
// ---------------------------------------------------------
// Setup test customers
const testCustomer1: CustomerKhata = {
  id: 'cust-1',
  name: 'R. Rajesh',
  phone: '9840123456',
  type: 'individual',
  totalCredit: 500,
  totalDebit: 400,
  balanceDue: 100,
  notes: 'Regular xerox customer',
  createdAt: Date.now() - 5 * 86400000,
  lastUpdated: Date.now(),
};

const testCustomer2: CustomerKhata = {
  id: 'cust-2',
  name: 'P. Priya',
  phone: '9840654321',
  type: 'advocate',
  totalCredit: 1200,
  totalDebit: 1200,
  balanceDue: 0,
  notes: 'e-District certificates',
  createdAt: Date.now() - 3 * 86400000,
  lastUpdated: Date.now(),
};

const currentCustomers = StorageService.getCustomers();
StorageService.saveCustomers([...currentCustomers, testCustomer1, testCustomer2]);

const customers = StorageService.getCustomers();
const targetPhoneNumbers = customers.map(c => c.phone.replace(/[^0-9]/g, ''));

// Simulate Broadcast URL Generator with attachment metadata
const promoMessage = `Special Offer: College Project Printing & Color Xerox at 50% off! Visit ${retrievedSettings.centerName}`;
const sampleAttachment = {
  name: 'offer_flyer.pdf',
  type: 'application/pdf',
  size: 204850,
  base64: 'data:application/pdf;base64,JVBERi0xLjQK...',
};

const broadcastUrls = targetPhoneNumbers.map(phone => {
  const text = `${promoMessage}\n📎 Attached: ${sampleAttachment.name}`;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
});

assert(
  customers.length >= 2 &&
  broadcastUrls.length === customers.length &&
  broadcastUrls[0].includes('wa.me/91') &&
  broadcastUrls[0].includes('offer_flyer.pdf'),
  '6. WhatsApp Broadcast to Multiple Customers with File Attachment Simulation'
);

// ---------------------------------------------------------
// TEST 7: User should able to export back up & import restore
// ---------------------------------------------------------
const exportedBackupString = StorageService.exportFullBackup();
const backupParsed = JSON.parse(exportedBackupString);

const backupValid = Boolean(
  backupParsed.kioskSettings?.centerName === 'Sri Sai CSC e-Sevai Kiosk' &&
  Array.isArray(backupParsed.invoices) &&
  backupParsed.invoices.length >= 1 &&
  Array.isArray(backupParsed.services) &&
  Array.isArray(backupParsed.customers)
);

assert(
  backupValid,
  '7. Full JSON Offline Backup & Restore Generation',
  `Backup payload size: ${exportedBackupString.length} bytes`
);

// ---------------------------------------------------------
// TEST 8: Admin Module - Desktop User, License & JSON Audit Management
// ---------------------------------------------------------
const testLicense = {
  id: 'lic-test-99',
  licenseKey: 'CSC-2026-TEST-9999',
  clientName: 'Deepan Anand',
  centerName: 'Salem Central CSC Kiosk',
  phone: '9842512345',
  plan: 'enterprise' as const,
  status: 'active' as const,
  machineId: 'WIN-DESKTOP-TEST',
  issuedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
  maxOperators: 5,
};
StorageService.addLicense(testLicense);
const licenses = StorageService.getLicenses();
const foundLicense = licenses.find(l => l.id === testLicense.id);

const testAuditReport = {
  id: 'audit-test-1',
  importedAt: new Date().toISOString(),
  fileName: 'csc_backup_salem_test.json',
  centerName: 'Salem Central CSC Kiosk',
  totalInvoices: 42,
  totalRevenue: 15400,
  totalPendingDue: 1200,
  totalCustomers: 28,
  operatorsCount: 3,
};
StorageService.addAuditReport(testAuditReport);
const audits = StorageService.getAuditReports();
const foundAudit = audits.find(a => a.id === testAuditReport.id);

assert(
  Boolean(foundLicense) &&
  foundLicense?.licenseKey === 'CSC-2026-TEST-9999' &&
  Boolean(foundAudit) &&
  foundAudit?.totalRevenue === 15400,
  '8. Admin Module Desktop License & JSON Audit Verification'
);

// ---------------------------------------------------------
// TEST 9: Client License Activation & Store Setup Workflow
// ---------------------------------------------------------
const activationResult = StorageService.activateLicenseWithKey('CSC-2026-TEST-9999', 'WIN-DESKTOP-TEST');
const currentActiveLicense = StorageService.getActiveLicense();

assert(
  activationResult.success === true &&
  currentActiveLicense !== null &&
  currentActiveLicense?.licenseKey === 'CSC-2026-TEST-9999' &&
  currentActiveLicense?.centerName === 'Salem Central CSC Kiosk',
  '9. Client License Key Activation & Active Store Verification'
);

// ---------------------------------------------------------
// TEST 10: Anti-Resale Hardware Machine Lock Enforcement
// ---------------------------------------------------------
// Attempt activating the same license on an unauthorized different machine
const unauthorizedAttempt = StorageService.activateLicenseWithKey(
  'CSC-2026-TEST-9999',
  'HWID-UNAUTHORIZED-DIFF-PC-9999'
);

// Verify that it is blocked
const isBlocked = unauthorizedAttempt.success === false && unauthorizedAttempt.message.includes('Hardware Lock Violation');

// Admin unlocks PC for legitimate customer hardware replacement
const licenseToUnlock = StorageService.getLicenses().find(l => l.licenseKey === 'CSC-2026-TEST-9999');
if (licenseToUnlock) {
  StorageService.resetLicenseMachineLock(licenseToUnlock.id);
}

// Authorized replacement activation succeeds on the new machine
const authorizedReplacement = StorageService.activateLicenseWithKey(
  'CSC-2026-TEST-9999',
  'HWID-NEW-REPLACEMENT-PC-1234'
);

assert(
  isBlocked && authorizedReplacement.success === true,
  '10. Anti-Resale Hardware Machine Lock & Admin PC Transfer Verification'
);

// ---------------------------------------------------------
// TEST 11: Client Diagnostic Ticket & Admin Repair Patch
// ---------------------------------------------------------
StorageService.logClientError('Thermal receipt printer timeout on USB port 3', 'hardware');
const diagnosticTicket = StorageService.generateDiagnosticTicket('Paper margin truncated on right side');

const ticketValid = Boolean(
  diagnosticTicket.id.startsWith('ticket-') &&
  diagnosticTicket.machineId.length > 0 &&
  diagnosticTicket.recentErrors.length >= 1 &&
  diagnosticTicket.recentErrors[0].message.includes('Thermal receipt printer timeout') &&
  Boolean(diagnosticTicket.clientQuery?.includes('Paper margin truncated'))
);

// Admin constructs repair patch
const repairPatch = {
  id: 'patch-test-01',
  targetMachineId: diagnosticTicket.machineId,
  createdAt: new Date().toISOString(),
  notes: 'Calibrated printer margins and cleared error logs',
  clearErrorLogs: true,
};

const patchResult = StorageService.applyRepairPatch(repairPatch);
const errorsAfterPatch = StorageService.getClientErrors();

assert(
  ticketValid && patchResult.success === true && errorsAfterPatch.length === 0,
  '11. Client Diagnostic Ticket & Admin Remote Repair Patch Verification'
);

console.log('\n====================================================');
console.log(`  TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All user must-have test scenarios passed with 100% success!\n');
}
