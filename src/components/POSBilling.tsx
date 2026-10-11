import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Receipt, 
  CreditCard, 
  Banknote, 
  BookOpen, 
  User, 
  Phone, 
  ShieldCheck, 
  FileText, 
  Check, 
  Printer, 
  Share2, 
  Clock, 
  Tag, 
  ChevronRight,
  Layers,
  AlertCircle,
  Percent,
  Calculator,
  X
} from 'lucide-react';
import { 
  ServiceCatalogItem, 
  InvoiceItem, 
  Invoice, 
  PaymentMode, 
  PaymentStatus, 
  CustomerKhata, 
  Operator, 
  KioskSettings 
} from '../types';

interface POSBillingProps {
  services: ServiceCatalogItem[];
  customers: CustomerKhata[];
  currentOperator: Operator;
  settings: KioskSettings;
  cartItems: InvoiceItem[];
  onUpdateCart: (items: InvoiceItem[]) => void;
  onInvoiceCreated: (invoice: Invoice) => void;
  onNavigateToXerox: () => void;
}

export const POSBilling: React.FC<POSBillingProps> = ({
  services,
  customers,
  currentOperator,
  settings,
  cartItems,
  onUpdateCart,
  onInvoiceCreated,
  onNavigateToXerox,
}) => {
  // Citizen Details state
  const [citizenName, setCitizenName] = useState<string>('');
  const [citizenPhone, setCitizenPhone] = useState<string>('');
  const [citizenAadhaarLast4, setCitizenAadhaarLast4] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Service catalog filter & search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Custom Utility / Bill Amount & Commission Calculation state (e.g. EB bill 5000 with 2% commission)
  const [showUtilityCalc, setShowUtilityCalc] = useState<boolean>(false);
  const [selectedUtilityService, setSelectedUtilityService] = useState<ServiceCatalogItem | null>(null);
  const [billFaceValue, setBillFaceValue] = useState<number>(5000);
  const [commissionPercent, setCommissionPercent] = useState<number>(2.0);
  const [utilityConsumerNo, setUtilityConsumerNo] = useState<string>('');

  // Billing parameters
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [isMarkAsPaid, setIsMarkAsPaid] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (!custId) return;
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setCitizenName(cust.name);
      setCitizenPhone(cust.phone);
    }
  };

  const filteredServices = services.filter((srv) => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (srv.tamilName && srv.tamilName.includes(searchTerm)) ||
      srv.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = selectedCategory === 'all' || srv.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddService = (srv: ServiceCatalogItem) => {
    if (srv.category === 'utility' || srv.code.includes('TNEB') || srv.code.includes('BILL')) {
      setSelectedUtilityService(srv);
      setShowUtilityCalc(true);
      return;
    }

    const existingIndex = cartItems.findIndex((item) => item.serviceId === srv.id);
    if (existingIndex !== -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].amount = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      onUpdateCart(updated);
    } else {
      const newItem: InvoiceItem = {
        id: 'pos-' + Date.now() + Math.random().toString(36).substring(2, 6),
        serviceId: srv.id,
        name: srv.name,
        category: srv.category,
        quantity: 1,
        unitPrice: srv.totalFee,
        amount: srv.totalFee,
        details: `${srv.dept} • Turnaround: ${srv.turnAroundDays}`,
      };
      onUpdateCart([...cartItems, newItem]);
    }
  };

  const handleAddUtilityWithCommission = () => {
    if (!selectedUtilityService) return;
    const commissionAmount = (billFaceValue * commissionPercent) / 100;
    const totalPayableByCitizen = billFaceValue + commissionAmount;

    const newItem: InvoiceItem = {
      id: 'util-' + Date.now(),
      serviceId: selectedUtilityService.id,
      name: `${selectedUtilityService.name} (Bill: ₹${billFaceValue})`,
      category: selectedUtilityService.category,
      quantity: 1,
      unitPrice: totalPayableByCitizen,
      amount: totalPayableByCitizen,
      details: `Bill Amount: ₹${billFaceValue} + Kiosk Commission (${commissionPercent}%): ₹${commissionAmount.toFixed(2)}${utilityConsumerNo ? ` • Consumer #: ${utilityConsumerNo}` : ''}`,
    };

    onUpdateCart([...cartItems, newItem]);
    setShowUtilityCalc(false);
    setSelectedUtilityService(null);
    setUtilityConsumerNo('');
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cartItems];
    updated[index].quantity = newQty;
    updated[index].amount = newQty * updated[index].unitPrice;
    onUpdateCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    onUpdateCart(updated);
  };

  const handleClearCart = () => {
    onUpdateCart([]);
    setDiscount(0);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.amount, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const paidAmount = isMarkAsPaid ? totalAmount : 0;
  const balanceDue = totalAmount - paidAmount;
  const paymentStatus: PaymentStatus = isMarkAsPaid ? 'paid' : 'unpaid';

  const handleGenerateInvoice = () => {
    if (cartItems.length === 0) {
      alert('Please add at least one service or xerox job to generate a bill.');
      return;
    }

    const cName = citizenName.trim() || 'Walk-in Citizen';
    const cPhone = citizenPhone.trim();

    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${randomSeq}`;
    const tokenNumber = Math.floor(1 + Math.random() * 150);

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      tokenNumber,
      date: new Date().toISOString(),
      citizenName: cName,
      citizenPhone: cPhone,
      citizenAadhaarLast4: citizenAadhaarLast4.trim() || undefined,
      items: [...cartItems],
      subtotal,
      discount,
      totalAmount,
      paidAmount,
      balanceDue,
      paymentStatus: paymentMode === 'credit_khata' ? 'unpaid' : paymentStatus,
      paymentMode,
      operatorId: currentOperator.id,
      operatorName: currentOperator.name,
      notes: notes.trim() || undefined,
      customerId: selectedCustomerId || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onInvoiceCreated(newInvoice);

    onUpdateCart([]);
    setCitizenName('');
    setCitizenPhone('');
    setCitizenAadhaarLast4('');
    setSelectedCustomerId('');
    setDiscount(0);
    setNotes('');
    setIsMarkAsPaid(true);
    setPaymentMode('cash');
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Counter POS & Utility Commission Calculator
            </h2>
            <p className="text-xs text-slate-500">
              Calculate exact customer pricing with custom service commissions (e.g. EB Bill ₹5000 + 2%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToXerox}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-bold shadow-xs transition"
          >
            <Layers className="w-4 h-4 text-amber-300" />
            <span>Open Xerox & Print Calculator</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>1. Citizen / Customer Information</span>
              </h3>
              
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-[11px] text-slate-500 hidden sm:inline whitespace-nowrap">Customer Account:</span>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full sm:w-48 bg-slate-100 border border-slate-300 rounded-lg text-xs px-2 py-1 font-medium text-slate-800 focus:outline-hidden truncate"
                >
                  <option value="">-- Quick Pick Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type} • Due: ₹{c.balanceDue})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Citizen Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. K. Senthil Kumar"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  WhatsApp / Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9842100000"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Aadhaar (Last 4 Digits)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 4821"
                  value={citizenAadhaarLast4}
                  onChange={(e) => setCitizenAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>2. Select Government & Utility Services</span>
              </h3>
              <span className="text-xs font-medium text-slate-500">
                {filteredServices.length} Services available
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search service name, EB bill, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden shadow-xs"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'certificate', label: 'Certificates' },
                  { id: 'egov', label: 'e-District' },
                  { id: 'financial', label: 'Banking/PAN' },
                  { id: 'utility', label: 'EB & Utility' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-blue-900 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredServices.map((srv) => (
                <div
                  key={srv.id}
                  className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm rounded-xl p-3 flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">
                        {srv.code}
                      </span>
                      <span className="text-xs font-extrabold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {srv.category === 'utility' ? 'Commission %' : `₹${srv.totalFee}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug group-hover:text-blue-900">
                      {srv.name}
                    </h4>

                    {srv.tamilName && (
                      <p className="text-[11px] font-medium text-amber-700 mt-0.5">
                        {srv.tamilName}
                      </p>
                    )}

                    <p className="text-[10px] text-slate-500 mt-1">
                      Dept: {srv.dept} • Time: {srv.turnAroundDays}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {srv.category === 'utility' ? 'Bill Payment & Recharge' : `Govt: ₹${srv.govtFee} + Fee: ₹${srv.kioskCharge}`}
                    </span>
                    <button
                      onClick={() => handleAddService(srv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-900 hover:text-white text-blue-900 text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{srv.category === 'utility' ? 'Calculate Bill' : 'Add'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-black text-slate-900">Current Bill Cart</h3>
                <span className="text-[11px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                  {cartItems.length} items
                </span>
              </div>
              {cartItems.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-medium">Cart is empty</p>
                <p className="text-[11px] text-slate-400">
                  Select services or utility bills (like EB Bill ₹5000 + commission) from the catalog.
                </p>
                <button
                  onClick={onNavigateToXerox}
                  className="mt-2 text-xs font-bold text-blue-900 hover:underline inline-flex items-center gap-1"
                >
                  <span>Quick Xerox Calculator</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto py-2">
                {cartItems.map((item, idx) => (
                  <div key={item.id || idx} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-900 leading-snug">{item.name}</p>
                      {item.details && (
                        <p className="text-[10px] text-slate-500 line-clamp-1">{item.details}</p>
                      )}
                      <p className="text-[11px] font-mono text-slate-600">
                        ₹{item.unitPrice} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => handleUpdateQuantity(idx, item.quantity - 1)}
                          className="w-5 h-5 rounded font-bold text-xs text-slate-600 hover:bg-slate-200"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold w-6 text-center text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(idx, item.quantity + 1)}
                          className="w-5 h-5 rounded font-bold text-xs text-slate-600 hover:bg-slate-200"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-mono text-xs font-black text-slate-900 w-16 text-right">
                        ₹{item.amount.toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">₹{subtotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  Kiosk Discount:
                </span>
                <div className="flex items-center gap-1 w-24">
                  <span className="text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-right bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 font-mono text-xs text-emerald-700 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-between text-base font-black text-blue-950 border-t border-slate-200 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-amber-600 text-lg">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Payment Mode & Settlement
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('cash');
                    setIsMarkAsPaid(true);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition ${
                    paymentMode === 'cash'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('upi');
                    setIsMarkAsPaid(true);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition ${
                    paymentMode === 'upi'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('credit_khata');
                    setIsMarkAsPaid(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition ${
                    paymentMode === 'credit_khata'
                      ? 'bg-amber-50 border-amber-600 text-amber-900 shadow-2xs ring-1 ring-amber-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Customer Credit</span>
                </button>
              </div>
            </div>

            {paymentMode !== 'credit_khata' && (
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">Payment Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMarkAsPaid(true)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      isMarkAsPaid
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    Paid Full
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMarkAsPaid(false)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                      !isMarkAsPaid
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    Unpaid / Due
                  </button>
                </div>
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Optional remark / acknowledgment number..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
              />
            </div>

            <button
              onClick={handleGenerateInvoice}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 active:scale-98"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Generate Official Receipt & Token (₹{totalAmount.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>

      {showUtilityCalc && selectedUtilityService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-black text-slate-900">{selectedUtilityService.name}</h3>
              </div>
              <button
                onClick={() => setShowUtilityCalc(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Consumer / Service Connection Number</label>
                <input
                  type="text"
                  placeholder="e.g. 04-291-00421"
                  value={utilityConsumerNo}
                  onChange={(e) => setUtilityConsumerNo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bill Face Value Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-mono text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={billFaceValue || ''}
                    onChange={(e) => setBillFaceValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-base font-mono font-black text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kiosk Service Commission (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-mono font-bold text-slate-900 text-center"
                  />
                  <span className="font-bold text-slate-500">%</span>
                  <div className="flex items-center gap-1 ml-auto">
                    {[1, 2, 2.5, 3, 5].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCommissionPercent(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                          commissionPercent === p ? 'bg-blue-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1.5 text-blue-950">
                <div className="flex justify-between">
                  <span>Bill Face Value:</span>
                  <span className="font-mono font-bold">₹{billFaceValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Kiosk Commission ({commissionPercent}%):</span>
                  <span className="font-mono font-bold">+ ₹{((billFaceValue * commissionPercent) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-blue-950 border-t border-blue-200 pt-1.5">
                  <span>Total Payable by Citizen:</span>
                  <span className="font-mono text-amber-600 text-base">₹{(billFaceValue + (billFaceValue * commissionPercent) / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUtilityCalc(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddUtilityWithCommission}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-sm"
                >
                  Add to Bill Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
