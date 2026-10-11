import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  // If running inside native Electron desktop application, hide PWA installation
  if (typeof window !== 'undefined' && ((window as any).electronAPI || (window as any).isElectron)) {
    return null;
  }

  // If already running as an installed standalone PWA, show small installed badge
  if (isInstalled) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-300">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>Kiosk PWA Installed</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3 py-1.5 text-xs shadow-md transition active:scale-95"
        title="Install CSC Kiosk to home screen / desktop for offline access"
      >
        <Download className="w-4 h-4 text-slate-950" />
        <span>Install App (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-700" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-sm">
                    CSC
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Install e-Sevai Kiosk</h3>
                    <p className="text-xs text-slate-500">Add to iPhone / iPad Home Screen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong>Share button</strong> (square with arrow up) at the bottom toolbar of Safari.</span>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Tap <strong>Add</strong> in the top right. The kiosk will work offline directly from your home screen!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-blue-900 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback general PWA info button when running in regular browser (before prompt fires or desktop Chrome)
  return (
    <>
      <button
        onClick={() => setShowInstallHelp(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs"
        title="PWA Offline Kiosk Installation"
      >
        <Download className="w-3.5 h-3.5 text-blue-700" />
        <span className="hidden sm:inline">PWA App</span>
      </button>

      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center font-bold text-base shadow-sm">
                  ₹
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Install Offline Kiosk PWA</h3>
                  <p className="text-xs text-slate-500">Common Service Centre / e-Sevai Kiosk</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallHelp(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <p className="leading-relaxed">
                This CSC e-Sevai Kiosk is fully compliant with modern Progressive Web App (PWA) standards, allowing it to run offline without an internet connection.
              </p>
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-start gap-2.5 text-blue-900">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  To install on <strong>Desktop Chrome/Edge</strong>, click the install icon (🖥️ or ➕) in your browser address bar. On mobile, choose <em>&quot;Install App&quot;</em> or <em>&quot;Add to Home Screen&quot;</em> from the menu.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Zero lag instant billing & Xerox counter calculator</li>
                <li>Offline customer directory & account ledger access</li>
                <li>Auto-save and local data backup</li>
              </ul>
            </div>

            <button
              onClick={() => setShowInstallHelp(false)}
              className="mt-5 w-full rounded-xl bg-blue-900 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 transition"
            >
              Continue to Kiosk
            </button>
          </div>
        </div>
      )}
    </>
  );
};
