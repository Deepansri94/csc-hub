import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Key, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Check, 
  Copy, 
  RefreshCw, 
  Laptop, 
  DollarSign, 
  AlertCircle,
  FileText,
  Clock,
  ExternalLink,
  Lock,
  UserCheck,
  UserX,
  LifeBuoy,
  Wrench,
  CheckCircle2,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { 
  Operator, 
  KioskSettings, 
  ServiceCatalogItem, 
  DesktopLicense, 
  DesktopAuditReport,
  ClientDiagnosticTicket,
  AdminRepairPatch
} from '../types';
import { StorageService } from '../services/storageService';

interface AdminModuleProps {
  operators: Operator[];
  settings: KioskSettings;
  services: ServiceCatalogItem[];
  onUpdateOperators: (ops: Operator[]) => void;
  onUpdateServices: (services: ServiceCatalogItem[]) => void;
}

export const AdminModule: React.FC<AdminModuleProps> = ({
  operators,
  settings,
  services,
  onUpdateOperators,
  onUpdateServices,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'licenses' | 'catalog' | 'audit' | 'distribution' | 'troubleshoot'>('users');
  const [licenses, setLicenses] = useState<DesktopLicense[]>(StorageService.getLicenses());
  const [auditReports, setAuditReports] = useState<DesktopAuditReport[]>(StorageService.getAuditReports());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Operator State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPin, setNewUserPin] = useState('1234');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'operator'>('operator');

  // New License State
  const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);
  const [licenseClientName, setLicenseClientName] = useState('');
  const [licenseCenterName, setLicenseCenterName] = useState('');
  const [licensePhone, setLicensePhone] = useState('');
  const [licensePlan, setLicensePlan] = useState<'trial' | 'standard' | 'enterprise'>('standard');
  const [licenseMachineId, setLicenseMachineId] = useState('');

  // Audit Import State
  const [importedAuditData, setImportedAuditData] = useState<any | null>(null);
  const [auditImportMessage, setAuditImportMessage] = useState<string | null>(null);

  // Troubleshooting & Support Ticket State
  const [importedTicket, setImportedTicket] = useState<ClientDiagnosticTicket | null>(null);
  const [ticketImportMessage, setTicketImportMessage] = useState<string | null>(null);
  const [patchNotes, setPatchNotes] = useState<string>('Standard system repair and configuration update');
  const [includeCatalogInPatch, setIncludeCatalogInPatch] = useState<boolean>(true);
  const [resetHwidInPatch, setResetHwidInPatch] = useState<boolean>(false);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Add Operator
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim()) return;

    const newOp: Operator = {
      id: 'op-' + Date.now(),
      name: newUserName.trim(),
      phone: newUserPhone.trim(),
      pin: newUserPin.trim() || '1234',
      role: newUserRole,
      isActive: true,
    };

    const updated = [...operators, newOp];
    StorageService.saveOperators(updated);
    onUpdateOperators(updated);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserPhone('');
    setNewUserPin('1234');
  };

  // Toggle Operator Status
  const handleToggleOperatorStatus = (id: string) => {
    const updated = operators.map((op) => {
      if (op.id === id) {
        return { ...op, isActive: !op.isActive };
      }
      return op;
    });
    StorageService.saveOperators(updated);
    onUpdateOperators(updated);
  };

  // Delete Operator
  const handleDeleteOperator = (id: string) => {
    if (operators.length <= 1) {
      alert('You must have at least one active administrator.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updated = operators.filter((op) => op.id !== id);
      StorageService.saveOperators(updated);
      onUpdateOperators(updated);
    }
  };

  // Generate License
  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseClientName.trim() || !licenseCenterName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cityCode = licenseCenterName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'TN');
    const generatedKey = `CSC-2026-${cityCode}-${randomSuffix}`;

    const days = licensePlan === 'trial' ? 30 : licensePlan === 'standard' ? 180 : 365;
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

    const newLic: DesktopLicense = {
      id: 'lic-' + Date.now(),
      licenseKey: generatedKey,
      clientName: licenseClientName.trim(),
      centerName: licenseCenterName.trim(),
      phone: licensePhone.trim() || '9876543210',
      plan: licensePlan,
      status: 'active',
      machineId: licenseMachineId.trim() || `MACHINE-${randomSuffix}`,
      issuedAt: new Date().toISOString(),
      expiresAt,
      maxOperators: licensePlan === 'trial' ? 1 : licensePlan === 'standard' ? 3 : 10,
    };

    StorageService.addLicense(newLic);
    setLicenses(StorageService.getLicenses());
    setShowAddLicenseModal(false);
    setLicenseClientName('');
    setLicenseCenterName('');
    setLicensePhone('');
    setLicenseMachineId('');
  };

  // Toggle License Status
  const handleToggleLicenseStatus = (id: string) => {
    const updated = licenses.map((lic) => {
      if (lic.id === id) {
        return {
          ...lic,
          status: lic.status === 'active' ? ('suspended' as const) : ('active' as const),
        };
      }
      return lic;
    });
    StorageService.saveLicenses(updated);
    setLicenses(updated);
  };

  // Delete License
  const handleDeleteLicense = (id: string) => {
    if (window.confirm('Delete this desktop license? The desktop application will require reactivation.')) {
      StorageService.deleteLicense(id);
      setLicenses(StorageService.getLicenses());
    }
  };

  // Export License JSON for desktop client
  const handleExportLicenseFile = (lic: DesktopLicense) => {
    const payload = {
      app: 'CSC e-Sevai Kiosk Desktop',
      license: lic,
      generatedAt: new Date().toISOString(),
      authorizedBy: 'Web Administration Module',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csc_license_${lic.licenseKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Master Catalog JSON for desktop clients
  const handleExportMasterCatalog = () => {
    const payload = {
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      settings: settings,
      services: services,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csc_master_catalog_2026.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Desktop Audit JSON
  const handleFileUploadAudit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.invoices && !parsed.kioskSettings) {
          setAuditImportMessage('Invalid file format. Please upload a valid CSC Kiosk exported backup JSON.');
          return;
        }

        const invs = parsed.invoices || [];
        const totalRev = invs.reduce((acc: number, inv: any) => acc + (inv.paidAmount || 0), 0);
        const totalPending = (parsed.customers || []).reduce((acc: number, c: any) => acc + (c.balanceDue || 0), 0);

        const newReport: DesktopAuditReport = {
          id: 'audit-' + Date.now(),
          importedAt: new Date().toISOString(),
          fileName: file.name,
          centerName: parsed.kioskSettings?.centerName || 'Desktop Kiosk',
          totalInvoices: invs.length,
          totalRevenue: totalRev,
          totalPendingDue: totalPending,
          totalCustomers: (parsed.customers || []).length,
          operatorsCount: (parsed.operators || []).length,
        };

        StorageService.addAuditReport(newReport);
        setAuditReports(StorageService.getAuditReports());
        setImportedAuditData({
          ...newReport,
          invoices: invs,
          settings: parsed.kioskSettings,
        });
        setAuditImportMessage(`Successfully imported and audited ${invs.length} invoices from ${file.name}!`);
      } catch {
        setAuditImportMessage('Error reading file. Ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Support Ticket Import Handler
  const handleImportTicket = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const ticket: ClientDiagnosticTicket = JSON.parse(event.target?.result as string);
        if (ticket.machineId) {
          setImportedTicket(ticket);
          setTicketImportMessage(`Diagnostic ticket loaded for ${ticket.centerName} (${ticket.machineId})`);
        } else {
          setTicketImportMessage('Invalid ticket format: Missing Hardware ID.');
        }
      } catch {
        setTicketImportMessage('Error reading ticket file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Generate & Export Repair Patch
  const handleExportRepairPatch = (ticket: ClientDiagnosticTicket) => {
    const matchedLicense = licenses.find(l => l.machineId === ticket.machineId || l.licenseKey === ticket.licenseKey);
    
    let renewedLicense: DesktopLicense | undefined = undefined;
    if (matchedLicense) {
      renewedLicense = {
        ...matchedLicense,
        expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
        status: 'active',
        machineId: resetHwidInPatch ? '' : matchedLicense.machineId,
      };
    }

    const patch: AdminRepairPatch = {
      id: 'patch-' + Date.now().toString(36).toUpperCase(),
      targetMachineId: ticket.machineId,
      targetLicenseKey: ticket.licenseKey,
      createdAt: new Date().toISOString(),
      notes: patchNotes,
      newLicense: renewedLicense,
      updatedCatalog: includeCatalogInPatch ? services : undefined,
      resetMachineLock: resetHwidInPatch,
      clearErrorLogs: true,
    };

    const jsonStr = JSON.stringify(patch, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repair_patch_${ticket.machineId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`Repair patch exported! Send 'repair_patch_${ticket.machineId}.json' to ${ticket.ownerName} to resolve their issue.`);
  };

  // 1-Click WhatsApp Reply
  const handleReplyWhatsApp = (ticket: ClientDiagnosticTicket) => {
    const cleanPhone = ticket.phone.replace(/[^0-9]/g, '');
    let msg = `Hello ${ticket.ownerName} (${ticket.centerName}),\n\n`;
    msg += `Regarding your support ticket for machine *${ticket.machineId}*:\n`;
    msg += `We have verified your diagnostics report.\n\n`;
    msg += `Solution:\n`;
    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Central Web Administration & Desktop Hub</span>
          </div>
          <h2 className="text-2xl font-black">Admin Management Module</h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
            Maintain desktop users and operators, issue offline license keys, distribute master price catalogs, and inspect imported transaction JSON audits from Electron desktop kiosks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMasterCatalog}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-sm transition active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Export Master Catalog JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Desktop Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{operators.length}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {operators.filter(o => o.isActive).length} Active Accounts
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Active Licenses</span>
            <Key className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{licenses.length}</p>
          <span className="text-[11px] text-slate-500 font-semibold">
            {licenses.filter(l => l.status === 'active').length} Authorized Kiosks
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Catalog Services</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{services.length}</p>
          <span className="text-[11px] text-slate-500 font-semibold">Standard Rates</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">Audit Reports</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{auditReports.length}</p>
          <span className="text-[11px] text-slate-500 font-semibold">Imported Backups</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'users'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Operator Management ({operators.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('licenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'licenses'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Desktop Licenses ({licenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'audit'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Audit & Report Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('distribution')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'distribution'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Desktop App Distribution</span>
        </button>

        <button
          onClick={() => setActiveTab('troubleshoot')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'troubleshoot'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-amber-400" />
          <span>Diagnostics & Troubleshooting</span>
        </button>
      </div>

      {/* TAB 1: USER & OPERATOR MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Registered Desktop Users & Counter Operators</h3>
              <p className="text-xs text-slate-500">
                Manage user access credentials, roles, and passcodes for desktop counters.
              </p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold">
                  <th className="p-3 border-b">Operator Name</th>
                  <th className="p-3 border-b">Phone</th>
                  <th className="p-3 border-b">Role</th>
                  <th className="p-3 border-b">4-Digit PIN</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operators.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs">
                        {op.name.charAt(0)}
                      </div>
                      <span>{op.name}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">+91 {op.phone}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        op.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {op.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">••••</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        op.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {op.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        <span>{op.isActive ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleOperatorStatus(op.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px]"
                      >
                        {op.isActive ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteOperator(op.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="Delete Operator"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DESKTOP LICENSES */}
      {activeTab === 'licenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Desktop Kiosk Licenses</h3>
              <p className="text-xs text-slate-500">
                Issue and manage secure offline licenses for installed Electron desktop applications.
              </p>
            </div>
            <button
              onClick={() => setShowAddLicenseModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New License</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold">
                  <th className="p-3 border-b">Center / Kiosk Name</th>
                  <th className="p-3 border-b">License Key</th>
                  <th className="p-3 border-b">Plan</th>
                  <th className="p-3 border-b">Machine ID</th>
                  <th className="p-3 border-b">Expires On</th>
                  <th className="p-3 border-b">Status</th>
                  <th className="p-3 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {licenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50 transition">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{lic.centerName}</p>
                      <p className="text-[10px] text-slate-500">{lic.clientName} ({lic.phone})</p>
                    </td>
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800">
                        <span>{lic.licenseKey}</span>
                        <button
                          onClick={() => handleCopy(lic.licenseKey, lic.id)}
                          className="hover:text-blue-900"
                          title="Copy License Key"
                        >
                          {copiedKey === lic.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-900">
                        {lic.plan}
                      </span>
                    </td>
                    <td className="p-3">
                      {lic.machineId ? (
                        <div className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <Lock className="w-3 h-3 text-blue-700 shrink-0" />
                          <span>{lic.machineId}</span>
                        </div>
                      ) : (
                        <span className="inline-block text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          🔓 Awaiting 1st PC Activation
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {new Date(lic.expiresAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        lic.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {lic.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      {lic.machineId && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Reset Hardware Lock for ${lic.clientName}? This will permit activating on a new PC.`)) {
                              StorageService.resetLicenseMachineLock(lic.id);
                              setLicenses(StorageService.getLicenses());
                            }
                          }}
                          className="px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold text-[10px]"
                          title="Reset Hardware Lock for PC Transfer"
                        >
                          Unlock PC
                        </button>
                      )}
                      <button
                        onClick={() => handleExportLicenseFile(lic)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1"
                        title="Download JSON License File for Client"
                      >
                        <Download className="w-3 h-3" />
                        <span>File</span>
                      </button>
                      <button
                        onClick={() => handleToggleLicenseStatus(lic.id)}
                        className="px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[11px]"
                      >
                        {lic.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => handleDeleteLicense(lic.id)}
                        className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                        title="Delete License"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT & REPORT INSPECTOR (JSON IMPORT) */}
      {activeTab === 'audit' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Desktop Kiosk JSON Audit Inspector</h3>
                <p className="text-xs text-slate-500">
                  Upload exported end-of-day JSON files from desktop kiosks to inspect revenues, invoices, and discrepancies.
                </p>
              </div>

              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition">
                <Upload className="w-4 h-4" />
                <span>Upload Kiosk Backup JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUploadAudit}
                  className="hidden"
                />
              </label>
            </div>

            {auditImportMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{auditImportMessage}</span>
              </div>
            )}

            {/* Imported Inspection Details */}
            {importedAuditData && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Inspected Store: {importedAuditData.centerName}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Total Revenue</span>
                    <p className="text-lg font-black text-emerald-700 font-mono">₹{importedAuditData.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Invoices Processed</span>
                    <p className="text-lg font-black text-slate-900 font-mono">{importedAuditData.totalInvoices}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Outstanding Due</span>
                    <p className="text-lg font-black text-rose-600 font-mono">₹{importedAuditData.totalPendingDue.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Registered Clients</span>
                    <p className="text-lg font-black text-slate-900 font-mono">{importedAuditData.totalCustomers}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Audit History Log */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Audited Reports History ({auditReports.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2.5 border-b">Audited At</th>
                      <th className="p-2.5 border-b">Backup File</th>
                      <th className="p-2.5 border-b">Center</th>
                      <th className="p-2.5 border-b text-right">Invoices</th>
                      <th className="p-2.5 border-b text-right">Revenue</th>
                      <th className="p-2.5 border-b text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          No desktop JSON audits uploaded yet.
                        </td>
                      </tr>
                    ) : (
                      auditReports.map((rpt) => (
                        <tr key={rpt.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                            {new Date(rpt.importedAt).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 font-medium text-slate-900">{rpt.fileName}</td>
                          <td className="p-2.5 text-slate-700 font-semibold">{rpt.centerName}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{rpt.totalInvoices}</td>
                          <td className="p-2.5 text-right font-mono font-black text-emerald-700">₹{rpt.totalRevenue.toFixed(2)}</td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => {
                                StorageService.deleteAuditReport(rpt.id);
                                setAuditReports(StorageService.getAuditReports());
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete Report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DESKTOP APP DISTRIBUTION */}
      {activeTab === 'distribution' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Electron Desktop Application Distribution</h3>
            <p className="text-xs text-slate-500 mt-1">
              Instructions and package deployment for giving users the standalone desktop application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold uppercase text-blue-900">Windows Package</span>
              <h4 className="text-sm font-black text-slate-900">CSCKiosk-Setup.exe</h4>
              <p className="text-xs text-slate-600">
                Self-installing NSIS package with desktop shortcut and Baileys background WhatsApp support.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-1 rounded border">
                  Target: Windows 10 & 11
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold uppercase text-blue-900">Linux Package</span>
              <h4 className="text-sm font-black text-slate-900">CSCKiosk.AppImage</h4>
              <p className="text-xs text-slate-600">
                Standalone portable executable for Ubuntu, Debian, and Linux-based kiosk counters.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-1 rounded border">
                  Target: Linux x64
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-xs font-bold uppercase text-blue-900">macOS Package</span>
              <h4 className="text-sm font-black text-slate-900">CSCKiosk.dmg</h4>
              <p className="text-xs text-slate-600">
                Apple Silicon & Intel DMG package with offline local storage encryption.
              </p>
              <div className="pt-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 bg-white px-2 py-1 rounded border">
                  Target: macOS 12+
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 space-y-2">
            <div className="font-bold flex items-center gap-2 text-blue-900">
              <Shield className="w-4 h-4" />
              <span>How Desktop Kiosk Users Connect to Admin:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-blue-900 pl-1">
              <li>Admin generates a <strong>License Key</strong> under the Licenses tab and gives it to the user.</li>
              <li>User downloads and launches the <strong>Electron Desktop Application</strong>.</li>
              <li>User imports the <strong>Master Pricing Catalog JSON</strong> to get all updated Xerox & e-District rates.</li>
              <li>At the end of day/week, user exports their <strong>Backup JSON</strong> and submits it to Admin for auditing.</li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 5: DIAGNOSTICS & TROUBLESHOOTING */}
      {activeTab === 'troubleshoot' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 mb-1">
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Remote Client Troubleshooting Hub</span>
              </div>
              <h3 className="text-base font-black text-slate-900">Client Diagnostics & Remote Support</h3>
              <p className="text-xs text-slate-500">
                Inspect diagnostic support packages (.json) sent by clients, troubleshoot errors, and generate 1-click repair patches.
              </p>
            </div>

            {/* Import Ticket Button */}
            <label className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer transition">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Import Support Ticket (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportTicket}
                className="hidden"
              />
            </label>
          </div>

          {ticketImportMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{ticketImportMessage}</span>
            </div>
          )}

          {/* Ticket Inspection Details */}
          {importedTicket ? (
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3">
                <div>
                  <h4 className="font-black text-slate-900 text-base">{importedTicket.centerName}</h4>
                  <p className="text-xs text-slate-600">
                    Owner: <strong>{importedTicket.ownerName}</strong> • Phone: <strong>{importedTicket.phone}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReplyWhatsApp(importedTicket)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Client</span>
                  </button>
                </div>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Hardware ID</span>
                  <span className="font-mono font-bold text-slate-900">{importedTicket.machineId}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">License Plan</span>
                  <span className="font-bold text-slate-900 capitalize">{importedTicket.licensePlan} ({importedTicket.licenseStatus})</span>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Database Counts</span>
                  <span className="font-bold text-slate-900">{importedTicket.invoicesCount} Invoices • {importedTicket.customersCount} Customers</span>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">App Environment</span>
                  <span className="font-bold text-slate-900">{importedTicket.platform} v{importedTicket.appVersion}</span>
                </div>
              </div>

              {/* Client Query & Error Trace */}
              <div className="space-y-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-900 block mb-1">
                    Client's Reported Issue / Doubt:
                  </span>
                  <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{importedTicket.clientQuery || 'No description provided by client.'}"
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-900 block mb-1">
                    System Error Trace ({importedTicket.recentErrors.length} recorded):
                  </span>
                  {importedTicket.recentErrors.length === 0 ? (
                    <div className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zero application crashes or unhandled exceptions logged.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {importedTicket.recentErrors.map((err, idx) => (
                        <div key={idx} className="text-[11px] font-mono bg-rose-50 text-rose-900 p-2 rounded border border-rose-200">
                          <span className="text-slate-500 text-[10px] block">{new Date(err.timestamp).toLocaleTimeString()}</span>
                          <span>{err.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Repair Patch Generator Box */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-800" />
                  <h4 className="font-black text-xs text-indigo-950 uppercase tracking-wider">
                    Generate 1-Click Repair Patch for this Client
                  </h4>
                </div>
                <p className="text-xs text-slate-600">
                  Select repair actions to bundle into a repair patch file for machine <strong>{importedTicket.machineId}</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCatalogInPatch}
                      onChange={(e) => setIncludeCatalogInPatch(e.target.checked)}
                      className="rounded text-blue-900"
                    />
                    <span className="font-semibold text-slate-800">Push latest Master Price Catalog ({services.length} items)</span>
                  </label>

                  <label className="flex items-center gap-2 bg-white p-2.5 rounded-lg border cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resetHwidInPatch}
                      onChange={(e) => setResetHwidInPatch(e.target.checked)}
                      className="rounded text-blue-900"
                    />
                    <span className="font-semibold text-slate-800">Reset Machine Lock (Allows PC Migration)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Patch Notes / Resolution Summary:</label>
                  <input
                    type="text"
                    value={patchNotes}
                    onChange={(e) => setPatchNotes(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="pt-1 flex items-center justify-end">
                  <button
                    onClick={() => handleExportRepairPatch(importedTicket)}
                    className="px-4 py-2 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>Export Repair Patch JSON</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3 bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mx-auto">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h4 className="font-black text-slate-900 text-sm">No Client Support Ticket Loaded</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When a counter client has an issue or question, they click <strong>"Help & Support"</strong> in their kiosk app and export a support ticket. Import that ticket file here to inspect their diagnostics.
              </p>
            </div>
          )}

          {/* Quick Troubleshooting Reference Guide for Admin */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-900" />
              <span>Admin Troubleshooting & Support Playbook</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border space-y-1">
                <span className="font-bold text-slate-900 block">1. Hardware Lock Violation</span>
                <p className="text-slate-600 text-[11px]">
                  If client changed computers or formatted Windows, locate their license in the Licenses tab and click <strong>"Unlock PC"</strong>, or generate a repair patch with Reset Machine Lock enabled.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border space-y-1">
                <span className="font-bold text-slate-900 block">2. Thermal Printer Margins</span>
                <p className="text-slate-600 text-[11px]">
                  In client Kiosk Settings → General, set <strong>Print Format to 80mm or 58mm POS Thermal</strong>. Thermal receipts auto-format without page headers or footers.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border space-y-1">
                <span className="font-bold text-slate-900 block">3. WhatsApp Gateway Disconnected</span>
                <p className="text-slate-600 text-[11px]">
                  Advise client to re-scan the WhatsApp QR code in the WhatsApp Hub. If running standalone web mode, click-to-chat links automatically work without requiring local Node service.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border space-y-1">
                <span className="font-bold text-slate-900 block">4. Distributing New Government Rates</span>
                <p className="text-slate-600 text-[11px]">
                  Click <strong>"Export Master Catalog JSON"</strong> in the Admin header and send the file to the client. The client imports it in 1-click via their setup wizard.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCreateUser} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h4 className="text-sm font-black text-slate-900">Add New Operator / Desktop User</h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="e.g. Anand R."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="operator">Operator (Counter Staff)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add License */}
      {showAddLicenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handleCreateLicense} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <h4 className="text-sm font-black text-slate-900">Issue Desktop Kiosk License</h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kiosk / Center Name *</label>
              <input
                type="text"
                required
                value={licenseCenterName}
                onChange={(e) => setLicenseCenterName(e.target.value)}
                placeholder="e.g. Sri Balaji e-Sevai Kiosk"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Client / Owner Name *</label>
              <input
                type="text"
                required
                value={licenseClientName}
                onChange={(e) => setLicenseClientName(e.target.value)}
                placeholder="e.g. M. Senthil Kumar"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={licensePhone}
                  onChange={(e) => setLicensePhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">License Plan</label>
                <select
                  value={licensePlan}
                  onChange={(e) => setLicensePlan(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="trial">Trial (30 Days)</option>
                  <option value="standard">Standard (6 Months)</option>
                  <option value="enterprise">Enterprise (1 Year)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Machine Hardware ID (Optional)</label>
              <input
                type="text"
                value={licenseMachineId}
                onChange={(e) => setLicenseMachineId(e.target.value)}
                placeholder="Leave blank for auto-generation"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddLicenseModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs"
              >
                Issue License
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
