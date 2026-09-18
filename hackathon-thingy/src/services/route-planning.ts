import type { MapPlace } from "@/constants/map-places";
import type { PlanActivity, PlanDetails } from "./trip-planner";

export type RouteData = {
  coordinates: number[][];
  distanceKm: number;
  minutes: number;
};
export type RouteStop = PlanActivity & {
  kind: "fuel" | "food" | "scenic" | "culture";
  routeKm: number;
  openingHours?: string;
  cuisine?: string;
  website?: string;
  wheelchair?: string;
  osmUrl?: string;
};
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
async function request(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok)
      throw new Error("The route service is unavailable. Please try again.");
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
export async function drivingRoute(places: MapPlace[]): Promise<RouteData> {
  const points = places.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const data = await request(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${points}?geometries=geojson&overview=full&access_token=${encodeURIComponent(token)}`,
  );
  const route = data.routes?.[0];
  if (!route)
    throw new Error("No driving route found between these locations.");
  return {
    coordinates: route.geometry.coordinates,
    distanceKm: route.distance / 1000,
    minutes: route.duration / 60,
  };
}
// Project onto route segments, rather than a start/destination bounding box.
export function routePosition(
  route: RouteData,
  longitude: number,
  latitude: number,
) {
  const scale = Math.cos((latitude * Math.PI) / 180);
  const xy = (p: number[]) => [p[0] * 111.32 * scale, p[1] * 111.32];
  const point = xy([longitude, latitude]);
  let best = Infinity,
    along = 0,
    total = 0;
  for (let i = 1; i < route.coordinates.length; i++) {
    const a = xy(route.coordinates[i - 1]),
      b = xy(route.coordinates[i]);
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy);
    const t = len
      ? Math.max(
          0,
          Math.min(
            1,
            ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (len * len),
          ),
        )
      : 0;
    const d = Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
    if (d < best) {
      best = d;
      along = total + t * len;
    }
    total += len;
  }
  return {
    offsetKm: best,
    routeKm: total ? (along / total) * route.distanceKm : 0,
  };
}
const placeCache = new Map<string, RouteStop[]>();
export async function discoverStops(route: RouteData): Promise<RouteStop[]> {
  const cacheKey = JSON.stringify(route.coordinates);
  const cached = placeCache.get(cacheKey);
  if (cached) return cached;
  const lng = route.coordinates.map((p) => p[0]),
    lat = route.coordinates.map((p) => p[1]);
  const box = `${Math.min(...lat) - 0.025},${Math.min(...lng) - 0.03},${Math.max(...lat) + 0.025},${Math.max(...lng) + 0.03}`;
  const query = `[out:json][timeout:12];(nwr[amenity~"^(fuel|cafe|restaurant)$"](${box});nwr[tourism~"^(viewpoint|museum|attraction)$"](${box}););out center tags;`;
  const data = await request("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  const unique = new Set<string>();
  const stops: RouteStop[] = (data.elements ?? [])
    .flatMap(
      (e: {
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags: Record<string, string>;
      }) => {
        const latitude = e.lat ?? e.center?.lat,
          longitude = e.lon ?? e.center?.lon;
        if (latitude == null || longitude == null) return [];
        const { offsetKm, routeKm } = routePosition(route, longitude, latitude);
        if (offsetKm > 2 || routeKm < 1 || routeKm > route.distanceKm - 1)
          return [];
        const kind =
          e.tags.amenity === "fuel"
            ? "fuel"
            : e.tags.amenity
              ? "food"
              : e.tags.tourism === "viewpoint"
                ? "scenic"
                : "culture";
        const name =
          e.tags.name ||
          e.tags.brand ||
          (kind === "fuel"
            ? "Fuel station"
            : kind === "scenic"
              ? "Viewpoint"
              : "");
        if (!name) return [];
        const key = `${name}-${Math.round(latitude * 1000)}-${Math.round(longitude * 1000)}`;
        if (unique.has(key)) return [];
        unique.add(key);
        return [
          {
            id: `osm-${e.type}-${e.id}`,
            title: name,
            description: `${kind === "fuel" ? "Fuel stop" : kind === "food" ? "Food & a break" : kind === "scenic" ? "Scenic stop" : "Local discovery"} · mapped on OpenStreetMap. Check access and opening hours.`,
            duration: kind === "food" ? 30 : 15,
            place: { name, latitude, longitude, span: 0.015 },
            included: true,
            kind,
            routeKm,
            openingHours: e.tags.opening_hours,
            cuisine: e.tags.cuisine?.replace(/;/g, ", "),
            wheelchair: e.tags.wheelchair,
            website: /^https?:\/\//i.test(e.tags.website ?? "")
              ? e.tags.website
              : undefined,
            osmUrl: `https://www.openstreetmap.org/${e.type}/${e.id}`,
          } as RouteStop,
        ];
      },
    )
    .sort(
      (a: RouteStop, b: RouteStop) =>
        a.routeKm - b.routeKm || a.id.localeCompare(b.id),
    );
  if (placeCache.size >= 10) placeCache.clear();
  placeCache.set(cacheKey, stops);
  return stops;
}
export function selectRouteStops(
  plan: PlanDetails,
  route: RouteData,
  candidates: RouteStop[],
) {
  const chosen: RouteStop[] = [];
  const warnings: string[] = [];
  const matching = candidates.filter((s) =>
    s.kind === "food"
      ? plan.interests.includes("Food")
      : s.kind === "scenic"
        ? plan.interests.includes("Scenic")
        : s.kind === "culture"
          ? plan.interests.includes("Local lore") ||
            plan.interests.includes("Curiosity")
          : false,
  );
  const budget = Math.min(120, Math.round(route.minutes * 0.35));
  let used = 0;
  // Aim for a few spaced experiences, with one meal stop rather than several cafes.
  const targetCount = Math.min(matching.length, Math.floor(budget / 20));
  for (let i = 0; i < targetCount; i++) {
    const target = (route.distanceKm * (i + 1)) / (targetCount + 1);
    const options = matching
      .filter(
        (stop) =>
          stop.routeKm > route.distanceKm * 0.12 &&
          stop.routeKm < route.distanceKm * 0.93 &&
          used + stop.duration <= budget &&
          !chosen.some(
            (s) =>
              s.id === stop.id ||
              Math.abs(s.routeKm - stop.routeKm) < 20 ||
              (s.kind === "food" && stop.kind === "food"),
          ),
      )
      .sort(
        (a, b) =>
          Math.abs(a.routeKm - target) - Math.abs(b.routeKm - target) ||
          a.id.localeCompare(b.id),
      );
    if (options[0]) {
      chosen.push(options[0]);
      used += options[0].duration;
    }
  }
  // Fill long driving gaps with mapped places to pause, independent of interests.
  for (let minute = 120; minute < route.minutes; minute += 120) {
    const km = (minute / route.minutes) * route.distanceKm;
    if (
      chosen.some(
        (s) =>
          (Math.abs(s.routeKm - km) / route.distanceKm) * route.minutes < 45,
      )
    )
      continue;
    const rest = candidates
      .filter((s) => s.kind === "food")
      .filter((s) => !chosen.some((c) => c.id === s.id))
      .sort((a, b) => Math.abs(a.routeKm - km) - Math.abs(b.routeKm - km))[0];
    if (
      rest &&
      (Math.abs(rest.routeKm - km) / route.distanceKm) * route.minutes <= 40
    )
      chosen.push(rest);
    else
      warnings.push(
        `Plan a break around ${Math.round(km)} km; no suitable mapped stop was found nearby.`,
      );
  }
  const activities = chosen.sort((a, b) => a.routeKm - b.routeKm).slice(0, 18);
  return {
    activities,
    warnings,
    pace: (used < 30
      ? "relaxed"
      : used < 75
        ? "balanced"
        : "packed") as PlanDetails["pace"],
  };
}
