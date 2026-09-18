import { QuestStopPreview } from "@/components/quest-stop-preview";
import { QuestRouteSummary } from "@/components/quest-route-summary";
import { NearbyFacts } from "@/components/nearby-facts";
import { PlanDateField } from "@/components/plan-date-field";
import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Share,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { TravelerAvatar } from "@/components/traveler-avatar";
import { AuthGate } from "@/components/auth-gate";
import {
  BodyText,
  PixelButton,
  QuestScreen,
  SectionHeading,
} from "@/components/sidequest-ui";
import { DestinationMap } from "@/components/destination-map";
import { Field, LocalQR, Option, ps } from "@/components/planner-ui";
import { Interest } from "@/constants/trip";
import { PlacePicker } from "@/components/plan-place-picker";
import {
  drivingRoute,
  discoverStops,
  selectRouteStops,
  routePosition,
  type RouteData,
  type RouteStop,
} from "@/services/route-planning";
import { SideQuestColors as C } from "@/constants/theme";
import { useAuth } from "@/context/auth";
import {
  newPlan,
  PlanDetails,
  PlannedTrip,
  planner,
  Social,
  validatePlan,
} from "@/services/trip-planner";
import { TripProgress } from "@/components/trip-progress";

const interests: Interest[] = ["Scenic", "Food", "Local lore", "Curiosity"];
function PlanContent() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const [otherActiveTrip, setOtherActiveTrip] = useState<PlannedTrip | null>(null);
  const [trip, setTrip] = useState<PlannedTrip | null>(null);
  const [form, setForm] = useState<PlanDetails>(newPlan);
  const [step, setStep] = useState<"route" | "review" | "saved">(
    params.id ? "saved" : "route",
  );
  const [route, setRoute] = useState<RouteData | null>(null);
  const [candidates, setCandidates] = useState<RouteStop[]>([]);
  const [searchFailed, setSearchFailed] = useState(false);
  const [routeWarnings, setRouteWarnings] = useState<string[]>([]);
  const [suggestionKind, setSuggestionKind] = useState("For you");
  const [suggestionLimit, setSuggestionLimit] = useState(8);
  const [routeResult, setRouteResult] = useState<{
    key: string;
    data: RouteData;
  } | null>(null);
  const [adding, setAdding] = useState(false);
  const [editDescription, setEditDescription] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(params.id));
  const [error, setError] = useState("");
  const [social, setSocial] = useState<Social>({
    friends: [],
    travelers: [],
    invitations: [],
  });
  const [invite, setInvite] = useState<{
    code: string;
    expiresAt: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const routeKey = JSON.stringify([
    form.origin,
    ...form.activities.filter((a) => a.included).map((a) => a.place),
    form.destination,
  ]);
  const routeTotal = routeResult?.key === routeKey ? routeResult.data : null;
  useEffect(() => {
    if (step !== "review") return;
    let active = true;
    void drivingRoute(JSON.parse(routeKey))
      .then((r) => {
        if (active) setRouteResult({ key: routeKey, data: r });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [routeKey, step]);
  const availableSuggestions = candidates
    .filter((c) => !form.activities.some((a) => a.id === c.id))
    .filter((c) =>
      suggestionKind === "Fuel"
        ? c.kind === "fuel"
        : suggestionKind === "All"
          ? true
          : c.kind === "food"
            ? form.interests.includes("Food")
            : c.kind === "scenic"
              ? form.interests.includes("Scenic")
              : c.kind === "culture" &&
                (form.interests.includes("Local lore") ||
                  form.interests.includes("Curiosity")),
    );
  const id = params.id || trip?.id;
  const load = useCallback(async () => {
    if (!id) return;
    const [t, s, all] = await Promise.all([
      planner<PlannedTrip>("detail", { id }),
      planner<Social>("social"),
      planner<PlannedTrip[]>("list"),
    ]);
    setOtherActiveTrip(all.find(item => item.id !== id && ["active", "paused"].includes(item.status)) ?? null);
    setTrip(t);
    setSocial(s);
  }, [id]);
  useEffect(() => {
    let active = true;
    if (!id || step !== "saved") return;
    void Promise.all([
      planner<PlannedTrip>("detail", { id }),
      planner<Social>("social"),
      planner<PlannedTrip[]>("list"),
    ])
      .then(([t, s, all]) => {
        if (active) {
          setOtherActiveTrip(all.find(item => item.id !== id && ["active", "paused"].includes(item.status)) ?? null);
          setTrip(t);
          setSocial(s);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const timer = setInterval(() => void load().catch(() => {}), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id, load, step]);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save your changes. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };
  const change = <K extends keyof PlanDetails>(key: K, value: PlanDetails[K]) =>
    setForm((p) => ({
      ...p,
      starterTemplate:
        key === "origin" || key === "destination" ? false : p.starterTemplate,
      [key]:
        key === "activities" && route
          ? [...(value as PlanDetails["activities"])].sort(
              (a, b) =>
                routePosition(route, a.place.longitude, a.place.latitude)
                  .routeKm -
                routePosition(route, b.place.longitude, b.place.latitude)
                  .routeKm,
            )
          : value,
    }));
  const review = () => {
    const problem = validatePlan(form);
    if (problem) {
      setError(problem);
      return;
    }
    if (form.starterTemplate || trip) {
      setError("");
      setStep("review");
    } else generate();
  };
  const generate = () => {
    const problem = validatePlan(form);
    if (problem) {
      setError(problem);
      return;
    }
    void run(async () => {
      const road = await drivingRoute([form.origin, form.destination]);
      setRoute(road);
      let stops: RouteStop[] = [];
      let discoveryFailed = false;
      try {
        stops = await discoverStops(road);
      } catch {
        discoveryFailed = true;
      }
      setCandidates(stops);
      setSearchFailed(discoveryFailed);
      const suggested = selectRouteStops(form, road, stops);
      setRouteWarnings([
        ...suggested.warnings,
        ...(discoveryFailed
          ? [
              "Place search is unavailable. You can retry suggestions or add stops manually.",
            ]
          : []),
      ]);
      setForm({
        ...form,
        starterTemplate: false,
        pace: suggested.pace,
        activities: suggested.activities,
        description:
          form.description ||
          `A trip from ${form.origin.name} to ${form.destination.name}.`,
      });
      setStep("review");
    });
  };
  const save = () =>
    run(async () => {
      const problem = validatePlan(form);
      if (problem) throw new Error(problem);
      const saved = await planner<{ id: string }>(trip ? "update" : "create", {
        id: trip?.id,
        revision: trip?.revision,
        details: form,
      });
      const fresh = await planner<PlannedTrip>("detail", { id: saved.id });
      setTrip(fresh);
      setStep("saved");
      router.setParams({ id: saved.id });
    });
  const owner = trip?.ownerId === session?.user.id;
  const configuredBase = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, "");
  const developmentHost = Constants.expoConfig?.hostUri;
  const webBase =
    Platform.OS === "web" && typeof window !== "undefined"
      ? (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1") &&
        developmentHost
        ? `http://${developmentHost}`
        : window.location.origin
      : null;
  const inviteUrl = invite
    ? configuredBase || webBase
      ? `${configuredBase || webBase}/join?code=${invite.code}`
      : Linking.createURL("/join", { queryParams: { code: invite.code } })
    : "";
  const share = () =>
    run(async () => {
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: "Join my SideQuest trip",
          text: trip?.details.name,
          url: inviteUrl,
        });
      } else if (Platform.OS === "web" && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setNotice("Invite link copied.");
      } else
        await Share.share({
          message: `Join ${trip?.details.name}: ${inviteUrl}\nInvite code: ${invite?.code}`,
        });
    });
  if (loading)
    return (
      <QuestScreen key={step}>
        <ActivityIndicator color={C.gold} />
        <BodyText muted>Opening your trip…</BodyText>
      </QuestScreen>
    );
  return (
    <QuestScreen key={step}>
      <View style={ps.row}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (step === "review") setStep("route");
            else if (step === "route" && trip) setStep("saved");
            else router.replace("/journey");
          }}
          style={ps.button}
        >
          <Text style={ps.link}>
            ← {step === "review" ? "Trip details" : "Your trips"}
          </Text>
        </Pressable>
        <Text style={ps.small}>
          {step === "route"
            ? "01 / Plan"
            : step === "review"
              ? "02 / Review"
              : trip?.status === "planning"
                ? "Draft trip"
                : trip?.status === "completed"
                  ? "Completed"
                  : "On the road"}
        </Text>
      </View>
      {!!error && (
        <View style={ps.card}>
          <Text accessibilityRole="alert" style={ps.error}>
            {error}
          </Text>
          {!trip && params.id && (
            <PixelButton
              label="Try again"
              onPress={() => run(load)}
              variant="ghost"
            />
          )}
        </View>
      )}
      {step === "route" && (
        <>
          <View style={ps.section}>
            <Text style={ps.title}>{trip ? "Edit trip" : "Plan a trip"}</Text>
            <BodyText muted>
              Your route, dates and stops are ready. Change anything, or
              continue.
            </BodyText>
          </View>
          <View style={ps.card}>
            <Field
              label="Trip name"
              value={form.name}
              onChangeText={(v) => change("name", v)}
              maxLength={60}
            />
            <PlacePicker
              label="Start location"
              place={form.origin}
              onChange={(p) => change("origin", p)}
            />
            <PlacePicker
              label="Destination"
              place={form.destination}
              onChange={(p) => change("destination", p)}
            />
          </View>
          <DestinationMap
            place={form.destination}
            origin={form.origin}
            height={190}
          />
          <View style={ps.section}>
            <SectionHeading title="When are you going?" />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <PlanDateField
                  label="Departure date"
                  value={form.startDate}
                  onChange={(v) => change("startDate", v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PlanDateField
                  label="End date"
                  value={form.endDate}
                  onChange={(v) => change("endDate", v)}
                />
              </View>
            </View>
            <Text style={ps.small}>
              A day trip can start and end on the same date.
            </Text>
          </View>
          <View style={ps.section}>
            <SectionHeading title="What catches your eye?" />
            <View style={ps.options}>
              {interests.map((i) => (
                <Option
                  key={i}
                  label={i}
                  selected={form.interests.includes(i)}
                  onPress={() =>
                    change(
                      "interests",
                      form.interests.includes(i)
                        ? form.interests.filter((x) => x !== i)
                        : [...form.interests, i],
                    )
                  }
                />
              ))}
            </View>
          </View>
          <View style={ps.section}>
            <SectionHeading title="A pace that fits the drive" />
            <Text style={ps.small}>
              We’ll match stops to the driving time, your interests and places
              along the route. Longer drives get room for breaks.
            </Text>
            <Text style={ps.small}>
              Potential fuel stops appear in your suggestions. Add one whenever
              you need it.
            </Text>
          </View>
          <PixelButton raised label="Review trip →" loading={busy} onPress={review} />
          {trip && (
            <PixelButton
              label="Keep my itinerary and review"
              variant="ghost"
              onPress={() => {
                const e = validatePlan(form);
                if (e) setError(e);
                else setStep("review");
              }}
            />
          )}
        </>
      )}
      {step === "review" && (
        <>
          <View style={ps.section}>
            <Text style={ps.title}>Your quest is ready.</Text>
            <BodyText muted>
              A few good stops. A little room for discovery. Make it yours, then invite your party.
            </BodyText>
          </View>
          <DestinationMap
            place={form.destination}
            origin={form.origin}
            stops={form.activities
              .filter((a) => a.included)
              .map((a) => a.place)}
            height={280}
          />
          <QuestRouteSummary plan={form} route={routeTotal} direct={route} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: editDescription }}
            onPress={() => setEditDescription(!editDescription)}
            style={ps.button}
          >
            <Text style={ps.link}>
              {editDescription ? "Hide trip note" : "Add a trip note"}
            </Text>
          </Pressable>
          {editDescription && (
            <Field
              label="Trip description"
              value={form.description}
              onChangeText={(v) => change("description", v)}
              multiline
              maxLength={2000}
            />
          )}
          {form.starterTemplate && (
            <Text style={ps.small}>
              Suggested itinerary · real venues, ready to edit. Check opening hours before travelling.
            </Text>
          )}
          <PixelButton
            label="Discover other stops"
            variant="ghost"
            loading={busy}
            onPress={generate}
          />
          <SectionHeading
            title={`On the way · ${form.activities.filter((a) => a.included).length} stops`}
          />
          <Text style={ps.small}>Your side quests, in travel order. Remove any stop to keep moving.</Text>
          {routeWarnings.map((w) => (
            <Text key={w} style={ps.small}>
              {w}
            </Text>
          ))}
          {searchFailed && route && (
            <PixelButton
              label="Retry place search"
              variant="ghost"
              loading={busy}
              onPress={() =>
                run(async () => {
                  const stops = await discoverStops(route);
                  setCandidates(stops);
                  setSearchFailed(false);
                  setRouteWarnings([]);
                  setAdding(true);
                })
              }
            />
          )}
          {form.activities.map((a, index) => (
            <View key={a.id} style={ps.card}>
              <View style={ps.row}>
                <Text style={[ps.label, { flex: 1 }]}>
                  {a.included
                    ? String(
                        form.activities
                          .slice(0, index + 1)
                          .filter((x) => x.included).length,
                      ).padStart(2, "0")
                    : "—"}{" "}
                  · {a.title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${a.included ? "Remove" : "Restore"} ${a.title}`}
                  style={ps.button}
                  onPress={() =>
                    change(
                      "activities",
                      form.activities.map((x) =>
                        x.id === a.id ? { ...x, included: !x.included } : x,
                      ),
                    )
                  }
                >
                  <Text style={ps.link}>
                    {a.included ? "Remove" : "Restore"}
                  </Text>
                </Pressable>
              </View>
              {a.included && (
                <>
                  <QuestStopPreview activity={a} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: expanded === a.id }}
                    onPress={() => setExpanded(expanded === a.id ? null : a.id)}
                    style={ps.button}
                  >
                    <Text style={ps.link}>
                      {expanded === a.id ? "Done editing" : "Edit stop"}
                    </Text>
                  </Pressable>
                </>
              )}
              {a.included && expanded === a.id && (
                <>
                  <Field
                    label={`Stop ${index + 1} title`}
                    value={a.title}
                    onChangeText={(v) =>
                      change(
                        "activities",
                        form.activities.map((x) =>
                          x.id === a.id ? { ...x, title: v } : x,
                        ),
                      )
                    }
                  />
                  <Field
                    label={`Stop ${index + 1} description`}
                    value={a.description}
                    multiline
                    onChangeText={(v) =>
                      change(
                        "activities",
                        form.activities.map((x) =>
                          x.id === a.id ? { ...x, description: v } : x,
                        ),
                      )
                    }
                  />
                  <PlacePicker
                    label={`Stop ${index + 1} location`}
                    place={a.place}
                    onChange={(v) =>
                      change(
                        "activities",
                        form.activities.map((x) =>
                          x.id === a.id ? { ...x, place: v } : x,
                        ),
                      )
                    }
                  />
                  <Field
                    label={`Stop ${index + 1} duration in minutes`}
                    value={String(a.duration)}
                    onChangeText={(v) =>
                      change(
                        "activities",
                        form.activities.map((x) =>
                          x.id === a.id
                            ? { ...x, duration: Number(v) || 0 }
                            : x,
                        ),
                      )
                    }
                  />
                </>
              )}
            </View>
          ))}
          {!form.activities.length && (
            <BodyText muted>
              No suggested stops for this route yet. Add your own below.
            </BodyText>
          )}
          <PixelButton
            label={adding ? "Close suggestions" : "+ Add a stop"}
            variant="ghost"
            onPress={() => setAdding(!adding)}
          />
          {adding && (
            <View style={ps.card}>
              <Text style={ps.label}>Along your route</Text>
              <View style={ps.options}>
                {["For you", "Fuel", "All"].map((kind) => (
                  <Option
                    key={kind}
                    label={kind}
                    selected={suggestionKind === kind}
                    onPress={() => {
                      setSuggestionKind(kind);
                      setSuggestionLimit(8);
                    }}
                  />
                ))}
              </View>
              {availableSuggestions.slice(0, suggestionLimit).map((c) => (
                <View key={c.id} style={ps.row}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={ps.label}>{c.title}</Text>
                    <Text style={ps.small}>
                      {c.kind} · around {Math.round(c.routeKm)} km ·{" "}
                      {c.duration} min
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${c.title}`}
                    disabled={form.activities.length >= 20}
                    style={ps.button}
                    onPress={() =>
                      change(
                        "activities",
                        [...form.activities, c].sort((a, b) =>
                          route
                            ? routePosition(
                                route,
                                a.place.longitude,
                                a.place.latitude,
                              ).routeKm -
                              routePosition(
                                route,
                                b.place.longitude,
                                b.place.latitude,
                              ).routeKm
                            : 0,
                        ),
                      )
                    }
                  >
                    <Text style={ps.link}>Add</Text>
                  </Pressable>
                </View>
              ))}
              {availableSuggestions.length > suggestionLimit && (
                <Pressable
                  accessibilityRole="button"
                  style={ps.button}
                  onPress={() => setSuggestionLimit((n) => n + 8)}
                >
                  <Text style={ps.link}>Show more places</Text>
                </Pressable>
              )}
              {!availableSuggestions.length && (
                <Text style={ps.small}>
                  No more mapped suggestions. You can add your own stop.
                </Text>
              )}
              <PixelButton
                label="Add a manual stop"
                variant="ghost"
                disabled={form.activities.length >= 20}
                onPress={() => {
                  const id = `custom-${Date.now()}`;
                  change("activities", [
                    ...form.activities,
                    {
                      id,
                      title: "My stop",
                      description: "",
                      duration: 20,
                      place: form.destination,
                      included: true,
                    },
                  ]);
                  setExpanded(id);
                  setAdding(false);
                }}
              />
            </View>
          )}
          <Text style={ps.small}>
            Places © OpenStreetMap contributors. Check opening hours and access
            before you go.
          </Text>
          <PixelButton
            raised label={trip ? "Save changes" : "Save draft & invite members →"}
            loading={busy}
            onPress={save}
          />
        </>
      )}
      {step === "saved" && trip && (
        <>
          <View style={ps.section}>
            <Text style={ps.title}>{trip.details.name}</Text>
            <Text style={ps.small}>
              {trip.details.startDate} — {trip.details.endDate} ·{" "}
              {trip.details.pace} pace
            </Text>
          </View>
          <DestinationMap
            place={trip.details.destination}
            origin={trip.details.origin}
            stops={trip.details.activities
              .filter((a) => a.included)
              .map((a) => a.place)}
          />
          <Text style={ps.label}>
            {trip.details.origin.name} → {trip.details.destination.name}
          </Text>
          <Text style={ps.small}>{trip.details.destination.address}</Text>
          <BodyText muted>{trip.details.description}</BodyText>
          {trip.status === "active" && (
            <>
              <TripProgress
                progress={0}
                origin={trip.details.origin.name}
                destination={trip.details.destination.name}
                travelers={(trip.members ?? []).map((p, i) => ({
                  name: p.name,
                  seed: p.seed || p.id,
                  color: [C.gold, C.cobalt, C.emerald, C.amber][i % 4],
                }))}
              />
              <Text style={ps.small}>
                Trip started. Live location tracking isn’t connected yet.
              </Text>
            </>
          )}
          <View style={ps.card}>
            <SectionHeading title="Make more of the journey" />
            <PixelButton
              label="Explore places along the way"
              variant="ghost"
              onPress={() =>
                router.push({ pathname: "/places", params: { id: trip.id } })
              }
            />
            <PixelButton
              raised label="Play road trivia & spot-it"
              onPress={() =>
                router.push({ pathname: "/games", params: { id: trip.id } })
              }
            />
          </View>
          <NearbyFacts />
          <View style={ps.row}>
            <SectionHeading title="Upcoming activities" />
            {owner && trip.status === "planning" && (
              <Pressable
                accessibilityRole="button"
                style={ps.button}
                onPress={() => {
                  setForm(trip.details);
                  setStep("route");
                }}
              >
                <Text style={ps.link}>Edit plan</Text>
              </Pressable>
            )}
          </View>
          {trip.details.activities
            .filter((a) => a.included)
            .map((a, i) => (
              <View key={a.id} style={ps.divider}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expanded === a.id }}
                  style={ps.row}
                  onPress={() => setExpanded(expanded === a.id ? null : a.id)}
                >
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={ps.label}>
                      {String(i + 1).padStart(2, "0")} · {a.title}
                    </Text>
                    <Text style={ps.small}>
                      {a.place.name} · {a.duration} min
                    </Text>
                  </View>
                  <Text style={ps.link}>{expanded === a.id ? "−" : "+"}</Text>
                </Pressable>
                {expanded === a.id && (
                  <>
                    <BodyText muted>
                      {a.description || "No description yet."}
                    </BodyText>
                    <DestinationMap place={a.place} height={150} />
                  </>
                )}
              </View>
            ))}
          {!trip.details.activities.some((a) => a.included) && (
            <Text style={ps.small}>No stops planned yet.</Text>
          )}
          <View style={ps.divider}>
            <SectionHeading
              title={`Trip members · ${trip.members?.length ?? 1}`}
            />
            {trip.members?.map((p) => (
              <View style={ps.row} key={p.id}>
                <TravelerAvatar key={p.seed} seed={p.seed} name={p.name} />
                <View style={{ flex: 1 }}>
                  <Text style={ps.label}>
                    {p.name}
                    {p.id === session?.user.id ? " (you)" : ""}
                  </Text>
                  <Text style={ps.small}>
                    {p.id === trip.ownerId ? "Organiser" : "Member"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          {owner && trip.status !== "completed" && (
            <>
              <View style={ps.divider}>
                <SectionHeading title="Invite members" />
                <BodyText muted>
                  Send a link, share the code, or let a friend scan it. They’ll
                  sign in to join this trip.
                </BodyText>
                <PixelButton
                  variant="ghost"
                  label={
                    invite
                      ? "Replace invite code"
                      : "Create invite link & QR code"
                  }
                  loading={busy}
                  onPress={() =>
                    run(async () => setInvite(await planner("invite", { id })))
                  }
                />
                {invite && (
                  <View style={ps.card}>
                    <LocalQR value={inviteUrl} />
                    <Text
                      selectable
                      style={{
                        color: C.goldSoft,
                        fontSize: 26,
                        fontWeight: "700",
                        letterSpacing: 3,
                        textAlign: "center",
                      }}
                    >
                      {invite.code.match(/.{1,4}/g)?.join("-")}
                    </Text>
                    <Text style={ps.small}>
                      Valid until{" "}
                      {new Date(invite.expiresAt).toLocaleDateString()}.
                      Replacing it disables the previous code.
                    </Text>
                    <PixelButton
                      label={
                        Platform.OS === "web"
                          ? "Share / copy invite link"
                          : "Share invite"
                      }
                      onPress={share}
                      loading={busy}
                    />
                    <Text selectable style={ps.small}>
                      {inviteUrl}
                    </Text>
                  </View>
                )}
              </View>
              <View style={ps.section}>
                <SectionHeading title="Invite saved friends" />
                {social.friends.length === 0 && (
                  <Text style={ps.small}>
                    Your saved friends will appear here. Share an invite code
                    now, or save a past travel companion below.
                  </Text>
                )}
                {social.friends.map((p) => {
                  const joined = trip.members?.some((m) => m.id === p.id);
                  const pending = trip.pending?.includes(p.id);
                  return (
                    <View key={p.id} style={ps.row}>
                      <Text style={[ps.label, { flex: 1 }]}>{p.name}</Text>
                      <PixelButton
                        label={
                          joined ? "Joined" : pending ? "Invited" : "Invite"
                        }
                        size="compact"
                        disabled={joined || pending || busy}
                        variant="ghost"
                        onPress={() =>
                          run(async () => {
                            await planner("invite_friend", {
                              id,
                              userId: p.id,
                            });
                            await load();
                            setNotice(`Invitation sent to ${p.name}.`);
                          })
                        }
                      />
                    </View>
                  );
                })}
                {social.travelers
                  .filter((p) => !social.friends.some((f) => f.id === p.id))
                  .map((p) => (
                    <View key={p.id} style={ps.row}>
                      <Text style={[ps.small, { flex: 1 }]}>
                        {p.name} · past companion
                      </Text>
                      <PixelButton
                        label="Save friend"
                        size="compact"
                        variant="ghost"
                        disabled={busy}
                        onPress={() =>
                          run(async () => {
                            await planner("save_friend", { userId: p.id });
                            await load();
                          })
                        }
                      />
                    </View>
                  ))}
              </View>
              {trip.status === "planning" && (
                <View style={ps.divider}>
                  <BodyText muted>
                    Ready when you are. Starting the trip locks the itinerary
                    for everyone.
                  </BodyText>
                  {otherActiveTrip && <View style={ps.card}><Text style={ps.label}>Finish your current quest first.</Text><Text style={ps.small}>You’re already on {otherActiveTrip.details.name}. This plan stays saved as a draft.</Text><PixelButton variant="ghost" label="Return to active trip →" onPress={() => router.push({ pathname: "/plan", params: { id: otherActiveTrip.id } })} /></View>}
                  <PixelButton
                    disabled={!!otherActiveTrip}
                    raised label="Start trip →"
                    loading={busy}
                    onPress={() =>
                      run(async () => {
                        await planner("start", { id });
                        await load();
                        setNotice("Your trip has started.");
                      })
                    }
                  />
                </View>
              )}
            </>
          )}
          <PixelButton
            label="Photos & travel history"
            variant="ghost"
            onPress={() =>
              router.push({ pathname: "/history", params: { id: trip.id } })
            }
          />
          {owner && trip.status === "active" && (
            <PixelButton
              label="Finish trip"
              variant="ghost"
              loading={busy}
              onPress={() =>
                run(async () => {
                  await planner("complete", { id });
                  await load();
                  router.push({
                    pathname: "/history",
                    params: { id: trip.id },
                  });
                })
              }
            />
          )}
          {!owner && trip.status === "planning" && (
            <Text style={ps.small}>
              You’re in. The organiser will start the trip when everyone is
              ready.
            </Text>
          )}
          {!!notice && (
            <Text accessibilityLiveRegion="polite" style={ps.link}>
              {notice}
            </Text>
          )}
        </>
      )}
    </QuestScreen>
  );
}
export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <AuthGate>
      <PlanContent key={id ?? "new"} />
    </AuthGate>
  );
}
