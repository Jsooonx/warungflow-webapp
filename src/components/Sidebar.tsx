import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  MessageSquare, 
  Clock, 
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
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  onCreateOrderClick,
  onLogoutClick
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
            src="/Logo-warungflow.png" 
            alt="WarungFlow Logo" 
            className="w-8 h-8 object-contain rounded-lg" 
          />
          <div>
            <h1 className="text-sm font-semibold text-slate-900 tracking-tight leading-none">WarungFlow</h1>
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

      {/* Bottom Information Card: Trial Progress */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="p-3 bg-white border border-slate-200/60 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              Trial Period
            </span>
            <span className="text-slate-900 font-semibold">12 days left</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
          </div>
          <p className="text-[10px] text-slate-400 font-normal mt-2 leading-normal">
            Your 14-day free trial ends on June 15, 2026.
          </p>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 uppercase border border-slate-200">
            N
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate leading-none">Nur Aini</p>
            <p className="text-[10px] text-slate-400 truncate mt-1">Free Trial Member</p>
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
