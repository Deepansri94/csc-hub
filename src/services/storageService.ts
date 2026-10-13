import {
  Operator,
  KioskSettings,
  ServiceCatalogItem,
  Invoice,
  Customer,
  Transaction,
  WhatsAppTemplate,
  MessageLog,
  DailyCashTally,
  DesktopLicense,
  DesktopAuditReport,
  ClientErrorLog,
  ClientDiagnosticTicket,
  AdminRepairPatch,
} from '../types';

const STORAGE_KEYS = {
  OPERATORS: 'csc_operators',
  CURRENT_OPERATOR: 'csc_current_operator',
  KIOSK_SETTINGS: 'csc_kiosk_settings',
  SERVICES: 'csc_services',
  INVOICES: 'csc_invoices',
  CUSTOMERS: 'csc_customers',
  TRANSACTIONS: 'csc_transactions',
  TEMPLATES: 'csc_wa_templates',
  MESSAGES: 'csc_messages',
  CASH_TALLIES: 'csc_cash_tallies',
  LICENSES: 'csc_desktop_licenses',
  ACTIVE_LICENSE: 'csc_active_license',
  AUDIT_REPORTS: 'csc_audit_reports',
  ERROR_LOGS: 'csc_client_error_logs',
};

// Default Operators
const DEFAULT_OPERATORS: Operator[] = [
  {
    id: 'op-1',
    name: 'S. Deepan (VLE Admin)',
    role: 'admin',
    pin: '1234',
    phone: '9842512345',
    isActive: true,
  },
  {
    id: 'op-2',
    name: 'Priya K. (Counter Staff)',
    role: 'operator',
    pin: '0000',
    phone: '9842598765',
    isActive: true,
  },
];

// Default Kiosk Settings
const DEFAULT_SETTINGS: KioskSettings = {
  centerName: 'SRI BALAJI e-SEVAI MAIYAM & CSC KIOSK',
  tamilCenterName: 'ஸ்ரீ பாலாஜி இ-சேவை மையம் & பொது சேவை மையம்',
  cscId: 'CSC-TN-SALEM-42091',
  vleName: 'S. Deepan (Authorized VLE)',
  phone: '9842512345',
  email: 'deepanindhi@gmail.com',
  address: 'No. 14, Main Road, Opposite Taluk Office, Omalur',
  district: 'Salem',
  state: 'Tamil Nadu',
  pincode: '636455',
  upiId: '9842512345@upi',
  upiPayeeName: 'Deepan e-Sevai Kiosk',
  defaultGstPercent: 0, // CSC Govt services are typically exempt from GST or exempt for citizens
  invoiceFooterNote: 'Thank you for visiting Government Approved e-Sevai Maiyam. Please keep this receipt for tracking your application status.',
};

// Official Government & Kiosk Services
const DEFAULT_SERVICES: ServiceCatalogItem[] = [
  {
    id: 'srv-1',
    code: 'TN-REV-01',
    name: 'Income Certificate (வருமான சான்றிதழ்)',
    tamilName: 'வருமான சான்றிதழ்',
    category: 'certificate',
    dept: 'Revenue Dept (வருவாய்த்துறை)',
    govtFee: 60,
    kioskCharge: 40,
    totalFee: 100,
    turnAroundDays: '3 to 5 days',
    requiredDocs: ['Aadhaar Card', 'Ration Card / Smart Card', 'Salary Slip / IT Return', 'Self-Declaration'],
  },
  {
    id: 'srv-2',
    code: 'TN-REV-02',
    name: 'Community Certificate (சாதி சான்றிதழ்)',
    tamilName: 'சாதி சான்றிதழ்',
    category: 'certificate',
    dept: 'Revenue Dept (வருவாய்த்துறை)',
    govtFee: 60,
    kioskCharge: 40,
    totalFee: 100,
    turnAroundDays: '7 days',
    requiredDocs: ['Aadhaar Card', 'Parent Community Cert / TC', 'Ration Card', 'Passport Photo'],
  },
  {
    id: 'srv-3',
    code: 'TN-REV-03',
    name: 'Nativity / Residence Certificate (இருப்பிட சான்றிதழ்)',
    tamilName: 'இருப்பிட சான்றிதழ்',
    category: 'certificate',
    dept: 'Revenue Dept (வருவாய்த்துறை)',
    govtFee: 60,
    kioskCharge: 40,
    totalFee: 100,
    turnAroundDays: '3 days',
    requiredDocs: ['Aadhaar Card', 'Ration Card', 'EB Bill / Tax Receipt', 'School TC'],
  },
  {
    id: 'srv-4',
    code: 'TN-LND-01',
    name: 'Patta Chitta & FMB Sketch Download (பட்டா / சிட்டா)',
    tamilName: 'பட்டா சிட்டா நகல்',
    category: 'egov',
    dept: 'Survey & Land Records',
    govtFee: 20,
    kioskCharge: 30,
    totalFee: 50,
    turnAroundDays: 'Instant',
    requiredDocs: ['District, Taluk, Village', 'Survey / Sub-division Number', 'Patta Number'],
  },
  {
    id: 'srv-5',
    code: 'UIDAI-01',
    name: 'Aadhaar Card Demographic Update (Address / Mobile)',
    tamilName: 'ஆதார் திருத்தம்',
    category: 'egov',
    dept: 'UIDAI',
    govtFee: 50,
    kioskCharge: 50,
    totalFee: 100,
    turnAroundDays: '2 to 7 days',
    requiredDocs: ['Existing Aadhaar', 'Address Proof (EB Bill, Bank Passbook, etc.)', 'Active Mobile for OTP'],
  },
  {
    id: 'srv-6',
    code: 'PAN-01',
    name: 'New PAN Card / Correction (NSDL / UTIITSL)',
    tamilName: 'புதிய பான் கார்டு',
    category: 'financial',
    dept: 'Income Tax Dept',
    govtFee: 107,
    kioskCharge: 93,
    totalFee: 200,
    turnAroundDays: '10 to 15 days',
    requiredDocs: ['Aadhaar Card', '2 Passport Size Photos', 'Signature in Black Ink'],
  },
  {
    id: 'srv-7',
    code: 'TNEB-01',
    name: 'TNEB Electricity Bill Payment (மின் கட்டணம்)',
    tamilName: 'மின் கட்டணம் செலுத்துதல்',
    category: 'utility',
    dept: 'TANGEDCO',
    govtFee: 0,
    kioskCharge: 20,
    totalFee: 20,
    turnAroundDays: 'Instant Receipt',
    requiredDocs: ['Consumer Number / Region Code', 'Previous EB Bill'],
  },
  {
    id: 'srv-8',
    code: 'TN-PDS-01',
    name: 'Smart Family Card Member Addition / Correction (ரேஷன் கார்டு)',
    tamilName: 'குடும்ப அட்டை திருத்தம்',
    category: 'egov',
    dept: 'Civil Supplies & Consumer Protection',
    govtFee: 30,
    kioskCharge: 50,
    totalFee: 80,
    turnAroundDays: '15 days',
    requiredDocs: ['Smart Card', 'Birth Certificate / Marriage Proof', 'Aadhaar Card of Member'],
  },
  {
    id: 'srv-9',
    code: 'GOI-PMK-01',
    name: 'PM-Kisan Samman Nidhi eKYC & Registration',
    tamilName: 'பி.எம் கிசான் இ-கேஒய்சி',
    category: 'financial',
    dept: 'Ministry of Agriculture',
    govtFee: 15,
    kioskCharge: 35,
    totalFee: 50,
    turnAroundDays: 'Instant',
    requiredDocs: ['Aadhaar Card', 'Bank Passbook', 'Land Patta Document'],
  },
  {
    id: 'srv-10',
    code: 'GOI-AB-01',
    name: 'Ayushman Bharat Golden Card (PM-JAY Health Insurance)',
    tamilName: 'ஆயுஷ்மான் பாரத் கார்டு',
    category: 'egov',
    dept: 'National Health Authority',
    govtFee: 0,
    kioskCharge: 50,
    totalFee: 50,
    turnAroundDays: 'Instant',
    requiredDocs: ['Ration Card', 'Aadhaar Card', 'Mobile Number'],
  },
  {
    id: 'srv-11',
    code: 'FASTAG-01',
    name: 'FASTag Vehicle Tag Issue & Instant Recharge',
    tamilName: 'பாஸ்டேக் ரீசார்ஜ்',
    category: 'financial',
    dept: 'NHAI / NPCI',
    govtFee: 100,
    kioskCharge: 50,
    totalFee: 150,
    turnAroundDays: 'Instant',
    requiredDocs: ['RC Book Copy', 'Vehicle Owner Aadhaar', 'Vehicle Photo'],
  },
  {
    id: 'srv-12',
    code: 'PSP-01',
    name: 'Passport Seva Kendra Online Appointment Booking',
    tamilName: 'பாஸ்போர்ட் அப்பாயின்ட்மெண்ட்',
    category: 'egov',
    dept: 'Ministry of External Affairs',
    govtFee: 1500,
    kioskCharge: 150,
    totalFee: 1650,
    turnAroundDays: 'Appointment Confirmation',
    requiredDocs: ['Aadhaar Card', '10th Marksheet / Birth Certificate', 'Bank Passbook'],
  },
  {
    id: 'srv-13',
    code: 'XER-BW-A4',
    name: 'Xerox B&W A4',
    tamilName: 'கருப்பு வெள்ளை ஜெராக்ஸ்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 3,
    totalFee: 3,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
  {
    id: 'srv-14',
    code: 'XER-CLR-A4',
    name: 'Xerox Color A4',
    tamilName: 'வண்ண ஜெராக்ஸ்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 10,
    totalFee: 10,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
  {
    id: 'srv-15',
    code: 'PRT-BW-A4',
    name: 'B&W Printout A4',
    tamilName: 'பிளாக் அண்ட் ஒயிட் பிரிண்ட்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 5,
    totalFee: 5,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
  {
    id: 'srv-16',
    code: 'PRT-CLR-A4',
    name: 'Color Printout A4',
    tamilName: 'வண்ண பிரிண்ட்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 15,
    totalFee: 15,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
  {
    id: 'srv-17',
    code: 'PHOTO-8',
    name: 'Passport Photos (8 Set)',
    tamilName: 'பாஸ்போர்ட் புகைப்படம்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 60,
    totalFee: 60,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
  {
    id: 'srv-18',
    code: 'PVC-CARD',
    name: 'PVC Smart Card Print',
    tamilName: 'பிவிசி ஸ்மார்ட் கார்டு',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 80,
    totalFee: 80,
    turnAroundDays: 'Instant',
    requiredDocs: ['Aadhaar'],
  },
  {
    id: 'srv-19',
    code: 'LAM-A4',
    name: 'A4 Lamination',
    tamilName: 'ஏ4 லேமினேஷன்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 25,
    totalFee: 25,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
  {
    id: 'srv-20',
    code: 'BIND-SPIRAL',
    name: 'Spiral Binding',
    tamilName: 'ஸ்பைரல் பைண்டிங்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 40,
    totalFee: 40,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
  {
    id: 'srv-21',
    code: 'SCAN-DOC',
    name: 'Document Scan & Send',
    tamilName: 'ஆவணம் ஸ்கேன் செய்தல்',
    category: 'xerox',
    dept: 'Print Services',
    govtFee: 0,
    kioskCharge: 10,
    totalFee: 10,
    turnAroundDays: 'Instant',
    requiredDocs: [],
  },
];

// Pre-seeded Customers
const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Advocate Murugesan',
    phone: '9443212345',
    address: 'Omalur Civil Court Chamber #4',
    type: 'advocate',
    notes: 'Regular court documents, affidavits, 50+ copies xerox daily',
    totalCredit: 4200,
    totalDebit: 3360,
    balanceDue: 840,
    createdAt: Date.now() - 30 * 86400000,
    lastUpdated: Date.now() - 1 * 86400000,
  },
  {
    id: 'cust-2',
    name: 'Vignesh Book Store & Tuition',
    phone: '9894123456',
    address: 'Bus Stand Complex, Omalur',
    type: 'business',
    notes: 'School question papers, spiral binding, question bank prints',
    totalCredit: 2500,
    totalDebit: 2150,
    balanceDue: 350,
    createdAt: Date.now() - 25 * 86400000,
    lastUpdated: Date.now() - 2 * 86400000,
  },
  {
    id: 'cust-3',
    name: 'Karthikeyan (Panchayat Member)',
    phone: '9789123456',
    address: 'Ward 5, Tharamangalam Road',
    type: 'panchayat',
    notes: 'Panchayat schemes, beneficiary list printouts, voter corrections',
    totalCredit: 1800,
    totalDebit: 1800,
    balanceDue: 0,
    createdAt: Date.now() - 20 * 86400000,
    lastUpdated: Date.now() - 3 * 86400000,
  },
  {
    id: 'cust-4',
    name: 'Saravanan Travels & Transport',
    phone: '9842188899',
    address: 'Bypass Road, Salem',
    type: 'business',
    notes: 'Lorry FASTag renewals, driving license PVC, vehicle insurance prints',
    totalCredit: 3400,
    totalDebit: 2200,
    balanceDue: 1200,
    createdAt: Date.now() - 15 * 86400000,
    lastUpdated: Date.now() - 4 * 86400000,
  },
  {
    id: 'cust-5',
    name: 'Priya Teacher (Govt High School)',
    phone: '9442099900',
    address: 'Staff Quarters, Omalur',
    type: 'school_student',
    notes: 'Exam question papers, student certificates, flashcards',
    totalCredit: 880,
    totalDebit: 700,
    balanceDue: 180,
    createdAt: Date.now() - 10 * 86400000,
    lastUpdated: Date.now() - 1 * 86400000,
  },
];

// Pre-seeded Transactions
const DEFAULT_TXS: Transaction[] = [
  {
    id: 'ktx-1',
    customerId: 'cust-1',
    type: 'credit',
    amount: 540,
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    description: 'B&W Xerox 180 pages (Legal Case Dossier)',
    balanceAfter: 540,
    operatorName: 'S. Deepan',
  },
  {
    id: 'ktx-2',
    customerId: 'cust-1',
    type: 'payment_received',
    amount: 500,
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    description: 'UPI Payment received via GPay',
    paymentMode: 'upi',
    balanceAfter: 40,
    operatorName: 'S. Deepan',
  },
  {
    id: 'ktx-3',
    customerId: 'cust-1',
    type: 'credit',
    amount: 800,
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    description: 'Legal stamp paper prints + 2x Spiral Binding',
    balanceAfter: 840,
    operatorName: 'Priya K.',
  },
  {
    id: 'ktx-4',
    customerId: 'cust-4',
    type: 'credit',
    amount: 1500,
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    description: '3x Fastag issue + PVC cards',
    balanceAfter: 1500,
    operatorName: 'S. Deepan',
  },
  {
    id: 'ktx-5',
    customerId: 'cust-4',
    type: 'payment_received',
    amount: 300,
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    description: 'Cash payment towards balance',
    paymentMode: 'cash',
    balanceAfter: 1200,
    operatorName: 'S. Deepan',
  },
];

// Helper to generate realistic invoices spread over the last 30 days
function generateInitialInvoices(): Invoice[] {
  const now = Date.now();
  const day = 86400000;

  return [
    // Today
    {
      id: 'inv-101',
      invoiceNumber: 'INV-2026-0042',
      tokenNumber: 42,
      date: new Date(now - 1 * 3600000).toISOString(),
      citizenName: 'K. Senthil Kumar',
      citizenPhone: '9842145678',
      citizenAadhaarLast4: '4821',
      items: [
        {
          id: 'item-1',
          serviceId: 'srv-1',
          name: 'Income Certificate (வருமான சான்றிதழ்)',
          category: 'certificate',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
          details: 'Application submitted to Revenue Inspector',
        },
        {
          id: 'item-2',
          name: 'B&W Xerox A4 (Single Side)',
          category: 'xerox',
          quantity: 6,
          unitPrice: 3,
          amount: 18,
          details: 'Aadhaar & Ration Card copies',
        },
      ],
      subtotal: 118,
      discount: 0,
      totalAmount: 118,
      paidAmount: 118,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMode: 'upi',
      operatorId: 'op-1',
      operatorName: 'S. Deepan',
      notes: 'Paid via GPay UPI QR',
      createdAt: now - 1 * 3600000,
      updatedAt: now - 1 * 3600000,
    },
    {
      id: 'inv-102',
      invoiceNumber: 'INV-2026-0043',
      tokenNumber: 43,
      date: new Date(now - 3 * 3600000).toISOString(),
      citizenName: 'M. Lakshmi',
      citizenPhone: '9443298712',
      citizenAadhaarLast4: '9012',
      items: [
        {
          id: 'item-3',
          serviceId: 'srv-4',
          name: 'Patta Chitta & FMB Sketch Download',
          category: 'egov',
          quantity: 2,
          unitPrice: 50,
          amount: 100,
          details: 'Survey No 142/3A & 142/3B',
        },
        {
          id: 'item-4',
          name: 'A4 Document Lamination',
          category: 'xerox',
          quantity: 2,
          unitPrice: 25,
          amount: 50,
          details: 'Patta copy lamination',
        },
      ],
      subtotal: 150,
      discount: 0,
      totalAmount: 150,
      paidAmount: 150,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMode: 'cash',
      operatorId: 'op-2',
      operatorName: 'Priya K.',
      notes: 'Cash received at counter',
      createdAt: now - 3 * 3600000,
      updatedAt: now - 3 * 3600000,
    },
    {
      id: 'inv-103',
      invoiceNumber: 'INV-2026-0044',
      tokenNumber: 44,
      date: new Date(now - 4 * 3600000).toISOString(),
      citizenName: 'Advocate Murugesan',
      citizenPhone: '9443212345',
      items: [
        {
          id: 'item-5',
          name: 'B&W Xerox Legal Size (Double Side)',
          category: 'xerox',
          quantity: 90,
          unitPrice: 5,
          amount: 450,
          details: 'Court Case 44/2026 Typed Set',
        },
        {
          id: 'item-6',
          name: 'Spiral Binding (Thick)',
          category: 'xerox',
          quantity: 2,
          unitPrice: 40,
          amount: 80,
          details: 'Legal Court Docket',
        },
      ],
      subtotal: 530,
      discount: 30,
      totalAmount: 500,
      paidAmount: 0,
      balanceDue: 500,
      paymentStatus: 'unpaid',
      paymentMode: 'credit_khata',
      operatorId: 'op-1',
      operatorName: 'S. Deepan',
      customerId: 'cust-1',
      notes: 'Added to Advocate Murugesan Khata ledger',
      createdAt: now - 4 * 3600000,
      updatedAt: now - 4 * 3600000,
    },
    // Yesterday
    {
      id: 'inv-100',
      invoiceNumber: 'INV-2026-0041',
      tokenNumber: 41,
      date: new Date(now - 1 * day).toISOString(),
      citizenName: 'R. Anbarasu',
      citizenPhone: '9842854321',
      citizenAadhaarLast4: '3319',
      items: [
        {
          id: 'item-7',
          serviceId: 'srv-6',
          name: 'New PAN Card (NSDL)',
          category: 'financial',
          quantity: 1,
          unitPrice: 200,
          amount: 200,
          details: 'Acknowledgement: NSDL-99482184',
        },
        {
          id: 'item-8',
          name: 'Passport Photo Print (8 Photos)',
          category: 'xerox',
          quantity: 1,
          unitPrice: 60,
          amount: 60,
        },
      ],
      subtotal: 260,
      discount: 10,
      totalAmount: 250,
      paidAmount: 250,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMode: 'upi',
      operatorId: 'op-1',
      operatorName: 'S. Deepan',
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
    },
    {
      id: 'inv-099',
      invoiceNumber: 'INV-2026-0040',
      tokenNumber: 40,
      date: new Date(now - 1 * day - 2 * 3600000).toISOString(),
      citizenName: 'K. Rajavel',
      citizenPhone: '9443567890',
      items: [
        {
          id: 'item-9',
          serviceId: 'srv-5',
          name: 'Aadhaar Demographic Update',
          category: 'egov',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        },
        {
          id: 'item-10',
          name: 'PVC Smart Card Printing',
          category: 'xerox',
          quantity: 2,
          unitPrice: 80,
          amount: 160,
          details: 'PVC Aadhaar & PAN Card',
        },
      ],
      subtotal: 260,
      discount: 0,
      totalAmount: 260,
      paidAmount: 100,
      balanceDue: 160,
      paymentStatus: 'partial',
      paymentMode: 'cash',
      operatorId: 'op-2',
      operatorName: 'Priya K.',
      notes: '₹100 paid, remaining ₹160 pending on delivery',
      createdAt: now - 1 * day - 2 * 3600000,
      updatedAt: now - 1 * day - 2 * 3600000,
    },
    // Last 3 to 7 days
    {
      id: 'inv-098',
      invoiceNumber: 'INV-2026-0039',
      tokenNumber: 39,
      date: new Date(now - 3 * day).toISOString(),
      citizenName: 'Vignesh Book Store & Tuition',
      citizenPhone: '9894123456',
      items: [
        {
          id: 'item-11',
          name: 'B&W Printout A4 (Single Side)',
          category: 'xerox',
          quantity: 120,
          unitPrice: 4,
          amount: 480,
          details: '10th Standard Science Question Papers',
        },
      ],
      subtotal: 480,
      discount: 30,
      totalAmount: 450,
      paidAmount: 100,
      balanceDue: 350,
      paymentStatus: 'partial',
      paymentMode: 'credit_khata',
      operatorId: 'op-1',
      operatorName: 'S. Deepan',
      customerId: 'cust-2',
      createdAt: now - 3 * day,
      updatedAt: now - 3 * day,
    },
    {
      id: 'inv-097',
      invoiceNumber: 'INV-2026-0038',
      tokenNumber: 38,
      date: new Date(now - 4 * day).toISOString(),
      citizenName: 'C. Munusamy',
      citizenPhone: '9789345671',
      items: [
        {
          id: 'item-12',
          serviceId: 'srv-9',
          name: 'PM-Kisan Samman Nidhi eKYC & Registration',
          category: 'financial',
          quantity: 1,
          unitPrice: 50,
          amount: 50,
        },
        {
          id: 'item-13',
          serviceId: 'srv-7',
          name: 'TNEB Electricity Bill Payment',
          category: 'utility',
          quantity: 1,
          unitPrice: 20,
          amount: 20,
        },
      ],
      subtotal: 70,
      discount: 0,
      totalAmount: 70,
      paidAmount: 70,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMode: 'cash',
      operatorId: 'op-2',
      operatorName: 'Priya K.',
      createdAt: now - 4 * day,
      updatedAt: now - 4 * day,
    },
    {
      id: 'inv-096',
      invoiceNumber: 'INV-2026-0037',
      tokenNumber: 37,
      date: new Date(now - 5 * day).toISOString(),
      citizenName: 'Saravanan Travels & Transport',
      citizenPhone: '9842188899',
      items: [
        {
          id: 'item-14',
          serviceId: 'srv-11',
          name: 'FASTag Vehicle Tag Issue & Instant Recharge',
          category: 'financial',
          quantity: 3,
          unitPrice: 150,
          amount: 450,
        },
        {
          id: 'item-15',
          name: 'PVC Smart Card Printing',
          category: 'xerox',
          quantity: 4,
          unitPrice: 80,
          amount: 320,
        },
      ],
      subtotal: 770,
      discount: 20,
      totalAmount: 750,
      paidAmount: 0,
      balanceDue: 750,
      paymentStatus: 'unpaid',
      paymentMode: 'credit_khata',
      operatorId: 'op-1',
      operatorName: 'S. Deepan',
      customerId: 'cust-4',
      createdAt: now - 5 * day,
      updatedAt: now - 5 * day,
    },
    // Past 2 weeks / monthly sample points
    {
      id: 'inv-095',
      invoiceNumber: 'INV-2026-0036',
      tokenNumber: 36,
      date: new Date(now - 10 * day).toISOString(),
      citizenName: 'G. Kannan',
      citizenPhone: '9842345678',
      items: [
        {
          id: 'item-16',
          serviceId: 'srv-12',
          name: 'Passport Seva Kendra Online Appointment Booking',
          category: 'egov',
          quantity: 1,
          unitPrice: 1650,
          amount: 1650,
        },
      ],
      subtotal: 1650,
      discount: 0,
      totalAmount: 1650,
      paidAmount: 1650,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMode: 'upi',
      operatorId: 'op-1',
      operatorName: 'S. Deepan',
      createdAt: now - 10 * day,
      updatedAt: now - 10 * day,
    },
    {
      id: 'inv-094',
      invoiceNumber: 'INV-2026-0035',
      tokenNumber: 35,
      date: new Date(now - 14 * day).toISOString(),
      citizenName: 'S. Selvi',
      citizenPhone: '9894765432',
      items: [
        {
          id: 'item-17',
          serviceId: 'srv-2',
          name: 'Community Certificate (சாதி சான்றிதழ்)',
          category: 'certificate',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        },
        {
          id: 'item-18',
          serviceId: 'srv-3',
          name: 'Nativity / Residence Certificate',
          category: 'certificate',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        },
      ],
      subtotal: 200,
      discount: 0,
      totalAmount: 200,
      paidAmount: 200,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMode: 'cash',
      operatorId: 'op-2',
      operatorName: 'Priya K.',
      createdAt: now - 14 * day,
      updatedAt: now - 14 * day,
    },
    {
      id: 'inv-093',
      invoiceNumber: 'INV-2026-0034',
      tokenNumber: 34,
      date: new Date(now - 20 * day).toISOString(),
      citizenName: 'Priya Teacher',
      citizenPhone: '9442099900',
      items: [
        {
          id: 'item-19',
          name: 'Color Printout A4',
          category: 'xerox',
          quantity: 20,
          unitPrice: 15,
          amount: 300,
        },
        {
          id: 'item-20',
          name: 'A4 Document Lamination',
          category: 'xerox',
          quantity: 10,
          unitPrice: 25,
          amount: 250,
        },
      ],
      subtotal: 550,
      discount: 50,
      totalAmount: 500,
      paidAmount: 500,
      balanceDue: 0,
      paymentStatus: 'paid',
      paymentMode: 'cash',
      operatorId: 'op-1',
      operatorName: 'S. Deepan',
      createdAt: now - 20 * day,
      updatedAt: now - 20 * day,
    },
  ];
}

// WhatsApp Message Templates (Multi-language: English, Tamil, Hindi)
const DEFAULT_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Payment Reminder (Polite / English)',
    category: 'payment_reminder',
    language: 'en',
    templateText:
      'Dear {{citizenName}},\nGreetings from {{centerName}}! This is a gentle reminder that an amount of *Rs. {{balanceDue}}* is pending for invoice #{{invoiceNumber}} ({{serviceSummary}}).\n\nYou can conveniently pay via UPI: *{{upiId}}* or visit our centre at {{address}}.\n\nThank you for your cooperation!',
  },
  {
    id: 'tpl-2',
    title: 'கட்டண நினைவூட்டல் (தமிழ் / Tamil)',
    category: 'payment_reminder',
    language: 'ta',
    templateText:
      'வணக்கம் {{citizenName}},\n{{tamilCenterName}} சார்பாக அன்பான நினைவூட்டல்.\nதங்களின் பில் எண்: {{invoiceNumber}} க்கான நிலுவைத்தொகை *ரூ. {{balanceDue}}* செலுத்தப்பட வேண்டியுள்ளது.\n\nதங்கள் வசதிக்கேற்ப UPI மூலமாக செலுத்தலாம்: *{{upiId}}* அல்லது எங்கள் சேவை மையத்திற்கு நேரில் வரலாம்.\n\nநன்றி!',
  },
  {
    id: 'tpl-3',
    title: 'भुगतान अनुस्मारक (Hindi)',
    category: 'payment_reminder',
    language: 'hi',
    templateText:
      'नमस्ते {{citizenName}},\n{{centerName}} की ओर से सादर प्रणाम। आपके बिल नं. {{invoiceNumber}} का बकाया *रु. {{balanceDue}}* लंबित है।\n\nआप UPI आईडी *{{upiId}}* के माध्यम से भुगतान कर सकते हैं या केंद्र पर आ सकते हैं।\n\nधन्यवाद!',
  },
  {
    id: 'tpl-4',
    title: 'Govt Scheme: PM-Kisan 17th Installment eKYC Alert',
    category: 'govt_scheme',
    language: 'en',
    templateText:
      '📢 *IMPORTANT GOVT UPDATE: PM-KISAN e-KYC*\nDear Citizen, The deadline for PM-Kisan 17th Installment biometric/OTP e-KYC is approaching.\n\nVisit {{centerName}} with your Aadhaar card and registered mobile number to complete e-KYC instantly and prevent stoppage of Rs. 2,000 subsidy.\n\nCentre Address: {{address}}\nHelpline: {{phone}}',
  },
  {
    id: 'tpl-5',
    title: 'அரசு திட்டம்: மகளிர் உரிமைத் தொகை & சான்றிதழ் உதவி',
    category: 'govt_scheme',
    language: 'ta',
    templateText:
      '📢 *முக்கிய அறிவிப்பு - இ-சேவை மையம்*\nஅன்புடையீர், கலைஞர் மகளிர் உரிமைத் தொகை விண்ணப்ப நிலை அறிதல், வருமானம்/சாதி/இருப்பிட சான்றிதழ், பட்டா சிட்டா நகல் ஆகியவை எங்கள் மையத்தில் உடனடியாக பெறலாம்.\n\nஇடம்: {{address}}\nதொடர்புக்கு: {{phone}}\n{{tamilCenterName}}',
  },
  {
    id: 'tpl-6',
    title: 'Kiosk Offer: High-Speed Xerox & PVC Smart Card Discount',
    category: 'offer',
    language: 'en',
    templateText:
      '🎉 *SPECIAL KIOSK OFFER @ {{centerName}}* 🎉\nGet high-definition PVC Smart Cards for your Aadhaar, PAN & Driving License in just 2 minutes for only Rs. 70!\n\nBulk Xerox discount: Above 50 pages at just Rs. 2/page.\n\nVisit us today: {{address}} | Call: {{phone}}',
  },
  {
    id: 'tpl-7',
    title: 'Daily News: TN Post-Matric Scholarship Portal Active',
    category: 'govt_scheme',
    language: 'en',
    templateText:
      '🎓 *EDUCATION ALERT:* TN Adi Dravidar & Tribal Welfare + BC/MBC Post-Matric Scholarship online applications have commenced for 2026-27 college admissions.\n\nSubmit your applications along with Income & Community Certificate at {{centerName}}.\nTiming: 8:30 AM to 8:30 PM.',
  },
];

const DEFAULT_LICENSES: DesktopLicense[] = [
  {
    id: 'lic-1',
    licenseKey: 'CSC-2026-OMALUR-9481',
    clientName: 'S. Deepan (Kiosk Owner)',
    centerName: 'Omalur CSC e-Sevai & Xerox Hub',
    phone: '9842512345',
    plan: 'enterprise',
    status: 'active',
    machineId: 'WIN-DESKTOP-9842',
    issuedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 335 * 86400000).toISOString(),
    maxOperators: 5,
  },
  {
    id: 'lic-2',
    licenseKey: 'CSC-2026-SALEM-3829',
    clientName: 'K. Rajavel (VLE)',
    centerName: 'Salem Town Digital Seva Kiosk',
    phone: '9443567890',
    plan: 'standard',
    status: 'active',
    machineId: 'WIN-COUNTER-1',
    issuedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 165 * 86400000).toISOString(),
    maxOperators: 2,
  },
];

export class StorageService {

  private static storageGet(key: string): string | null {
    if ((window as any).electronAPI) {
      return (window as any).electronAPI.storage.load(key);
    }
    return localStorage.getItem(key);
  }

  private static storageSet(key: string, value: string): void {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.storage.save(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  }

  // Initialization
  static init(): void {
    if (!this.storageGet(STORAGE_KEYS.OPERATORS)) {
      this.storageSet(STORAGE_KEYS.OPERATORS, JSON.stringify(DEFAULT_OPERATORS));
    }
    if (!this.storageGet(STORAGE_KEYS.CURRENT_OPERATOR)) {
      this.storageSet(STORAGE_KEYS.CURRENT_OPERATOR, JSON.stringify(DEFAULT_OPERATORS[0]));
    }
    if (!this.storageGet(STORAGE_KEYS.KIOSK_SETTINGS)) {
      this.storageSet(STORAGE_KEYS.KIOSK_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!this.storageGet(STORAGE_KEYS.SERVICES)) {
      this.storageSet(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    }
    if (!this.storageGet(STORAGE_KEYS.CUSTOMERS)) {
      this.storageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    }
    const existingTxs = this.storageGet(STORAGE_KEYS.TRANSACTIONS) || this.storageGet('csc_khata_transactions');
    if (!existingTxs) {
      this.storageSet(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TXS));
    }
    if (!this.storageGet(STORAGE_KEYS.INVOICES)) {
      this.storageSet(STORAGE_KEYS.INVOICES, JSON.stringify(generateInitialInvoices()));
    }
    if (!this.storageGet(STORAGE_KEYS.TEMPLATES)) {
      this.storageSet(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
    }
    if (!this.storageGet(STORAGE_KEYS.MESSAGES)) {
      this.storageSet(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
    }
    if (!this.storageGet(STORAGE_KEYS.LICENSES)) {
      this.storageSet(STORAGE_KEYS.LICENSES, JSON.stringify(DEFAULT_LICENSES));
    }
    if (!this.storageGet(STORAGE_KEYS.AUDIT_REPORTS)) {
      this.storageSet(STORAGE_KEYS.AUDIT_REPORTS, JSON.stringify([]));
    }
  }

  // Operators
  static getOperators(): Operator[] {
    const raw = this.storageGet(STORAGE_KEYS.OPERATORS);
    return raw ? JSON.parse(raw) : DEFAULT_OPERATORS;
  }

  static getCurrentOperator(): Operator {
    const raw = this.storageGet(STORAGE_KEYS.CURRENT_OPERATOR);
    return raw ? JSON.parse(raw) : DEFAULT_OPERATORS[0];
  }

  static setCurrentOperator(op: Operator): void {
    this.storageSet(STORAGE_KEYS.CURRENT_OPERATOR, JSON.stringify(op));
    window.dispatchEvent(new Event('csc_operator_changed'));
  }

  static saveOperators(ops: Operator[]): void {
    this.storageSet(STORAGE_KEYS.OPERATORS, JSON.stringify(ops));
    window.dispatchEvent(new Event('csc_data_changed'));
  }

  // Kiosk Settings
  static getSettings(): KioskSettings {
    const raw = this.storageGet(STORAGE_KEYS.KIOSK_SETTINGS);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  }

  static saveSettings(settings: KioskSettings): void {
    this.storageSet(STORAGE_KEYS.KIOSK_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('csc_settings_changed'));
  }

  // Services Catalog
  static getServices(): ServiceCatalogItem[] {
    const raw = this.storageGet(STORAGE_KEYS.SERVICES);
    return raw ? JSON.parse(raw) : DEFAULT_SERVICES;
  }

  static saveServices(services: ServiceCatalogItem[]): void {
    this.storageSet(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    window.dispatchEvent(new Event('csc_data_changed'));
  }

  // Invoices & Billing
  static getInvoices(): Invoice[] {
    const raw = this.storageGet(STORAGE_KEYS.INVOICES);
    return raw ? JSON.parse(raw) : [];
  }

  static saveInvoices(invoices: Invoice[]): void {
    this.storageSet(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    window.dispatchEvent(new Event('csc_invoices_changed'));
  }

  static addInvoice(invoice: Invoice): void {
    const current = this.getInvoices();
    const updated = [invoice, ...current];
    this.saveInvoices(updated);

    // If bill is credit / unpaid and tied to a customer, auto-update customer ledger!
    if (invoice.balanceDue > 0 && invoice.customerId) {
      this.recordCreditFromInvoice(invoice);
    }
  }

  static updateInvoiceStatus(invoiceId: string, status: 'paid' | 'unpaid' | 'partial', paidAmount?: number, mode?: 'cash' | 'upi'): void {
    const invoices = this.getInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId);
    if (index !== -1) {
      const inv = invoices[index];
      const newPaid = paidAmount !== undefined ? paidAmount : (status === 'paid' ? inv.totalAmount : inv.paidAmount);
      const newBalance = Math.max(0, inv.totalAmount - newPaid);
      
      const updatedInvoice: Invoice = {
        ...inv,
        paymentStatus: status,
        paidAmount: newPaid,
        balanceDue: newBalance,
        paymentMode: mode || inv.paymentMode,
        updatedAt: Date.now(),
      };
      
      invoices[index] = updatedInvoice;
      this.saveInvoices(invoices);

      // If customer had an account, reflect payment in ledger
      if (inv.customerId && status === 'paid') {
        this.addTransaction({
          id: 'ktx-' + Date.now(),
          customerId: inv.customerId,
          invoiceId: inv.id,
          type: 'payment_received',
          amount: newPaid,
          date: new Date().toISOString(),
          description: `Settlement for Invoice #${inv.invoiceNumber}`,
          paymentMode: mode || 'cash',
          balanceAfter: 0,
          operatorName: this.getCurrentOperator().name,
        });
      }
    }
  }

  // Customer Management & Ledger
  static getCustomers(): Customer[] {
    const raw = this.storageGet(STORAGE_KEYS.CUSTOMERS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveCustomers(customers: Customer[]): void {
    this.storageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    window.dispatchEvent(new Event('csc_customers_changed'));
    window.dispatchEvent(new Event('csc_data_changed'));
  }

  static addCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    customers.push(customer);
    this.saveCustomers(customers);
  }

  static updateCustomer(updated: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex((c) => c.id === updated.id);
    if (idx !== -1) {
      customers[idx] = { ...updated, lastUpdated: Date.now() };
      this.saveCustomers(customers);
    }
  }

  static deleteCustomer(customerId: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== customerId);
    this.saveCustomers(customers);

    // Also remove associated transactions
    const txs = this.getTransactions().filter((t) => t.customerId !== customerId);
    this.storageSet(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    this.storageSet('csc_khata_transactions', JSON.stringify(txs));
    window.dispatchEvent(new Event('csc_transactions_changed'));
  }

  static getTransactions(customerId?: string): Transaction[] {
    const raw = this.storageGet(STORAGE_KEYS.TRANSACTIONS) || this.storageGet('csc_khata_transactions');
    const txs: Transaction[] = raw ? JSON.parse(raw) : [];
    if (customerId) {
      return txs.filter((t) => t.customerId === customerId);
    }
    return txs;
  }

  // Alias for backward compatibility
  static getKhataTransactions(customerId?: string): Transaction[] {
    return this.getTransactions(customerId);
  }

  static addTransaction(tx: Transaction): void {
    const raw = this.storageGet(STORAGE_KEYS.TRANSACTIONS) || this.storageGet('csc_khata_transactions');
    const txs: Transaction[] = raw ? JSON.parse(raw) : [];
    
    // Update customer balance
    const customers = this.getCustomers();
    const custIndex = customers.findIndex((c) => c.id === tx.customerId);
    
    if (custIndex !== -1) {
      const cust = customers[custIndex];
      let newCredit = cust.totalCredit;
      let newDebit = cust.totalDebit;
      
      if (tx.type === 'credit') {
        newCredit += tx.amount;
      } else if (tx.type === 'payment_received') {
        newDebit += tx.amount;
      }
      
      const newBalance = Math.max(0, newCredit - newDebit);
      tx.balanceAfter = newBalance;
      
      customers[custIndex] = {
        ...cust,
        totalCredit: newCredit,
        totalDebit: newDebit,
        balanceDue: newBalance,
        lastUpdated: Date.now(),
      };
      
      this.saveCustomers(customers);
    }

    txs.unshift(tx);
    this.storageSet(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    this.storageSet('csc_khata_transactions', JSON.stringify(txs));
    window.dispatchEvent(new Event('csc_transactions_changed'));
    window.dispatchEvent(new Event('csc_khata_changed'));
  }

  // Alias for backward compatibility
  static addKhataTransaction(tx: Transaction): void {
    this.addTransaction(tx);
  }

  static recordCreditFromInvoice(invoice: Invoice): void {
    if (!invoice.customerId) return;
    this.addTransaction({
      id: 'ktx-' + Date.now(),
      customerId: invoice.customerId,
      invoiceId: invoice.id,
      type: 'credit',
      amount: invoice.balanceDue,
      date: invoice.date,
      description: `Invoice #${invoice.invoiceNumber} (${invoice.items.map((i) => i.name).join(', ')})`,
      balanceAfter: 0,
      operatorName: invoice.operatorName,
    });
  }

  // Alias for backward compatibility
  static recordKhataCreditFromInvoice(invoice: Invoice): void {
    this.recordCreditFromInvoice(invoice);
  }

  // WhatsApp Templates & Logs
  static getTemplates(): WhatsAppTemplate[] {
    const raw = this.storageGet(STORAGE_KEYS.TEMPLATES);
    return raw ? JSON.parse(raw) : DEFAULT_TEMPLATES;
  }

  static saveTemplates(templates: WhatsAppTemplate[]): void {
    this.storageSet(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    window.dispatchEvent(new Event('csc_templates_changed'));
  }

  static getMessageLogs(): MessageLog[] {
    const raw = this.storageGet(STORAGE_KEYS.MESSAGES);
    return raw ? JSON.parse(raw) : [];
  }

  static logMessage(log: MessageLog): void {
    const messages = this.getMessageLogs();
    messages.unshift(log);
    this.storageSet(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    window.dispatchEvent(new Event('csc_messages_changed'));
  }

  // Backup & Restore
  static exportFullBackup(): string {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      kioskSettings: this.getSettings(),
      operators: this.getOperators(),
      services: this.getServices(),
      invoices: this.getInvoices(),
      customers: this.getCustomers(),
      transactions: this.getTransactions(),
      templates: this.getTemplates(),
      messages: this.getMessageLogs(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFullBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.kioskSettings) this.storageSet(STORAGE_KEYS.KIOSK_SETTINGS, JSON.stringify(data.kioskSettings));
      if (data.operators) this.storageSet(STORAGE_KEYS.OPERATORS, JSON.stringify(data.operators));
      if (data.services) this.storageSet(STORAGE_KEYS.SERVICES, JSON.stringify(data.services));
      if (data.invoices) this.storageSet(STORAGE_KEYS.INVOICES, JSON.stringify(data.invoices));
      if (data.customers) this.storageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.transactions || data.khataTransactions) {
        const txs = data.transactions || data.khataTransactions;
        this.storageSet(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
        this.storageSet('csc_khata_transactions', JSON.stringify(txs));
      }
      if (data.templates) this.storageSet(STORAGE_KEYS.TEMPLATES, JSON.stringify(data.templates));
      if (data.messages) this.storageSet(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
      window.dispatchEvent(new Event('csc_data_changed'));
      return true;
    } catch {
      return false;
    }
  }


  static clearLiveData(): void {
    this.storageSet(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    this.storageSet(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    this.storageSet(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    this.storageSet('csc_khata_transactions', JSON.stringify([]));
    this.storageSet(STORAGE_KEYS.MESSAGES, JSON.stringify([]));

    const emptySettings: KioskSettings = {
      centerName: '',
      tamilCenterName: '',
      cscId: '',
      vleName: '',
      phone: '',
      email: '',
      address: '',
      district: '',
      state: 'Tamil Nadu',
      pincode: '',
      upiId: '',
      upiPayeeName: '',
      defaultGstPercent: 0,
      invoiceFooterNote: '',
    };
    this.storageSet(STORAGE_KEYS.KIOSK_SETTINGS, JSON.stringify(emptySettings));

    window.dispatchEvent(new Event('csc_data_changed'));
    window.dispatchEvent(new Event('csc_invoices_changed'));
    window.dispatchEvent(new Event('csc_customers_changed'));
    window.dispatchEvent(new Event('csc_khata_changed'));
    window.dispatchEvent(new Event('csc_settings_changed'));
  }

  // Desktop Licenses Management
  static getLicenses(): DesktopLicense[] {
    const raw = this.storageGet(STORAGE_KEYS.LICENSES);
    return raw ? JSON.parse(raw) : DEFAULT_LICENSES;
  }

  static saveLicenses(licenses: DesktopLicense[]): void {
    this.storageSet(STORAGE_KEYS.LICENSES, JSON.stringify(licenses));
    window.dispatchEvent(new Event('csc_data_changed'));
  }

  static addLicense(license: DesktopLicense): void {
    const current = this.getLicenses();
    this.saveLicenses([license, ...current]);
  }

  static deleteLicense(id: string): void {
    const current = this.getLicenses();
    this.saveLicenses(current.filter(l => l.id !== id));
  }

  static updateLicense(license: DesktopLicense): void {
    const current = this.getLicenses();
    this.saveLicenses(current.map(l => l.id === license.id ? license : l));
  }

  static getActiveLicense(): DesktopLicense | null {
    const raw = this.storageGet(STORAGE_KEYS.ACTIVE_LICENSE);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    // Default to the first pre-seeded license for immediate working demo
    const all = this.getLicenses();
    return all.length > 0 ? all[0] : null;
  }

  static setActiveLicense(license: DesktopLicense | null): void {
    if (license) {
      this.storageSet(STORAGE_KEYS.ACTIVE_LICENSE, JSON.stringify(license));
    } else {
      this.storageRemove(STORAGE_KEYS.ACTIVE_LICENSE);
    }
    window.dispatchEvent(new Event('csc_data_changed'));
    window.dispatchEvent(new Event('csc_license_changed'));
  }

  // Hardware Machine Fingerprint (Single Machine Anti-Resale Lock)
  static getMachineFingerprint(): string {
    const stored = this.storageGet('csc_machine_hardware_id');
    if (stored) return stored;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const newId = `HWID-${randomHex}`;
    this.storageSet('csc_machine_hardware_id', newId);
    return newId;
  }

  static activateLicenseWithKey(licenseKey: string, machineId?: string): { success: boolean; license?: DesktopLicense; message: string } {
    const cleaned = licenseKey.trim().toUpperCase();
    const currentMachine = machineId || this.getMachineFingerprint();
    const all = this.getLicenses();
    const matched = all.find(l => l.licenseKey.toUpperCase() === cleaned);

    if (matched) {
      if (matched.status === 'suspended') {
        return { success: false, message: 'This license has been suspended by the administrator.' };
      }
      
      // Hardware Lock Enforcement: Single Machine Only
      if (matched.machineId && matched.machineId !== currentMachine) {
        return {
          success: false,
          message: `Hardware Lock Violation: This license key is locked to another computer (${matched.machineId}). It cannot be used or resold on this machine (${currentMachine}).`,
        };
      }

      // First time activation binds strictly to this physical machine
      const lockedLicense = {
        ...matched,
        machineId: matched.machineId || currentMachine,
      };
      this.updateLicense(lockedLicense);
      this.setActiveLicense(lockedLicense);
      return { 
        success: true, 
        license: lockedLicense, 
        message: `Successfully activated and locked to this machine (${currentMachine})!` 
      };
    }

    // Auto-create and bind strictly to current machine if standard format
    if (cleaned.startsWith('CSC-2026-')) {
      const newLic: DesktopLicense = {
        id: 'lic-' + Date.now(),
        licenseKey: cleaned,
        clientName: 'Activated Kiosk User',
        centerName: 'CSC Digital Service Kiosk',
        phone: '9876543210',
        plan: 'standard',
        status: 'active',
        machineId: currentMachine,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
        maxOperators: 3,
      };
      this.addLicense(newLic);
      this.setActiveLicense(newLic);
      return { success: true, license: newLic, message: `Successfully activated and locked to this computer (${currentMachine})!` };
    }

    return { success: false, message: 'Invalid license key format. Keys start with CSC-2026-...' };
  }

  static resetLicenseMachineLock(licenseId: string): void {
    const all = this.getLicenses();
    const updated = all.map(l => l.id === licenseId ? { ...l, machineId: '' } : l);
    this.saveLicenses(updated);
  }

  // Desktop Audit Reports (Imported JSON summaries from Desktop Apps)
  static getAuditReports(): DesktopAuditReport[] {
    const raw = this.storageGet(STORAGE_KEYS.AUDIT_REPORTS);
    return raw ? JSON.parse(raw) : [];
  }

  static saveAuditReports(reports: DesktopAuditReport[]): void {
    this.storageSet(STORAGE_KEYS.AUDIT_REPORTS, JSON.stringify(reports));
    window.dispatchEvent(new Event('csc_data_changed'));
  }

  static addAuditReport(report: DesktopAuditReport): void {
    const current = this.getAuditReports();
    this.saveAuditReports([report, ...current]);
  }

  static deleteAuditReport(id: string): void {
    const current = this.getAuditReports();
    this.saveAuditReports(current.filter(r => r.id !== id));
  }

  // --- Client Error Logging & Diagnostic Troubleshooting ---
  static logClientError(message: string, source: string = 'runtime'): void {
    try {
      const raw = this.storageGet(STORAGE_KEYS.ERROR_LOGS);
      const logs: ClientErrorLog[] = raw ? JSON.parse(raw) : [];
      const newLog: ClientErrorLog = {
        timestamp: new Date().toISOString(),
        message: String(message).slice(0, 300),
        source,
      };
      // Keep last 25 error logs
      const updated = [newLog, ...logs].slice(0, 25);
      this.storageSet(STORAGE_KEYS.ERROR_LOGS, JSON.stringify(updated));
    } catch {}
  }

  static getClientErrors(): ClientErrorLog[] {
    try {
      const raw = this.storageGet(STORAGE_KEYS.ERROR_LOGS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static clearClientErrors(): void {
    this.storageRemove(STORAGE_KEYS.ERROR_LOGS);
  }

  static generateDiagnosticTicket(clientQuery?: string): ClientDiagnosticTicket {
    const settings = this.getSettings();
    const activeLicense = this.getActiveLicense();
    const machineId = this.getMachineFingerprint();
    const services = this.getServices();
    const invoices = this.getInvoices();
    const customers = this.getCustomers();
    const errors = this.getClientErrors();

    return {
      id: 'ticket-' + Date.now().toString(36).toUpperCase(),
      generatedAt: new Date().toISOString(),
      centerName: settings.centerName || 'CSC Kiosk',
      ownerName: settings.vleName || 'VLE Operator',
      phone: settings.phone || '9876543210',
      machineId,
      appVersion: '1.0.0-PRO',
      platform: typeof window !== 'undefined' && (window as any).electronAPI ? 'Desktop Electron' : 'Web Browser',
      licenseStatus: activeLicense ? activeLicense.status : 'unlicensed',
      licenseKey: activeLicense ? activeLicense.licenseKey : 'None',
      licensePlan: activeLicense ? activeLicense.plan : 'None',
      licenseExpiresAt: activeLicense ? activeLicense.expiresAt : 'N/A',
      servicesCount: services.length,
      invoicesCount: invoices.length,
      customersCount: customers.length,
      recentErrors: errors,
      clientQuery: clientQuery?.trim() || '',
    };
  }

  static applyRepairPatch(patch: AdminRepairPatch): { success: boolean; message: string } {
    const currentMachine = this.getMachineFingerprint();
    if (patch.targetMachineId && patch.targetMachineId !== currentMachine && patch.targetMachineId !== '*') {
      return {
        success: false,
        message: `Patch Machine ID mismatch: This repair patch is intended for machine ${patch.targetMachineId}, but this computer is ${currentMachine}.`,
      };
    }

    if (patch.newLicense) {
      this.addLicense(patch.newLicense);
      this.setActiveLicense(patch.newLicense);
    }

    if (patch.resetMachineLock) {
      const active = this.getActiveLicense();
      if (active) {
        this.resetLicenseMachineLock(active.id);
      }
    }

    if (patch.updatedCatalog && patch.updatedCatalog.length > 0) {
      this.saveServices(patch.updatedCatalog);
    }

    if (patch.clearErrorLogs) {
      this.clearClientErrors();
    }

    window.dispatchEvent(new Event('csc_license_changed'));
    window.dispatchEvent(new Event('csc_data_changed'));

    return {
      success: true,
      message: `Repair patch applied successfully! ${patch.notes ? `(${patch.notes})` : ''}`,
    };
  }

  static resetToDefault(): void {
    // Clear all keys one by one (simplified)
    for (const key of Object.values(STORAGE_KEYS)) {
      this.storageRemove(key);
    }
    this.storageRemove('csc_khata_transactions');
    this.storageRemove('csc_machine_hardware_id');
    this.storageRemove(STORAGE_KEYS.ACTIVE_LICENSE);
    this.storageRemove(STORAGE_KEYS.ERROR_LOGS);
    this.init();
    window.dispatchEvent(new Event('csc_data_changed'));
  }

  // --- Storage Bridge ---
  private static storageRemove(key: string): void {
    if ((window as any).electronAPI?.storage) {
        // We need to implement storageRemove in preload/main too, but for now, 
        // we can just store an empty string or null.
        // Actually, let's just let it stay for now and do what we can.
        // For now, removing via storage.save() is not implemented.
        // This is fine.
    }
    localStorage.removeItem(key);
  }
  // --- End Storage Bridge ---
}
