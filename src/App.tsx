/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { 
  Operator, 
  KioskSettings, 
  ServiceCatalogItem, 
  Customer,
  Transaction,
  Invoice,
  InvoiceItem 
} from './types';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { POSBilling } from './components/POSBilling';
import { XeroxCalculator } from './components/XeroxCalculator';
import { InvoicesList } from './components/InvoicesList';
import { CustomerBook } from './components/CustomerBook';
import { WhatsAppHub } from './components/WhatsAppHub';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AdminModule } from './components/AdminModule';
import { InvoiceModal } from './components/InvoiceModal';
import { AuthModal } from './components/AuthModal';
import { SettingsModal } from './components/SettingsModal';
import { ClientSetupModal } from './components/ClientSetupModal';
import { ClientSupportModal } from './components/ClientSupportModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Initialize local storage on mount
  useEffect(() => {
    StorageService.init();
  }, []);

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [operators, setOperators] = useState<Operator[]>(StorageService.getOperators());
  const [currentOperator, setCurrentOperator] = useState<Operator>(StorageService.getCurrentOperator());
  const [settings, setSettings] = useState<KioskSettings>(StorageService.getSettings());
  const [services, setServices] = useState<ServiceCatalogItem[]>(StorageService.getServices());
  const [customers, setCustomers] = useState<Customer[]>(StorageService.getCustomers());
  const [invoices, setInvoices] = useState<Invoice[]>(StorageService.getInvoices());
  const [transactions, setTransactions] = useState<Transaction[]>(StorageService.getKhataTransactions());

  // POS Cart State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Modals State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showClientSetupModal, setShowClientSetupModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Listen to storage/data sync events
  useEffect(() => {
    const handleDataChanged = () => {
      setInvoices(StorageService.getInvoices());
      setCustomers(StorageService.getCustomers());
      setTransactions(StorageService.getKhataTransactions());
      setServices(StorageService.getServices());
      setOperators(StorageService.getOperators());
      setSettings(StorageService.getSettings());
    };

    window.addEventListener('csc_data_changed', handleDataChanged);
    window.addEventListener('csc_invoices_changed', handleDataChanged);
    window.addEventListener('csc_customers_changed', handleDataChanged);
    window.addEventListener('csc_transactions_changed', handleDataChanged);
    window.addEventListener('csc_settings_changed', handleDataChanged);
    window.addEventListener('csc_operator_changed', handleDataChanged);

    return () => {
      window.removeEventListener('csc_data_changed', handleDataChanged);
      window.removeEventListener('csc_invoices_changed', handleDataChanged);
      window.removeEventListener('csc_customers_changed', handleDataChanged);
      window.removeEventListener('csc_transactions_changed', handleDataChanged);
      window.removeEventListener('csc_settings_changed', handleDataChanged);
      window.removeEventListener('csc_operator_changed', handleDataChanged);
    };
  }, []);

  // Handlers
  const handleInvoiceCreated = (newInv: Invoice) => {
    StorageService.addInvoice(newInv);
    setInvoices(StorageService.getInvoices());
    setCustomers(StorageService.getCustomers());
    setTransactions(StorageService.getKhataTransactions());
    setSelectedInvoice(newInv);
  };

  const handleMarkPaid = (invoiceId: string, mode: 'cash' | 'upi') => {
    StorageService.updateInvoiceStatus(invoiceId, 'paid', undefined, mode);
    setInvoices(StorageService.getInvoices());
    setCustomers(StorageService.getCustomers());
    setTransactions(StorageService.getTransactions());
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      const updated = StorageService.getInvoices().find((i) => i.id === invoiceId);
      if (updated) setSelectedInvoice(updated);
    }
  };

  const handleSendWhatsAppReminder = (invoiceOrCustomer: Invoice | Customer) => {
    // Switch to WhatsApp tab with pre-filled message
    setActiveTab('whatsapp');
  };

  // Metrics for Navigation
  const unpaidCount = invoices.filter((i) => i.paymentStatus !== 'paid').length;
  const totalPendingDue = customers.reduce((acc, c) => acc + c.balanceDue, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Offline connectivity & synchronization status banner */}
      <OfflineIndicator />

      {/* Header */}
      <Header
        currentOperator={currentOperator}
        settings={settings}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenClientSetup={() => setShowClientSetupModal(true)}
        onOpenSupport={() => setShowSupportModal(true)}
        isAdminMode={activeTab === 'admin'}
        onToggleAdminMode={() => setActiveTab(activeTab === 'admin' ? 'pos' : 'admin')}
      />

      {/* Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unpaidCount={unpaidCount}
        totalPendingDue={totalPendingDue}
      />

      {/* Main App Content View */}
      <main className="flex-1 pb-16 pt-4 px-4 sm:px-6">
        {activeTab === 'pos' && (
          <POSBilling
            services={services}
            customers={customers}
            currentOperator={currentOperator}
            settings={settings}
            cartItems={cartItems}
            onUpdateCart={setCartItems}
            onInvoiceCreated={handleInvoiceCreated}
            onNavigateToXerox={() => setActiveTab('xerox')}
          />
        )}

        {activeTab === 'xerox' && (
          <XeroxCalculator
            onAddToCart={(item) => setCartItems([...cartItems, item])}
            onQuickBill={(items) => {
              setCartItems(items);
              setActiveTab('pos');
            }}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesList
            invoices={invoices}
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
            onMarkPaid={handleMarkPaid}
            onSendWhatsApp={handleSendWhatsAppReminder}
          />
        )}

        {activeTab === 'khata' && (
          <CustomerBook
            customers={customers}
            transactions={transactions}
            settings={settings}
            currentOperator={currentOperator}
            onAddCustomer={(c) => {
              StorageService.addCustomer(c);
              setCustomers(StorageService.getCustomers());
            }}
            onUpdateCustomer={() => {
              setCustomers(StorageService.getCustomers());
            }}
            onDeleteCustomer={() => {
              setCustomers(StorageService.getCustomers());
              setTransactions(StorageService.getTransactions());
            }}
            onAddTransaction={(tx) => {
              StorageService.addTransaction(tx);
              setTransactions(StorageService.getTransactions());
              setCustomers(StorageService.getCustomers());
            }}
            onSendWhatsAppReminder={() => setActiveTab('whatsapp')}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppHub
            customers={customers}
            invoices={invoices}
            settings={settings}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            invoices={invoices}
            customers={customers}
            transactions={transactions}
            settings={settings}
          />
        )}

        {activeTab === 'admin' && (
          <AdminModule
            operators={operators}
            settings={settings}
            services={services}
            onUpdateOperators={(ops) => {
              setOperators(ops);
            }}
            onUpdateServices={(srvs) => {
              setServices(srvs);
            }}
          />
        )}
      </main>

      {/* Modals */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          settings={settings}
          onClose={() => setSelectedInvoice(null)}
          onMarkPaid={handleMarkPaid}
          onSendWhatsAppReminder={() => {
            setSelectedInvoice(null);
            setActiveTab('whatsapp');
          }}
        />
      )}

      {showAuthModal && (
        <AuthModal
          operators={operators}
          currentOperator={currentOperator}
          onSelectOperator={(op) => {
            StorageService.setCurrentOperator(op);
            setCurrentOperator(op);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onUpdateSettings={(s) => setSettings(s)}
        />
      )}

      {showClientSetupModal && (
        <ClientSetupModal
          settings={settings}
          onClose={() => setShowClientSetupModal(false)}
          onUpdateSettings={(s) => setSettings(s)}
          onUpdateServices={(srvs) => setServices(srvs)}
        />
      )}

      {showSupportModal && (
        <ClientSupportModal
          isOpen={showSupportModal}
          onClose={() => setShowSupportModal(false)}
          settings={settings}
        />
      )}
    </div>
  );
}
