import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import React, { useCallback, useEffect, useState } from "react";

export type VisitStatus = "planned" | "active" | "visited";

export interface RouteStop {
  id: string;
  name: string;
  address: string;
  note?: string;
  status: VisitStatus;
  order: number;
  lat?: number;
  lng?: number;
  visitedAt?: string;
  estimatedMinutes?: number;
}

export interface DayRoute {
  id: string;
  date: string;
  stops: RouteStop[];
  totalKm?: number;
  totalMinutes?: number;
  isOptimized: boolean;
  startAddress?: string;
}

const STORAGE_KEY = "routeopt_routes";
const TODAY_KEY = "routeopt_today";

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

  const first = unvisited.shift()!;
  route.push(first);

  while (unvisited.length > 0) {
    const current = route[route.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;

    unvisited.forEach((stop, idx) => {
      if (current.lat && current.lng && stop.lat && stop.lng) {
        const dist = Math.sqrt(
          Math.pow(current.lat - stop.lat, 2) +
            Math.pow(current.lng - stop.lng, 2)
        );
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      } else {
        if (idx < nearestIdx || nearestDist === Infinity) {
          nearestIdx = idx;
          nearestDist = idx;
        }
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [routesStr, todayId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(TODAY_KEY),
      ]);

      const allRoutes: DayRoute[] = routesStr ? JSON.parse(routesStr) : [];
      setRoutes(allRoutes);

      const today = getTodayString();
      let todayR = allRoutes.find((r) => r.date === today);

      if (!todayR) {
        todayR = {
          id: generateId(),
          date: today,
          stops: [],
          isOptimized: false,
        };
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
    const todayR = updated.find((r) => r.date === today) ?? null;
    setTodayRoute(todayR);
  };

  const addStop = useCallback(
    async (stop: Omit<RouteStop, "id" | "order" | "status">) => {
      if (!todayRoute) return;

      const newStop: RouteStop = {
        ...stop,
        id: generateId(),
        order: todayRoute.stops.length,
        status: "planned",
      };

      const updatedRoute = {
        ...todayRoute,
        stops: [...todayRoute.stops, newStop],
        isOptimized: false,
      };

      const updated = routes.map((r) =>
        r.id === todayRoute.id ? updatedRoute : r
      );
      await saveRoutes(updated);
    },
    [todayRoute, routes]
  );

  const removeStop = useCallback(
    async (stopId: string) => {
      if (!todayRoute) return;

      const updatedStops = todayRoute.stops
        .filter((s) => s.id !== stopId)
        .map((s, idx) => ({ ...s, order: idx }));

      const updatedRoute = { ...todayRoute, stops: updatedStops };
      const updated = routes.map((r) =>
        r.id === todayRoute.id ? updatedRoute : r
      );
      await saveRoutes(updated);
    },
    [todayRoute, routes]
  );

  const updateStopStatus = useCallback(
    async (stopId: string, status: VisitStatus) => {
      if (!todayRoute) return;

      const updatedStops = todayRoute.stops.map((s) =>
        s.id === stopId
          ? {
              ...s,
              status,
              visitedAt:
                status === "visited" ? new Date().toISOString() : s.visitedAt,
            }
          : s
      );

      const updatedRoute = { ...todayRoute, stops: updatedStops };
      const updated = routes.map((r) =>
        r.id === todayRoute.id ? updatedRoute : r
      );
      await saveRoutes(updated);
    },
    [todayRoute, routes]
  );

  const optimizeRoute = useCallback(async () => {
    if (!todayRoute || todayRoute.stops.length < 2) return;

    const planned = todayRoute.stops.filter((s) => s.status !== "visited");
    const visited = todayRoute.stops.filter((s) => s.status === "visited");

    const optimized = nearestNeighborTSP(planned);
    const allStops = [
      ...visited,
      ...optimized.map((s, idx) => ({ ...s, order: visited.length + idx })),
    ];

    const updatedRoute = { ...todayRoute, stops: allStops, isOptimized: true };
    const updated = routes.map((r) =>
      r.id === todayRoute.id ? updatedRoute : r
    );
    await saveRoutes(updated);
  }, [todayRoute, routes]);

  const reorderStops = useCallback(
    async (reordered: RouteStop[]) => {
      if (!todayRoute) return;

      const withOrder = reordered.map((s, idx) => ({ ...s, order: idx }));
      const updatedRoute = { ...todayRoute, stops: withOrder };
      const updated = routes.map((r) =>
        r.id === todayRoute.id ? updatedRoute : r
      );
      await saveRoutes(updated);
    },
    [todayRoute, routes]
  );

  const updateStop = useCallback(
    async (stopId: string, data: Partial<RouteStop>) => {
      if (!todayRoute) return;

      const updatedStops = todayRoute.stops.map((s) =>
        s.id === stopId ? { ...s, ...data } : s
      );
      const updatedRoute = { ...todayRoute, stops: updatedStops };
      const updated = routes.map((r) =>
        r.id === todayRoute.id ? updatedRoute : r
      );
      await saveRoutes(updated);
    },
    [todayRoute, routes]
  );

  const clearTodayRoute = useCallback(async () => {
    if (!todayRoute) return;
    const updatedRoute = { ...todayRoute, stops: [], isOptimized: false };
    const updated = routes.map((r) =>
      r.id === todayRoute.id ? updatedRoute : r
    );
    await saveRoutes(updated);
  }, [todayRoute, routes]);

  const stats = React.useMemo(() => {
    if (!todayRoute)
      return { total: 0, visited: 0, planned: 0, active: 0, visitedPct: 0 };
    const total = todayRoute.stops.length;
    const visited = todayRoute.stops.filter(
      (s) => s.status === "visited"
    ).length;
    const active = todayRoute.stops.filter((s) => s.status === "active").length;
    const planned = total - visited - active;
    const visitedPct = total > 0 ? Math.round((visited / total) * 100) : 0;
    return { total, visited, planned, active, visitedPct };
  }, [todayRoute]);

  return {
    routes,
    todayRoute,
    loading,
    stats,
    addStop,
    removeStop,
    updateStopStatus,
    optimizeRoute,
    reorderStops,
    updateStop,
    clearTodayRoute,
  };
});

export { RouteProvider, useRouteContext };
