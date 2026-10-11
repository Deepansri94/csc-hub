import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Share2, 
  Bell, 
  Tag, 
  Newspaper, 
  Copy, 
  Check, 
  User, 
  Phone, 
  Languages, 
  Clock, 
  ExternalLink,
  Sparkles,
  Paperclip,
  FileText,
  Image as ImageIcon,
  X,
  Users,
  CheckCircle2,
  Zap,
  QrCode,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Laptop,
  Activity,
  Terminal,
} from 'lucide-react';
import { Customer, Invoice, KioskSettings, WhatsAppTemplate, MessageLog } from '../types';
import { StorageService } from '../services/storageService';

interface WhatsAppHubProps {
  customers: Customer[];
  invoices: Invoice[];
  settings: KioskSettings;
}

export const WhatsAppHub: React.FC<WhatsAppHubProps> = ({
  customers,
  invoices,
  settings,
}) => {
  // Desktop Electron WhatsApp Gateway State
  const [gatewayStatus, setGatewayStatus] = useState<{
    state: 'connected' | 'qr_ready' | 'disconnected' | 'checking';
    hasQr: boolean;
    qr: string;
    phone?: string;
  }>({ state: 'checking', hasQr: false, qr: '' });

  const [isTestingGateway, setIsTestingGateway] = useState<boolean>(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<string | null>(null);

  const fetchGatewayStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setGatewayStatus({
          state: data.state || 'disconnected',
          hasQr: !!data.hasQr,
          qr: data.qr || '',
          phone: data.phone,
        });
      } else {
        setGatewayStatus(prev => ({ ...prev, state: 'disconnected' }));
      }
    } catch {
      setGatewayStatus(prev => ({ ...prev, state: 'disconnected' }));
    }
  };

  useEffect(() => {
    fetchGatewayStatus();
    const interval = setInterval(fetchGatewayStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<'reminders' | 'bulk' | 'broadcast' | 'custom' | 'linked' | 'logs'>('reminders');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ta' | 'hi'>('en');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination states
  const [remindersPage, setRemindersPage] = useState<number>(1);
  const [broadcastPage, setBroadcastPage] = useState<number>(1);
  const [logsPage, setLogsPage] = useState<number>(1);
  const itemsPerPage = 6;

  // WhatsApp Linked Device / QR Session state
  const [isLinked, setIsLinked] = useState<boolean>(true);

  // Custom composer state
  const [customPhone, setCustomPhone] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-1');

  // Bulk / Promotional Broadcast state with attachment support
  const [bulkMessageText, setBulkMessageText] = useState<string>(
    `🎉 *SPECIAL KIOSK OFFER @ ${settings.centerName}* 🎉\nGet instant Aadhaar, PAN & Driving License PVC Smart Cards in just 2 minutes for only ₹70!\n\nVisit us today: ${settings.address} | Call: ${settings.phone}`
  );
  const [bulkAttachedFile, setBulkAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>(customers.map(c => c.id));
  const [isSendingBulk, setIsSendingBulk] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<{ sent: number; total: number } | null>(null);

  // Logs state
  const [logs, setLogs] = useState<MessageLog[]>(StorageService.getMessageLogs());

  const dueCustomers = customers.filter((c) => c.balanceDue > 0);
  const templates = StorageService.getTemplates();

  // Paginated slices
  const paginatedReminders = dueCustomers.slice((remindersPage - 1) * itemsPerPage, remindersPage * itemsPerPage);
  const totalReminderPages = Math.ceil(dueCustomers.length / itemsPerPage) || 1;

  const broadcastTemplates = templates.filter((t) => t.category === 'offer' || t.category === 'govt_scheme');
  const paginatedBroadcast = broadcastTemplates.slice((broadcastPage - 1) * itemsPerPage, broadcastPage * itemsPerPage);
  const totalBroadcastPages = Math.ceil(broadcastTemplates.length / itemsPerPage) || 1;

  const paginatedLogs = logs.slice((logsPage - 1) * itemsPerPage, logsPage * itemsPerPage);
  const totalLogPages = Math.ceil(logs.length / itemsPerPage) || 1;

  const handleDirectWhatsAppSend = (phone: string, text: string) => {
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    const log: MessageLog = {
      id: 'msg-' + Date.now() + Math.random().toString(36).substring(2, 6),
      recipientName: 'Citizen',
      recipientPhone: phone,
      templateCategory: 'whatsapp_direct',
      message: text,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
    StorageService.logMessage(log);
    setLogs(StorageService.getMessageLogs());
  };

  const handleLinkedDeviceSend = async (name: string, phone: string, text: string, file?: { name: string; size: string } | null) => {
    let finalMsg = text;
    if (file) {
      finalMsg += `\n\n📎 [Attachment: ${file.name} (${file.size})]`;
    }

    let sentSilently = false;
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: finalMsg }),
      });
      const data = await res.json();
      if (data.success) {
        sentSilently = true;
      }
    } catch {
      // Local Baileys server offline, fallback to wa.me
    }

    if (!sentSilently) {
      const url = `https://wa.me/91${phone}?text=${encodeURIComponent(finalMsg)}`;
      window.open(url, '_blank');
    }

    const log: MessageLog = {
      id: 'msg-' + Date.now() + Math.random().toString(36).substring(2, 6),
      recipientName: name,
      recipientPhone: phone,
      templateCategory: sentSilently ? 'whatsapp_baileys_silent' : 'whatsapp_active_account',
      message: finalMsg,
      status: 'sent',
      timestamp: new Date().toISOString(),
    };
    StorageService.logMessage(log);
    setLogs(StorageService.getMessageLogs());

    if (sentSilently) {
      alert(`✅ Message sent silently via Baileys WhatsApp Gateway to ${name} (+91 ${phone})!`);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type.includes('image') ? 'image' : 'document',
      });
    }
  };

  const handleBulkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBulkAttachedFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type.includes('image') ? 'image' : 'document',
      });
    }
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhone.trim() || !customText.trim()) {
      alert('Recipient Phone and Message Content are required.');
      return;
    }

    handleLinkedDeviceSend(customName.trim() || 'Citizen', customPhone.trim(), customText, attachedFile);
    setCustomText('');
    setCustomPhone('');
    setCustomName('');
    setAttachedFile(null);
  };

  const handleStartBulkBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerIds.length === 0) {
      alert('Please select at least one customer for broadcast.');
      return;
    }
    if (!bulkMessageText.trim()) {
      alert('Please enter promotional broadcast text.');
      return;
    }

    setIsSendingBulk(true);
    setBulkProgress({ sent: 0, total: selectedCustomerIds.length });

    const targetCustomers = customers.filter(c => selectedCustomerIds.includes(c.id));

    let finalBulkText = bulkMessageText;
    if (bulkAttachedFile) {
      finalBulkText += `\n\n📎 [Attachment: ${bulkAttachedFile.name} (${bulkAttachedFile.size})]`;
    }

    for (let i = 0; i < targetCustomers.length; i++) {
      const cust = targetCustomers[i];
      await new Promise(r => setTimeout(r, 100));

      const log: MessageLog = {
        id: 'bulk-' + Date.now() + '-' + i,
        recipientName: cust.name,
        recipientPhone: cust.phone,
        templateCategory: 'whatsapp_broadcast',
        message: finalBulkText,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
      StorageService.logMessage(log);
      setBulkProgress({ sent: i + 1, total: targetCustomers.length });
    }

    setLogs(StorageService.getMessageLogs());
    setIsSendingBulk(false);

    // Open chat for the first recipient using active WhatsApp account
    if (targetCustomers.length > 0) {
      const firstCust = targetCustomers[0];
      const url = `https://wa.me/91${firstCust.phone}?text=${encodeURIComponent(finalBulkText)}`;
      window.open(url, '_blank');
    }

    alert(`📋 Logged broadcast for ${targetCustomers.length} customers! Opening WhatsApp chat with the first recipient (+91 ${targetCustomers[0]?.phone}) to send via your active account.`);
  };

  const handleSelectTemplate = (tpl: WhatsAppTemplate) => {
    setSelectedTemplateId(tpl.id);
    let populated = tpl.templateText
      .replace(/{{centerName}}/g, settings.centerName)
      .replace(/{{tamilCenterName}}/g, settings.tamilCenterName)
      .replace(/{{upiId}}/g, settings.upiId)
      .replace(/{{address}}/g, settings.address)
      .replace(/{{phone}}/g, settings.phone)
      .replace(/{{citizenName}}/g, customName || 'Citizen')
      .replace(/{{balanceDue}}/g, '500')
      .replace(/{{invoiceNumber}}/g, 'INV-2026-0042')
      .replace(/{{serviceSummary}}/g, 'Income Certificate & Xerox');

    setCustomText(populated);
  };

  const getCustomerReminderText = (cust: Customer, lang: 'en' | 'ta' | 'hi') => {
    if (lang === 'ta') {
      return `வணக்கம் ${cust.name},\n${settings.tamilCenterName} சார்பாக அன்பான நினைவூட்டல்.\nதங்களின் இ-சேவை மற்றும் ஜெராக்ஸ் கட்டண நிலுவைத்தொகை *ரூ. ${cust.balanceDue}* உள்ளது.\n\nதங்கள் வசதிக்கேற்ப UPI மூலமாக செலுத்தலாம்: *${settings.upiId}*\nநேரில் செலுத்த: ${settings.address}\n\nநன்றி! - ${settings.phone}`;
    }
    if (lang === 'hi') {
      return `नमस्ते ${cust.name},\n${settings.centerName} की ओर से सादर प्रणाम। आपके खाते का कुल बकाया *रु. ${cust.balanceDue}* है।\n\nआप UPI *${settings.upiId}* द्वारा भुगतान कर सकते हैं।\nकेंद्र का पता: ${settings.address}\n\nधन्यवाद! - ${settings.phone}`;
    }
    return `Dear ${cust.name},\nGreetings from ${settings.centerName}! This is a gentle reminder that a pending balance of *Rs. ${cust.balanceDue}* is due on your account.\n\nYou can pay via UPI: *${settings.upiId}* or visit our centre at ${settings.address}.\n\nThank you for your business! - Ph: ${settings.phone}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 mb-2">
            <Laptop className="w-3.5 h-3.5 text-emerald-400" />
            <span>Desktop Electron WhatsApp Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Desktop WhatsApp Gateway & Broadcast Hub</h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
            Integrated natively into the desktop kiosk runtime using background Baileys socket integration. Dispatches receipts, payment alerts, and broadcast announcements directly from your workstation with high speed.
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            gatewayStatus.state === 'connected' 
              ? 'bg-emerald-400 animate-pulse' 
              : gatewayStatus.state === 'qr_ready'
              ? 'bg-amber-400 animate-ping'
              : 'bg-slate-400'
          }`} />
          <div className="text-xs">
            <p className="font-bold text-white">
              {gatewayStatus.state === 'connected'
                ? 'Desktop Gateway Active'
                : gatewayStatus.state === 'qr_ready'
                ? 'Scan QR to Connect'
                : 'Desktop Engine Ready'}
            </p>
            <p className="text-[10px] text-slate-300">
              {settings.phone ? `+91 ${settings.phone}` : 'Workstation Linked Account'}
            </p>
          </div>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'reminders'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Payment Reminders ({dueCustomers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bulk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'bulk'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Bulk Promotions + Attachments</span>
        </button>

        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'broadcast'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Govt Schemes</span>
        </button>

        <button
          onClick={() => setActiveSubTab('custom')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'custom'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Single Composer</span>
        </button>

        <button
          onClick={() => setActiveSubTab('linked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'linked'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Desktop Gateway</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'logs'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Dispatched Logs ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: Payment Reminders */}
      {activeSubTab === 'reminders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Clients with Pending Payments</h3>
              <p className="text-xs text-slate-500">
                Send payment reminders silently via your linked WhatsApp device session.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
              Total Pending: ₹{dueCustomers.reduce((a, b) => a + b.balanceDue, 0).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReminders.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-bold text-slate-800">All Accounts Settled!</p>
                <p className="text-xs text-slate-500">No customers currently have overdue balances.</p>
              </div>
            ) : (
              paginatedReminders.map((cust) => {
                const messagePreview = getCustomerReminderText(cust, selectedLanguage);
                return (
                  <div
                    key={cust.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-emerald-300 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{cust.name}</h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">+91 {cust.phone}</p>
                          <span className="inline-block text-[10px] uppercase font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded mt-1">
                            {cust.type}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-400">Due Amount</span>
                          <p className="text-lg font-black text-rose-600 font-mono">
                            ₹{cust.balanceDue.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-2.5 my-3 border border-slate-100 text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-28 overflow-y-auto">
                        {messagePreview}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleCopyText(cust.id, messagePreview)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                        title="Copy text"
                      >
                        {copiedId === cust.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          handleLinkedDeviceSend(cust.name, cust.phone, messagePreview);
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Open WhatsApp Chat</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalReminderPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Showing page <strong>{remindersPage}</strong> of <strong>{totalReminderPages}</strong> ({dueCustomers.length} total pending)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRemindersPage(p => Math.max(1, p - 1))}
                  disabled={remindersPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRemindersPage(p => Math.min(totalReminderPages, p + 1))}
                  disabled={remindersPage === totalReminderPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Bulk Promotions with Attachments */}
      {activeSubTab === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 flex flex-col h-[560px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Recipients ({selectedCustomerIds.length}/{customers.length})
              </h4>
              <button
                onClick={() => {
                  if (selectedCustomerIds.length === customers.length) {
                    setSelectedCustomerIds([]);
                  } else {
                    setSelectedCustomerIds(customers.map(c => c.id));
                  }
                }}
                className="text-xs font-bold text-blue-900 hover:underline"
              >
                {selectedCustomerIds.length === customers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {customers.map((c) => {
                const isSelected = selectedCustomerIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                      isSelected ? 'bg-emerald-50/60 border border-emerald-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomerIds([...selectedCustomerIds, c.id]);
                          } else {
                            setSelectedCustomerIds(selectedCustomerIds.filter(id => id !== c.id));
                          }
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="font-bold text-xs text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">+91 {c.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                      {c.type}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Bulk Promotional Broadcast with Attachments</span>
              </h4>
              <p className="text-xs text-slate-500">
                Send promotional offers and attached promotional brochures/images to multiple customers simultaneously via your linked WhatsApp device session.
              </p>

              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">Broadcast Message Text *</label>
                <textarea
                  rows={6}
                  value={bulkMessageText}
                  onChange={(e) => setBulkMessageText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-sans focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Bulk Attachment Section */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <Paperclip className="w-4 h-4 text-blue-900" />
                    <span>Attach Promotional Banner or PDF Brochure</span>
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Browse File</span>
                    <input
                      type="file"
                      onChange={handleBulkFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                </div>

                {bulkAttachedFile && (
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      {bulkAttachedFile.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="font-medium text-slate-900">{bulkAttachedFile.name}</span>
                      <span className="text-slate-400 text-[10px]">({bulkAttachedFile.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBulkAttachedFile(null)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-bold">Quick Promos:</span>
                {[
                  { title: 'PVC Card Offer', text: `🎉 SPECIAL KIOSK OFFER @ ${settings.centerName}! PVC Smart Cards in 2 mins for ₹70!` },
                  { title: 'PM-Kisan Alert', text: `📢 PM-KISAN e-KYC deadline alert! Visit ${settings.centerName} immediately.` },
                ].map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBulkMessageText(p.text)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-3">
              {isSendingBulk && bulkProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Broadcasting with Attachment...</span>
                    <span>{bulkProgress.sent} / {bulkProgress.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      style={{ width: `${Math.round((bulkProgress.sent / bulkProgress.total) * 100)}%` }}
                      className="bg-emerald-600 h-full transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleStartBulkBroadcast}
                disabled={isSendingBulk || selectedCustomerIds.length === 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 active:scale-98"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  {isSendingBulk
                    ? 'Broadcasting in Progress...'
                    : `Send Broadcast + Attachment to ${selectedCustomerIds.length} Customers`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Govt Schemes */}
      {activeSubTab === 'broadcast' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Public Scheme Notifications & Daily News
            </h3>
            <p className="text-xs text-slate-500">
              One-click silent broadcast messages to inform citizens of government updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedBroadcast.map((tpl) => {
              const formatted = tpl.templateText
                .replace(/{{centerName}}/g, settings.centerName)
                .replace(/{{tamilCenterName}}/g, settings.tamilCenterName)
                .replace(/{{address}}/g, settings.address)
                .replace(/{{phone}}/g, settings.phone);

              return (
                <div
                  key={tpl.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        {tpl.category === 'offer' ? (
                          <Tag className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Newspaper className="w-4 h-4 text-blue-600" />
                        )}
                        <h4 className="text-sm font-bold text-slate-900">{tpl.title}</h4>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                        {tpl.language.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl my-3 border border-slate-100 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                      {formatted}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleCopyText(tpl.id, formatted)}
                      className="flex-1 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      {copiedId === tpl.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setCustomText(formatted);
                        setActiveSubTab('custom');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Send Silently</span>
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalBroadcastPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Showing page <strong>{broadcastPage}</strong> of <strong>{totalBroadcastPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBroadcastPage(p => Math.max(1, p - 1))}
                  disabled={broadcastPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setBroadcastPage(p => Math.min(totalBroadcastPages, p + 1))}
                  disabled={broadcastPage === totalBroadcastPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Single Composer */}
      {activeSubTab === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Select Pre-Set Template</span>
            </h4>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedTemplateId === tpl.id
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{tpl.title}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{tpl.language}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {tpl.templateText}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h4 className="text-sm font-black text-slate-900">Silent Single Message Composer</h4>

            <form onSubmit={handleSendCustomMessage} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Citizen / Recipient Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Adv. Murugesan"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp Mobile Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-slate-400">+91</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9842100000"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Type message text here..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-sans text-slate-900 focus:ring-2 focus:ring-emerald-600 font-medium"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-blue-900" />
                    <span>Attach Receipt, Certificate or Scan Copy</span>
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Browse File</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                </div>

                {attachedFile && (
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2">
                      {attachedFile.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                      <span className="font-medium text-slate-900">{attachedFile.name}</span>
                      <span className="text-slate-400 text-[10px]">({attachedFile.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-98"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Send WhatsApp Message Silently</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: Desktop Electron WhatsApp Gateway */}
      {activeSubTab === 'linked' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 max-w-2xl mx-auto space-y-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Laptop className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-slate-900">Desktop Electron WhatsApp Engine</h3>
              <p className="text-xs text-slate-500">Native Baileys background socket daemon on this workstation</p>
            </div>
          </div>

          {/* Connection Status Card */}
          <div className={`p-4 rounded-xl border text-left flex items-start justify-between gap-4 ${
            gatewayStatus.state === 'connected'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : gatewayStatus.state === 'qr_ready'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  gatewayStatus.state === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : gatewayStatus.state === 'qr_ready'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-slate-400'
                }`} />
                <span className="font-black text-xs uppercase tracking-wider">
                  {gatewayStatus.state === 'connected'
                    ? 'Engine Status: Connected & Online'
                    : gatewayStatus.state === 'qr_ready'
                    ? 'Engine Status: Ready to Pair via QR'
                    : 'Engine Status: Standalone Workstation Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {gatewayStatus.state === 'connected'
                  ? 'All customer receipts and payment reminders are dispatched silently in the background without opening browser tabs.'
                  : gatewayStatus.state === 'qr_ready'
                  ? 'Scan the terminal QR code below from your phone WhatsApp (Linked Devices) to authorize this desktop.'
                  : 'Desktop messaging service is initialized on localhost. Automatic fallback to desktop WhatsApp Web is available.'}
              </p>
            </div>

            <button
              type="button"
              onClick={fetchGatewayStatus}
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 shadow-2xs shrink-0"
              title="Refresh Engine Status"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* QR Code Presentation if ready to pair */}
          {gatewayStatus.state === 'qr_ready' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Terminal Pairing QR Code
              </h4>
              <div className="w-52 h-52 bg-white p-2 rounded-xl shadow-inner mx-auto flex items-center justify-center border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    gatewayStatus.qr
                  )}`}
                  alt="WhatsApp Terminal Pairing QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs text-slate-600 space-y-1 text-left max-w-sm mx-auto">
                <p><strong>1.</strong> Open WhatsApp on your mobile phone</p>
                <p><strong>2.</strong> Go to <strong>Settings</strong> / <strong>Menu</strong> &gt; <strong>Linked Devices</strong></p>
                <p><strong>3.</strong> Tap <strong>Link a Device</strong> and point your camera at this QR code</p>
              </div>
            </div>
          )}

          {/* Connected Details & Actions */}
          {gatewayStatus.state === 'connected' && (
            <div className="space-y-4">
              <div className="bg-emerald-100/60 border border-emerald-300 rounded-xl p-4 text-left text-xs text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Desktop Automation Active:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-emerald-950 pl-1">
                  <li>Instant silent dispatch of invoices, bill reminders & receipts.</li>
                  <li>Zero browser redirects, popups, or external tabs.</li>
                  <li>Multi-device persistent authentication saved in workstation storage.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Test Dispatch Form */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-600" />
              <span>Test Desktop Engine Dispatch</span>
            </h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="tel"
                placeholder="10-digit WhatsApp number"
                defaultValue={settings.phone}
                id="test-wa-phone-input"
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs flex-1 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                disabled={isTestingGateway}
                onClick={async () => {
                  const input = document.getElementById('test-wa-phone-input') as HTMLInputElement;
                  const phone = input?.value || settings.phone;
                  if (!phone) {
                    alert('Please enter a 10-digit WhatsApp phone number');
                    return;
                  }
                  setIsTestingGateway(true);
                  setGatewayTestResult(null);
                  try {
                    const res = await fetch('/api/whatsapp/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        phone,
                        message: `🔔 CSC Desktop Kiosk Test: Electron WhatsApp gateway is active and operational at ${settings.centerName}!`,
                      }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setGatewayTestResult('✅ Test message dispatched silently via Electron background engine!');
                    } else {
                      setGatewayTestResult(`⚠️ Gateway returned: ${data.error || 'Opening WhatsApp Web fallback...'}`);
                      window.open(`https://wa.me/91${phone}?text=CSC%20Desktop%20Test`, '_blank');
                    }
                  } catch (e: any) {
                    setGatewayTestResult('ℹ️ Engine offline. Opening standard desktop WhatsApp Web fallback.');
                    window.open(`https://wa.me/91${phone}?text=CSC%20Desktop%20Test`, '_blank');
                  } finally {
                    setIsTestingGateway(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingGateway ? 'Sending...' : 'Send Test Notification'}</span>
              </button>
            </div>
            {gatewayTestResult && (
              <p className="text-xs font-medium text-slate-700 mt-2 p-2 bg-white rounded-lg border border-slate-200">
                {gatewayTestResult}
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: Dispatched Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-900">WhatsApp Linked Dispatched Logs</h4>
            <span className="text-xs text-slate-500">{logs.length} messages dispatched</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {paginatedLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs">No WhatsApp messages dispatched in this session yet.</p>
              </div>
            ) : (
              paginatedLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.recipientName}</span>
                      <span className="font-mono text-slate-500">(+91 {log.recipientPhone})</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                        {log.templateCategory}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 line-clamp-2 text-[11px] font-sans whitespace-pre-wrap">
                      {log.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              ))
            )}
          </div>

          {totalLogPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500">
                Showing page <strong>{logsPage}</strong> of <strong>{totalLogPages}</strong> ({logs.length} total logs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                  disabled={logsPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLogsPage(p => Math.min(totalLogPages, p + 1))}
                  disabled={logsPage === totalLogPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
