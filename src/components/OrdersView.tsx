import React, { useState } from 'react';
import type { Order, OrderStatus, Template } from '../types';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Edit3, 
  Trash2,
  ExternalLink,
  Check,
  Plus,
  CalendarClock,
  FileText
} from 'lucide-react';
import { RollingText } from './RollingText';
import { compileInvoiceText, copyInvoiceAndOpenWhatsApp, copyInvoiceText, formatWhatsAppLink } from '../lib/whatsapp';

interface OrdersViewProps {
  orders: Order[];
  templates: Template[];
  onAddOrderClick: () => void;
  onEditOrderClick: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onWhatsAppCopied: (orderId: string) => void;
  onInvoiceCopied: (orderNumber: string, action: 'copy' | 'send', copied: boolean) => void;
  initialFilterStatus?: string;
  onFilterStatusChange?: (status: string) => void;
  lastChangedOrder?: { id: string; kind: 'create' | 'edit' | 'status' } | null;
  savedStatusOrderId?: string | null;
  lang?: 'id' | 'en';
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  templates,
  onAddOrderClick,
  onEditOrderClick,
  onDeleteOrder,
  onUpdateStatus,
  onWhatsAppCopied,
  onInvoiceCopied,
  initialFilterStatus = 'all',
  onFilterStatusChange,
  lastChangedOrder = null,
  savedStatusOrderId = null,
  lang = 'id'
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(initialFilterStatus);
  const [activeWhatsAppPopover, setActiveWhatsAppPopover] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync state with prop updates (e.g. from routing)
  React.useEffect(() => {
    setFilterStatus(initialFilterStatus);
  }, [initialFilterStatus]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.whatsappNumber.includes(search) ||
      order.productName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Replace template variables
  const compileTemplate = (templateBody: string, order: Order) => {
    return templateBody
      .replace(/{nama}/g, order.customerName)
      .replace(/{total}/g, order.totalPrice.toLocaleString('id-ID'))
      .replace(/{tracking}/g, order.trackingNumber || '[No Tracking Resi]');
  };

  const handleWhatsAppAction = (template: Template, order: Order) => {
    const text = compileTemplate(template.body, order);
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(`${order.id}-${template.id}`);
      setTimeout(() => setCopiedId(null), 2000);
      
      // Open WhatsApp link in new tab
      const link = formatWhatsAppLink(order.whatsappNumber);
      window.open(link, '_blank', 'noopener,noreferrer');
      onWhatsAppCopied(order.orderNumber);
    }).catch(err => {
      console.error('Failed to copy text', err);
    });
  };

  const handleInvoiceAction = async (order: Order, action: 'copy' | 'send') => {
    const invoiceOrders = [order, ...orders.filter((item) => item.id !== order.id)];
    if (action === 'send') {
      const result = await copyInvoiceAndOpenWhatsApp(order, invoiceOrders);
      setCopiedId(`${order.id}-invoice-send`);
      setTimeout(() => setCopiedId(null), 2000);
      onInvoiceCopied(order.orderNumber, 'send', result.copied);
      return;
    }

    await copyInvoiceText(order, invoiceOrders);
    setCopiedId(`${order.id}-invoice-copy`);
    setTimeout(() => setCopiedId(null), 2000);
    onInvoiceCopied(order.orderNumber, 'copy', true);
  };

  const renderWhatsAppMenu = (order: Order) => {
    const invoiceOrders = [order, ...orders.filter((item) => item.id !== order.id)];

    return (
      <>
        <p className="text-[9px] font-bold text-slate-400 px-2 py-0.5 uppercase tracking-wider">
          {lang === 'id' ? 'Kirim Notifikasi WA' : 'Send WA Alert'}
        </p>
        <p className="px-2 pb-1 text-[10px] text-slate-400 leading-normal">
          {lang === 'id' ? 'Teks pesan akan disalin terlebih dahulu. Tempel di chat WhatsApp yang terbuka.' : 'Message text will be copied first. Paste it in the WhatsApp chat that opens.'}
        </p>
        <div className="space-y-0.5 mt-1">
          {order.status === 'paid' && (
            <>
              <button
                onClick={() => {
                  void handleInvoiceAction(order, 'send');
                  setActiveWhatsAppPopover(null);
                }}
                title={compileInvoiceText(order, invoiceOrders)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-blue-50/70 hover:bg-blue-50 text-[11px] font-semibold flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span className="text-blue-700 group-hover:text-blue-800 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  <RollingText compact>{lang === 'id' ? 'Kirim invoice WA' : 'Send invoice WA'}</RollingText>
                </span>
                {copiedId === `${order.id}-invoice-send` ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <ExternalLink className="w-3 h-3 text-blue-500 group-hover:text-blue-700 shrink-0" />
                )}
              </button>
              <button
                onClick={() => {
                  void handleInvoiceAction(order, 'copy');
                  setActiveWhatsAppPopover(null);
                }}
                title={compileInvoiceText(order, invoiceOrders)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-[11px] font-semibold flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span className="text-slate-700 group-hover:text-blue-700 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  <RollingText compact>{lang === 'id' ? 'Salin teks invoice' : 'Copy invoice text'}</RollingText>
                </span>
                {copiedId === `${order.id}-invoice-copy` ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600 shrink-0" />
                )}
              </button>
            </>
          )}
          {templates.map((tpl) => {
            const isCopied = copiedId === `${order.id}-${tpl.id}`;
            let translatedName = tpl.name;
            if (tpl.type === 'payment_confirmation') translatedName = lang === 'id' ? 'Tagihan Pembayaran' : 'Payment Bill';
            if (tpl.type === 'processing') translatedName = lang === 'id' ? 'Konfirmasi Lunas' : 'Payment Confirmation';
            if (tpl.type === 'shipping') translatedName = lang === 'id' ? 'Notifikasi Resi' : 'Shipping Receipt';
            if (tpl.type === 'order_format') translatedName = lang === 'id' ? 'Format Order WhatsApp' : 'WhatsApp Order Format';

            return (
              <button
                key={tpl.id}
                onClick={() => {
                  handleWhatsAppAction(tpl, order);
                  setActiveWhatsAppPopover(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-[11px] font-semibold flex items-center justify-between group transition-colors cursor-pointer"
              >
                <span className="text-slate-700 group-hover:text-emerald-700">
                  <RollingText compact>{translatedName}</RollingText>
                </span>
                {isCopied ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : (
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const statusStyles: Record<OrderStatus, { bg: string, text: string, label: string }> = {
    pending_payment: { bg: 'bg-amber-50 border-amber-200 text-amber-800', text: 'text-amber-800', label: lang === 'id' ? 'Belum Bayar' : 'Unpaid' },
    paid: { bg: 'bg-blue-50 border-blue-200 text-blue-800', text: 'text-blue-800', label: lang === 'id' ? 'Lunas' : 'Paid' },
    packing: { bg: 'bg-purple-50 border-purple-200 text-purple-800', text: 'text-purple-800', label: lang === 'id' ? 'Dikemas' : 'Packing' },
    shipped: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-800', text: 'text-indigo-800', label: lang === 'id' ? 'Dikirim' : 'Shipped' },
    done: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', text: 'text-emerald-800', label: lang === 'id' ? 'Selesai' : 'Done' },
    cancelled: { bg: 'bg-rose-50 border-rose-200 text-rose-800', text: 'text-rose-800', label: lang === 'id' ? 'Batal' : 'Cancelled' },
  };

  const formatCreatedAt = (dateString: string) => {
    return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-visible lg:overflow-y-auto space-y-6 select-none relative page-transition-enter">
      {/* Header and Add Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lang === 'id' ? 'Log Order' : 'Order Logs'}</h2>
          <p className="text-xs text-slate-400 mt-1">{lang === 'id' ? 'Ruang kerja order padat seperti spreadsheet.' : 'High-density spreadsheet-like order workspace.'}</p>
        </div>
        <button
          onClick={onAddOrderClick}
          className="group h-9 px-4 rounded-lg border border-transparent bg-emerald-600 hover:bg-white active:bg-emerald-50 text-white hover:text-emerald-700 text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all duration-500"
        >
          <Plus className="w-4 h-4 transition-transform duration-500 group-hover:rotate-90" />
          <RollingText compact>{lang === 'id' ? 'Buat Order' : 'Create Order'}</RollingText>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        <div className="relative w-full lg:flex-1 lg:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={lang === 'id' ? 'Cari ID order, nama pelanggan, produk, telepon...' : 'Search order ID, customer name, product, phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200/80 rounded-lg text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
          />
        </div>

        <div className="flex w-full lg:w-auto items-center gap-1.5 lg:ml-auto overflow-x-auto pb-1 lg:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500 mr-1.5">{lang === 'id' ? 'Status:' : 'Status:'}</span>
          {(['all', 'pending_payment', 'paid', 'packing', 'shipped', 'done', 'cancelled'] as const).map((status) => {
            const isActive = filterStatus === status;
            const label = status === 'all' ? (lang === 'id' ? 'Semua Order' : 'All Orders') : statusStyles[status]?.label;
            return (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  if (onFilterStatusChange) onFilterStatusChange(status);
                }}
                className={`group h-7 px-3 rounded-md text-[11px] font-semibold transition-all duration-500 cursor-pointer border ${
                  isActive 
                    ? 'bg-slate-950 border-transparent text-white hover:bg-white hover:text-slate-950' 
                    : 'bg-white border-transparent text-slate-600 hover:bg-slate-950 hover:text-white shadow-xs'
                }`}
              >
                <RollingText compact>{label}</RollingText>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Orders Cards */}
      <div className="space-y-3 lg:hidden">
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-xs">
            {lang === 'id' ? 'Tidak ada order yang cocok dengan kriteria pencarian.' : 'No orders matching search criteria.'}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const style = statusStyles[order.status] || { bg: 'bg-slate-50 border-slate-200 text-slate-800', label: order.status };
            const isWAOpen = activeWhatsAppPopover === order.id;
            const isStatusSaved = savedStatusOrderId === order.id;
            const isHighlighted = lastChangedOrder?.id === order.id;
            const highlightClass = isHighlighted
              ? lastChangedOrder?.kind === 'status'
                ? `order-row-highlight-status order-row-highlight-${order.status}`
                : 'order-row-highlight-success'
              : '';

            return (
              <div key={order.id} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 ${highlightClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-950">{order.orderNumber}</p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-800">{order.customerName}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-300" />
                      {formatCreatedAt(order.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${style.bg}`}>
                    {style.label}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50/70 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 truncate">{order.productName} x{order.quantity}</span>
                    <span className="font-mono font-bold text-slate-900">Rp{order.totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">{order.whatsappNumber}</p>
                  {order.notes && (
                    <p className="mt-1 truncate text-[11px] text-slate-400">Note: {order.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                    className={`h-8 min-w-0 flex-1 rounded-lg border px-2 text-[10px] font-bold outline-hidden cursor-pointer ${style.bg} ${isStatusSaved ? 'status-pipeline-sweep' : ''}`}
                  >
                    <option value="pending_payment">{lang === 'id' ? 'Belum Bayar' : 'Unpaid'}</option>
                    <option value="paid">{lang === 'id' ? 'Lunas' : 'Paid'}</option>
                    <option value="packing">{lang === 'id' ? 'Dikemas' : 'Packing'}</option>
                    <option value="shipped">{lang === 'id' ? 'Dikirim' : 'Shipped'}</option>
                    <option value="done">{lang === 'id' ? 'Selesai' : 'Done'}</option>
                    <option value="cancelled">{lang === 'id' ? 'Dibatalkan' : 'Cancelled'}</option>
                  </select>
                  {isStatusSaved && (
                    <span className="saved-pill text-[10px] font-bold text-emerald-700">{lang === 'id' ? 'Disimpan' : 'Saved'}</span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1.5 relative">
                  <div className="relative">
                    <button
                      onClick={() => setActiveWhatsAppPopover(isWAOpen ? null : order.id)}
                      title={lang === 'id' ? 'Kirim notifikasi WhatsApp' : 'Send WhatsApp alert'}
                      className={`h-8 px-3 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isWAOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WA
                    </button>
                    {isWAOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setActiveWhatsAppPopover(null)} />
                        <div className="absolute right-0 bottom-full mb-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 text-left animate-in fade-in slide-in-from-bottom-1 duration-100">
                          {renderWhatsAppMenu(order)}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => onEditOrderClick(order)}
                    title={lang === 'id' ? 'Edit detail order' : 'Edit order details'}
                    className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-500 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteOrder(order.id)}
                    title={lang === 'id' ? 'Hapus order' : 'Delete order'}
                    className="h-8 px-3 rounded-lg border border-rose-100 bg-rose-50 text-[11px] font-bold text-rose-600 cursor-pointer"
                  >
                    {lang === 'id' ? 'Hapus' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Orders Table Container */}
      <div className="hidden bg-white border border-slate-200 rounded-xl shadow-xs lg:block lg:overflow-visible overflow-hidden">
        <div className="lg:overflow-visible overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-24">{lang === 'id' ? 'ID Order' : 'Order ID'}</th>
                <th className="py-3 px-4 w-52">{lang === 'id' ? 'Waktu Ditambahkan' : 'Added Date & Time'}</th>
                <th className="py-3 px-4">{lang === 'id' ? 'Nama Pelanggan' : 'Customer Name'}</th>
                <th className="py-3 px-4 w-40">{lang === 'id' ? 'Nomor WhatsApp' : 'WhatsApp Number'}</th>
                <th className="py-3 px-4">{lang === 'id' ? 'Nama Produk (Qty)' : 'Product Name (Qty)'}</th>
                <th className="py-3 px-4 w-32">{lang === 'id' ? 'Total Harga' : 'Total Price'}</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 w-36 text-right">{lang === 'id' ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {lang === 'id' ? 'Tidak ada order yang cocok dengan kriteria pencarian.' : 'No orders matching search criteria.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const style = statusStyles[order.status] || { bg: 'bg-slate-50 border-slate-200 text-slate-800', label: order.status };
                  const isWAOpen = activeWhatsAppPopover === order.id;
                  const isHighlighted = lastChangedOrder?.id === order.id;
                  const isStatusSaved = savedStatusOrderId === order.id;
                  const highlightClass = isHighlighted
                    ? lastChangedOrder?.kind === 'status'
                      ? `order-row-highlight-status order-row-highlight-${order.status}`
                      : 'order-row-highlight-success'
                    : '';

                  return (
                    <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${highlightClass}`}>
                      {/* ID */}
                      <td className="py-3.5 px-4 font-bold text-slate-950">{order.orderNumber}</td>

                      {/* Created at */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5 text-slate-300" />
                          <span className="leading-tight">{formatCreatedAt(order.createdAt)}</span>
                        </span>
                      </td>
                      
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 block">{order.customerName}</span>
                        {order.notes && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-xs" title={order.notes}>
                            Note: {order.notes}
                          </span>
                        )}
                      </td>
                      
                      {/* WA Number */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{order.whatsappNumber}</td>
                      
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900">{order.productName}</span>
                        <span className="text-slate-400 font-bold ml-1.5">x{order.quantity}</span>
                      </td>
                      
                      {/* Total */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        Rp{order.totalPrice.toLocaleString('id-ID')}
                      </td>
                      
                      {/* Status */}
                      <td className="py-3.5 px-4 relative">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border outline-hidden cursor-pointer ${style.bg} ${isStatusSaved ? 'status-pipeline-sweep' : ''}`}
                        >
                          <option value="pending_payment">{lang === 'id' ? 'Belum Bayar' : 'Unpaid'}</option>
                          <option value="paid">{lang === 'id' ? 'Lunas' : 'Paid'}</option>
                          <option value="packing">{lang === 'id' ? 'Dikemas' : 'Packing'}</option>
                          <option value="shipped">{lang === 'id' ? 'Dikirim' : 'Shipped'}</option>
                          <option value="done">{lang === 'id' ? 'Selesai' : 'Done'}</option>
                          <option value="cancelled">{lang === 'id' ? 'Dibatalkan' : 'Cancelled'}</option>
                        </select>
                        {isStatusSaved && (
                          <span className="saved-pill ml-2 text-[10px] font-bold text-emerald-700">
                            {lang === 'id' ? 'Disimpan' : 'Saved'}
                          </span>
                        )}
                      </td>
                      
                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Action */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveWhatsAppPopover(isWAOpen ? null : order.id)}
                              title={lang === 'id' ? 'Kirim notifikasi WhatsApp' : 'Send WhatsApp alert'}
                              className={`p-1.5 rounded-lg border hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105 active:scale-95 transition-all duration-150 group cursor-pointer ${
                                isWAOpen ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 group-hover:scale-110 group-hover:-translate-y-[1px] transition-transform duration-200" />
                            </button>
                            
                            {/* WhatsApp Dropdown Menu */}
                            {isWAOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-20" 
                                  onClick={() => setActiveWhatsAppPopover(null)}
                                />
                                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-100">
                                  {renderWhatsAppMenu(order)}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Edit Action */}
                          <button
                            onClick={() => onEditOrderClick(order)}
                            title={lang === 'id' ? 'Edit detail order' : 'Edit order details'}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 text-slate-400 hover:scale-105 active:scale-95 transition-all duration-150 group cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
                          </button>

                          {/* Delete Action */}
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            title={lang === 'id' ? 'Hapus order' : 'Delete order'}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 hover:scale-105 active:scale-95 transition-all duration-150 group cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 animate-trash-shake" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

