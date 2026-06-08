import React, { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle,
  Truck,
  CreditCard,
  ShoppingCart,
  CalendarClock,
  MessageSquare,
  FileText,
  ClipboardPaste,
  Database,
  ArrowUpRight,
  X
} from 'lucide-react';
import { RollingText } from './RollingText';

interface DashboardViewProps {
  orders: Order[];
  onNavigateToTab: (tab: string, filterStatus?: string) => void;
  onEditOrder: (order: Order) => void;
  invoiceHandledOrderIds?: string[];
  lastChangedOrder?: { id: string; kind: 'create' | 'edit' | 'status' } | null;
  lang: 'id' | 'en';
}

// 7-day sparkline baseline waves
const BASELINES: Record<OrderStatus, number[]> = {
  pending_payment: [3, 5, 2, 6, 4, 7, 5],
  paid: [5, 8, 4, 7, 6, 9, 8],
  packing: [2, 4, 3, 5, 3, 4, 4],
  shipped: [4, 6, 5, 8, 7, 9, 8],
  done: [8, 12, 10, 15, 12, 17, 16],
  cancelled: [1, 2, 1, 3, 2, 2, 2],
};

// Lightweight trend fallback values for visual context.
const TRENDS: Record<OrderStatus, { value: number; isPositive: boolean }> = {
  pending_payment: { value: 12.5, isPositive: true },
  paid: { value: 19.8, isPositive: true },
  packing: { value: 5.4, isPositive: false },
  shipped: { value: 7.6, isPositive: true },
  done: { value: 25.2, isPositive: true },
  cancelled: { value: 1.2, isPositive: false },
};

// Status visual configuration
const THEMES: Record<OrderStatus, { 
  stroke: string; 
  text: string; 
  bg: string; 
  border: string;
  label: string;
  desc: string;
}> = {
  pending_payment: {
    stroke: '#f59e0b', // amber-500
    text: 'text-amber-700 bg-amber-50 border-amber-200/50',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Unpaid',
    desc: 'Waiting for transfer'
  },
  paid: {
    stroke: '#3b82f6', // blue-500
    text: 'text-blue-700 bg-blue-50 border-blue-200/50',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Paid',
    desc: 'Ready to pack'
  },
  packing: {
    stroke: '#a855f7', // purple-500
    text: 'text-purple-700 bg-purple-50 border-purple-200/50',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    label: 'Packing',
    desc: 'In production/wrap'
  },
  shipped: {
    stroke: '#6366f1', // indigo-500
    text: 'text-indigo-700 bg-indigo-50 border-indigo-200/50',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    label: 'Shipped',
    desc: 'Sent to couriers'
  },
  done: {
    stroke: '#10b981', // emerald-500
    text: 'text-emerald-700 bg-emerald-50 border-emerald-200/50',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Completed',
    desc: 'Delivered to customers'
  },
  cancelled: {
    stroke: '#f43f5e', // rose-500
    text: 'text-rose-700 bg-rose-50 border-rose-200/50',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    label: 'Cancelled',
    desc: 'Voided order'
  }
};

const STATUS_ICONS: Record<OrderStatus, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  pending_payment: CreditCard,
  paid: CheckCircle,
  packing: Package,
  shipped: Truck,
  done: TrendingUp,
  cancelled: AlertTriangle,
};

// SVG Path Helpers
const getDayLabel = (daysAgo: number, lang?: 'id' | 'en') => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: 'short' });
};

const getSvgCoords = (points: number[], width = 120, height = 36) => {
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
  
  return points.map((val, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - 3 - ((val - minVal) / range) * (height - 6);
    return { x, y };
  });
};

const getCurvePath = (pts: { x: number; y: number }[]) => {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  const dx = 8; // control point offset
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    d += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

const getFillPath = (pts: { x: number; y: number }[], height = 36) => {
  const linePath = getCurvePath(pts);
  if (!linePath) return '';
  return `${linePath} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
};

// Sparkline Mini Chart Component
const Sparkline: React.FC<{ status: OrderStatus; points: number[] }> = ({ status, points }) => {
  const theme = THEMES[status];
  const coords = getSvgCoords(points, 120, 36);
  const strokePath = getCurvePath(coords);
  const fillPath = getFillPath(coords, 36);
  
  return (
    <svg viewBox="0 0 120 36" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={theme.stroke} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <path className="sparkline-fill-reveal" d={fillPath} fill={`url(#grad-${status})`} />
      <path className="sparkline-draw" pathLength={1} d={strokePath} fill="none" stroke={theme.stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const CountUpValue: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const duration = 620;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <>{displayValue}</>;
};

const getStatusTheme = (status: OrderStatus, lang: 'id' | 'en') => {
  const t = THEMES[status];
  return {
    ...t,
    label: {
      pending_payment: lang === 'id' ? 'Belum Bayar' : 'Unpaid',
      paid: lang === 'id' ? 'Lunas' : 'Paid',
      packing: lang === 'id' ? 'Dikemas' : 'Packing',
      shipped: lang === 'id' ? 'Dikirim' : 'Shipped',
      done: lang === 'id' ? 'Selesai' : 'Completed',
      cancelled: lang === 'id' ? 'Dibatalkan' : 'Cancelled',
    }[status],
    desc: {
      pending_payment: lang === 'id' ? 'Menunggu transfer bank' : 'Waiting for transfer',
      paid: lang === 'id' ? 'Siap dikemas' : 'Ready to pack',
      packing: lang === 'id' ? 'Dalam proses packing' : 'In production/wrap',
      shipped: lang === 'id' ? 'Dikirim ke kurir' : 'Sent to couriers',
      done: lang === 'id' ? 'Diterima oleh pelanggan' : 'Delivered to customers',
      cancelled: lang === 'id' ? 'Order dibatalkan' : 'Voided order',
    }[status],
  };
};

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  orders, 
  onNavigateToTab,
  onEditOrder,
  invoiceHandledOrderIds = [],
  lastChangedOrder = null,
  lang
}) => {
  // Modal tracking states
  const [activeChartModal, setActiveChartModal] = useState<OrderStatus | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Helper for status count
  const getCount = (status: OrderStatus) => orders.filter(o => o.status === status).length;

  // Generate dynamic 7-day data points for a status (baseline + live updates)
  const getStatusDataPoints = (status: OrderStatus) => {
    const base = BASELINES[status] || [0, 0, 0, 0, 0, 0, 0];
    return base.map((baseVal, i) => {
      const daysAgo = 6 - i;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);
      const dateStr = targetDate.toDateString();
      
      const count = orders.filter(o => 
        o.status === status && 
        new Date(o.createdAt).toDateString() === dateStr
      ).length;
      
      return baseVal + count;
    });
  };

  // Calculators for Need Attention items
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

  const unpaidStuck = orders.filter(o => 
    o.status === 'pending_payment' && (now - new Date(o.createdAt).getTime() > ONE_DAY_MS)
  );

  const packingStuck = orders.filter(o => 
    o.status === 'packing' && (now - new Date(o.createdAt).getTime() > TWO_DAYS_MS)
  );

  const missingTracking = orders.filter(o => 
    o.status === 'shipped' && (!o.trackingNumber || o.trackingNumber.trim() === '')
  );

  const paidReady = orders.filter(o => o.status === 'paid');
  const paidInvoiceMissing = paidReady.filter((order) => !invoiceHandledOrderIds.includes(order.id));
  const paidReadyToPack = paidReady.filter((order) => invoiceHandledOrderIds.includes(order.id));
  const packingOrders = orders.filter(o => o.status === 'packing');
  const shippedWithTracking = orders.filter(o => 
    o.status === 'shipped' && !!o.trackingNumber?.trim()
  );

  const getAgeMs = (order: Order) => now - new Date(order.createdAt).getTime();
  const formatAge = (ageMs: number) => {
    if (ageMs < 60 * 60 * 1000) return `${Math.max(1, Math.floor(ageMs / (60 * 1000)))}m`;
    if (ageMs < ONE_DAY_MS) return `${Math.floor(ageMs / (60 * 60 * 1000))}h`;
    return `${Math.floor(ageMs / ONE_DAY_MS)}d`;
  };

  type OpsTone = 'amber' | 'blue' | 'purple' | 'indigo' | 'emerald';
  type OpsQueueItem = {
    id: string;
    order: Order;
    title: string;
    meta: string;
    ageLabel: string;
    actionLabel: string;
    severity: number;
    tone: OpsTone;
    Icon: React.ComponentType<{ className?: string }>;
    onAction: () => void;
  };

  const toneStyles: Record<OpsTone, { icon: string; badge: string; button: string }> = {
    amber: {
      icon: 'bg-amber-50 border-amber-200/60 text-amber-700',
      badge: 'bg-amber-50 border-amber-200 text-amber-700',
      button: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200/60',
    },
    blue: {
      icon: 'bg-blue-50 border-blue-200/60 text-blue-700',
      badge: 'bg-blue-50 border-blue-200 text-blue-700',
      button: 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200/60',
    },
    purple: {
      icon: 'bg-purple-50 border-purple-200/60 text-purple-700',
      badge: 'bg-purple-50 border-purple-200 text-purple-700',
      button: 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200/60',
    },
    indigo: {
      icon: 'bg-indigo-50 border-indigo-200/60 text-indigo-700',
      badge: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      button: 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200/60',
    },
    emerald: {
      icon: 'bg-emerald-50 border-emerald-200/60 text-emerald-700',
      badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      button: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200/60',
    },
  };

  const workQueueItems: OpsQueueItem[] = [
    ...missingTracking.map((order) => ({
      id: `missing-${order.id}`,
      order,
      title: lang === 'id' ? 'Kode resi pengiriman belum diisi' : 'Missing tracking code',
      meta: `${order.orderNumber} - ${order.customerName}`,
      ageLabel: lang === 'id' ? 'Resi kosong' : 'Missing resi',
      actionLabel: lang === 'id' ? 'Tambah Resi' : 'Add Resi',
      severity: 4,
      tone: 'indigo' as const,
      Icon: HelpCircle,
      onAction: () => onEditOrder(order),
    })),
    ...packingStuck.map((order) => ({
      id: `packing-${order.id}`,
      order,
      title: lang === 'id' ? 'Proses packing tertunda lama' : 'Packing is aging',
      meta: `${order.orderNumber} - ${order.productName}`,
      ageLabel: lang === 'id' ? `${formatAge(getAgeMs(order))} dikemas` : `${formatAge(getAgeMs(order))} packing`,
      actionLabel: lang === 'id' ? 'Kirim' : 'Ship',
      severity: 3,
      tone: 'purple' as const,
      Icon: Package,
      onAction: () => onEditOrder(order),
    })),
    ...unpaidStuck.map((order) => ({
      id: `unpaid-${order.id}`,
      order,
      title: lang === 'id' ? 'Perlu follow-up pembayaran' : 'Payment follow-up due',
      meta: `${order.orderNumber} - Rp${order.totalPrice.toLocaleString('id-ID')}`,
      ageLabel: lang === 'id' ? `${formatAge(getAgeMs(order))} belum bayar` : `${formatAge(getAgeMs(order))} unpaid`,
      actionLabel: lang === 'id' ? 'Ingatkan' : 'Remind',
      severity: 2,
      tone: 'amber' as const,
      Icon: Clock,
      onAction: () => onNavigateToTab('orders', 'pending_payment'),
    })),
    ...paidInvoiceMissing.map((order) => ({
      id: `invoice-${order.id}`,
      order,
      title: lang === 'id' ? 'Invoice belum dikirim' : 'Invoice not sent yet',
      meta: `${order.orderNumber} - ${order.productName}`,
      ageLabel: lang === 'id' ? `${formatAge(getAgeMs(order))} lunas` : `${formatAge(getAgeMs(order))} paid`,
      actionLabel: lang === 'id' ? 'Invoice' : 'Invoice',
      severity: 2,
      tone: 'blue' as const,
      Icon: FileText,
      onAction: () => onNavigateToTab('orders', 'paid'),
    })),
    ...paidReadyToPack.map((order) => ({
      id: `paid-${order.id}`,
      order,
      title: lang === 'id' ? 'Siap dikemas' : 'Ready to pack',
      meta: `${order.orderNumber} - ${order.productName}`,
      ageLabel: lang === 'id' ? `${formatAge(getAgeMs(order))} lunas` : `${formatAge(getAgeMs(order))} paid`,
      actionLabel: lang === 'id' ? 'Kemas' : 'Pack',
      severity: 1,
      tone: 'blue' as const,
      Icon: CheckCircle,
      onAction: () => onNavigateToTab('orders', 'paid'),
    })),
  ]
    .sort((a, b) => b.severity - a.severity || getAgeMs(b.order) - getAgeMs(a.order))
    .slice(0, 8);

  const agingItems = workQueueItems
    .filter((item) => item.severity >= 2)
    .slice(0, 5);

  const followUpItems: OpsQueueItem[] = [
    ...unpaidStuck.map((order) => ({
      id: `follow-unpaid-${order.id}`,
      order,
      title: lang === 'id' ? 'Kirim pengingat pembayaran' : 'Send payment reminder',
      meta: `${order.customerName} - ${order.orderNumber}`,
      ageLabel: lang === 'id' ? `${formatAge(getAgeMs(order))} menunggu` : `${formatAge(getAgeMs(order))} waiting`,
      actionLabel: lang === 'id' ? 'Ingatkan' : 'Remind',
      severity: 3,
      tone: 'amber' as const,
      Icon: MessageSquare,
      onAction: () => onNavigateToTab('orders', 'pending_payment'),
    })),
    ...paidReady.map((order) => ({
      id: `follow-paid-${order.id}`,
      order,
      title: lang === 'id' ? 'Kirim update proses pesanan' : 'Send processing update',
      meta: `${order.customerName} - ${order.orderNumber}`,
      ageLabel: lang === 'id' ? 'Update siap' : 'Ready update',
      actionLabel: lang === 'id' ? 'Proses' : 'Process',
      severity: 2,
      tone: 'blue' as const,
      Icon: MessageSquare,
      onAction: () => onNavigateToTab('orders', 'paid'),
    })),
    ...packingOrders.map((order) => ({
      id: `follow-packing-${order.id}`,
      order,
      title: lang === 'id' ? 'Kirim update proses pesanan' : 'Send processing update',
      meta: `${order.customerName} - ${order.orderNumber}`,
      ageLabel: lang === 'id' ? `${formatAge(getAgeMs(order))} dikemas` : `${formatAge(getAgeMs(order))} packing`,
      actionLabel: lang === 'id' ? 'Update' : 'Update',
      severity: 2,
      tone: 'purple' as const,
      Icon: MessageSquare,
      onAction: () => onNavigateToTab('orders', 'packing'),
    })),
    ...shippedWithTracking.map((order) => ({
      id: `follow-shipped-${order.id}`,
      order,
      title: lang === 'id' ? 'Kirim notifikasi pengiriman & resi' : 'Send shipping alert',
      meta: `${order.customerName} - ${order.trackingNumber}`,
      ageLabel: lang === 'id' ? 'Resi siap' : 'Resi ready',
      actionLabel: lang === 'id' ? 'Notif' : 'Alert',
      severity: 1,
      tone: 'emerald' as const,
      Icon: Truck,
      onAction: () => onNavigateToTab('orders', 'shipped'),
    })),
  ]
    .sort((a, b) => b.severity - a.severity || getAgeMs(b.order) - getAgeMs(a.order))
    .slice(0, 6);

  const attentionCount = workQueueItems.length;

  // Recent orders sorted by creation time
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Status visual themes for the Feed List
  const statusStyles: Record<OrderStatus, { bg: string, text: string, label: string }> = {
    pending_payment: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: lang === 'id' ? 'Belum Bayar' : 'Unpaid' },
    paid: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', label: lang === 'id' ? 'Lunas' : 'Paid' },
    packing: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', label: lang === 'id' ? 'Dikemas' : 'Packing' },
    shipped: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', label: lang === 'id' ? 'Dikirim' : 'Shipped' },
    done: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: lang === 'id' ? 'Selesai' : 'Done' },
    cancelled: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', label: lang === 'id' ? 'Dibatalkan' : 'Cancelled' },
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

  // Pre-calculate large chart items if modal active
  const largeTheme = activeChartModal ? getStatusTheme(activeChartModal, lang) : null;
  const largeIcon = activeChartModal ? STATUS_ICONS[activeChartModal] : null;
  const largePoints = activeChartModal ? getStatusDataPoints(activeChartModal) : [];
  
  const chartMin = activeChartModal ? Math.max(0, Math.min(...largePoints) - 1) : 0;
  const chartMax = activeChartModal ? Math.max(...largePoints) + 2 : 0;
  const chartRange = chartMax - chartMin === 0 ? 1 : chartMax - chartMin;
  
  const largeCoords = largePoints.map((val, i) => {
    const x = 30 + (i / 6) * 510;
    const y = 170 - ((val - chartMin) / chartRange) * 150;
    return { x, y };
  });

  const largeStrokePath = getCurvePath(largeCoords);
  const largeFillPath = largeStrokePath ? `${largeStrokePath} L 540 170 L 30 170 Z` : '';

  const gridValues = [
    chartMin,
    Math.round(chartMin + chartRange * 0.33),
    Math.round(chartMin + chartRange * 0.66),
    chartMax
  ];
  const uniqueGridValues = Array.from(new Set(gridValues)).sort((a, b) => a - b);

  const cardStatuses: OrderStatus[] = ['pending_payment', 'paid', 'packing', 'shipped', 'done'];
  const hasNoOrders = orders.length === 0;

  return (
    <div className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6 select-none page-transition-enter">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {lang === 'id' ? 'Ringkasan Dasbor' : 'Overview Dashboard'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {lang === 'id' ? 'Pelacakan operasional dan antrean tugas real-time.' : 'Real-time operational tracking and task queues.'}
        </p>
      </div>

      {hasNoOrders && (
        <div className="premium-card overflow-hidden bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
            <div className="p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-slate-100">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-4">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {lang === 'id' ? 'Mulai alur order pertama Anda' : 'Start your first order flow'}
              </h3>
              <p className="mt-2 max-w-lg text-xs leading-relaxed text-slate-500">
                {lang === 'id' 
                  ? 'Dasbor akan aktif setelah ada order pertama. Mulai dari input manual atau paste chat pembeli ke Magic Paste.' 
                  : 'Dashboard will come alive after the first order. Start with manual input or paste buyer chat into Magic Paste.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => onNavigateToTab('orders/new')}
                  className="group h-9 px-4 rounded-lg bg-slate-950 hover:bg-white text-white hover:text-slate-950 text-xs font-bold transition-all duration-500 shadow-xs cursor-pointer"
                >
                  <RollingText compact>{lang === 'id' ? 'Buat order pertama' : 'Create first order'}</RollingText>
                </button>
                <button
                  onClick={() => onNavigateToTab('orders/new')}
                  className="group h-9 px-4 rounded-lg bg-white hover:bg-slate-950 text-slate-700 hover:text-white text-xs font-bold transition-all duration-500 shadow-xs cursor-pointer"
                >
                  <RollingText compact>{lang === 'id' ? 'Coba Tempel Ajaib' : 'Try Magic Paste'}</RollingText>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 p-5 sm:p-6 bg-slate-50/50">
              {[
                { 
                  icon: ClipboardPaste, 
                  title: lang === 'id' ? 'Tempel chat' : 'Paste chat', 
                  desc: lang === 'id' ? 'Salin format order dari WhatsApp buyer.' : 'Copy order format from buyer WhatsApp.' 
                },
                { 
                  icon: MessageSquare, 
                  title: lang === 'id' ? 'Kirim notifikasi' : 'Send updates', 
                  desc: lang === 'id' ? 'Kirim reminder, invoice, atau resi via WA.' : 'Send reminder, invoice, or receipt via WA.' 
                },
                { 
                  icon: Database, 
                  title: lang === 'id' ? 'Lacak pelanggan' : 'Track customers', 
                  desc: lang === 'id' ? 'Customer list otomatis dari order tersimpan.' : 'Automatic customer database from saved orders.' 
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl border border-slate-100 bg-white p-3.5">
                    <Icon className="h-4 w-4 text-emerald-600 mb-2" />
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {cardStatuses.map((status) => {
          const theme = getStatusTheme(status, lang);
          const Icon = STATUS_ICONS[status];
          const count = getCount(status);
          const points = getStatusDataPoints(status);
          const trend = TRENDS[status];

          return (
            <button
              key={status}
              onClick={() => setActiveChartModal(status)}
              className="p-4 sm:p-5 premium-card text-left cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[118px] sm:min-h-[145px] group"
            >
              <div>
                {/* Top row */}
                <div className="flex items-center justify-between text-slate-400 mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100/50 group-hover:border-emerald-100 group-hover:bg-emerald-50 transition-colors">
                      <Icon className="w-3.5 h-3.5" style={{ color: theme.stroke }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{theme.label}</span>
                  </div>
                  {/* Circular ArrowUpRight */}
                  <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100/60 flex items-center justify-center text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-100/80 transition-all">
                    <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Mid Row: Value & Trend inline */}
                <div className="flex items-baseline gap-1.5 mt-1 sm:mt-2">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                    <CountUpValue value={count} />
                  </span>
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                </div>
                
                {/* Desc */}
                <p className="text-[10px] text-slate-400 font-medium mt-1 line-clamp-2">{theme.desc}</p>
              </div>

              {/* Sparkline at bottom */}
              <div className="mt-3 sm:mt-4 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 h-9 sm:h-12 overflow-hidden rounded-b-[1.25rem]">
                <Sparkline status={status} points={points} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Main widgets split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Panel 1: TODAY'S WORK QUEUE */}
        <div className="premium-card flex flex-col overflow-hidden">
          <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${attentionCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                {lang === 'id' ? 'Antrean Kerja Hari Ini' : "Today's Work Queue"}
              </h3>
            </div>
            {attentionCount > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {attentionCount} {lang === 'id' ? 'Tugas' : 'Tasks'}
              </span>
            )}
          </div>
          
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-96">
            {attentionCount === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-800">
                  {lang === 'id' ? 'Semua beres!' : 'All caught up!'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'id' 
                    ? 'Tidak ada tugas pembayaran, packing, atau pengiriman yang mendesak saat ini.' 
                    : 'No urgent payment, packing, or shipping tasks right now.'}
                </p>
              </div>
            ) : (
              workQueueItems.map((item) => {
                const Icon = item.Icon;
                const tone = toneStyles[item.tone];
                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${tone.icon}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${tone.badge}`}>
                            {item.ageLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-1">
                          {item.meta} - {item.order.customerName}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={item.onAction}
                      className={`group px-2.5 py-1 text-[11px] font-semibold rounded-md border flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${tone.button}`}
                    >
                      <RollingText compact>{item.actionLabel}</RollingText> <ArrowRight className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 2: BOTTLENECK AGING */}
        <div className="premium-card flex flex-col overflow-hidden">
          <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                {lang === 'id' ? 'Hambatan Operasional' : 'Bottleneck Aging'}
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="group text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <RollingText compact>{lang === 'id' ? 'Audit Semua' : 'Audit All'}</RollingText>
            </button>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-96">
            {agingItems.length === 0 ? (
              <div className="h-full min-h-48 flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-3" />
                <p className="text-xs font-semibold text-slate-800">
                  {lang === 'id' ? 'Tidak ada hambatan menumpuk' : 'No aging bottlenecks'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'id' 
                    ? 'Tidak ada pesanan belum bayar, packing, atau resi kosong yang telat.' 
                    : 'No late unpaid, packing, or missing resi items.'}
                </p>
              </div>
            ) : (
              agingItems.map((item) => {
                const tone = toneStyles[item.tone];
                return (
                  <button
                    key={item.id}
                    onClick={item.onAction}
                    className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate"><RollingText compact>{item.order.orderNumber} - {item.order.customerName}</RollingText></p>
                        <p className="text-[11px] text-slate-400 mt-1 truncate">{item.title}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 group-hover:scale-105 transition-transform ${tone.badge}`}>
                        {item.ageLabel}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 3: WHATSAPP FOLLOW-UP QUEUE */}
        <div className="premium-card flex flex-col overflow-hidden">
          <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                {lang === 'id' ? 'Antrean Follow-up WhatsApp' : 'WhatsApp Follow-up Queue'}
              </h3>
            </div>
            {followUpItems.length > 0 && (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                {followUpItems.length} {lang === 'id' ? 'Siap' : 'Ready'}
              </span>
            )}
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-96">
            {followUpItems.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-800">
                  {lang === 'id' ? 'Tidak ada antrean follow-up' : 'No follow-ups queued'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lang === 'id' 
                    ? 'Tidak ada pengingat pembayaran, proses, atau notifikasi pengiriman yang menunggu.' 
                    : 'No reminder, processing, or shipping alert is waiting.'}
                </p>
              </div>
            ) : (
              followUpItems.map((item) => {
                const Icon = item.Icon;
                const tone = toneStyles[item.tone];
                return (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${tone.icon}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-1">{item.meta}</p>
                      </div>
                    </div>
                    <button
                      onClick={item.onAction}
                      className={`group px-2.5 py-1 text-[11px] font-semibold rounded-md border flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${tone.button}`}
                    >
                      <RollingText compact>{item.actionLabel}</RollingText> <ArrowRight className="w-3 h-3 transition-transform duration-500 group-hover:translate-x-0.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right widget: RECENT ORDERS */}
        <div className="premium-card flex flex-col overflow-hidden">
          <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                {lang === 'id' ? 'Aktivitas Order Terbaru' : 'Recent Orders Feed'}
              </h3>
            </div>
            <button 
              onClick={() => onNavigateToTab('orders')}
              className="group text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              <RollingText compact>{lang === 'id' ? 'Lihat Semua' : 'View All'}</RollingText>
            </button>
          </div>
          
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-96">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {lang === 'id' ? 'Belum ada order terdaftar.' : 'No orders registered yet.'}
              </div>
            ) : (
              recentOrders.map((order) => {
                const style = statusStyles[order.status] || { bg: 'bg-slate-100', text: 'text-slate-800', label: order.status };
                const isHighlighted = lastChangedOrder?.id === order.id;
                const highlightClass = isHighlighted
                  ? lastChangedOrder?.kind === 'status'
                    ? `order-row-highlight-status order-row-highlight-${order.status}`
                    : 'order-row-highlight-success'
                  : '';
                return (
                  <div key={order.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 ${highlightClass}`}>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{order.orderNumber}</span>
                        <span className="text-xs font-medium text-slate-700 truncate">{order.customerName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {order.productName} (x{order.quantity}) - Rp{order.totalPrice.toLocaleString('id-ID')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 gap-1.5 max-w-52">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="text-[10px] text-slate-400 text-right leading-snug flex items-start gap-1">
                        <CalendarClock className="w-3 h-3 mt-0.5 shrink-0 text-slate-300" />
                        {lang === 'id' ? 'Dibuat' : 'Added'} {formatCreatedAt(order.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Large Chart Modal */}
      {activeChartModal && largeTheme && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 page-transition-enter">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col p-6 relative">
            
            {/* Close button X */}
            <button
              onClick={() => {
                setActiveChartModal(null);
                setHoveredPointIndex(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header info */}
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {largeIcon && React.createElement(largeIcon, { 
                  className: "w-5 h-5", 
                  style: { color: largeTheme.stroke } 
                })}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'id' ? 'Analisis Tren' : 'Trend Analysis'}
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {lang === 'id' ? `Riwayat Order ${largeTheme.label}` : `${largeTheme.label} Orders History`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'id' ? 'Menampilkan volume transaksi dan tren selama 7 hari terakhir.' : 'Showing transaction volume and trends for the last 7 days.'}
                </p>
              </div>
            </div>

            {/* Interactive SVG Chart wrapper */}
            <div className="relative border border-slate-100/80 rounded-xl p-4 bg-slate-50/30 overflow-hidden select-none">
              <svg 
                viewBox="0 0 550 200" 
                className="w-full h-auto overflow-visible"
              >
                <defs>
                  <linearGradient id={`large-grad-${activeChartModal}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={largeTheme.stroke} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={largeTheme.stroke} stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {uniqueGridValues.map((val, idx) => {
                  const y = 170 - ((val - chartMin) / chartRange) * 150;
                  return (
                    <g key={idx} className="opacity-80">
                      <line 
                        x1="30" 
                        y1={y} 
                        x2="540" 
                        y2={y} 
                        stroke="#e2e8f0" 
                        strokeWidth="1" 
                        strokeDasharray="4 4"
                      />
                      <text 
                        x="22" 
                        y={y + 3.5} 
                        textAnchor="end" 
                        fontSize="9"
                        fontWeight="600"
                        fill="#94a3b8" 
                        className="font-mono"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area Under Curve */}
                {largeFillPath && (
                  <path 
                    className="sparkline-fill-reveal"
                    d={largeFillPath} 
                    fill={`url(#large-grad-${activeChartModal})`} 
                  />
                )}

                {/* Trend Line Curve */}
                {largeStrokePath && (
                  <path 
                    className="sparkline-draw"
                    pathLength={1}
                    d={largeStrokePath} 
                    fill="none" 
                    stroke={largeTheme.stroke} 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                )}

                {/* Hover Vertical Guide Line */}
                {hoveredPointIndex !== null && (
                  <line
                    x1={largeCoords[hoveredPointIndex].x}
                    y1="20"
                    x2={largeCoords[hoveredPointIndex].x}
                    y2="170"
                    stroke={largeTheme.stroke}
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-50"
                  />
                )}

                {/* Dots on points */}
                {largeCoords.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPointIndex === idx ? "5" : "3.5"}
                    fill="#ffffff"
                    stroke={largeTheme.stroke}
                    strokeWidth={hoveredPointIndex === idx ? "3" : "2"}
                    className="transition-all duration-150"
                  />
                ))}

                {/* Invisible hover interceptors */}
                {largeCoords.map((pt, idx) => (
                  <circle
                    key={`hover-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="16"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                ))}

                {/* Dates under points */}
                {largeCoords.map((pt, idx) => {
                  const daysAgo = 6 - idx;
                  const dateLabel = getDayLabel(daysAgo, lang);
                  return (
                    <text 
                      key={idx} 
                      x={pt.x} 
                      y="190" 
                      textAnchor="middle" 
                      fontSize="9"
                      fontWeight="500"
                      fill="#94a3b8" 
                      className="font-sans"
                    >
                      {dateLabel}
                    </text>
                  );
                })}

                {/* Tooltip Overlay (SVG scaled) */}
                {hoveredPointIndex !== null && (
                  <g transform={`translate(${largeCoords[hoveredPointIndex].x}, ${largeCoords[hoveredPointIndex].y - 12})`}>
                    <rect
                      x="-55"
                      y="-36"
                      width="110"
                      height="30"
                      rx="6"
                      fill="#0f172a" 
                      stroke="#334155" 
                      strokeWidth="1"
                    />
                    <polygon
                      points="-4,-6 4,-6 0,-2"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <rect
                      x="-9"
                      y="-7"
                      width="18"
                      height="2"
                      fill="#0f172a"
                    />
                    <text
                      x="0"
                      y="-23"
                      textAnchor="middle"
                      fill="#94a3b8" 
                      fontSize="8"
                      fontWeight="500"
                      className="font-sans"
                    >
                      {getDayLabel(6 - hoveredPointIndex, lang)}
                    </text>
                    <text
                      x="0"
                      y="-12"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="700"
                      className="font-sans"
                    >
                      {largePoints[hoveredPointIndex]} {largeTheme.label}
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Quick overview metric */}
            <div className="mt-4 flex items-center justify-between text-xs border border-slate-100 bg-slate-50/20 p-3 rounded-xl font-medium">
              <span className="text-slate-400">{lang === 'id' ? 'Total Status Saat Ini' : 'Total in Status Currently'}</span>
              <span className="text-slate-800 font-bold font-mono">
                {getCount(activeChartModal)} {lang === 'id' ? 'Order' : 'Orders'}
              </span>
            </div>

            {/* Navigation and Close Buttons */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setActiveChartModal(null);
                  setHoveredPointIndex(null);
                }}
                className="group flex-1 py-2.5 border border-transparent bg-white hover:bg-slate-950 text-slate-600 hover:text-white rounded-xl font-semibold text-xs transition-all duration-500 cursor-pointer text-center shadow-xs"
              >
                <RollingText compact>{lang === 'id' ? 'Tutup' : 'Close'}</RollingText>
              </button>
              <button
                onClick={() => {
                  onNavigateToTab('orders', activeChartModal);
                  setActiveChartModal(null);
                  setHoveredPointIndex(null);
                }}
                className="group flex-[2] py-2.5 border border-transparent text-white hover:text-emerald-700 bg-emerald-600 hover:bg-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-500 shadow-sm shadow-emerald-600/10"
              >
                <RollingText compact>{lang === 'id' ? 'Lihat Log Detail' : 'View Detailed Logs'}</RollingText> <ArrowRight className="w-3.5 h-3.5 transition-transform duration-500 group-hover:translate-x-0.5" />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
