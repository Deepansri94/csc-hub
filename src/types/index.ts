export type UserRole = 'admin' | 'operator';

export interface Operator {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  phone: string;
  isActive: boolean;
}

export interface KioskSettings {
  centerName: string;
  tamilCenterName: string;
  cscId: string;
  vleName: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  upiId: string;
  upiPayeeName: string;
  defaultGstPercent: number;
  invoiceFooterNote: string;
}

export type ServiceCategory = 'egov' | 'certificate' | 'utility' | 'financial' | 'printing' | 'xerox';

export interface ServiceCatalogItem {
  id: string;
  code: string;
  name: string;
  tamilName?: string;
  category: ServiceCategory;
  dept: string;
  govtFee: number;
  kioskCharge: number;
  totalFee: number;
  turnAroundDays: string;
  requiredDocs: string[];
}

export type XeroxItemType =
  | 'bw_xerox'
  | 'color_xerox'
  | 'bw_print'
  | 'color_print'
  | 'photo_print'
  | 'pvc_card'
  | 'lamination'
  | 'spiral_binding'
  | 'scanning';

export type PaperSize = 'A4' | 'A3' | 'Legal' | 'Photo4x6' | 'PVC';
export type PageSide = 'single' | 'double';

export interface XeroxJobConfig {
  id: string;
  type: XeroxItemType;
  label: string;
  size: PaperSize;
  sides: PageSide;
  pages: number;
  copies: number;
  unitRate: number;
  totalAmount: number;
}

export interface InvoiceItem {
  id: string;
  serviceId?: string;
  name: string;
  category: ServiceCategory | 'xerox';
  quantity: number;
  unitPrice: number;
  amount: number;
  details?: string;
}

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';
export type PaymentMode = 'cash' | 'upi' | 'credit' | 'credit_khata' | 'split';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tokenNumber: number;
  date: string; // ISO string
  citizenName: string;
  citizenPhone: string;
  citizenAadhaarLast4?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  operatorId: string;
  operatorName: string;
  notes?: string;
  customerId?: string; // Linked to customer if credit
  createdAt: number;
  updatedAt: number;
}

export type CustomerType = 'individual' | 'advocate' | 'business' | 'school_student' | 'panchayat';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: CustomerType;
  notes?: string;
  totalCredit: number; // Credit given
  totalDebit: number;  // Payments received
  balanceDue: number;  // Outstanding
  createdAt: number;
  lastUpdated: number;
}

// Backward compatibility alias
export type CustomerKhata = Customer;

export type TxType = 'credit' | 'payment_received' | 'adjustment';
export type KhataTxType = TxType;

export interface Transaction {
  id: string;
  customerId: string;
  invoiceId?: string;
  type: TxType;
  amount: number;
  date: string;
  description: string;
  paymentMode?: 'cash' | 'upi';
  balanceAfter: number;
  operatorName: string;
}

// Backward compatibility alias
export type KhataTransaction = Transaction;

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'payment_reminder' | 'govt_scheme' | 'offer' | 'service_ready';
  language: 'en' | 'ta' | 'hi';
  templateText: string;
}

export interface MessageLog {
  id: string;
  recipientName: string;
  recipientPhone: string;
  templateCategory: string;
  message: string;
  status: 'sent' | 'scheduled' | 'failed';
  timestamp: string;
}

export interface DailyCashTally {
  date: string;
  openingCash: number;
  systemCashCollected: number;
  systemUpiCollected: number;
  systemCreditIssued: number;
  systemPaymentReceived: number;
  actualPhysicalCash: number;
  cashDifference: number;
  notes: string;
  operatorName: string;
  isClosed: boolean;
}

export interface DesktopLicense {
  id: string;
  licenseKey: string;
  clientName: string;
  centerName: string;
  phone: string;
  plan: 'trial' | 'standard' | 'enterprise';
  status: 'active' | 'suspended' | 'expired';
  machineId?: string;
  issuedAt: string;
  expiresAt: string;
  maxOperators: number;
}

export interface DesktopAuditReport {
  id: string;
  importedAt: string;
  fileName: string;
  centerName: string;
  totalInvoices: number;
  totalRevenue: number;
  totalPendingDue: number;
  totalCustomers: number;
  operatorsCount: number;
}

export interface ClientErrorLog {
  timestamp: string;
  message: string;
  source?: string;
}

export interface ClientDiagnosticTicket {
  id: string;
  generatedAt: string;
  centerName: string;
  ownerName: string;
  phone: string;
  machineId: string;
  appVersion: string;
  platform: string;
  licenseStatus: string;
  licenseKey: string;
  licensePlan: string;
  licenseExpiresAt: string;
  servicesCount: number;
  invoicesCount: number;
  customersCount: number;
  recentErrors: ClientErrorLog[];
  clientQuery?: string;
  adminNotes?: string;
}

export interface AdminRepairPatch {
  id: string;
  targetMachineId: string;
  targetLicenseKey?: string;
  createdAt: string;
  notes: string;
  newLicense?: DesktopLicense;
  updatedCatalog?: ServiceCatalogItem[];
  resetMachineLock?: boolean;
  clearErrorLogs?: boolean;
}


