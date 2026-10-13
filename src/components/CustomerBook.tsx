import React, { useState } from 'react';
import { 
  BookOpen, 
  UserPlus, 
  Plus, 
  Minus, 
  Search, 
  Share2, 
  Phone, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  X,
  CreditCard,
  Banknote,
  Edit3,
  Trash2,
  UserCheck
} from 'lucide-react';
import { Customer, Transaction, KioskSettings, Operator, CustomerType } from '../types';
import { StorageService } from '../services/storageService';

interface CustomerBookProps {
  customers: Customer[];
  transactions: Transaction[];
  settings: KioskSettings;
  currentOperator: Operator;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onAddTransaction: (tx: Transaction) => void;
  onSendWhatsAppReminder: (customer: Customer) => void;
}

export const CustomerBook: React.FC<CustomerBookProps> = ({
  customers,
  transactions,
  settings,
  currentOperator,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddTransaction,
  onSendWhatsAppReminder,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    customers.length > 0 ? customers[0] : null
  );

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState<boolean>(false);
  const [showTxModal, setShowTxModal] = useState<boolean>(false);
  const [txModalType, setTxModalType] = useState<'credit' | 'payment_received'>('credit');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustType, setNewCustType] = useState<CustomerType>('individual');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Edit Customer Form State
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustType, setEditCustType] = useState<CustomerType>('individual');
  const [editCustNotes, setEditCustNotes] = useState('');

  // New Transaction Form State
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDescription, setTxDescription] = useState<string>('');
  const [txPaymentMode, setTxPaymentMode] = useState<'cash' | 'upi'>('cash');

  // Filter customers
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate overall Customer Ledger metrics
  const totalOutstandingBalance = customers.reduce((acc, c) => acc + c.balanceDue, 0);
  const totalCreditGiven = customers.reduce((acc, c) => acc + c.totalCredit, 0);
  const totalPaymentReceived = customers.reduce((acc, c) => acc + c.totalDebit, 0);

  // Transactions for selected customer
  const customerTxs = selectedCustomer
    ? transactions.filter((t) => t.customerId === selectedCustomer.id)
    : [];

  // Submit New Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Customer Name and Phone number are required.');
      return;
    }

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || undefined,
      type: newCustType,
      notes: newCustNotes.trim() || undefined,
      totalCredit: openingBalance > 0 ? openingBalance : 0,
      totalDebit: 0,
      balanceDue: openingBalance > 0 ? openingBalance : 0,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };

    onAddCustomer(newCust);
    setSelectedCustomer(newCust);

    if (openingBalance > 0) {
      onAddTransaction({
        id: 'ktx-' + Date.now(),
        customerId: newCust.id,
        type: 'credit',
        amount: openingBalance,
        date: new Date().toISOString(),
        description: 'Opening Balance Due',
        balanceAfter: openingBalance,
        operatorName: currentOperator.name,
      });
    }

    // Reset & close
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustNotes('');
    setOpeningBalance(0);
    setShowAddCustomerModal(false);
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomer = (cust: Customer) => {
    setEditCustName(cust.name);
    setEditCustPhone(cust.phone);
    setEditCustAddress(cust.address || '');
    setEditCustType(cust.type);
    setEditCustNotes(cust.notes || '');
    setShowEditCustomerModal(true);
  };

  // Submit Edit Customer
  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!editCustName.trim() || !editCustPhone.trim()) {
      alert('Customer Name and Phone number are required.');
      return;
    }

    const updated: Customer = {
      ...selectedCustomer,
      name: editCustName.trim(),
      phone: editCustPhone.trim(),
      address: editCustAddress.trim() || undefined,
      type: editCustType,
      notes: editCustNotes.trim() || undefined,
      lastUpdated: Date.now(),
    };

    StorageService.updateCustomer(updated);
    if (onUpdateCustomer) onUpdateCustomer(updated);
    setSelectedCustomer(updated);
    setShowEditCustomerModal(false);
  };

  // Delete Customer
  const handleDeleteCustomer = (cust: Customer) => {
    if (window.confirm(`Are you sure you want to delete customer "${cust.name}"? This will permanently remove their profile and transaction ledger history.`)) {
      StorageService.deleteCustomer(cust.id);
      if (onDeleteCustomer) onDeleteCustomer(cust.id);
      if (selectedCustomer?.id === cust.id) {
        const remaining = customers.filter(c => c.id !== cust.id);
        setSelectedCustomer(remaining.length > 0 ? remaining[0] : null);
      }
    }
  };

  // Submit New Transaction (Give Credit or Receive Payment)
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (txAmount <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    const defaultDesc =
      txModalType === 'credit'
        ? 'Xerox & e-Governance service charge'
        : `Payment received via ${txPaymentMode.toUpperCase()}`;

    const newTx: Transaction = {
      id: 'ktx-' + Date.now(),
      customerId: selectedCustomer.id,
      type: txModalType,
      amount: txAmount,
      date: new Date().toISOString(),
      description: txDescription.trim() || defaultDesc,
      paymentMode: txModalType === 'payment_received' ? txPaymentMode : undefined,
      balanceAfter: 0,
      operatorName: currentOperator.name,
    };

    onAddTransaction(newTx);

    // Update locally selected customer balance
    let newBal = selectedCustomer.balanceDue;
    if (txModalType === 'credit') newBal += txAmount;
    else newBal = Math.max(0, newBal - txAmount);

    setSelectedCustomer({
      ...selectedCustomer,
      balanceDue: newBal,
      totalCredit: txModalType === 'credit' ? selectedCustomer.totalCredit + txAmount : selectedCustomer.totalCredit,
      totalDebit: txModalType === 'payment_received' ? selectedCustomer.totalDebit + txAmount : selectedCustomer.totalDebit,
      lastUpdated: Date.now(),
    });

    setTxAmount(0);
    setTxDescription('');
    setShowTxModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Ledger Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-rose-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-200">Total Pending Due</span>
            <ArrowUpRight className="w-5 h-5 text-rose-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 font-mono text-rose-100">
            ₹{totalOutstandingBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-rose-300 mt-1">Across {customers.length} registered customer accounts</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Credit Issued</span>
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 font-mono text-amber-400">
            ₹{totalCreditGiven.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative services delivered on credit</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Total Payments Received</span>
            <ArrowDownLeft className="w-5 h-5 text-emerald-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 font-mono text-emerald-100">
            ₹{totalPaymentReceived.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-300 mt-1">Cash and UPI customer settlements</p>
        </div>
      </div>

      {/* Main Split Ledger Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Directory (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-black text-slate-900">Customer Directory</h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {customers.length}
              </span>
            </div>

            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>

          {/* Search box */}
          <div className="py-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>

          {/* Customer list scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">No customers found.</p>
              </div>
            ) : (
              // Simple pagination logic
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`w-full p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50 border-2 border-blue-900 shadow-2xs'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{cust.name}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {cust.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        +91 {cust.phone}
                      </p>
                      {cust.address && (
                        <p className="text-[10px] text-slate-400 truncate">{cust.address}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-right">
                        <span className={`font-mono text-sm font-black ${
                          cust.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          ₹{cust.balanceDue.toFixed(2)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {cust.balanceDue > 0 ? 'Due' : 'Settled'}
                        </p>
                      </div>

                      {/* Quick Action row */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                            handleOpenEditCustomer(cust);
                          }}
                          className="p-1 rounded-md text-slate-500 hover:text-blue-900 hover:bg-slate-200 transition"
                          title="Edit Customer Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomer(cust);
                          }}
                          className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Simple Pagination Control */}
          <div className="p-2 border-t border-slate-200 text-center text-xs text-slate-500">
             Showing {Math.min(filteredCustomers.length, 50)} of {filteredCustomers.length}
          </div>
        </div>

        {/* Right Column: Customer Detailed Ledger & Transactions (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col h-[650px] justify-between">
          {selectedCustomer ? (
            <>
              {/* Customer Header & Outstanding Banner */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {selectedCustomer.name}
                      </h3>
                      <span className="text-[11px] uppercase font-bold px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full">
                        {selectedCustomer.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      +91 {selectedCustomer.phone}
                      {selectedCustomer.address && (
                        <>
                          <span>•</span>
                          <span>{selectedCustomer.address}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Edit Customer Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditCustomer(selectedCustomer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition"
                      title="Edit Customer Profile"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-900" />
                      <span>Edit</span>
                    </button>

                    {/* Delete Customer Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomer(selectedCustomer)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold shadow-xs transition"
                      title="Delete Customer Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    {/* WhatsApp Reminder Button */}
                    {selectedCustomer.balanceDue > 0 && (
                      <button
                        type="button"
                        onClick={() => onSendWhatsAppReminder(selectedCustomer)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                        title="Send WhatsApp Payment Reminder"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp Reminder</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Net Balance Card */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Net Outstanding Balance
                    </span>
                    <p className={`text-2xl font-black font-mono mt-0.5 ${
                      selectedCustomer.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      ₹{selectedCustomer.balanceDue.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTxModalType('credit');
                        setShowTxModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Credit (+)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTxModalType('payment_received');
                        setShowTxModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Record Payment (-)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions Timeline */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 my-2 pr-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Transaction History & Ledger Timeline
                </p>

                {customerTxs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs">No transactions recorded yet for this customer.</p>
                  </div>
                ) : (
                  customerTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                          tx.type === 'credit'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {tx.type === 'credit' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownLeft className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(tx.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            • By {tx.operatorName}
                            {tx.paymentMode && ` • Mode: ${tx.paymentMode.toUpperCase()}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono text-sm font-black ${
                          tx.type === 'credit' ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {tx.type === 'credit' ? `+₹${tx.amount.toFixed(2)}` : `-₹${tx.amount.toFixed(2)}`}
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Bal: ₹{tx.balanceAfter.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Account Created: {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN')}</span>
                <span className="font-semibold text-slate-700">Total Given: ₹{selectedCustomer.totalCredit} • Total Paid: ₹{selectedCustomer.totalDebit}</span>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Select a Customer</p>
              <p className="text-xs text-slate-400 mt-1">
                Choose a customer from the left to view their credit-debit ledger and transactions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New Customer */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-black text-slate-900">Add Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adv. Murugesan / Vignesh Stores"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp / Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9842100000"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 font-semibold focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Category</label>
                  <select
                    value={newCustType}
                    onChange={(e) => setNewCustType(e.target.value as CustomerType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="individual">Individual Citizen</option>
                    <option value="advocate">Court Advocate</option>
                    <option value="business">Local Business / Shop</option>
                    <option value="school_student">School / College</option>
                    <option value="panchayat">Panchayat / Govt Rep</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Balance Due (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={openingBalance || ''}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 font-bold focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Chamber / Shop Info</label>
                <input
                  type="text"
                  placeholder="e.g. Near Bus Stand, Court Chamber #4"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Note</label>
                <input
                  type="text"
                  placeholder="e.g. 50+ copies xerox daily client"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Customer */}
      {showEditCustomerModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-900" />
                <h3 className="text-base font-black text-slate-900">Edit Customer Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">WhatsApp / Phone Number *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900 font-semibold focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Category</label>
                <select
                  value={editCustType}
                  onChange={(e) => setEditCustType(e.target.value as CustomerType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:ring-2 focus:ring-blue-900"
                >
                  <option value="individual">Individual Citizen</option>
                  <option value="advocate">Court Advocate</option>
                  <option value="business">Local Business / Shop</option>
                  <option value="school_student">School / College</option>
                  <option value="panchayat">Panchayat / Govt Rep</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Chamber / Shop Info</label>
                <input
                  type="text"
                  placeholder="e.g. Near Bus Stand, Court Chamber #4"
                  value={editCustAddress}
                  onChange={(e) => setEditCustAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Note</label>
                <input
                  type="text"
                  value={editCustNotes}
                  onChange={(e) => setEditCustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Update Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Transaction (Give Credit or Receive Payment) */}
      {showTxModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                {txModalType === 'credit' ? (
                  <Plus className="w-5 h-5 text-rose-600" />
                ) : (
                  <Minus className="w-5 h-5 text-emerald-600" />
                )}
                <h3 className="text-base font-black text-slate-900">
                  {txModalType === 'credit' ? 'Record Credit Given (+)' : 'Record Payment Received (-)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
              <p className="text-slate-500 font-medium">Customer:</p>
              <p className="text-sm font-bold text-slate-900">{selectedCustomer.name}</p>
              <p className="text-slate-600 font-mono">Current Balance Due: <strong className="text-rose-600">₹{selectedCustomer.balanceDue.toFixed(2)}</strong></p>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  min="1"
                  placeholder="0.00"
                  value={txAmount || ''}
                  onChange={(e) => setTxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-lg font-mono font-black text-slate-900 focus:ring-2 focus:ring-blue-900"
                />
              </div>

              {txModalType === 'payment_received' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxPaymentMode('cash')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition ${
                        txPaymentMode === 'cash'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-500'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxPaymentMode('upi')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition ${
                        txPaymentMode === 'upi'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>UPI (GPay/PhonePe)</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Reason</label>
                <input
                  type="text"
                  placeholder={txModalType === 'credit' ? 'e.g. 150 pages Xerox Legal Size' : 'e.g. Cash paid at counter'}
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`w-1/2 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm ${
                    txModalType === 'credit' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {txModalType === 'credit' ? 'Record Credit' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
