import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import React, { useCallback, useEffect, useState } from "react";

export type VisitStatus = "planned" | "active" | "visited";
export type Priority = "high" | "medium" | "low";

export interface RouteStop {
  id: string;
  clientId?: string;
  name: string;
  address: string;
  phone?: string;
  note?: string;
  priority: Priority;
  status: VisitStatus;
  order: number;
  lat?: number;
  lng?: number;
  visitedAt?: string;
  estimatedMinutes?: number;
  visitNote?: string;
  orderValue?: string;
}

export interface DayRoute {
  id: string;
  date: string;
  stops: RouteStop[];
  isOptimized: boolean;
}

const STORAGE_KEY = "routeopt_routes_v2";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function nearestNeighborTSP(stops: RouteStop[]): RouteStop[] {
  if (stops.length <= 1) return stops;
  const unvisited = [...stops];
  const route: RouteStop[] = [];
  route.push(unvisited.shift()!);
  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    unvisited.forEach((stop, idx) => {
      if (current.lat && current.lng && stop.lat && stop.lng) {
        const dist = Math.sqrt(
          Math.pow(current.lat - stop.lat, 2) + Math.pow(current.lng - stop.lng, 2)
        );
        if (dist < nearestDist) { nearestDist = dist; nearestIdx = idx; }
      } else if (nearestDist === Infinity) {
        nearestIdx = idx; nearestDist = 0;
      }
    });
    route.push(unvisited[nearestIdx]);
    unvisited.splice(nearestIdx, 1);
  }
  return route.map((stop, idx) => ({ ...stop, order: idx }));
}

const [RouteProvider, useRouteContext] = createContextHook(() => {
  const [routes, setRoutes] = useState<DayRoute[]>([]);
  const [todayRoute, setTodayRoute] = useState<DayRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const routesStr = await AsyncStorage.getItem(STORAGE_KEY);
      const allRoutes: DayRoute[] = routesStr ? JSON.parse(routesStr) : [];
      setRoutes(allRoutes);
      const today = getTodayString();
      let todayR = allRoutes.find((r) => r.date === today);
      if (!todayR) {
        todayR = { id: generateId(), date: today, stops: [], isOptimized: false };
        const updated = [...allRoutes, todayR];
        setRoutes(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      setTodayRoute(todayR);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const saveRoutes = async (updated: DayRoute[]) => {
    setRoutes(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const today = getTodayString();
    setTodayRoute(updated.find((r) => r.date === today) ?? null);
  };

  const addStop = useCallback(
    async (stop: Omit<RouteStop, "id" | "order" | "status">) => {
      if (!todayRoute) return;
      const newStop: RouteStop = { ...stop, id: generateId(), order: todayRoute.stops.length, status: "planned" };
      const updatedRoute = { ...todayRoute, stops: [...todayRoute.stops, newStop], isOptimized: false };
      await saveRoutes(routes.map((r) => (r.id === todayRoute.id ? updatedRoute : r)));
    },
    [todayRoute, routes]
  );

  const removeStop = useCallback(
    async (stopId: string) => {
      if (!todayRoute) return;
      const updatedStops = todayRoute.stops.filter((s) => s.id !== stopId).map((s, idx) => ({ ...s, order: idx }));
      await saveRoutes(routes.map((r) => (r.id === todayRoute.id ? { ...todayRoute, stops: updatedStops } : r)));
    },
    [todayRoute, routes]
  );

  const updateStopStatus = useCallback(
    async (stopId: string, status: VisitStatus) => {
      if (!todayRoute) return;
      const updatedStops = todayRoute.stops.map((s) =>
        s.id === stopId
          ? { ...s, status, visitedAt: status === "visited" ? new Date().toISOString() : s.visitedAt }
          : s
      );
      await saveRoutes(routes.map((r) => (r.id === todayRoute.id ? { ...todayRoute, stops: updatedStops } : r)));
    },
    [todayRoute, routes]
  );

  const markVisitedWithReport = useCallback(
    async (stopId: string, visitNote: string, orderValue?: string) => {
      if (!todayRoute) return;
      const updatedStops = todayRoute.stops.map((s) =>
        s.id === stopId
          ? { ...s, status: "visited" as VisitStatus, visitedAt: new Date().toISOString(), visitNote: visitNote.trim() || undefined, orderValue: orderValue?.trim() || undefined }
          : s
      );
      await saveRoutes(routes.map((r) => (r.id === todayRoute.id ? { ...todayRoute, stops: updatedStops } : r)));
    },
    [todayRoute, routes]
  );

  const optimizeRoute = useCallback(async () => {
    if (!todayRoute || todayRoute.stops.length < 2) return;
    const planned = todayRoute.stops.filter((s) => s.status !== "visited");
    const visited = todayRoute.stops.filter((s) => s.status === "visited");
    const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    const sortedByPriority = [...planned].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    const optimized = nearestNeighborTSP(sortedByPriority);
    const allStops = [...visited, ...optimized.map((s, idx) => ({ ...s, order: visited.length + idx }))];
    await saveRoutes(routes.map((r) => (r.id === todayRoute.id ? { ...todayRoute, stops: allStops, isOptimized: true } : r)));
  }, [todayRoute, routes]);

  const updateStop = useCallback(
    async (stopId: string, data: Partial<RouteStop>) => {
      if (!todayRoute) return;
      const updatedStops = todayRoute.stops.map((s) => (s.id === stopId ? { ...s, ...data } : s));
      await saveRoutes(routes.map((r) => (r.id === todayRoute.id ? { ...todayRoute, stops: updatedStops } : r)));
    },
    [todayRoute, routes]
  );

  const clearTodayRoute = useCallback(async () => {
    if (!todayRoute) return;
    await saveRoutes(routes.map((r) => (r.id === todayRoute.id ? { ...todayRoute, stops: [], isOptimized: false } : r)));
  }, [todayRoute, routes]);

  const nextStop = React.useMemo(() => {
    if (!todayRoute) return null;
    const active = todayRoute.stops.find((s) => s.status === "active");
    if (active) return active;
    return [...todayRoute.stops]
      .filter((s) => s.status === "planned")
      .sort((a, b) => a.order - b.order)[0] ?? null;
  }, [todayRoute]);

  const stats = React.useMemo(() => {
    if (!todayRoute) return { total: 0, visited: 0, planned: 0, active: 0, visitedPct: 0 };
    const total = todayRoute.stops.length;
    const visited = todayRoute.stops.filter((s) => s.status === "visited").length;
    const active = todayRoute.stops.filter((s) => s.status === "active").length;
    const planned = total - visited - active;
    const visitedPct = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { total, visited, planned, active, visitedPct };
  }, [todayRoute]);

  return {
    routes, todayRoute, loading, stats, nextStop,
    addStop, removeStop, updateStopStatus, markVisitedWithReport,
    optimizeRoute, updateStop, clearTodayRoute,
  };
});

export { RouteProvider, useRouteContext };
