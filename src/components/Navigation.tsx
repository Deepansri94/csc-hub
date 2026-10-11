import React from 'react';
import { 
  Receipt, 
  Printer, 
  FileSpreadsheet, 
  BookOpen, 
  MessageSquare, 
  BarChart3,
  Sparkles,
  Shield
} from 'lucide-react';

export type ActiveTab = 'pos' | 'xerox' | 'invoices' | 'khata' | 'whatsapp' | 'analytics' | 'admin';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unpaidCount: number;
  totalPendingDue: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  unpaidCount,
  totalPendingDue,
}) => {
  const tabs = [
    {
      id: 'pos' as ActiveTab,
      label: 'Counter POS',
      sublabel: 'Quick Billing',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'xerox' as ActiveTab,
      label: 'Xerox & Print',
      sublabel: 'Rate Calculator',
      icon: Printer,
      badge: null,
    },
    {
      id: 'invoices' as ActiveTab,
      label: 'Bills & Invoices',
      sublabel: 'Receipts & PDF',
      icon: FileSpreadsheet,
      badge: unpaidCount > 0 ? `${unpaidCount} Due` : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'khata' as ActiveTab,
      label: 'Customer Book',
      sublabel: 'Accounts & Ledger',
      icon: BookOpen,
      badge: totalPendingDue > 0 ? `₹${totalPendingDue.toLocaleString('en-IN')}` : null,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 'whatsapp' as ActiveTab,
      label: 'WhatsApp Hub',
      sublabel: 'Reminders & News',
      icon: MessageSquare,
      badge: 'Auto',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Reports & Analytics',
      sublabel: 'Visual Dashboard',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Admin Hub',
      sublabel: 'Users & Desktop',
      icon: Shield,
      badge: 'Admin',
      badgeColor: 'bg-amber-400 text-slate-950 font-bold',
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 relative ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-sm ring-2 ring-blue-900/20'
                    : 'text-slate-700 hover:text-blue-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <div className="text-left flex flex-col">
                  <span className="leading-tight">{tab.label}</span>
                  <span className={`text-[10px] font-normal leading-tight hidden md:block ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                    {tab.sublabel}
                  </span>
                </div>

                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                      tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
