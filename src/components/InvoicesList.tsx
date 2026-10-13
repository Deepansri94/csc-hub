import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Eye, 
  Printer, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  User, 
  Calendar,
  Share2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Invoice } from '../types';
import { StorageService } from '../services/storageService';
import { isElectronDesktop, shareViaWhatsApp, getInvoiceWhatsAppText } from '../utils/platform';

interface InvoicesListProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onMarkPaid: (invoiceId: string, mode: 'cash' | 'upi') => void;
  onSendWhatsApp: (invoice: Invoice) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  invoices,
  onViewInvoice,
  onMarkPaid,
  onSendWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filter logic
  const now = Date.now();
  const dayMs = 86400000;

  const filteredInvoices = invoices.filter((inv) => {
    // Search
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.citizenPhone && inv.citizenPhone.includes(searchTerm)) ||
      inv.tokenNumber.toString().includes(searchTerm);

    // Status
    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;

    // Payment Mode
    const matchesMode = modeFilter === 'all' || inv.paymentMode === modeFilter;

    // Time filter
    let matchesTime = true;
    const invTime = new Date(inv.date).getTime();
    if (timeFilter === 'today') {
      matchesTime = now - invTime <= dayMs;
    } else if (timeFilter === 'week') {
      matchesTime = now - invTime <= 7 * dayMs;
    } else if (timeFilter === 'month') {
      matchesTime = now - invTime <= 30 * dayMs;
    }

    return matchesSearch && matchesStatus && matchesMode && matchesTime;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isDesktop = isElectronDesktop();

  const handleInvoiceWhatsAppClick = (invoice: Invoice) => {
    const settings = StorageService.getSettings();
    const text = getInvoiceWhatsAppText(invoice, settings);

    shareViaWhatsApp({
      phone: invoice.citizenPhone || '',
      text,
      onDesktopAction: () => {
        onSendWhatsApp(invoice);
      },
    });
  };

  // Summary KPIs
  const totalBilled = filteredInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalCollected = filteredInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalOutstanding = filteredInvoices.reduce((acc, i) => acc + i.balanceDue, 0);
  const unpaidCount = filteredInvoices.filter((i) => i.paymentStatus !== 'paid').length;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Invoice No',
      'Token No',
      'Date',
      'Citizen Name',
      'Phone',
      'Items Count',
      'Total Amount (INR)',
      'Paid Amount (INR)',
      'Balance Due (INR)',
      'Payment Status',
      'Payment Mode',
      'Operator',
    ];

    const rows = filteredInvoices.map((i) => [
      i.invoiceNumber,
      i.tokenNumber,
      new Date(i.date).toLocaleDateString('en-IN'),
      `"${i.citizenName}"`,
      i.citizenPhone || '',
      i.items.length,
      i.totalAmount,
      i.paidAmount,
      i.balanceDue,
      i.paymentStatus.toUpperCase(),
      i.paymentMode.toUpperCase(),
      `"${i.operatorName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSC_Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{totalBilled.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">{filteredInvoices.length} Invoices</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs bg-emerald-50/20">
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}% Realized
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs bg-rose-50/20">
          <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Outstanding Due</p>
          <p className="text-2xl font-black text-rose-700 mt-1 font-mono">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-rose-600 mt-0.5">{unpaidCount} Bills Pending</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Export Data</p>
            <p className="text-xs text-slate-600 mt-1">Download filtered records as CSV spreadsheet</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Citizen Name, Phone, Token #, or Invoice #..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid / Due</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div className="sm:col-span-2">
            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-hidden"
            >
              <option value="all">All Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI / QR</option>
              <option value="credit_khata">Customer Credit</option>
            </select>
          </div>

          {/* Time Filter */}
          <div className="sm:col-span-3">
            <select
              value={timeFilter}
              onChange={(e) => {
                setTimeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-hidden"
            >
              <option value="all">All Time History</option>
              <option value="today">Today Only</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 font-bold">Token / Date</th>
                <th className="py-3 px-3 font-bold">Invoice #</th>
                <th className="py-3 px-3 font-bold">Citizen Details</th>
                <th className="py-3 px-3 font-bold">Services & Items</th>
                <th className="py-3 px-3 font-bold text-right">Amount (₹)</th>
                <th className="py-3 px-3 font-bold text-center">Status</th>
                <th className="py-3 px-3 font-bold text-center">Payment Mode</th>
                <th className="py-3 px-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-sm">No invoices found matching current filters.</p>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-900 text-amber-400 font-black flex items-center justify-center font-mono text-xs shrink-0">
                          #{invoice.tokenNumber}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {new Date(invoice.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(invoice.date).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-blue-950">
                      {invoice.invoiceNumber}
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{invoice.citizenName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {invoice.citizenPhone ? `+91 ${invoice.citizenPhone}` : 'No phone'}
                      </p>
                    </td>

                    <td className="py-3 px-3 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        {invoice.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {invoice.items.length} service item{invoice.items.length > 1 ? 's' : ''}
                      </p>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <p className="font-black text-slate-900 font-mono text-sm">
                        ₹{invoice.totalAmount.toFixed(2)}
                      </p>
                      {invoice.balanceDue > 0 && (
                        <p className="text-[10px] font-bold text-rose-600 font-mono">
                          Due: ₹{invoice.balanceDue.toFixed(2)}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        invoice.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : invoice.paymentStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {invoice.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-semibold text-slate-700 capitalize text-[11px]">
                      {invoice.paymentMode === 'credit_khata' ? 'Credit / Due' : invoice.paymentMode.toUpperCase()}
                    </td>

                    <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                      {/* View & PDF Receipt Button */}
                      <button
                        onClick={() => onViewInvoice(invoice)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 transition"
                        title="View & Download PDF Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* WhatsApp Reminder Button */}
                      {invoice.citizenPhone && (
                        <button
                          onClick={() => handleInvoiceWhatsAppClick(invoice)}
                          className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                          title={isDesktop ? "Send via Desktop WhatsApp Hub" : "Share on WhatsApp (Opens wa.me in new tab)"}
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Mark Paid Shortcut if Unpaid */}
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => onMarkPaid(invoice.id, 'cash')}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition"
                          title="Mark full bill as Paid (Cash)"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Invoices Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3.5 border-t border-slate-200 bg-slate-50 text-xs">
            <span className="text-slate-500 font-medium">
              Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredInvoices.length} total invoices)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-white border border-slate-200 rounded-md">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition shadow-2xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
