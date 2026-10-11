import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Check, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  X, 
  Building2, 
  Phone, 
  CreditCard, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Laptop,
  Copy
} from 'lucide-react';
import { DesktopLicense, KioskSettings, ServiceCatalogItem } from '../types';
import { StorageService } from '../services/storageService';

interface ClientSetupModalProps {
  settings: KioskSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: KioskSettings) => void;
  onUpdateServices: (services: ServiceCatalogItem[]) => void;
}

export const ClientSetupModal: React.FC<ClientSetupModalProps> = ({
  settings,
  onClose,
  onUpdateSettings,
  onUpdateServices,
}) => {
  const [activeTab, setActiveTab] = useState<'license' | 'catalog' | 'store'>('license');
  const [activeLicense, setActiveLicense] = useState<DesktopLicense | null>(StorageService.getActiveLicense());
  const [inputKey, setInputKey] = useState('');
  const [machineId, setMachineId] = useState<string>('');
  const [copiedHwid, setCopiedHwid] = useState<boolean>(false);
  const [activationMessage, setActivationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load physical machine hardware fingerprint
  React.useEffect(() => {
    async function loadHwid() {
      if ((window as any).electronAPI?.getHardwareId) {
        try {
          const hwid = await (window as any).electronAPI.getHardwareId();
          if (hwid) {
            setMachineId(hwid);
            return;
          }
        } catch {}
      }
      setMachineId(StorageService.getMachineFingerprint());
    }
    loadHwid();
  }, []);

  // Store quick form
  const [storeForm, setStoreForm] = useState({
    centerName: settings.centerName,
    tamilCenterName: settings.tamilCenterName,
    phone: settings.phone,
    upiId: settings.upiId,
    vleName: settings.vleName,
    address: settings.address,
  });
  const [storeSaved, setStoreSaved] = useState(false);

  // Handle License Key Verification
  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    const res = StorageService.activateLicenseWithKey(inputKey, machineId);
    if (res.success && res.license) {
      setActiveLicense(res.license);
      setActivationMessage({ text: res.message, type: 'success' });
      setInputKey('');
      // Auto-update center name if available in license
      if (res.license.centerName && !settings.centerName) {
        const updated = { ...settings, centerName: res.license.centerName };
        StorageService.saveSettings(updated);
        onUpdateSettings(updated);
      }
    } else {
      setActivationMessage({ text: res.message, type: 'error' });
    }
  };

  // Handle License JSON File Upload
  const handleUploadLicenseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const lic = parsed.license || parsed;
        if (lic && lic.licenseKey) {
          if (lic.machineId && lic.machineId !== machineId) {
            setActivationMessage({
              text: `Hardware Lock Violation: This license file is locked to another computer (${lic.machineId}). It cannot be used or resold on this machine (${machineId}).`,
              type: 'error',
            });
            return;
          }
          const bound = { ...lic, machineId: lic.machineId || machineId };
          StorageService.addLicense(bound);
          StorageService.setActiveLicense(bound);
          setActiveLicense(bound);
          setActivationMessage({
            text: `Successfully activated and locked to this machine (${machineId})!`,
            type: 'success',
          });

          if (lic.centerName) {
            const updated = { ...settings, centerName: lic.centerName, phone: lic.phone || settings.phone };
            StorageService.saveSettings(updated);
            onUpdateSettings(updated);
            setStoreForm(prev => ({ ...prev, centerName: lic.centerName, phone: lic.phone || prev.phone }));
          }
        } else {
          setActivationMessage({ text: 'Invalid license file format.', type: 'error' });
        }
      } catch {
        setActivationMessage({ text: 'Failed to read license JSON file.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  // Handle Master Catalog JSON Upload
  const handleUploadMasterCatalog = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.services)) {
          StorageService.saveServices(parsed.services);
          onUpdateServices(parsed.services);
          setActivationMessage({
            text: `Successfully imported ${parsed.services.length} master services and pricing from ${file.name}!`,
            type: 'success',
          });
        } else {
          setActivationMessage({ text: 'No service catalog array found in file.', type: 'error' });
        }
      } catch {
        setActivationMessage({ text: 'Error reading master catalog JSON.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  // Save Store Details
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: KioskSettings = {
      ...settings,
      centerName: storeForm.centerName,
      tamilCenterName: storeForm.tamilCenterName,
      phone: storeForm.phone,
      upiId: storeForm.upiId,
      vleName: storeForm.vleName,
      address: storeForm.address,
    };
    StorageService.saveSettings(updated);
    onUpdateSettings(updated);
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">Client Store & License Setup</h3>
              <p className="text-xs text-blue-200">
                Activate counter license, import master pricing rates, and setup store profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 border-b border-slate-200 px-5 pt-3 bg-slate-50">
          <button
            onClick={() => setActiveTab('license')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'license'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>1. License Activation</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>2. Master Rates Import</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'store'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>3. Counter Profile & UPI</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-5 flex-1">
          {/* Notification Alert */}
          {activationMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              activationMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              {activationMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{activationMessage.text}</span>
            </div>
          )}

          {/* TAB 1: LICENSE ACTIVATION */}
          {activeTab === 'license' && (
            <div className="space-y-4">
              {/* Current Status Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Desktop License</span>
                  <h4 className="text-sm font-black text-slate-900">
                    {activeLicense ? activeLicense.centerName : 'No Active License Found'}
                  </h4>
                  <p className="text-xs font-mono text-slate-600 mt-0.5">
                    Key: {activeLicense ? activeLicense.licenseKey : 'Not Activated'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    activeLicense?.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {activeLicense ? `${activeLicense.plan} - ${activeLicense.status}` : 'Trial Mode'}
                  </span>
                  {activeLicense && (
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">
                      Expires: {new Date(activeLicense.expiresAt).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>

              {/* Hardware Machine Lock Badge */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-900 flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5 text-blue-700" />
                    <span>Single-Machine Node Lock: This Computer's Hardware ID</span>
                  </span>
                  <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{machineId || 'Detecting...'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(machineId);
                    setCopiedHwid(true);
                    setTimeout(() => setCopiedHwid(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition"
                >
                  {copiedHwid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHwid ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              {/* Enter Key Form */}
              <form onSubmit={handleActivateKey} className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Enter License Key Provided by Administrator:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSC-2026-OMALUR-9481"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs uppercase font-bold text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                  >
                    Activate Key
                  </button>
                </div>
              </form>

              {/* Upload License File alternative */}
              <div className="pt-3 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 block mb-2">Or Upload License Configuration File:</span>
                <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-blue-50/50 transition">
                  <Upload className="w-5 h-5 text-blue-900 mb-1" />
                  <span className="text-xs font-bold text-slate-800">Upload csc_license_*.json</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Click to browse your downloaded license file</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadLicenseFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  Need a license? Contact your network administrator. The administrator issues licenses via the central <strong>Admin Hub</strong> portal.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER RATES IMPORT */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Synchronize Master Pricing & Services</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Import the standard catalog template (<code className="bg-slate-100 px-1 py-0.5 rounded text-blue-900 font-mono">csc_master_catalog_2026.json</code>) exported by your Admin to get updated certificate government fees and Xerox rates.
                </p>
              </div>

              <label className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-emerald-50/50 transition">
                <FileSpreadsheet className="w-8 h-8 text-emerald-700 mb-2" />
                <span className="text-xs font-bold text-slate-900">Select csc_master_catalog_2026.json</span>
                <span className="text-[10px] text-slate-500 mt-1">
                  Updates Tamil Nadu e-District, Aadhaar, PAN, and print prices in 1 click
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadMasterCatalog}
                  className="hidden"
                />
              </label>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                <p className="font-bold text-slate-900 mb-1">What this updates:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Tamil Nadu Revenue & Community Certificates official fees</li>
                  <li>Patta / Chitta & Land record download charges</li>
                  <li>Standard Xerox (B&W / Color) & Photo Printing pricing</li>
                  <li>PVC Smart Card & Lamination rates</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: COUNTER PROFILE & UPI */}
          {activeTab === 'store' && (
            <form onSubmit={handleSaveStore} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kiosk / Center Name *</label>
                <input
                  type="text"
                  required
                  value={storeForm.centerName}
                  onChange={(e) => setStoreForm({ ...storeForm, centerName: e.target.value })}
                  placeholder="e.g. Sri Balaji CSC e-Sevai Kiosk"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tamil Center Name</label>
                  <input
                    type="text"
                    value={storeForm.tamilCenterName}
                    onChange={(e) => setStoreForm({ ...storeForm, tamilCenterName: e.target.value })}
                    placeholder="ஸ்ரீ பாலாஜி இ-சேவை மையம்"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">UPI ID (for Bill QR Code) *</label>
                  <input
                    type="text"
                    required
                    value={storeForm.upiId}
                    onChange={(e) => setStoreForm({ ...storeForm, upiId: e.target.value })}
                    placeholder="name@okhdfcbank"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">VLE / Owner Name</label>
                  <input
                    type="text"
                    value={storeForm.vleName}
                    onChange={(e) => setStoreForm({ ...storeForm, vleName: e.target.value })}
                    placeholder="M. Senthil Kumar"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Landmark</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  placeholder="Bus Stand Complex, Omalur Main Road"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                {storeSaved ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Store Profile Saved!
                  </span>
                ) : <div />}

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs transition"
                >
                  Save Store Details
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
