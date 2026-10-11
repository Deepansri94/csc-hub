import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  RotateCcw, 
  QrCode, 
  X, 
  Check, 
  Database,
  Plus,
  Trash2,
  Tag
} from 'lucide-react';
import { KioskSettings, ServiceCatalogItem } from '../types';
import { StorageService } from '../services/storageService';

interface SettingsModalProps {
  settings: KioskSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: KioskSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<KioskSettings>(settings);
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'upi' | 'backup'>('profile');
  const [backupJson, setBackupJson] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const [servicesList, setServicesList] = useState<ServiceCatalogItem[]>(StorageService.getServices());
  const [updateStatus, setUpdateStatus] = useState<string>('');
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);

  const handleCheckUpdate = async () => {
    setUpdateStatus('Checking for updates...');
    if ((window as any).electronAPI?.checkUpdate) {
      try {
        await (window as any).electronAPI.checkUpdate();
        setUpdateStatus('Update check completed.');
      } catch {
        setUpdateStatus('Failed to check for updates.');
      }
    } else {
      setUpdateStatus('Update checker is active in the installed Desktop App.');
    }
  };

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newGovtFee, setNewGovtFee] = useState<number>(0);
  const [newKioskCharge, setNewKioskCharge] = useState<number>(0);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(formData);
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleClearProfile = () => {
    if (window.confirm('Clear all center profile details (Company name, phone, address, etc.)?')) {
      const cleared: KioskSettings = {
        centerName: '',
        tamilCenterName: '',
        cscId: '',
        vleName: '',
        phone: '',
        email: '',
        address: '',
        district: '',
        state: 'Tamil Nadu',
        pincode: '',
        upiId: '',
        upiPayeeName: '',
        defaultGstPercent: 0,
        invoiceFooterNote: '',
      };
      setFormData(cleared);
      StorageService.saveSettings(cleared);
      onUpdateSettings(cleared);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleUpdatePrice = (id: string, field: 'govtFee' | 'kioskCharge', value: number) => {
    const updated = servicesList.map(s => {
      if (s.id === id) {
        const newVal = Math.max(0, value);
        const updatedSrv = { ...s, [field]: newVal };
        updatedSrv.totalFee = updatedSrv.govtFee + updatedSrv.kioskCharge;
        return updatedSrv;
      }
      return s;
    });
    setServicesList(updated);
    StorageService.saveServices(updated);
  };

  const [newCategory, setNewCategory] = useState<string>('xerox');

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ServiceCatalogItem = {
      id: 'srv-' + Date.now(),
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory as any,
      dept: 'General',
      govtFee: newGovtFee,
      kioskCharge: newKioskCharge,
      totalFee: newGovtFee + newKioskCharge,
      turnAroundDays: 'Instant',
      requiredDocs: ['Aadhaar'],
    };
    const updated = [newItem, ...servicesList];
    setServicesList(updated);
    StorageService.saveServices(updated);
    setShowAddServiceModal(false);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CSC_eSevai_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportBackup = () => {
    if (!backupJson.trim()) {
      alert('Please paste backup JSON content to restore.');
      return;
    }
    const success = StorageService.importFullBackup(backupJson);
    if (success) {
      setImportSuccess(true);
      setTimeout(() => {
        setImportSuccess(false);
        window.location.reload();
      }, 1500);
    } else {
      alert('Invalid backup JSON format.');
    }
  };

  const handleClearLiveData = () => {
    if (window.confirm('This will clear all invoices, customer book entries, and transactions to start a clean Live Session. Are you sure?')) {
      StorageService.clearLiveData();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  const handleResetData = () => {
    if (window.confirm('WARNING: This will reset all data back to sample demo mode. Are you sure?')) {
      StorageService.resetToDefault();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-black">Kiosk Administration</h3>
          <button onClick={onClose}><X className="w-5 h-5"/></button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          {[
            { id: 'profile', label: 'Center Profile' },
            { id: 'services', label: 'Services & Product Pricing' },
            { id: 'upi', label: 'UPI & QR Config' },
            { id: 'backup', label: 'Offline Backup & Restore' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 text-xs font-bold ${activeTab === tab.id ? 'border-b-2 border-blue-900 bg-white' : ''}`}>
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Center Name (English)</label>
                  <input type="text" value={formData.centerName} onChange={(e) => setFormData({ ...formData, centerName: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Center Name (Tamil)</label>
                  <input type="text" value={formData.tamilCenterName} onChange={(e) => setFormData({ ...formData, tamilCenterName: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CSC ID</label>
                  <input type="text" value={formData.cscId} onChange={(e) => setFormData({ ...formData, cscId: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">VLE Owner Name</label>
                  <input type="text" value={formData.vleName} onChange={(e) => setFormData({ ...formData, vleName: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Center Address</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g. 9842512345" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="e.g. center@gmail.com" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">District</label>
                  <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode</label>
                  <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-900" />
                </div>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-sm">Save Profile</button>
                <button type="button" onClick={handleClearProfile} className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold">Clear Profile Details</button>
                {savedSuccess && <span className="text-emerald-700 font-bold">Saved successfully!</span>}
              </div>
            </form>
          )}

          {activeTab === 'services' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-sm">Service & Pricing Catalog</h4>
                <button onClick={() => setShowAddServiceModal(true)} className="px-3 py-1.5 bg-blue-900 text-white rounded-lg font-bold">Add Service</button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-2 border">Service Name</th>
                    <th className="p-2 border text-right">Govt Fee</th>
                    <th className="p-2 border text-right">Kiosk</th>
                    <th className="p-2 border text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {servicesList.map((srv) => (
                    <tr key={srv.id}>
                      <td className="p-2 border font-bold text-slate-900">{srv.name}</td>
                      <td className="p-2 border text-right">
                        <input type="number" value={srv.govtFee} onChange={(e) => handleUpdatePrice(srv.id, 'govtFee', parseFloat(e.target.value))} className="w-16 p-1 border rounded text-right font-mono" />
                      </td>
                      <td className="p-2 border text-right">
                        <input type="number" value={srv.kioskCharge} onChange={(e) => handleUpdatePrice(srv.id, 'kioskCharge', parseFloat(e.target.value))} className="w-16 p-1 border rounded text-right font-mono" />
                      </td>
                      <td className="p-2 border text-right font-black text-emerald-700 font-mono">₹{srv.totalFee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'upi' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI ID (VPA) *</label>
                <input type="text" value={formData.upiId} onChange={(e) => setFormData({ ...formData, upiId: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI Payee Business Name *</label>
                <input type="text" value={formData.upiPayeeName} onChange={(e) => setFormData({ ...formData, upiPayeeName: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900" />
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">Session Data Management</h4>
                <p className="text-slate-600">Switch between a clean production Live Session (empty invoices & customer book) or sample Demo Data.</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={handleClearLiveData} className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-sm">
                    Switch to Live Session (Clear Invoices & Customer Book)
                  </button>
                  <button onClick={handleResetData} className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm">
                    Reset to Demo Data
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-black text-slate-900 text-sm">Backup & Restore</h4>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleExportBackup} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                    <Download className="w-4 h-4" /> Export Backup JSON
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h4 className="font-black text-slate-900 text-sm">Desktop App Updates</h4>
                <p className="text-slate-600">Check for the latest official desktop software updates and upgrade seamlessly.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={handleCheckUpdate} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold">
                    🔄 Check for Update
                  </button>
                  {updateStatus && <span className="text-slate-700 font-semibold">{updateStatus}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleAddCustomService} className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-3">
            <h4 className="font-black text-sm">Add New Service</h4>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full p-2 border rounded-xl" required>
              <option value="xerox">Xerox & Print</option>
              <option value="certificate">Certificate</option>
              <option value="egov">e-District</option>
              <option value="financial">Financial</option>
              <option value="utility">Utility</option>
            </select>
            <input placeholder="Code (e.g. XER-BW)" value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full p-2 border rounded-xl" required />
            <input placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-2 border rounded-xl" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Govt Fee" value={newGovtFee} onChange={e => setNewGovtFee(parseFloat(e.target.value))} className="w-full p-2 border rounded-xl" />
              <input type="number" placeholder="Kiosk Charge" value={newKioskCharge} onChange={e => setNewKioskCharge(parseFloat(e.target.value))} className="w-full p-2 border rounded-xl" />
            </div>
            <button type="submit" className="w-full py-2 bg-blue-900 text-white rounded-xl font-bold">Save</button>
            <button type="button" onClick={() => setShowAddServiceModal(false)} className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">Close</button>
          </form>
        </div>
      )}
    </div>
  );
};
