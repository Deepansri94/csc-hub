import React, { useState, useEffect } from 'react';
import { 
  X, 
  LifeBuoy, 
  MessageSquare, 
  Download, 
  Upload, 
  Laptop, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  Wrench,
  Clock,
  Sparkles
} from 'lucide-react';
import { KioskSettings, DesktopLicense, ClientDiagnosticTicket, AdminRepairPatch } from '../types';
import { StorageService } from '../services/storageService';

interface ClientSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: KioskSettings;
}

export const ClientSupportModal: React.FC<ClientSupportModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [machineId, setMachineId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [activeLicense, setActiveLicense] = useState<DesktopLicense | null>(null);
  const [clientQuery, setClientQuery] = useState<string>('');
  const [ticketStatusMsg, setTicketStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errorsList, setErrorsList] = useState(StorageService.getClientErrors());

  useEffect(() => {
    if (isOpen) {
      setActiveLicense(StorageService.getActiveLicense());
      setErrorsList(StorageService.getClientErrors());
      setTicketStatusMsg(null);

      // Load machine id
      if ((window as any).electronAPI?.getHardwareId) {
        (window as any).electronAPI.getHardwareId().then((hwid: string) => {
          if (hwid) setMachineId(hwid);
          else setMachineId(StorageService.getMachineFingerprint());
        }).catch(() => {
          setMachineId(StorageService.getMachineFingerprint());
        });
      } else {
        setMachineId(StorageService.getMachineFingerprint());
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(machineId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSendViaWhatsApp = () => {
    const ticket = StorageService.generateDiagnosticTicket(clientQuery);
    const adminPhone = '9842512345'; // Admin support helpline or settings.phone

    let text = `*CSC KIOSK SUPPORT & TROUBLESHOOTING REQUEST*\n\n`;
    text += `*Store Name:* ${ticket.centerName}\n`;
    text += `*Owner/VLE:* ${ticket.ownerName} (${ticket.phone})\n`;
    text += `*Hardware ID:* ${ticket.machineId}\n`;
    text += `*License Status:* ${ticket.licenseStatus.toUpperCase()} (${ticket.licensePlan})\n`;
    text += `*App Platform:* ${ticket.platform}\n`;
    text += `*Client Doubt / Error Description:*\n"${ticket.clientQuery || 'Need general assistance with Kiosk setup.'}"\n\n`;

    if (ticket.recentErrors.length > 0) {
      text += `*Latest System Error:* ${ticket.recentErrors[0].message}\n`;
    } else {
      text += `*System Logs:* 0 critical errors detected.\n`;
    }

    const cleanPhone = adminPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');

    setTicketStatusMsg({
      text: 'WhatsApp opened with diagnostic report ready to send to Admin Support!',
      type: 'success',
    });
  };

  const handleDownloadTicket = () => {
    const ticket = StorageService.generateDiagnosticTicket(clientQuery);
    const jsonStr = JSON.stringify(ticket, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `support_ticket_${ticket.machineId}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTicketStatusMsg({
      text: 'Support ticket downloaded! You can send this file to your Admin via Email or WhatsApp.',
      type: 'success',
    });
  };

  const handleImportRepairPatch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const patch: AdminRepairPatch = JSON.parse(event.target?.result as string);
        const res = StorageService.applyRepairPatch(patch);
        setTicketStatusMsg({
          text: res.message,
          type: res.success ? 'success' : 'error',
        });
        if (res.success) {
          setActiveLicense(StorageService.getActiveLicense());
          setErrorsList(StorageService.getClientErrors());
        }
      } catch (err) {
        setTicketStatusMsg({
          text: 'Invalid repair patch file format.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150 my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 px-6 py-4 flex items-center justify-between text-white border-b border-blue-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-800/80 border border-blue-700 text-amber-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>Client Support & Diagnostics</span>
                <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Troubleshoot
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                Direct diagnostics, Admin support link, and instant repair patch tool
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {ticketStatusMsg && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                ticketStatusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {ticketStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{ticketStatusMsg.text}</span>
            </div>
          )}

          {/* Machine Health & Diagnostics Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-blue-700" />
                <span>System Health & Node Status</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Diagnostics Active</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Hardware ID (This Computer)</span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="font-mono text-xs font-bold text-slate-900">{machineId || 'Detecting...'}</span>
                  <button
                    onClick={handleCopyHwid}
                    className="p-1 hover:bg-slate-100 rounded text-slate-600"
                    title="Copy Hardware ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">License & Expiry</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {activeLicense 
                    ? `${activeLicense.plan.toUpperCase()} • ${activeLicense.status.toUpperCase()}`
                    : 'Unlicensed / Trial'}
                </span>
              </div>
            </div>

            {/* Error log indicator */}
            <div className="pt-1">
              {errorsList.length === 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No runtime system errors logged. Counter billing is running normally.</span>
                </div>
              ) : (
                <div className="text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{errorsList.length} recent system warning(s) recorded</span>
                    </span>
                    <button
                      onClick={() => {
                        StorageService.clearClientErrors();
                        setErrorsList([]);
                      }}
                      className="text-[10px] underline hover:text-amber-950 font-semibold"
                    >
                      Clear Logs
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-slate-700 truncate">
                    Last: {errorsList[0].message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Issue Description Form */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Describe your question, doubt, or error:
            </label>
            <textarea
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              placeholder="e.g., Thermal receipt printer text is cut off on right side, or how to import new government rate catalog..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons: WhatsApp & Download */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleSendViaWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send via WhatsApp to Admin</span>
            </button>

            <button
              onClick={handleDownloadTicket}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>Download Support Ticket (.json)</span>
            </button>
          </div>

          {/* Admin Repair Patch Application Section */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-indigo-700" />
              <h4 className="text-xs font-black text-indigo-950">Received a Repair Patch from Admin?</h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              If your Admin created a customized fix file (<code className="font-mono text-indigo-900 font-bold">repair_patch.json</code>) to resolve your issue, renew your license, or update rates, load it here:
            </p>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs cursor-pointer shadow-xs transition">
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              <span>Load Repair Patch (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportRepairPatch}
                className="hidden"
              />
            </label>
          </div>

          {/* Remote Desktop Assistance Section */}
          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Need Live Screen Assistance?</span>
              <span className="text-[11px] text-slate-500">Provide your AnyDesk / RustDesk 9-digit ID to your Admin for live remote support.</span>
            </div>
            <a
              href="https://anydesk.com/en/downloads"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-700 font-bold hover:underline inline-flex items-center gap-1 shrink-0 ml-2"
            >
              <span>AnyDesk</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
