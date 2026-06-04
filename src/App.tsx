import { useCallback, useRef, useState, useEffect } from 'react';
import { useAppState } from './hooks/useAppState';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { OrderFormView } from './components/OrderFormView';
import { CustomersView } from './components/CustomersView';
import { TemplatesView } from './components/TemplatesView';
import { LoginView } from './components/LoginView';
import { LandingPageView } from './components/LandingPageView';
import { CheckCircle, X } from 'lucide-react';
import { useHashRouter } from './hooks/useHashRouter';
import type { Order, OrderStatus } from './types';
import { useAuthSession } from './hooks/useAuthSession';
import { signOut } from './services/authService';

type Toast = {
  id: string;
  title: string;
  message?: string;
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
        className="toast-enter w-full max-w-sm rounded-xl border border-emerald-200/70 bg-white px-4 py-3 shadow-lg shadow-slate-900/8 flex items-start gap-3"
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

function App() {
  const {
    user,
    isAuthenticated,
    isPasswordRecovery,
    clearPasswordRecovery,
    isAuthLoading,
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
  } = useAppState(user);

  const { path, params, navigate } = useHashRouter();
  const isPasswordResetRoute = (path === 'login' && window.location.hash.includes('mode=reset')) || isPasswordRecovery;

  const [isPageLoading, setIsPageLoading] = useState(false);
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
    if (isAuthenticated && (path === 'landing' || (path === 'login' && !isPasswordResetRoute))) {
      startPageLoading(() => {
        loaderNavigationRef.current = true;
        navigate('dashboard');
      });
    }
  }, [isAuthenticated, isPasswordResetRoute, path, navigate, startPageLoading]);

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

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastChangedOrder, setLastChangedOrder] = useState<{ id: string; kind: ChangeKind } | null>(null);
  const [savedStatusOrderId, setSavedStatusOrderId] = useState<string | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const savedTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
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
    showToast('Login berhasil', `Selamat datang kembali, ${email}!`);
    startPageLoading(() => {
      loaderNavigationRef.current = true;
      navigate('dashboard');
    });
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar dari workspace?');
    if (confirmed) {
      startPageLoading(() => {
        void signOut().finally(() => {
          showToast('Logout berhasil', 'Sesi Anda telah diakhiri.');
          loaderNavigationRef.current = true;
          navigate('landing');
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
  }) => {
    try {
      if (orderToEdit) {
        const updated = await updateOrder(orderToEdit.id, orderData);
        markChangedOrder(updated.id, 'edit');
        showToast('Order updated', `${updated.orderNumber} details saved.`);
      } else {
        const newOrder = await addOrder(orderData);
        markChangedOrder(newOrder.id, 'create');
        showToast('Order created', `${newOrder.orderNumber} has been added.`);
      }
      navigate('orders');
    } catch (error) {
      showToast('Save failed', error instanceof Error ? error.message : 'Unable to save order.');
    }
  };

  const handleCancelForm = () => {
    navigate('orders');
  };

  const handleDeleteOrder = async (id: string) => {
    const order = orders.find((item) => item.id === id);
    const deleted = await deleteOrder(id);
    if (deleted) {
      showToast('Order deleted', `${order?.orderNumber || id} removed from order logs.`);
    }
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    try {
      const updated = await updateOrder(id, { status });
      markChangedOrder(id, 'status');
      markSavedStatus(id);
      showToast('Status updated', `${updated.orderNumber} is now ${status.replace('_', ' ')}.`);
    } catch (error) {
      showToast('Status failed', error instanceof Error ? error.message : 'Unable to update status.');
    }
  };

  const handleTemplateCopied = (label: string) => {
    showToast('Template copied', `${label} is ready to paste.`);
  };

  const handleWhatsAppCopied = (orderId: string) => {
    showToast('WhatsApp message copied', `${orderId} message copied and chat opened.`);
  };

  const handleImportLocalOrders = async () => {
    try {
      const imported = await importLocalOrders();
      showToast('Local orders imported', `${imported.length} orders moved to Supabase.`);
    } catch (error) {
      showToast('Import failed', error instanceof Error ? error.message : 'Unable to import local orders.');
    }
  };

  // Render main screen view based on active tab & form overlays
  const renderView = () => {
    if (isAddingOrder || orderToEdit) {
      return (
        <OrderFormView
          orderToEdit={orderToEdit}
          onSave={handleSaveOrder}
          onCancel={handleCancelForm}
          onFormatCopied={() => handleTemplateCopied('Blank order format')}
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
            lastChangedOrder={lastChangedOrder}
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
          />
        );
      case 'customers':
        return (
          <CustomersView
            customers={customers}
            orders={orders}
          />
        );
      case 'templates':
        return (
          <TemplatesView
            templates={templates}
            onTemplateCopied={handleTemplateCopied}
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

  if (isAuthLoading) {
    return <PageLoadingScreen />;
  }

  const appContent = (!isAuthenticated || isPasswordResetRoute) ? (
    path === 'login' ? (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onPasswordResetComplete={clearPasswordRecovery}
        onBackToLanding={() => navigateWithLoading('landing')}
      />
    ) : (
      <LandingPageView onGetStartedClick={() => navigateWithLoading('login')} />
    )
  ) : (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => navigate(tab)}
        onCreateOrderClick={handleCreateOrderClick}
        onLogoutClick={handleLogout}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">{renderView()}</main>
      {(isDataLoading || dataError || authError || canImportLocalOrders) && (
        <div className="fixed left-72 right-6 top-4 z-40 flex flex-col gap-2">
          {isDataLoading && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-500 shadow-lg shadow-slate-900/5">
              Loading workspace database...
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
                <p className="text-xs font-bold text-emerald-900">Import local orders?</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">Kami menemukan data lama di browser ini. Pindahkan ke database Supabase akun ini.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={dismissLocalImport} className="px-3 py-1.5 rounded-lg bg-white text-[11px] font-bold text-emerald-700 cursor-pointer">
                  Skip
                </button>
                <button type="button" onClick={handleImportLocalOrders} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-[11px] font-bold text-white cursor-pointer">
                  Import
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
