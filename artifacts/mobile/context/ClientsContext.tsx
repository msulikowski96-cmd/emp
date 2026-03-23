import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import React, { useCallback, useEffect, useState } from "react";
import type { Priority } from "@/context/RouteContext";

const STORAGE_KEY = "routeopt_clients_v1";
const ORDERS_KEY = "routeopt_orders_v1";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export type PaymentStatus = "ok" | "overdue" | "critical";

export interface Client {
  id: string;
  name: string;
  company?: string;
  address: string;
  phone?: string;
  email?: string;
  nip?: string;
  paymentDays: number;
  discount: number;
  creditLimit?: number;
  currentDebt?: number;
  notes?: string;
  priority: Priority;
  tags?: string[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

export type OrderStatus = "draft" | "confirmed" | "delivered" | "cancelled";

export interface ClientOrder {
  id: string;
  clientId: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes?: string;
  discount?: number;
}

const [ClientsProvider, useClientsContext] = createContextHook(() => {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [clientsStr, ordersStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ORDERS_KEY),
      ]);
      setClients(clientsStr ? JSON.parse(clientsStr) : []);
      setOrders(ordersStr ? JSON.parse(ordersStr) : []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const saveClients = async (updated: Client[]) => {
    setClients(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveOrders = async (updated: ClientOrder[]) => {
    setOrders(updated);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  };

  const addClient = useCallback(async (data: Omit<Client, "id" | "createdAt">) => {
    const client: Client = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await saveClients([...clients, client]);
    return client;
  }, [clients]);

  const updateClient = useCallback(async (id: string, data: Partial<Client>) => {
    await saveClients(clients.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, [clients]);

  const deleteClient = useCallback(async (id: string) => {
    await saveClients(clients.filter((c) => c.id !== id));
  }, [clients]);

  const addOrder = useCallback(async (data: Omit<ClientOrder, "id" | "date">) => {
    const order: ClientOrder = { ...data, id: generateId(), date: new Date().toISOString() };
    await saveOrders([...orders, order]);
    return order;
  }, [orders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    await saveOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }, [orders]);

  const getClientOrders = useCallback((clientId: string) => {
    return orders.filter((o) => o.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders]);

  const getPaymentStatus = useCallback((client: Client): PaymentStatus => {
    if (!client.currentDebt || client.currentDebt <= 0) return "ok";
    if (client.creditLimit && client.currentDebt >= client.creditLimit) return "critical";
    if (client.currentDebt > 0) return "overdue";
    return "ok";
  }, []);

  const totalRevenueThisMonth = React.useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return orders
      .filter((o) => o.date >= monthStart && o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const totalRevenueToday = React.useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return orders
      .filter((o) => o.date.startsWith(today) && o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  return {
    clients, orders, loading,
    addClient, updateClient, deleteClient,
    addOrder, updateOrderStatus, getClientOrders, getPaymentStatus,
    totalRevenueThisMonth, totalRevenueToday,
  };
});

export { ClientsProvider, useClientsContext };
