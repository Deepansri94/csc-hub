import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Building2, 
  Phone, 
  Clock, 
  Copy, 
  Check
} from 'lucide-react';
import { Invoice, KioskSettings } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { isElectronDesktop, shareViaWhatsApp, getInvoiceWhatsAppText } from '../utils/platform';

interface InvoiceModalProps {
  invoice: Invoice | null;
  settings: KioskSettings;
  onClose: () => void;
  onMarkPaid?: (invoiceId: string, mode: 'cash' | 'upi') => void;
  onSendWhatsAppReminder?: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  settings,
  onClose,
  onMarkPaid,
  onSendWhatsAppReminder,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!invoice) return null;

  // Convert numbers to Indian Rupee Words
  const inWords = (num: number): string => {
    const a = [
      '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
      'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const n = Math.floor(num);
    if (n === 0) return 'Zero Rupees Only';
    if (n > 99999) return `Rupees ${n} Only`;
    
    let str = '';
    const thousands = Math.floor(n / 1000);
    const hundreds = Math.floor((n % 1000) / 100);
    const rem = n % 100;
    
    if (thousands > 0) {
      str += (thousands < 20 ? a[thousands] : b[Math.floor(thousands / 10)] + ' ' + a[thousands % 10]) + 'Thousand ';
    }
    if (hundreds > 0) {
      str += a[hundreds] + 'Hundred ';
    }
    if (rem > 0) {
      if (str !== '') str += 'and ';
      str += rem < 20 ? a[rem] : b[Math.floor(rem / 10)] + (rem % 10 !== 0 ? ' ' + a[rem % 10] : ' ');
    }
    return str.trim() + ' Rupees Only';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(printRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, 297));
      pdf.save(`CSC_Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Build UPI payment link for QR Code
  const upiPaymentUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.upiPayeeName)}&am=${invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount}&cu=INR&tn=Invoice%20${invoice.invoiceNumber}`;
  // High quality QR Code image via standard API
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiPaymentUrl)}&margin=4`;

  const copyReceiptSummary = () => {
    const text = `CSC e-Sevai Invoice #${invoice.invoiceNumber}\nCitizen: ${invoice.citizenName}\nAmount: Rs. ${invoice.totalAmount}\nStatus: ${invoice.paymentStatus.toUpperCase()}\nCentre: ${settings.centerName} (${settings.phone})`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = getInvoiceWhatsAppText(invoice, settings);
    shareViaWhatsApp({
      phone: invoice.citizenPhone || '',
      text,
      onDesktopAction: () => {
        if (onSendWhatsAppReminder) {
          onSendWhatsAppReminder(invoice);
        }
      },
    });
  };

  const isDesktop = isElectronDesktop();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Top Modal Controls bar */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-sm tracking-wide">
              Official Receipt • {invoice.invoiceNumber}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              invoice.paymentStatus === 'paid' ? 'bg-emerald-500 text-white' :
              invoice.paymentStatus === 'partial' ? 'bg-amber-500 text-slate-950' :
              'bg-rose-500 text-white animate-pulse'
            }`}>
              {invoice.paymentStatus}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-xs transition"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
              title="Save as PDF File"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Saving...' : 'Save PDF'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold shadow-xs transition"
              title={isDesktop ? "Send via Desktop WhatsApp Hub" : "Share via WhatsApp (Opens wa.me in new tab)"}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="print-invoice-sheet bg-white w-full max-w-2xl p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 text-slate-900 relative"
          >
            {/* Header of Invoice */}
            <div className="border-b-2 border-blue-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-blue-950 p-1 border-2 border-amber-500 flex items-center justify-center shrink-0">
                    <img src="/icon.svg" alt="CSC" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-blue-900 uppercase bg-blue-100 px-2 py-0.5 rounded">
                      Government Approved e-Sevai Kiosk
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1 leading-tight">
                      {settings.centerName}
                    </h2>
                    <p className="text-xs font-semibold text-slate-600">
                      {settings.tamilCenterName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {settings.address}, {settings.district} - {settings.pincode}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      CSC ID: <strong className="text-blue-900 font-bold">{settings.cscId}</strong> | Ph: {settings.phone}
                    </p>
                  </div>
                </div>

                {/* Token Badge */}
                <div className="text-right shrink-0">
                  <div className="inline-block bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-xl p-2.5 text-center shadow-xs border border-blue-800">
                    <p className="text-[9px] uppercase tracking-wider text-blue-200 font-bold">Token No</p>
                    <p className="text-2xl font-black text-amber-400">#{invoice.tokenNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Receipt Meta & Citizen Details */}
            <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-200 text-xs">
              <div className="space-y-1">
                <p className="text-slate-500 font-medium">Billed To (Citizen Details):</p>
                <p className="text-sm font-bold text-slate-900">{invoice.citizenName}</p>
                <p className="text-slate-600 flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  +91 {invoice.citizenPhone || 'N/A'}
                </p>
                {invoice.citizenAadhaarLast4 && (
                  <p className="text-slate-500 text-[11px]">
                    Aadhaar Last 4: <span className="font-mono font-bold text-slate-800">XXXX-XXXX-{invoice.citizenAadhaarLast4}</span>
                  </p>
                )}
              </div>

              <div className="text-right space-y-1">
                <p className="text-slate-500 font-medium">Receipt Details:</p>
                <p className="text-sm font-bold font-mono text-blue-950">{invoice.invoiceNumber}</p>
                <p className="text-slate-600 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(invoice.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  {new Date(invoice.date).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
                <p className="text-[11px] text-slate-500">
                  Operator: <strong className="text-slate-700">{invoice.operatorName}</strong>
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-700 bg-slate-50">
                    <th className="py-2 px-2 text-left font-bold">#</th>
                    <th className="py-2 px-2 text-left font-bold">Service / Item Description</th>
                    <th className="py-2 px-2 text-center font-bold">Qty</th>
                    <th className="py-2 px-2 text-right font-bold">Rate (₹)</th>
                    <th className="py-2 px-2 text-right font-bold">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-900">
                        {item.name}
                        {item.details && (
                          <span className="block text-[10px] text-slate-500 italic font-normal">
                            {item.details}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-700 font-mono">{item.quantity}</td>
                      <td className="py-2 px-2 text-right text-slate-700 font-mono">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900 font-mono">
                        ₹{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Totals */}
            <div className="border-t-2 border-slate-300 pt-3">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Left: UPI QR for easy payment & Payment status stamp */}
                <div className="w-full sm:w-1/2 flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="w-20 h-20 shrink-0 bg-white p-1 rounded-lg border border-slate-300 shadow-xs flex items-center justify-center">
                    <img
                      src={upiQrImageUrl}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-900" />
                      Scan & Pay with UPI
                    </p>
                    <p className="text-slate-600 text-[10px] font-mono break-all">{settings.upiId}</p>
                    <p className="text-[10px] text-slate-500">GPay • PhonePe • Paytm • BHIM</p>
                    <div className="pt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {invoice.paymentStatus === 'paid' ? `PAID (${invoice.paymentMode.toUpperCase()})` :
                         invoice.paymentStatus === 'partial' ? `PARTIAL (${invoice.paymentMode.toUpperCase()})` :
                         `UNPAID / CUSTOMER CREDIT`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Subtotal, Discount, Balance */}
                <div className="w-full sm:w-1/2 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Kiosk Discount:</span>
                      <span className="font-mono">-₹{invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-blue-950 border-t border-slate-200 pt-1.5">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{invoice.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span>Amount Paid:</span>
                    <span className="font-mono text-emerald-700">₹{invoice.paidAmount.toFixed(2)}</span>
                  </div>
                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded">
                      <span>Balance Outstanding:</span>
                      <span className="font-mono">₹{invoice.balanceDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount in words */}
              <div className="mt-3 text-[11px] text-slate-600 italic bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100">
                <strong>Amount in Words:</strong> {inWords(invoice.totalAmount)}
              </div>
            </div>

            {/* Footer declaration and VLE sign */}
            <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 items-end text-[10px] text-slate-500">
              <div className="space-y-1 pr-4">
                <p className="leading-tight">{settings.invoiceFooterNote}</p>
                <p className="font-semibold text-slate-700">VLE Name: {settings.vleName}</p>
                <p className="text-[9px] text-slate-400">System Generated e-Sevai Kiosk Receipt • No Signature Required</p>
              </div>

              <div className="text-right">
                <div className="inline-block border-t border-slate-400 pt-1 px-4 text-center">
                  <p className="font-bold text-slate-800 text-[11px]">{settings.centerName}</p>
                  <p className="text-[9px] text-slate-500">Authorized Kiosk Seal / Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Action Bar */}
        <div className="no-print bg-white p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={copyReceiptSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {invoice.paymentStatus !== 'paid' && onMarkPaid && (
              <>
                <button
                  onClick={() => onMarkPaid(invoice.id, 'cash')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Paid (Cash)</span>
                </button>
                <button
                  onClick={() => onMarkPaid(invoice.id, 'upi')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Paid (UPI)</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
