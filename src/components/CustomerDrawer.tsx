import React, { useEffect, useRef } from 'react';
import type { Customer, Order, OrderStatus } from '../types';
import { X, MessageSquare, ShoppingBag, Calendar, CreditCard } from 'lucide-react';

interface CustomerDrawerProps {
  customer: Customer | null;
  orders: Order[];
  onClose: () => void;
  lang?: 'id' | 'en';
}

export const CustomerDrawer: React.FC<CustomerDrawerProps> = ({
  customer,
  orders,
  onClose,
  lang = 'id'
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Click outside to close drawer
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (customer) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [customer, onClose]);

  if (!customer) return null;

  // Filter orders matching this customer's whatsappNumber
  const customerOrders = orders
    .filter((o) => o.whatsappNumber.trim() === customer.whatsappNumber.trim())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Clean phone number for wa.me link
  const getWhatsAppLink = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  const statusStyles: Record<OrderStatus, { bg: string, text: string, label: string }> = {
    pending_payment: { bg: 'bg-amber-50 border-amber-200 text-amber-800', text: 'text-amber-800', label: lang === 'id' ? 'Belum Bayar' : 'Unpaid' },
    paid: { bg: 'bg-blue-50 border-blue-200 text-blue-800', text: 'text-blue-800', label: lang === 'id' ? 'Lunas' : 'Paid' },
    packing: { bg: 'bg-purple-50 border-purple-200 text-purple-800', text: 'text-purple-800', label: lang === 'id' ? 'Dikemas' : 'Packing' },
    shipped: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-800', text: 'text-indigo-800', label: lang === 'id' ? 'Dikirim' : 'Shipped' },
    done: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', text: 'text-emerald-800', label: lang === 'id' ? 'Selesai' : 'Done' },
    cancelled: { bg: 'bg-rose-50 border-rose-200 text-rose-800', text: 'text-rose-800', label: lang === 'id' ? 'Dibatalkan' : 'Cancelled' },
  };

  const formatOrderDate = (dateString: string) => {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const staggerStyle = (index: number) => ({
    '--stagger-delay': `${index * 40}ms`,
  } as React.CSSProperties);

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} />
      
      {/* Drawer box */}
      <div 
        ref={drawerRef}
        className="w-full max-w-md bg-white h-full shadow-2xl relative z-10 flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250 ease-out"
      >
        {/* Drawer Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {lang === 'id' ? 'Detail Pelanggan' : 'Customer Details'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Drawer Contents Scroll area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Customer Profile Section */}
          <div className="space-y-4 drawer-stagger" style={staggerStyle(0)}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200/50 flex items-center justify-center font-bold text-lg text-emerald-700">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 leading-none">{customer.name}</h4>
                <p className="text-xs text-slate-400 font-mono mt-1.5">{customer.whatsappNumber}</p>
              </div>
            </div>

            {/* Quick Action WhatsApp Button */}
            <a
              href={getWhatsAppLink(customer.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-10 rounded-lg border border-emerald-600/20 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {lang === 'id' ? 'Buka Chat WhatsApp' : 'Open WhatsApp Chat'}
            </a>
          </div>

          {/* Customer Summary Cards */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              {lang === 'id' ? 'Ringkasan Akun' : 'Account Summary'}
            </h5>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Box 1: Total orders */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl drawer-stagger" style={staggerStyle(1)}>
                <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {lang === 'id' ? 'Total Order' : 'Total Orders'}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 leading-none">{customer.totalOrders}</p>
              </div>

              {/* Box 2: Total Spent */}
              <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl drawer-stagger" style={staggerStyle(2)}>
                <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {lang === 'id' ? 'Total Belanja' : 'Total Spent'}
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 leading-none">
                  Rp{customer.totalSpending.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Last order date row */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl drawer-stagger" style={staggerStyle(3)}>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                {lang === 'id' ? 'Tanggal Order Terakhir' : 'Last Order Date'}
              </span>
              <span className="text-xs font-bold text-slate-800 text-right">
                {formatOrderDate(customer.lastOrderDate)}
              </span>
            </div>
          </div>

          {/* Customer Order History Section */}
          <div className="space-y-4 drawer-stagger" style={staggerStyle(4)}>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              {lang === 'id' ? `Riwayat Log Order (${customerOrders.length})` : `Order History logs (${customerOrders.length})`}
            </h5>

            <div className="space-y-3">
              {customerOrders.map((order, index) => {
                const style = statusStyles[order.status] || { bg: 'bg-slate-50 border-slate-200 text-slate-800', label: order.status };
                return (
                  <div 
                    key={order.id} 
                    className="p-3.5 border border-slate-200/70 rounded-xl bg-white hover:border-slate-300 transition-all flex flex-col gap-2 drawer-stagger"
                    style={staggerStyle(5 + Math.min(index, 7))}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{order.orderNumber}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${style.bg}`}>
                        {style.label}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {order.productName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {lang === 'id' ? 'Dibuat' : 'Added'}: {formatOrderDate(order.createdAt)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {lang === 'id' ? 'Jml' : 'Qty'}: {order.quantity} - {lang === 'id' ? 'Harga' : 'Price'}: Rp{order.totalPrice.toLocaleString('id-ID')}
                      </p>
                    </div>

                    {order.trackingNumber && (
                      <div className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-100 rounded-md py-1 px-2.5 mt-1">
                        {lang === 'id' ? 'Resi' : 'Tracking'}: {order.trackingNumber}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
