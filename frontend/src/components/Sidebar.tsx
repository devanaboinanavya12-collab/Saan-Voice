import { LayoutDashboard, ShieldCheck, Zap, RefreshCw, Coins, Headset, LogOut, Terminal, CheckSquare, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userRole?: 'user' | 'admin';
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, userRole = 'user' }: SidebarProps) {
  const menuItems = userRole === 'admin' ? [
    { id: 'admin-overview', name: 'Organization Console', icon: LayoutDashboard },
    { id: 'claims-audit', name: 'Claims Audit', icon: CheckSquare },
    { id: 'settlement-pool', name: 'P2P Settlement Pools', icon: Activity },
    { id: 'system-logs', name: 'System Logs', icon: Terminal },
  ] : [
    { id: 'overview', name: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'emergency', name: 'Emergency Payout', icon: ShieldCheck },
    { id: 'p2p-trust', name: 'Zero-Border & Trust', icon: Zap },
    { id: 'fx-management', name: 'Dynamic FX Core', icon: RefreshCw },
    { id: 'loan-repayment', name: 'Collaborative Repay', icon: Coins },
    { id: 'voice-assistant', name: 'Hey Saan Terminal', icon: Headset },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200/60 p-7 flex flex-col justify-between fixed h-screen z-50 transition-all duration-300">
      <div>
        <div className="flex items-center gap-3 mb-10">
          <i className="fa-solid fa-microphone-lines text-2xl bg-gradient-to-r from-accentCyan to-accentPurple bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.2)]"></i>
          <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-slate-900 to-accentPurple bg-clip-text text-transparent">SAAN VOICE</span>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 border ${
                  isActive
                    ? 'text-accentPurple bg-accentPurple/5 border-accentPurple/25 shadow-sm'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 border border-transparent text-[#EF4444] hover:bg-[#EF4444]/5 mt-4 w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <div className="border-t border-slate-200/60 pt-5 text-xs text-slate-400 flex flex-col gap-1.5">
        <div>Version 2.0.0 (FastAPI/Postgres)</div>
        <div>Ref: UK-IFV-2026</div>
        <div className="bg-gradient-to-r from-accentPurple/10 to-accentCyan/10 border border-accentPurple/20 text-accentTeal text-[10px] font-bold py-1.5 px-3 rounded-lg text-center tracking-wider shadow-sm">
          UK INN-FOUNDER PROPOSAL
        </div>
      </div>
    </aside>
  );
}
