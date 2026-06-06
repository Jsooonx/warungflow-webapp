import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  MessageSquare, 
  ShieldCheck,
  PlusCircle, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { RollingText } from './RollingText';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onCreateOrderClick: () => void;
  onLogoutClick?: () => void;
  userName?: string;
  userEmail?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  onCreateOrderClick,
  onLogoutClick,
  userName = 'Workspace User',
  userEmail = 'Account active',
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'templates', label: 'WhatsApp Templates', icon: MessageSquare },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Logo Header */}
      <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img 
            src="/Logo-warungify.png" 
            alt="Warungify Logo" 
            className="w-8 h-8 object-contain rounded-lg" 
          />
          <div>
            <h1 className="text-sm font-semibold text-slate-900 tracking-tight leading-none">Warungify</h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5 inline-block"> Workspace</span>
          </div>
        </div>
      </div>

      {/* Global Action CTA Button */}
      <div className="px-4 py-4">
        <button
          onClick={onCreateOrderClick}
          className="group w-full h-10 px-4 rounded-lg border border-transparent bg-emerald-600 hover:bg-white active:bg-emerald-50 text-white hover:text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-500 shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
          <RollingText compact>Create New Order</RollingText>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group w-full h-10 px-3 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                isActive 
                  ? 'bg-slate-100/80 text-emerald-700 font-semibold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs"><RollingText compact>{item.label}</RollingText></span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Information Card */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="p-3 bg-white border border-slate-200/60 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Secure Workspace
            </span>
            <span className="text-emerald-700 font-semibold">Active</span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal mt-2 leading-normal">
            Auth and database rows are scoped to the signed-in account.
          </p>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 uppercase border border-slate-200">
            {(userName || userEmail || 'U').trim().charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate leading-none">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate mt-1">{userEmail}</p>
          </div>
        </div>
        <button 
          title="Logout"
          onClick={onLogoutClick}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
