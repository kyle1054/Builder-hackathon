import { STARTER_ACTIVITIES } from "@/constants/demo-trips";
import { supabase } from "@/lib/supabase";
import { MAP_PLACES, MapPlace } from "@/constants/map-places";
import { Interest } from "@/constants/trip";
import type { Json } from "@/types/database";

export type PlanActivity = {
  id: string;
  title: string;
  description: string;
  duration: number;
  place: MapPlace;
  included: boolean;
};
export type PlanDetails = {
  name: string;
  origin: MapPlace;
  destination: MapPlace;
  startDate: string;
  endDate: string;
  interests: Interest[];
  pace: "relaxed" | "balanced" | "packed";
  activities: PlanActivity[];
  description: string;
  starterTemplate?: boolean;
};
export type Person = { id: string; name: string; seed: string; role?: string };
export type PlannedTrip = {
  id: string;
  ownerId: string;
  status: string;
  details: PlanDetails;
  revision: number;
  members?: Person[];
  pending?: string[];
};
export type Social = {
  friends: Person[];
  travelers: Person[];
  invitations: { id: string; title: string; from: string }[];
};
export async function planner<T>(
  action: string,
  data: object = {},
): Promise<T> {
  const { data: result, error } = await supabase.rpc("trip_planner", {
    p_action: action,
    p_data: data as Json,
  });
  if (error) throw new Error(error.message);
  const response = result as { error?: string } | null;
  if (response?.error) throw new Error(response.error);
  return result as T;
}
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function newPlan(): PlanDetails {
  return {
    name: "A weekend in the Overberg",
    origin: MAP_PLACES.origin,
    destination: MAP_PLACES.destination,
    startDate: today(),
    endDate: today(),
    interests: ["Scenic", "Food", "Local lore"],
    pace: "balanced",
    activities: STARTER_ACTIVITIES.map((a) => ({
      ...a,
      place: { ...a.place },
    })),
    description:
      "A weekend drive from Stellenbosch through Elgin and the Overberg to Tierfontein Farm. Coffee, mountain views and time with your people.",
    starterTemplate: true,
  };
}
export function validatePlan(plan: PlanDetails): string | null {
  if (!plan.name.trim() || plan.name.trim().length > 60)
    return "Give your trip a name of up to 60 characters.";
  const validDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s;
  if (!validDate(plan.startDate) || !validDate(plan.endDate))
    return "Enter valid dates as YYYY-MM-DD.";
  if (plan.endDate < plan.startDate)
    return "The end date must be on or after the start date.";
  if (plan.origin.name === plan.destination.name)
    return "Choose different start and destination locations.";
  if (!plan.interests.length) return "Choose at least one interest.";
  return null;
}
