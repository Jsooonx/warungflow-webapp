import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Customer, Order, OrderStatus, Template } from '../types';
import { supabase, requireSupabaseConfig, isSupabaseConfigured } from '../lib/supabaseClient';
import { createOrder, deleteOrderById, fetchOrders, importOrders, updateOrderById } from '../services/orderService';
import { PREDEFINED_TEMPLATES, seedTemplatesIfEmpty } from '../services/templateService';

const STORAGE_KEY_ORDERS = 'warungify_orders';
const LEGACY_STORAGE_KEY_ORDERS = 'wa_order_manager_orders';
const getImportFlagKey = (userId: string) => `warungify_imported_${userId}`;
const getLegacyImportFlagKey = (userId: string) => `wa_order_manager_imported_${userId}`;

const getSavedLocalOrders = () => (
  localStorage.getItem(STORAGE_KEY_ORDERS) || localStorage.getItem(LEGACY_STORAGE_KEY_ORDERS)
);

type OrderDraft = Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>;

const normalizeLocalOrder = (order: Order): Order => ({
  ...order,
  orderNumber: order.orderNumber || order.id,
});

const makeOrderNumber = (orders: Order[]) => {
  const nextIdNumber = orders.reduce((max, order) => {
    const source = order.orderNumber || order.id;
    const num = parseInt(source.replace('ORD-', ''), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0) + 1;

  return `ORD-${String(nextIdNumber).padStart(3, '0')}`;
};

const collateCustomers = (orders: Order[]) => {
  const customerMap = new Map<string, {
    name: string;
    whatsappNumber: string;
    totalOrders: number;
    totalSpending: number;
    lastOrderDate: string;
  }>();

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  sortedOrders.forEach((order) => {
    const cleanPhone = order.whatsappNumber.trim();
    if (!cleanPhone) return;

    const existing = customerMap.get(cleanPhone);
    const isCancelled = order.status === 'cancelled';
    const orderPrice = isCancelled ? 0 : order.totalPrice;

    if (existing) {
      existing.name = order.customerName;
      existing.totalOrders += 1;
      existing.totalSpending += orderPrice;
      if (new Date(order.createdAt).getTime() > new Date(existing.lastOrderDate).getTime()) {
        existing.lastOrderDate = order.createdAt;
      }
    } else {
      customerMap.set(cleanPhone, {
        name: order.customerName,
        whatsappNumber: cleanPhone,
        totalOrders: 1,
        totalSpending: orderPrice,
        lastOrderDate: order.createdAt,
      });
    }
  });

  return Array.from(customerMap.values()).map((customer, index): Customer => ({
    id: `CUST-${String(index + 1).padStart(3, '0')}`,
    ...customer,
  }));
};

export const useAppState = (user: User | null) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [canImportLocalOrders, setCanImportLocalOrders] = useState(false);

  const customers = useMemo(() => collateCustomers(orders), [orders]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setTemplates([]);
      setCanImportLocalOrders(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setDataError('Supabase env belum dikonfigurasi. Isi .env dari .env.example.');
      setOrders([]);
      setTemplates(PREDEFINED_TEMPLATES.map((template) => ({ ...template, id: template.type })));
      return;
    }

    setIsDataLoading(true);
    setDataError(null);
    try {
      const [remoteOrders, remoteTemplates] = await Promise.all([
        fetchOrders(),
        seedTemplatesIfEmpty(user.id),
      ]);
      setOrders(remoteOrders);
      setTemplates(remoteTemplates);

      const localOrders = getSavedLocalOrders();
      const importedFlag =
        localStorage.getItem(getImportFlagKey(user.id)) ||
        localStorage.getItem(getLegacyImportFlagKey(user.id));
      setCanImportLocalOrders(Boolean(localOrders && !importedFlag && remoteOrders.length === 0));
    } catch (error) {
      setDataError(error instanceof Error ? error.message : 'Failed to load Supabase data.');
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const addOrder = useCallback(async (orderData: OrderDraft) => {
    if (!user) throw new Error('Login required before creating orders.');
    const orderNumber = makeOrderNumber(orders);
    const newOrder = await createOrder(user.id, orderNumber, orderData);
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, [orders, user]);

  const updateOrder = useCallback(async (id: string, updatedFields: Partial<OrderDraft>) => {
    const updatedOrder = await updateOrderById(id, updatedFields);
    setOrders((prev) => prev.map((order) => (order.id === id ? updatedOrder : order)));
    return updatedOrder;
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    const order = orders.find((item) => item.id === id);
    const confirmed = window.confirm(`Are you sure you want to delete order ${order?.orderNumber || id}?`);
    if (!confirmed) return false;
    await deleteOrderById(id);
    setOrders((prev) => prev.filter((item) => item.id !== id));
    return true;
  }, [orders]);

  const importLocalOrders = useCallback(async () => {
    if (!user) throw new Error('Login required before importing orders.');
    requireSupabaseConfig();
    const saved = getSavedLocalOrders();
    if (!saved) return [];

    const parsed = JSON.parse(saved) as Order[];
    const normalized = parsed.map(normalizeLocalOrder);
    const imported = await importOrders(user.id, normalized);
    localStorage.setItem(getImportFlagKey(user.id), 'true');
    setCanImportLocalOrders(false);
    setOrders((prev) => [...imported, ...prev].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ));

    await supabase.from('profiles').update({ local_orders_imported: true }).eq('id', user.id);
    return imported;
  }, [user]);

  const dismissLocalImport = useCallback(() => {
    if (!user) return;
    localStorage.setItem(getImportFlagKey(user.id), 'declined');
    setCanImportLocalOrders(false);
  }, [user]);

  const getStatusCount = useCallback((status: OrderStatus) => {
    return orders.filter((order) => order.status === status).length;
  }, [orders]);

  return {
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
    refreshData,
    getStatusCount,
  };
};

export type AppState = ReturnType<typeof useAppState>;
