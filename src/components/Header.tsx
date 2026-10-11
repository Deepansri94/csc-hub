import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  UserCheck, 
  Clock, 
  Settings, 
  ShieldCheck, 
  FileText, 
  Phone,
  QrCode,
  Key,
  Shield,
  Laptop,
  LifeBuoy
} from 'lucide-react';
import { KioskSettings, Operator, DesktopLicense } from '../types';
import { StorageService } from '../services/storageService';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenClientSetup: () => void;
  onOpenSupport: () => void;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  currentOperator: Operator;
  settings: KioskSettings;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenAuth,
  onOpenClientSetup,
  onOpenSupport,
  isAdminMode,
  onToggleAdminMode,
  currentOperator,
  settings,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [activeLicense, setActiveLicense] = useState<DesktopLicense | null>(StorageService.getActiveLicense());
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const handleLicenseChange = () => {
      setActiveLicense(StorageService.getActiveLicense());
    };
    window.addEventListener('csc_license_changed', handleLicenseChange);
    window.addEventListener('csc_data_changed', handleLicenseChange);

    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('csc_license_changed', handleLicenseChange);
      window.removeEventListener('csc_data_changed', handleLicenseChange);
    };
  }, []);

  return (
    <header className="bg-gradient-to-r from-[#0a1c3d] via-[#0f2b5c] to-[#1e3a8a] text-white border-b-2 border-amber-500 shadow-md">
      {/* Top micro banner with National / e-Governance accreditation & Mode Selector */}
      <div className="bg-[#061229] px-3 sm:px-6 py-1.5 text-[11px] flex flex-wrap items-center justify-between text-slate-300 border-b border-blue-950 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-semibold text-amber-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GOVERNMENT OF TAMIL NADU & MeitY APPROVED e-SEVAI KIOSK
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-300">
            CSC ID: <strong className="text-white tracking-wider">{settings.cscId}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-blue-950/80 p-0.5 rounded-lg border border-blue-800/60">
            <button
              onClick={onToggleAdminMode}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                !isAdminMode 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Laptop className="w-3 h-3" />
              <span>Client Kiosk App</span>
            </button>
            <button
              onClick={onToggleAdminMode}
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                isAdminMode 
                  ? 'bg-amber-400 text-slate-950 shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Admin Module Hub</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3 h-3 text-amber-400" />
            <span className="font-mono text-[11px]">{dateStr} • {timeStr}</span>
          </div>

          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
            isOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`}></span>
            {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
          </span>
        </div>
      </div>

      {/* Main Kiosk Header bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Emblem and Center Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-white p-1 shadow-md border-2 border-amber-400 shrink-0 flex items-center justify-center">
            <img 
              src="/icon.svg" 
              alt="CSC Emblem" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-sm shadow-xs">
              CSC
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                {settings.centerName}
              </h1>
              {isAdminMode && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Admin Portal
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-blue-200">
              <span className="font-medium text-amber-300">{settings.tamilCenterName}</span>
              <span className="text-blue-400 hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-300">{settings.district}, {settings.state}</span>
              <span className="text-blue-400 hidden sm:inline">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Phone className="w-3 h-3 text-emerald-400" />
                {settings.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Right actions: License Badge, Operator, PWA install, Settings */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Client License Setup Button */}
          <button
            onClick={onOpenClientSetup}
            className="flex items-center gap-1.5 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/50 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold transition shadow-xs"
            title="Client Store License & Master Rates Setup"
          >
            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">
              {activeLicense ? `License: ${activeLicense.plan.toUpperCase()}` : 'Activate License'}
            </span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Current Operator Profile */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 bg-blue-900/80 hover:bg-blue-800 border border-blue-700/60 rounded-xl px-2.5 py-1.5 text-left transition shadow-xs"
            title="Switch Operator / Lock Kiosk"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-800 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-600">
              {currentOperator.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-semibold text-white leading-tight line-clamp-1">{currentOperator.name}</p>
              <p className="text-[10px] text-blue-300 capitalize flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                {currentOperator.role === 'admin' ? 'VLE Admin' : 'Counter Staff'}
              </p>
            </div>
          </button>

          {/* Help & Support / Troubleshoot */}
          <button
            onClick={onOpenSupport}
            className="w-9 h-9 rounded-xl bg-blue-900/80 hover:bg-blue-800 border border-blue-700/60 flex items-center justify-center text-amber-300 hover:text-white transition shadow-xs"
            title="Help, Diagnostics & Admin Support"
          >
            <LifeBuoy className="w-4 h-4" />
          </button>

          {/* Kiosk Settings */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-blue-900/80 hover:bg-blue-800 border border-blue-700/60 flex items-center justify-center text-blue-200 hover:text-white transition shadow-xs"
            title="Kiosk Profile, UPI QR & Offline Backup"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
