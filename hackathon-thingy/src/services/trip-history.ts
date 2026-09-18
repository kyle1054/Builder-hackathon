import { supabase } from "@/lib/supabase";
import { createChroniclePhotoUrl, uploadChroniclePhoto } from "./sidequest-api";
import { PlannedTrip, planner } from "./trip-planner";
import type { Database } from "@/types/database";
import * as ImagePicker from "expo-image-picker";
export type JourneyRow = Database["public"]["Tables"]["journeys"]["Row"];
export type MemoryPhoto =
  Database["public"]["Tables"]["chronicle_entries"]["Row"] & {
    url: string | null;
    owner: string;
  };
export type HistoryTrip = {
  journey: JourneyRow;
  cover: string | null;
  photoCount: number;
  name: string;
};
export async function historyTrips(): Promise<HistoryTrip[]> {
  const { data: journeys, error } = await supabase
    .from("journeys")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  if (!journeys?.length) return [];
  const { data: photos, error: photoError } = await supabase
    .from("chronicle_entries")
    .select("*")
    .in(
      "journey_id",
      journeys.map((j) => j.id),
    )
    .neq("ai_status", "pending")
    .order("captured_at", { ascending: false });
  if (photoError) throw new Error(photoError.message);
  const plans = await planner<PlannedTrip[]>("list");
  return Promise.all(
    journeys.map(async (journey) => {
      const entries = photos?.filter((p) => p.journey_id === journey.id) ?? [];
      let cover: string | null = null;
      for (const photo of entries.slice(0, 3)) {
        try {
          cover = await createChroniclePhotoUrl(photo.storage_path);
          break;
        } catch {
          /* Try another uploaded photo if an object is unavailable. */
        }
      }
      return {
        journey,
        cover,
        photoCount: entries.length,
        name:
          plans.find((p) => p.id === journey.id)?.details.name ??
          `${journey.origin_name} to ${journey.destination_name}`,
      };
    }),
  );
}
export async function historyDetail(id: string) {
  const { data: journey, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    throw new Error("This trip is unavailable or you are not a member.");
  const [photoResult, memberResult, questResult, plans] = await Promise.all([
    supabase
      .from("chronicle_entries")
      .select("*")
      .eq("journey_id", id)
      .neq("ai_status", "pending")
      .order("captured_at", { ascending: false }),
    supabase.from("party_members").select("*").eq("party_id", journey.party_id),
    supabase
      .from("journey_quests")
      .select("*")
      .eq("journey_id", id)
      .order("rank"),
    planner<PlannedTrip[]>("list"),
  ]);
  for (const e of [photoResult.error, memberResult.error, questResult.error])
    if (e) throw new Error(e.message);
  const members = memberResult.data ?? [];
  const photos: MemoryPhoto[] = await Promise.all(
    (photoResult.data ?? []).map(async (photo) => ({
      ...photo,
      url: await createChroniclePhotoUrl(photo.storage_path).catch(() => null),
      owner:
        members.find((m) => m.user_id === photo.captured_by)?.display_name ??
        "Trip member",
    })),
  );
  return {
    journey,
    photos,
    members,
    quests: questResult.data ?? [],
    plan: plans.find((p) => p.id === id),
  };
}
export async function pickTripPhoto(journeyId: string, locationName: string) {
  const selected = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: false,
    quality: 0.85,
    base64: true,
  });
  if (selected.canceled) return false;
  const asset = selected.assets[0];
  if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 15 MB.");
  const type = asset.mimeType ?? "image/jpeg";
  const types = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
  } as const;
  if (!(type in types))
    throw new Error("Choose a JPEG, PNG, WebP or HEIC photo.");
  const contentType = type as keyof typeof types;
  const bytes = asset.base64
    ? Uint8Array.from(atob(asset.base64), (c) => c.charCodeAt(0)).buffer
    : await (await fetch(asset.uri)).arrayBuffer();
  if (bytes.byteLength > 15 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 15 MB.");
  await uploadChroniclePhoto({
    journeyId,
    locationName,
    bytes,
    contentType,
    fileExtension: types[contentType],
    entryType: "spontaneous",
  });
  return true;
}
