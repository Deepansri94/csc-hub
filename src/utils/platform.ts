import { Invoice, KioskSettings, Customer } from '../types';

/**
 * Detects whether the application is running inside an Electron Desktop application
 * or inside a standard Web Browser.
 */
export const isElectronDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.includes('electron')) return true;

  // Check Electron window object injected by preload script
  if ((window as any).electronAPI || (window as any).electron || (window as any).process?.type === 'renderer') {
    return true;
  }

  return false;
};

/**
 * Cleans and formats Indian or international phone numbers for WhatsApp wa.me links.
 */
export const formatWhatsAppPhone = (phone: string): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

/**
 * Generates formatted invoice receipt message text for WhatsApp sharing.
 */
export const getInvoiceWhatsAppText = (invoice: Invoice, settings: KioskSettings): string => {
  const itemsList = invoice.items
    .map((item, idx) => `${idx + 1}. ${item.name} (${item.quantity}x) - ₹${item.amount.toFixed(2)}`)
    .join('\n');

  const upiPay = (settings.upiId && invoice.balanceDue > 0)
    ? `\n💳 *Instant UPI Payment Link:*\nupi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.upiPayeeName || settings.centerName)}&am=${invoice.balanceDue}&cu=INR\n`
    : '';

  return `*${settings.centerName}*
--------------------------------
🧾 *TAX INVOICE / RECEIPT*
*Invoice No:* #${invoice.invoiceNumber}
*Token No:* #${invoice.tokenNumber}
*Date:* ${new Date(invoice.createdAt || invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
*Customer:* ${invoice.citizenName} ${invoice.citizenPhone ? `(+91 ${invoice.citizenPhone})` : ''}

*Services & Items:*
${itemsList}

--------------------------------
💰 *Total Amount:* ₹${invoice.totalAmount.toFixed(2)}
💵 *Paid Amount:* ₹${invoice.paidAmount.toFixed(2)}
${invoice.balanceDue > 0 ? `⚠️ *Balance Due:* ₹${invoice.balanceDue.toFixed(2)}` : '✅ *Payment Status:* FULLY PAID'}
*Payment Mode:* ${invoice.paymentMode === 'credit_khata' ? 'Credit / Due Ledger' : invoice.paymentMode.toUpperCase()}
${upiPay}
Thank you for visiting ${settings.centerName}!
📞 Contact: ${settings.phone}`;
};

/**
 * Generates customer due reminder message text for WhatsApp sharing.
 */
export const getCustomerReminderWhatsAppText = (customer: Customer, settings: KioskSettings): string => {
  const upiPay = settings.upiId
    ? `\n💳 *Pay via UPI:*\nupi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.upiPayeeName || settings.centerName)}&am=${customer.balanceDue}&cu=INR\n`
    : '';

  return `*${settings.centerName}*
--------------------------------
🔔 *PAYMENT REMINDER*
Dear *${customer.name}*,

You have an outstanding balance of *₹${customer.balanceDue.toFixed(2)}* at our service centre.

Kindly settle the due amount at your earliest convenience.
${upiPay}
📞 For any queries, call: ${settings.phone}
Thank you!`;
};

/**
 * Shares an invoice or customer reminder via WhatsApp.
 * - Browser: opens wa.me chat in a new browser tab.
 * - Desktop: triggers desktop integration callback (e.g., opens WhatsApp Hub tab).
 */
export const shareViaWhatsApp = ({
  phone,
  text,
  onDesktopAction,
}: {
  phone: string;
  text: string;
  onDesktopAction?: () => void;
}): void => {
  const isDesktop = isElectronDesktop();

  if (!isDesktop) {
    // Browser environment: use wa.me method to open WhatsApp chat in a new tab
    const cleanPhone = formatWhatsAppPhone(phone);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  } else {
    // Desktop application: execute desktop handler
    if (onDesktopAction) {
      onDesktopAction();
    } else {
      // Fallback in desktop if no specific handler
      const cleanPhone = formatWhatsAppPhone(phone);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    }
  }
};
