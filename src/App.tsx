import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { OrderFormView } from './components/OrderFormView';
import { CustomersView } from './components/CustomersView';
import { TemplatesView } from './components/TemplatesView';
import { LoginView } from './components/LoginView';
import { LandingPageView } from './components/LandingPageView';
import { PendingApprovalView } from './components/PendingApprovalView';
import { RollingText } from './components/RollingText';
import { CheckCircle, LayoutDashboard, LogOut, MessageSquare, PlusCircle, ShoppingCart, Users, X } from 'lucide-react';
import { useHashRouter } from './hooks/useHashRouter';
import type { Order, OrderStatus } from './types';
import { useAuthSession } from './hooks/useAuthSession';
import { signOut } from './services/authService';
import { copyInvoiceAndOpenWhatsApp, copyInvoiceText } from './lib/whatsapp';
import { getFriendlyErrorMessage } from './lib/errors';

type Toast = {
  id: string;
  title: string;
  message?: string;
  isExiting?: boolean;
};

type ChangeKind = 'create' | 'edit' | 'status';

interface ToastViewportProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ToastViewport = ({ toasts, onDismiss }: ToastViewportProps) => (
  <div className="fixed bottom-4 left-4 right-4 z-[60] flex flex-col items-center gap-2 sm:left-auto sm:right-5 sm:items-end">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={`${
          toast.isExiting ? 'toast-exit' : 'toast-enter'
        } w-full max-w-sm rounded-xl border border-emerald-200/70 bg-white px-4 py-3 shadow-lg shadow-slate-900/8 flex items-start gap-3`}
      >
        <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-900">{toast.title}</p>
          {toast.message && (
            <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{toast.message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

const PageLoadingScreen = () => (
  <div className="page-loading-screen fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-slate-100">
    <div className="page-loading-card flex flex-col items-center gap-4">
      <div className="relative h-12 w-12">
        <span className="page-loading-ring absolute inset-0 rounded-full border border-slate-300" />
        <span className="page-loading-dot absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">Loading</p>
        <div className="page-loading-bar h-1 w-28 overflow-hidden rounded-full bg-slate-200">
          <span className="block h-full rounded-full bg-slate-950" />
        </div>
      </div>
    </div>
  </div>
);

interface MobileAppShellProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  onCreateOrderClick: () => void;
  onLogoutClick: () => void;
  userName: string;
  lang: 'id' | 'en';
  onLangToggle: () => void;
  children: React.ReactNode;
}

const MobileAppShell = ({
  activeTab,
  onNavigate,
  onCreateOrderClick,
  onLogoutClick,
  userName,
  lang,
  onLangToggle,
  children,
}: MobileAppShellProps) => {
  const items = [
    { id: 'dashboard', label: lang === 'id' ? 'Home' : 'Home', icon: LayoutDashboard },
    { id: 'orders', label: lang === 'id' ? 'Order' : 'Orders', icon: ShoppingCart },
    { id: 'customers', label: lang === 'id' ? 'Pelanggan' : 'Customers', icon: Users },
    { id: 'templates', label: lang === 'id' ? 'Template' : 'Templates', icon: MessageSquare },
  ];

  return (
    <div className="lg:hidden flex h-screen w-screen flex-col overflow-hidden bg-slate-50">
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/Logo-warungify.png" alt="Warungify Logo" className="h-8 w-8 rounded-lg object-contain" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 leading-none">Warungify</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{userName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onLangToggle}
            className="px-1.5 py-0.5 rounded border border-slate-200 text-[9px] uppercase font-mono tracking-tight text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RollingText compact>{lang}</RollingText>
          </button>
          <button
            onClick={onCreateOrderClick}
            className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs"
            title="Create new order"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <button
            onClick={onLogoutClick}
            className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-400 flex items-center justify-center"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50">{children}</main>

      <nav className="h-16 shrink-0 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                isActive ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

function App() {
  useEffect(() => {
    document.title = 'Warungify - SaaS Workspace';
  }, []);

  const {
    user,
    profile,
    isAuthenticated,
    isApproved,
    isPasswordRecovery,
    clearPasswordRecovery,
    isAuthLoading,
    isProfileLoading,
    authError,
  } = useAuthSession();

  const {
    orders,
    customers,
    templates,
    isDataLoading,
    dataError,
    canImportLocalOrders,
    addOrder,
    updateOrder,
    deleteOrder,
    importLocalOrders,
    dismissLocalImport,
  } = useAppState(isApproved ? user : null);

  const { path, params, navigate } = useHashRouter();
  const isPasswordResetRoute = (path === 'login' && window.location.hash.includes('mode=reset')) || isPasswordRecovery;

  const [lang, setLang] = useState<'id' | 'en'>(() => {
    return (localStorage.getItem('warungify_lang') as 'id' | 'en') || 'id';
  });

  const handleSetLang = (newLang: 'id' | 'en') => {
    setLang(newLang);
    localStorage.setItem('warungify_lang', newLang);
  };

  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [localInvoiceHandledOrderIds, setLocalInvoiceHandledOrderIds] = useState<string[]>([]);
  const [isMobileViewport, setIsMobileViewport] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  ));
  const [pageLoadingRun, setPageLoadingRun] = useState(0);
  const pageLoadingActionTimerRef = useRef<number | null>(null);
  const pageLoadingEndTimerRef = useRef<number | null>(null);
  const previousPathRef = useRef(path);
  const loaderNavigationRef = useRef(false);

  const startPageLoading = useCallback((afterCover?: () => void) => {
    if (pageLoadingActionTimerRef.current) {
      window.clearTimeout(pageLoadingActionTimerRef.current);
    }
    if (pageLoadingEndTimerRef.current) {
      window.clearTimeout(pageLoadingEndTimerRef.current);
    }
    setPageLoadingRun((run) => run + 1);
    setIsPageLoading(true);
    pageLoadingActionTimerRef.current = window.setTimeout(() => {
      afterCover?.();
    }, 240);
    pageLoadingEndTimerRef.current = window.setTimeout(() => {
      setIsPageLoading(false);
    }, 920);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileViewport(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setLocalInvoiceHandledOrderIds([]);
      return;
    }

    const saved = localStorage.getItem(`warungify_invoice_handled_${user.id}`);
    setLocalInvoiceHandledOrderIds(saved ? JSON.parse(saved) as string[] : []);
  }, [user?.id]);

  const invoiceHandledOrderIds = useMemo(() => {
    const remoteHandled = orders
      .filter((order) => Boolean(order.invoiceSentAt))
      .map((order) => order.id);
    return Array.from(new Set([...remoteHandled, ...localInvoiceHandledOrderIds]));
  }, [localInvoiceHandledOrderIds, orders]);

  const markInvoiceHandled = useCallback(async (orderId: string) => {
    if (!user?.id) return;
    setLocalInvoiceHandledOrderIds((prev) => {
      const next = Array.from(new Set([...prev, orderId]));
      localStorage.setItem(`warungify_invoice_handled_${user.id}`, JSON.stringify(next));
      return next;
    });
    try {
      await updateOrder(orderId, { invoiceSentAt: new Date().toISOString() });
    } catch {
      // Local fallback keeps invoice reminders usable before the Supabase schema is migrated.
    }
  }, [updateOrder, user?.id]);

  const navigateWithLoading = useCallback((
    nextPath: string,
    nextParams?: { id?: string; status?: string },
  ) => {
    startPageLoading(() => {
      loaderNavigationRef.current = true;
      navigate(nextPath, nextParams);
    });
  }, [navigate, startPageLoading]);

  // Redirect authenticated users away from landing/login pages to dashboard
  useEffect(() => {
    if (!isLoggingOut && isAuthenticated && (path === 'landing' || (path === 'login' && !isPasswordResetRoute))) {
      startPageLoading(() => {
        loaderNavigationRef.current = true;
        navigate('dashboard');
      });
    }
  }, [isAuthenticated, isLoggingOut, isPasswordResetRoute, path, navigate, startPageLoading]);

  useEffect(() => {
    const publicPaths = new Set(['landing', 'login']);
    if (!isLoggingOut && !isAuthLoading && !isAuthenticated && !publicPaths.has(path)) {
      loaderNavigationRef.current = true;
      navigate('login');
    }
  }, [isAuthLoading, isAuthenticated, isLoggingOut, navigate, path]);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const didPathChange = previousPath !== path;
    const authShellPaths = new Set(['landing', 'login']);
    const isAuthShellBackForward =
      !isAuthenticated &&
      authShellPaths.has(previousPath) &&
      authShellPaths.has(path);

    if (didPathChange && isAuthShellBackForward) {
      if (loaderNavigationRef.current) {
        loaderNavigationRef.current = false;
      } else if (!isPageLoading) {
        startPageLoading();
      }
    } else if (didPathChange && loaderNavigationRef.current) {
      loaderNavigationRef.current = false;
    }

    previousPathRef.current = path;
  }, [isAuthenticated, isPageLoading, path, startPageLoading]);

  const activeTab = path.startsWith('orders') ? 'orders' : path;
  const ordersFilterStatus = params.status || 'all';
  const isAddingOrder = path === 'orders/new';
  const orderToEdit = (path === 'orders/edit' && params.id)
    ? (orders.find((o) => o.id === params.id) || null)
    : null;
  const displayName = (
    profile?.fullName?.trim()
      ? profile.fullName.trim()
      : typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user?.email?.split('@')[0]
  ) || 'Workspace User';
  const displayEmail = user?.email || 'Account active';

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastChangedOrder, setLastChangedOrder] = useState<{ id: string; kind: ChangeKind } | null>(null);
  const [savedStatusOrderId, setSavedStatusOrderId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const savedTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, isExiting: true } : toast))
    );
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 200); // matches the 0.2s duration of toast-exit animation
  }, []);

  const showToast = useCallback((title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, message }]);
    window.setTimeout(() => dismissToast(id), 2500);
  }, [dismissToast]);

  const markChangedOrder = useCallback((id: string, kind: ChangeKind) => {
    setLastChangedOrder({ id, kind });
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setLastChangedOrder(null);
    }, 1500);
  }, []);

  const markSavedStatus = useCallback((id: string) => {
    setSavedStatusOrderId(id);
    if (savedTimerRef.current) {
      window.clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = window.setTimeout(() => {
      setSavedStatusOrderId(null);
    }, 1500);
  }, []);

  const handleLoginSuccess = (email: string) => {
    showToast(lang === 'id' ? 'Login berhasil' : 'Login successful', lang === 'id' ? `Selamat datang kembali, ${email}!` : `Welcome back, ${email}!`);
    startPageLoading(() => {
      loaderNavigationRef.current = true;
      navigate('dashboard');
    });
  };

  const handleLogout = async () => {
    const confirmed = window.confirm(lang === 'id' ? 'Apakah Anda yakin ingin keluar dari workspace?' : 'Are you sure you want to log out of the workspace?');
    if (confirmed) {
      setIsLoggingOut(true);
      startPageLoading(() => {
        void signOut()
          .then(() => {
            showToast(lang === 'id' ? 'Logout berhasil' : 'Logout successful', lang === 'id' ? 'Sesi Anda telah diakhiri.' : 'Your session has been terminated.');
            loaderNavigationRef.current = true;
            navigate('landing');
          })
          .catch((error) => {
            showToast(lang === 'id' ? 'Logout gagal' : 'Logout failed', error instanceof Error ? error.message : (lang === 'id' ? 'Sesi belum bisa diakhiri.' : 'Could not terminate session.'));
          })
          .finally(() => {
            window.setTimeout(() => setIsLoggingOut(false), 300);
          });
      });
    }
  };

  // Switch tab & optionally pre-filter the orders table
  const handleNavigateToTab = (tab: string, filterStatus?: string) => {
    navigate(tab, filterStatus ? { status: filterStatus } : undefined);
  };

  const handleEditClick = (order: Order) => {
    navigate('orders/edit', { id: order.id });
  };

  const handleCreateOrderClick = () => {
    navigate('orders/new');
  };

  const handleSaveOrder = async (orderData: {
    customerName: string;
    whatsappNumber: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    notes: string;
    status: OrderStatus;
    trackingNumber?: string;
  }, options?: { invoiceAction?: 'copy' | 'send' }) => {
    try {
      let savedOrder: Order;
      if (orderToEdit) {
        const updated = await updateOrder(orderToEdit.id, orderData);
        savedOrder = updated;
        markChangedOrder(updated.id, 'edit');
        showToast(lang === 'id' ? 'Order diperbarui' : 'Order updated', lang === 'id' ? `Detail ${updated.orderNumber} disimpan.` : `${updated.orderNumber} details saved.`);
      } else {
        const newOrder = await addOrder(orderData);
        savedOrder = newOrder;
        markChangedOrder(newOrder.id, 'create');
        showToast(lang === 'id' ? 'Order dibuat' : 'Order created', lang === 'id' ? `${newOrder.orderNumber} berhasil ditambahkan.` : `${newOrder.orderNumber} has been added.`);
      }
      if (options?.invoiceAction && savedOrder.status === 'paid') {
        const invoiceOrders = [savedOrder, ...orders.filter((order) => order.id !== savedOrder.id)];
        if (options.invoiceAction === 'send') {
          const result = await copyInvoiceAndOpenWhatsApp(savedOrder, invoiceOrders);
          await markInvoiceHandled(savedOrder.id);
          showToast(
            result.copied 
              ? (lang === 'id' ? 'Invoice dikirim via WhatsApp' : 'Invoice sent via WhatsApp') 
              : (lang === 'id' ? 'Invoice siap ditempel' : 'Invoice ready to paste'),
            result.copied
              ? (lang === 'id' 
                ? `Invoice ${savedOrder.orderNumber} disalin. Tempel di chat WhatsApp yang baru terbuka.` 
                : `Invoice ${savedOrder.orderNumber} copied. Paste it in the WhatsApp chat that just opened.`)
              : (lang === 'id' 
                ? `Chat ${savedOrder.orderNumber} terbuka, tetapi akses clipboard diblokir. Salin invoice secara manual.` 
                : `Chat ${savedOrder.orderNumber} opened, but clipboard access was blocked. Copy the invoice manually.`),
          );
        } else {
          await copyInvoiceText(savedOrder, invoiceOrders);
          await markInvoiceHandled(savedOrder.id);
          showToast(
            lang === 'id' ? 'Teks invoice disalin' : 'Invoice text copied', 
            lang === 'id' ? `Invoice ${savedOrder.orderNumber} siap ditempel.` : `Invoice ${savedOrder.orderNumber} is ready to paste.`
          );
        }
      }
      navigate('orders');
    } catch (error) {
      showToast(lang === 'id' ? 'Gagal menyimpan' : 'Save failed', getFriendlyErrorMessage(error, lang === 'id' ? 'Gagal menyimpan order.' : 'Unable to save order.', lang));
    }
  };

  const handleCancelForm = () => {
    navigate('orders');
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const order = orders.find((item) => item.id === id);
      const deleted = await deleteOrder(id);
      if (deleted) {
        showToast(lang === 'id' ? 'Order dihapus' : 'Order deleted', lang === 'id' ? `${order?.orderNumber || id} dihapus dari log order.` : `${order?.orderNumber || id} removed from order logs.`);
      }
    } catch (error) {
      showToast(lang === 'id' ? 'Gagal menghapus' : 'Delete failed', getFriendlyErrorMessage(error, lang === 'id' ? 'Gagal menghapus order.' : 'Unable to delete order.', lang));
    }
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      const updated = await updateOrder(id, { status });
      markChangedOrder(id, 'status');
      markSavedStatus(id);
      const formattedStatus = status.replace('_', ' ');
      showToast(
        lang === 'id' ? 'Status diperbarui' : 'Status updated', 
        lang === 'id' ? `${updated.orderNumber} sekarang ${formattedStatus}.` : `${updated.orderNumber} is now ${formattedStatus}.`
      );
    } catch (error) {
      showToast(lang === 'id' ? 'Gagal memperbarui status' : 'Status failed', getFriendlyErrorMessage(error, lang === 'id' ? 'Gagal memperbarui status.' : 'Unable to update status.', lang));
    }
  };

  const handleTemplateCopied = (label: string) => {
    showToast(
      lang === 'id' ? 'Template disalin' : 'Template copied', 
      lang === 'id' ? `${label} siap ditempel.` : `${label} is ready to paste.`
    );
  };

  const handleWhatsAppCopied = (orderId: string) => {
    showToast(
      lang === 'id' ? 'Pesan WhatsApp disalin' : 'WhatsApp message copied', 
      lang === 'id' ? `Pesan ${orderId} disalin dan chat dibuka.` : `${orderId} message copied and chat opened.`
    );
  };

  const handleInvoiceCopied = (orderNumber: string, action: 'copy' | 'send', copied: boolean) => {
    const order = orders.find((item) => item.orderNumber === orderNumber);
    if (order) {
      void markInvoiceHandled(order.id);
    }

    showToast(
      action === 'send'
        ? (copied 
          ? (lang === 'id' ? 'Invoice dikirim via WhatsApp' : 'Invoice sent via WhatsApp') 
          : (lang === 'id' ? 'Invoice siap ditempel' : 'Invoice ready to paste'))
        : (lang === 'id' ? 'Teks invoice disalin' : 'Invoice text copied'),
      action === 'send'
        ? (copied
          ? (lang === 'id' 
            ? `Invoice ${orderNumber} disalin. Tempel di chat WhatsApp yang baru terbuka.` 
            : `Invoice ${orderNumber} copied. Paste it in the WhatsApp chat that just opened.`)
          : (lang === 'id' 
            ? `Chat ${orderNumber} terbuka, tetapi akses clipboard diblokir. Salin invoice secara manual.` 
            : `Chat ${orderNumber} opened, but clipboard access was blocked. Copy the invoice manually.`))
        : (lang === 'id' ? `Invoice ${orderNumber} siap ditempel.` : `Invoice ${orderNumber} is ready to paste.`),
    );
  };

  const handleImportLocalOrders = async () => {
    try {
      const imported = await importLocalOrders();
      showToast(
        lang === 'id' ? 'Order lokal diimpor' : 'Local orders imported', 
        lang === 'id' ? `${imported.length} order dipindahkan ke Supabase.` : `${imported.length} orders moved to Supabase.`
      );
    } catch (error) {
      showToast(lang === 'id' ? 'Gagal mengimpor' : 'Import failed', getFriendlyErrorMessage(error, lang === 'id' ? 'Gagal mengimpor order lokal.' : 'Unable to import local orders.', lang));
    }
  };

  // Render main screen view based on active tab & form overlays
  const renderView = () => {
    if (isAddingOrder || orderToEdit) {
      return (
        <OrderFormView
          orderToEdit={orderToEdit}
          orders={orders}
          onSave={handleSaveOrder}
          onCancel={handleCancelForm}
          onFormatCopied={() => handleTemplateCopied('Blank order format')}
          lang={lang}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            orders={orders}
            onNavigateToTab={handleNavigateToTab}
            onEditOrder={handleEditClick}
            invoiceHandledOrderIds={invoiceHandledOrderIds}
            lastChangedOrder={lastChangedOrder}
            lang={lang}
          />
        );
      case 'orders':
        return (
          <OrdersView
            orders={orders}
            templates={templates}
            initialFilterStatus={ordersFilterStatus}
            onFilterStatusChange={(status) => navigate('orders', { status })}
            lastChangedOrder={lastChangedOrder}
            savedStatusOrderId={savedStatusOrderId}
            onAddOrderClick={handleCreateOrderClick}
            onEditOrderClick={handleEditClick}
            onDeleteOrder={handleDeleteOrder}
            onUpdateStatus={handleUpdateStatus}
            onWhatsAppCopied={handleWhatsAppCopied}
            onInvoiceCopied={handleInvoiceCopied}
            lang={lang}
          />
        );
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            orders={orders}
            lang={lang}
          />
        );
      case 'templates':
        return (
          <TemplatesView
            templates={templates}
            onTemplateCopied={handleTemplateCopied}
            lang={lang}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-400">
            Screen not found.
          </div>
        );
    }
  };

  const betaApplicationUrl = import.meta.env.VITE_BETA_APPLICATION_URL as string | undefined;
  const openBetaApplication = () => {
    if (betaApplicationUrl) {
      window.open(betaApplicationUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    showToast(
      lang === 'id' ? 'Form beta belum diatur' : 'Beta form not set', 
      lang === 'id' ? 'Isi VITE_BETA_APPLICATION_URL untuk membuka pendaftaran beta.' : 'Fill VITE_BETA_APPLICATION_URL to open beta registration.'
    );
    navigateWithLoading('login');
  };

  if (isAuthLoading || isProfileLoading) {
    return <PageLoadingScreen />;
  }

  const shouldShowPublicShell = !isAuthenticated || isPasswordResetRoute || isLoggingOut;

  const appContent = shouldShowPublicShell ? (
    path === 'login' ? (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onPasswordResetComplete={clearPasswordRecovery}
        onBackToLanding={() => navigateWithLoading('landing')}
        lang={lang}
        setLang={handleSetLang}
      />
    ) : (
      <LandingPageView
        onGetStartedClick={openBetaApplication}
        onLoginClick={() => navigateWithLoading('login')}
        lang={lang}
        setLang={handleSetLang}
      />
    )
  ) : !isApproved ? (
    <PendingApprovalView
      profile={profile}
      userEmail={displayEmail}
      onLogout={handleLogout}
      lang={lang}
    />
  ) : (
    <div className="h-screen w-screen overflow-hidden bg-slate-50">
      {isMobileViewport ? (
        <MobileAppShell
          activeTab={activeTab}
          onNavigate={(tab) => navigate(tab)}
          onCreateOrderClick={handleCreateOrderClick}
          onLogoutClick={handleLogout}
          userName={displayName}
          lang={lang}
          onLangToggle={() => handleSetLang(lang === 'id' ? 'en' : 'id')}
        >
          {renderView()}
        </MobileAppShell>
      ) : (
        <div className="flex h-full w-full overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => navigate(tab)}
          onCreateOrderClick={handleCreateOrderClick}
          onLogoutClick={handleLogout}
          userName={displayName}
          userEmail={displayEmail}
          lang={lang}
          setLang={handleSetLang}
        />
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">{renderView()}</main>
        </div>
      )}
      {(isDataLoading || dataError || authError || canImportLocalOrders) && (
        <div className="fixed left-4 right-4 top-16 z-40 flex flex-col gap-2 lg:left-72 lg:right-6 lg:top-4">
          {isDataLoading && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 shadow-lg shadow-slate-900/5">
              {lang === 'id' ? 'Memuat database workspace...' : 'Loading workspace database...'}
            </div>
          )}
          {(dataError || authError) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 shadow-lg shadow-slate-900/5">
              {dataError || authError}
            </div>
          )}
          {canImportLocalOrders && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg shadow-slate-900/5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  {lang === 'id' ? 'Impor order lokal?' : 'Import local orders?'}
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {lang === 'id' 
                    ? 'Kami menemukan data lama di browser ini. Pindahkan ke database Supabase akun ini.' 
                    : 'We found old data on this browser. Move it to this account\'s Supabase database.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={dismissLocalImport} className="px-3 py-1.5 rounded-lg bg-white text-[11px] font-bold text-emerald-700 cursor-pointer">
                  {lang === 'id' ? 'Lewati' : 'Skip'}
                </button>
                <button type="button" onClick={handleImportLocalOrders} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-[11px] font-bold text-white cursor-pointer">
                  {lang === 'id' ? 'Impor' : 'Import'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {appContent}
      {isPageLoading && <PageLoadingScreen key={pageLoadingRun} />}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default App;
