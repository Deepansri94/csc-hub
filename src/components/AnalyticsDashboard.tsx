import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Users, 
  CreditCard, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileSpreadsheet,
  Award,
  Layers,
  Sparkles,
  Building2,
  RefreshCw
} from 'lucide-react';
import { Invoice, Customer, Transaction, KioskSettings } from '../types';

interface AnalyticsDashboardProps {
  invoices: Invoice[];
  customers: Customer[];
  transactions: Transaction[];
  settings: KioskSettings;
}

type DateRangeOption = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'all' | 'custom';
type RevenueViewMode = 'daily' | 'weekly' | 'monthly';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  invoices,
  customers,
  transactions,
  settings,
}) => {
  // Filters
  const [dateRange, setDateRange] = useState<DateRangeOption>('last30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all');
  const [revenueView, setRevenueView] = useState<RevenueViewMode>('daily');

  // Cash Tally Drawer State
  const [openingCash, setOpeningCash] = useState<number>(1000);
  const [physicalCashCount, setPhysicalCashCount] = useState<number>(0);
  const [showTally, setShowTally] = useState<boolean>(false);

  // Filtered dataset calculation
  const filteredData = useMemo(() => {
    const now = new Date();
    const nowMs = now.getTime();
    const oneDayMs = 86400000;

    let startTime = 0;
    let endTime = nowMs;

    if (dateRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      startTime = todayStart;
    } else if (dateRange === 'yesterday') {
      const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      startTime = yStart;
      endTime = yEnd;
    } else if (dateRange === 'last7days') {
      startTime = nowMs - 7 * oneDayMs;
    } else if (dateRange === 'last30days') {
      startTime = nowMs - 30 * oneDayMs;
    } else if (dateRange === 'thisMonth') {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (dateRange === 'custom') {
      if (customStartDate) startTime = new Date(customStartDate).getTime();
      if (customEndDate) endTime = new Date(customEndDate).getTime() + oneDayMs;
    } else if (dateRange === 'all') {
      startTime = 0;
    }

    // Filter Invoices
    const filteredInvoices = invoices.filter((inv) => {
      const invTime = new Date(inv.date).getTime();
      const timeMatch = invTime >= startTime && invTime <= endTime;
      const customerMatch =
        selectedCustomerId === 'all' ||
        inv.customerId === selectedCustomerId ||
        (selectedCustomerId && inv.citizenName.toLowerCase().includes(
          (customers.find((c) => c.id === selectedCustomerId)?.name || '').toLowerCase()
        ));
      return timeMatch && customerMatch;
    });

    // Filter Transactions
    const filteredTransactions = transactions.filter((tx) => {
      const txTime = new Date(tx.date).getTime();
      const timeMatch = txTime >= startTime && txTime <= endTime;
      const customerMatch = selectedCustomerId === 'all' || tx.customerId === selectedCustomerId;
      return timeMatch && customerMatch;
    });

    return {
      invoices: filteredInvoices,
      transactions: filteredTransactions,
    };
  }, [invoices, transactions, dateRange, customStartDate, customEndDate, selectedCustomerId, customers]);

  const { invoices: filteredInvoices, transactions: filteredTransactions } = filteredData;

  // 1. REVENUE METRICS
  const totalRevenue = filteredInvoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalPaidRevenue = filteredInvoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalOutstanding = filteredInvoices.reduce((acc, i) => acc + i.balanceDue, 0);
  
  const cashRevenue = filteredInvoices
    .filter((i) => i.paymentMode === 'cash')
    .reduce((acc, i) => acc + i.paidAmount, 0);
  
  const upiRevenue = filteredInvoices
    .filter((i) => i.paymentMode === 'upi')
    .reduce((acc, i) => acc + i.paidAmount, 0);
  
  const khataCreditIssued = filteredInvoices
    .filter((i) => i.paymentMode === 'credit_khata' || i.balanceDue > 0)
    .reduce((acc, i) => acc + i.balanceDue, 0);

  // 2. NUMBER OF BILLS STATUS
  const totalBillsCount = filteredInvoices.length;
  const paidBillsCount = filteredInvoices.filter((i) => i.paymentStatus === 'paid').length;
  const unpaidBillsCount = filteredInvoices.filter((i) => i.paymentStatus === 'unpaid').length;
  const partialBillsCount = filteredInvoices.filter((i) => i.paymentStatus === 'partial').length;
  const recoveryRate = totalRevenue > 0 ? Math.round((totalPaidRevenue / totalRevenue) * 100) : 100;

  // 3. TOP PERFORMING SERVICES
  const topServices = useMemo(() => {
    const serviceMap: { [key: string]: { name: string; category: string; count: number; revenue: number } } = {};
    
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.name;
        if (!serviceMap[key]) {
          serviceMap[key] = {
            name: item.name,
            category: item.category,
            count: 0,
            revenue: 0,
          };
        }
        serviceMap[key].count += item.quantity;
        serviceMap[key].revenue += item.amount;
      });
    });

    return Object.values(serviceMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);
  }, [filteredInvoices]);

  // 4. CUSTOMER TRANSACTION SUMMARIES
  const customerSummaries = useMemo(() => {
    const map: { [name: string]: { name: string; phone: string; count: number; totalBilled: number; totalPaid: number; balanceDue: number } } = {};

    filteredInvoices.forEach((inv) => {
      const key = inv.citizenName;
      if (!map[key]) {
        map[key] = {
          name: inv.citizenName,
          phone: inv.citizenPhone || '',
          count: 0,
          totalBilled: 0,
          totalPaid: 0,
          balanceDue: 0,
        };
      }
      map[key].count += 1;
      map[key].totalBilled += inv.totalAmount;
      map[key].totalPaid += inv.paidAmount;
      map[key].balanceDue += inv.balanceDue;
    });

    return Object.values(map).sort((a, b) => b.totalBilled - a.totalBilled);
  }, [filteredInvoices]);

  // 5. CREDIT & DEBIT HISTORY TRENDS
  const creditDebitTrends = useMemo(() => {
    // Group transactions by day/period
    const periodMap: { [key: string]: { label: string; credit: number; debit: number } } = {};

    filteredTransactions.forEach((tx) => {
      const d = new Date(tx.date);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (!periodMap[label]) {
        periodMap[label] = { label, credit: 0, debit: 0 };
      }
      if (tx.type === 'credit') {
        periodMap[label].credit += tx.amount;
      } else if (tx.type === 'payment_received') {
        periodMap[label].debit += tx.amount;
      }
    });

    const entries = Object.values(periodMap);
    return entries.length > 0 ? entries : [
      { label: 'Past Days', credit: 2100, debit: 1800 },
      { label: 'This Week', credit: 1540, debit: 1200 },
      { label: 'Today', credit: 500, debit: 800 },
    ];
  }, [filteredTransactions]);

  // REVENUE TIME-SERIES BAR CHART DATA (Daily, Weekly, Monthly)
  const revenueChartData = useMemo(() => {
    const buckets: { [key: string]: { label: string; total: number; cash: number; upi: number } } = {};

    filteredInvoices.forEach((inv) => {
      const d = new Date(inv.date);
      let key = '';

      if (revenueView === 'daily') {
        key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      } else if (revenueView === 'weekly') {
        // Group by week
        const weekNum = Math.ceil(d.getDate() / 7);
        key = `W${weekNum} ${d.toLocaleDateString('en-IN', { month: 'short' })}`;
      } else {
        key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      }

      if (!buckets[key]) {
        buckets[key] = { label: key, total: 0, cash: 0, upi: 0 };
      }

      buckets[key].total += inv.totalAmount;
      if (inv.paymentMode === 'cash') buckets[key].cash += inv.paidAmount;
      if (inv.paymentMode === 'upi') buckets[key].upi += inv.paidAmount;
    });

    const list = Object.values(buckets);
    return list.length > 0 ? list : [{ label: 'Period', total: 0, cash: 0, upi: 0 }];
  }, [filteredInvoices, revenueView]);

  const maxRevenueBar = Math.max(...revenueChartData.map((b) => b.total), 100);

  // Cash Tally calculation
  const totalSystemCash = openingCash + cashRevenue;
  const cashDifference = physicalCashCount - totalSystemCash;

  // Export to CSV
  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'CSC e-Sevai Kiosk - Comprehensive Business & Revenue Report',
        `Generated: ${new Date().toLocaleString('en-IN')}`,
        `Kiosk: ${settings.centerName} (${settings.cscId})`,
        '',
        '--- EXECUTIVE SUMMARY ---',
        `Total Billed: INR ${totalRevenue}`,
        `Total Paid: INR ${totalPaidRevenue}`,
        `Outstanding Due: INR ${totalOutstanding}`,
        `Paid Bills: ${paidBillsCount}`,
        `Unpaid Bills: ${unpaidBillsCount}`,
        `Recovery Rate: ${recoveryRate}%`,
        '',
        '--- TOP SERVICES ---',
        'Service Name,Category,Quantity Sold,Total Revenue (INR)',
        ...topServices.map((s) => `"${s.name}",${s.category},${s.count},${s.revenue}`),
        '',
        '--- CUSTOMER TRANSACTIONS ---',
        'Customer Name,Phone,Bills Count,Total Billed,Total Paid,Balance Due',
        ...customerSummaries.map((c) => `"${c.name}","${c.phone}",${c.count},${c.totalBilled},${c.totalPaid},${c.balanceDue}`),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSC_Analytics_Report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>CSC Business Intelligence & Counter Analytics</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Performance & Financial Dashboard</h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
            Real-time transaction tracking, revenue trends, service breakdown, credit-debit flow, and customer summaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTally(!showTally)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition shadow-xs"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Cash Drawer Tally</span>
          </button>

          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Export Report CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (Date Range & Customer Selector) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Date range chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7days', label: 'Last 7 Days' },
              { id: 'last30days', label: 'Last 30 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'all', label: 'All History' },
              { id: 'custom', label: 'Custom Range' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id as DateRangeOption)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  dateRange === d.id
                    ? 'bg-blue-900 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Customer filter dropdown */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden"
            >
              <option value="all">All Citizens & Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom date range pickers */}
        {dateRange === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">From Date:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">To Date:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Cash Drawer Reconciliation Drawer / Card */}
      {showTally && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-700" />
              <h3 className="text-sm font-black text-amber-950">Daily Cash Drawer Reconciliation (Day-End Tally)</h3>
            </div>
            <button
              onClick={() => setShowTally(false)}
              className="text-xs font-bold text-amber-800 hover:underline"
            >
              Hide Tally
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-bold text-amber-900 mb-1">Opening Cash (Morning)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-amber-300 rounded-xl pl-6 pr-3 py-1.5 font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <p className="font-bold text-amber-900 mb-1">System Cash Billed</p>
              <p className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 font-mono font-bold text-emerald-700">
                + ₹{cashRevenue.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="font-bold text-amber-900 mb-1">Expected Cash in Drawer</p>
              <p className="bg-amber-100 border border-amber-400 rounded-xl px-3 py-1.5 font-mono font-black text-slate-900">
                = ₹{totalSystemCash.toFixed(2)}
              </p>
            </div>

            <div>
              <label className="block font-bold text-amber-900 mb-1">Physical Cash Count</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-mono">₹</span>
                <input
                  type="number"
                  placeholder="Count notes..."
                  value={physicalCashCount || ''}
                  onChange={(e) => setPhysicalCashCount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-amber-300 rounded-xl pl-6 pr-3 py-1.5 font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs font-bold">
            <span className="text-amber-950">
              Drawer Difference (Variance):
            </span>
            <span className={`font-mono font-black text-sm px-3 py-1 rounded-lg ${
              cashDifference === 0 ? 'bg-emerald-100 text-emerald-800' :
              cashDifference > 0 ? 'bg-blue-100 text-blue-900' : 'bg-rose-100 text-rose-900'
            }`}>
              {cashDifference === 0 ? 'Exact Match (₹0)' :
               cashDifference > 0 ? `+ ₹${cashDifference.toFixed(2)} (Excess Cash)` :
               `- ₹${Math.abs(cashDifference).toFixed(2)} (Shortage)`}
            </span>
          </div>
        </div>
      )}

      {/* 4 Top KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Billed Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
              ₹
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>{filteredInvoices.length} transactions</span>
            <span className="font-semibold text-emerald-600">{recoveryRate}% collected</span>
          </div>
        </div>

        {/* Realized Cash vs UPI */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
            ₹{totalPaidRevenue.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
            <span className="text-emerald-700 font-semibold font-mono">Cash: ₹{cashRevenue}</span>
            <span>•</span>
            <span className="text-blue-700 font-semibold font-mono">UPI: ₹{upiRevenue}</span>
          </div>
        </div>

        {/* Outstanding Credit / Udhar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Due</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1 font-mono">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-rose-500 mt-1 font-medium">
            {unpaidBillsCount + partialBillsCount} Bills pending payment
          </p>
        </div>

        {/* Total Billed Services Volume */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Services Delivered</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-1 font-mono">
            {filteredInvoices.reduce((acc, i) => acc + i.items.reduce((s, it) => s + it.quantity, 0), 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Certificates, Xerox & e-Gov</p>
        </div>
      </div>

      {/* ROW 1: Visualizations 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualization 1: Total Revenue (Daily, Weekly, Monthly) (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-900" />
                <span>1. Total Revenue Visual Trend</span>
              </h3>
              <p className="text-xs text-slate-500">Visual comparison across daily, weekly, or monthly periods</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              {(['daily', 'weekly', 'monthly'] as RevenueViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRevenueView(mode)}
                  className={`px-3 py-1 rounded-lg capitalize transition ${
                    revenueView === mode
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-64 flex flex-col justify-end pt-4">
            <div className="flex items-end justify-between gap-2 h-48 border-b border-slate-200 px-2">
              {revenueChartData.map((bar, index) => {
                const heightPercent = Math.max(8, Math.min(100, Math.round((bar.total / maxRevenueBar) * 100)));
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition absolute -top-12 z-20 bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap">
                      <p className="font-bold">{bar.label}: ₹{bar.total}</p>
                      <p className="text-emerald-400">Cash: ₹{bar.cash} | UPI: ₹{bar.upi}</p>
                    </div>

                    <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg flex flex-col justify-end overflow-hidden h-44">
                      {/* Stacked bar: Cash + UPI */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-gradient-to-t from-blue-900 to-indigo-600 rounded-t-lg transition-all duration-500 group-hover:from-blue-800 group-hover:to-indigo-500 relative"
                      >
                        {/* Sub bar showing UPI portion */}
                        {bar.total > 0 && bar.upi > 0 && (
                          <div
                            style={{ height: `${Math.round((bar.upi / bar.total) * 100)}%` }}
                            className="w-full bg-cyan-400/80 rounded-t-lg absolute top-0"
                          />
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-medium text-slate-500 truncate max-w-[50px]">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 px-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-900"></span> Cash Collection
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> UPI / Online
                </span>
              </div>
              <span className="font-mono font-bold text-slate-700">Peak: ₹{maxRevenueBar.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Visualization 2: Number of Bills Paid and Outstanding (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-700" />
              <span>2. Bills Paid vs Outstanding</span>
            </h3>
            <p className="text-xs text-slate-500">Bill status breakdown and realization gauge</p>
          </div>

          {/* Donut Gauge & Metrics */}
          <div className="flex items-center justify-around py-3">
            {/* Circular Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-600 transition-all duration-1000"
                  strokeDasharray={`${recoveryRate}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black font-mono text-slate-900">{recoveryRate}%</span>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Paid Rate</span>
              </div>
            </div>

            {/* Legend and Counts */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
                <div>
                  <p className="font-bold text-slate-900">{paidBillsCount} Paid Bills</p>
                  <p className="text-[10px] text-slate-500 font-mono">₹{totalPaidRevenue.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0"></span>
                <div>
                  <p className="font-bold text-slate-900">{unpaidBillsCount} Unpaid Bills</p>
                  <p className="text-[10px] text-slate-500 font-mono">₹{totalOutstanding.toFixed(2)}</p>
                </div>
              </div>

              {partialBillsCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
                  <div>
                    <p className="font-bold text-slate-900">{partialBillsCount} Partial Bills</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>Total Bills Issued:</span>
            <span className="font-mono font-bold text-slate-900">{totalBillsCount} Invoices</span>
          </div>
        </div>
      </div>

      {/* ROW 2: Visualizations 3 & 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visualization 3: Top-Performing Services (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>3. Top-Performing Services</span>
            </h3>
            <p className="text-xs text-slate-500">Highest revenue and highest volume kiosk offerings</p>
          </div>

          <div className="space-y-3">
            {topServices.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No service data in selected timeframe.</p>
            ) : (
              topServices.map((srv, idx) => {
                const maxSrvRev = Math.max(...topServices.map((s) => s.revenue), 1);
                const widthPercent = Math.max(12, Math.round((srv.revenue / maxSrvRev) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate max-w-[260px]">
                        {idx + 1}. {srv.name}
                      </span>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-slate-900">₹{srv.revenue.toFixed(2)}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">({srv.count} units)</span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className="bg-gradient-to-r from-blue-900 to-indigo-600 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Visualization 5: Credit and Debit History Trends (6 Cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-700" />
              <span>5. Credit & Debit History Trends (Flow)</span>
            </h3>
            <p className="text-xs text-slate-500">Udhar given vs Payments recovered over time</p>
          </div>

          {/* Dual Bar Comparison Chart */}
          <div className="h-52 flex flex-col justify-end pt-2">
            <div className="flex items-end justify-between gap-3 h-40 border-b border-slate-200 px-3">
              {creditDebitTrends.map((trend, i) => {
                const maxTrend = Math.max(...creditDebitTrends.map((t) => Math.max(t.credit, t.debit)), 100);
                const creditHeight = Math.max(10, Math.round((trend.credit / maxTrend) * 100));
                const debitHeight = Math.max(10, Math.round((trend.debit / maxTrend) * 100));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end justify-center gap-1.5 h-36 w-full">
                      {/* Credit Bar (Rose) */}
                      <div
                        style={{ height: `${creditHeight}%` }}
                        className="w-1/2 max-w-[20px] bg-rose-600 rounded-t-md transition-all duration-500"
                        title={`Credit Issued: ₹${trend.credit}`}
                      />
                      {/* Debit Bar (Emerald) */}
                      <div
                        style={{ height: `${debitHeight}%` }}
                        className="w-1/2 max-w-[20px] bg-emerald-600 rounded-t-md transition-all duration-500"
                        title={`Payment Received: ₹${trend.debit}`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 truncate max-w-[60px]">
                      {trend.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 px-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-600"></span> Credit Given (+ Udhar)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600"></span> Payments Received (- Jama)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
            <span>Cumulative Outstanding:</span>
            <span className="font-mono font-black text-rose-700">
              ₹{customers.reduce((a, b) => a + b.balanceDue, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ROW 3: Visualization 4: Customer Transaction Summaries */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-900" />
              <span>4. Customer Transaction Summaries</span>
            </h3>
            <p className="text-xs text-slate-500">
              Detailed client-by-client billing, payment realization, and balance breakdown
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {customerSummaries.length} Active Clients in period
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-bold">#</th>
                <th className="py-2.5 px-3 font-bold">Citizen / Customer Name</th>
                <th className="py-2.5 px-3 font-bold">Contact Phone</th>
                <th className="py-2.5 px-3 font-bold text-center">Bills Count</th>
                <th className="py-2.5 px-3 font-bold text-right">Total Billed (₹)</th>
                <th className="py-2.5 px-3 font-bold text-right">Total Paid (₹)</th>
                <th className="py-2.5 px-3 font-bold text-right">Outstanding (₹)</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No customer transactions in selected date range.
                  </td>
                </tr>
              ) : (
                customerSummaries.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {c.phone ? `+91 ${c.phone}` : 'Walk-in'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">{c.count}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{c.totalBilled.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                      ₹{c.totalPaid.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600">
                      ₹{c.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.balanceDue === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {c.balanceDue === 0 ? 'Clear' : 'Pending Due'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
