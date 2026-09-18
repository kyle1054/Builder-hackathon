import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { SideQuestColors as C } from "@/constants/theme";
import type { PlanActivity } from "@/services/trip-planner";
import { TRIP_ACTIVITIES } from "@/constants/trip";
import { type PlaceExperience } from "@/services/place-experience";

import { venueExperience, verifiedVenue } from "@/constants/verified-venues";
import { DestinationMap } from "./destination-map";

export function QuestStopPreview({ activity, experience: suppliedExperience }: { activity: PlanActivity; experience?: PlaceExperience }) {
  const experience = suppliedExperience ?? venueExperience(activity);
  const venue = verifiedVenue(activity);
  const [details, setDetails] = useState(false);
  const seed = TRIP_ACTIVITIES.find(a => a.id === activity.id);
  const photo = experience.photos[0];
  const [photoFailed, setPhotoFailed] = useState(false);
  return <View style={s.preview}>
    {experience.demo && <Text style={s.demo}>DEMO PREVIEW · SAMPLE RATINGS & REVIEWS</Text>}
    {photo && !photoFailed ? <View>
      <Image source={{ uri: photo.url }} onError={() => setPhotoFailed(true)} style={s.image} contentFit="cover" accessibilityLabel={`Photo of ${activity.place.name}`} />
      {photo.authors.map((author, i) => <Pressable key={`${author.name}-${i}`} accessibilityRole={author.url ? "link" : undefined} disabled={!author.url} onPress={() => { if (author.url) void Linking.openURL(author.url); }} style={s.link}><Text style={s.caption}>Photo · {author.name}</Text></Pressable>)}
    </View> : <View><DestinationMap place={activity.place} height={155} /><Text style={s.caption}>Location map · venue photograph not available</Text></View>}
    <Text style={s.rating}>{experience.rating != null ? `★ ${experience.rating.toFixed(1)} · ${experience.reviewCount ?? 0} ${experience.demo ? "sample ratings" : "Google ratings"}` : ""}</Text>
    <View style={s.meta}><Text style={s.type}>{seed?.category ?? "Along your route"}</Text><Text style={s.duration}>{activity.duration} min stop</Text></View>
    {activity.place.name !== activity.title && <Text style={s.location}>{activity.place.name}</Text>}
    <Text style={s.description} numberOfLines={details ? undefined : 2}>{venue?.description ?? activity.description}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => setDetails(!details)} style={s.link}><Text style={s.linkText}>{details ? "Less detail −" : "About this stop +"}</Text></Pressable>
    {venue && <Pressable accessibilityRole="link" style={s.link} onPress={() => void Linking.openURL(venue.website)}><Text style={s.linkText}>Venue website ↗</Text></Pressable>}
    {details && <View style={s.reviews}>
      <Text style={s.reviewTitle}>{experience.demo ? "Sample traveller reviews" : experience.reviews.length ? "Traveller reviews · Google Maps" : "Traveller reviews"}</Text>
      {!experience.reviews.length && <Text style={s.description}>Verified reviews aren’t connected yet.</Text>}
      {experience.reviews.map((review, i) => <View key={i} style={s.review}>
        <View style={s.meta}><Pressable disabled={!review.authorUrl} accessibilityRole={review.authorUrl ? "link" : undefined} onPress={() => { if (review.authorUrl) void Linking.openURL(review.authorUrl); }} style={s.link}><Text style={s.reviewTitle}>{review.author}</Text></Pressable><Text style={s.rating}>{review.rating != null ? `★ ${review.rating}` : ""}</Text></View>
        <Text style={s.description}>{review.text}</Text><Text style={s.caption}>{review.date}</Text>
      </View>)}
      {!!experience.mapsUrl && <Pressable accessibilityRole="link" style={s.link} onPress={() => void Linking.openURL(experience.mapsUrl!)}><Text style={s.linkText}>View on Google Maps ↗</Text></Pressable>}
    </View>}
  </View>;
}
const s = StyleSheet.create({
  demo: { color: C.goldSoft, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  rating: { color: C.goldSoft, fontWeight: "700", fontSize: 13 },
  review: { gap: 6, paddingVertical: 8, borderBottomWidth: 1, borderColor: C.border },
  preview: { gap: 12 },
  image: { height: 155, width: "100%", borderRadius: 16 },
  caption: { color: C.textMuted, fontSize: 10, marginTop: 6 },
  meta: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  type: { color: C.emerald, fontSize: 12, fontWeight: "700" },
  duration: { color: C.goldSoft, fontSize: 12, fontWeight: "600" },
  location: { color: C.text, fontSize: 15, fontWeight: "600" },
  description: { color: C.textMuted, fontSize: 13, lineHeight: 20 },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { color: C.goldSoft, fontSize: 13, fontWeight: "600" },
  reviews: { gap: 6, borderTopWidth: 1, borderColor: C.border, paddingTop: 14 },
  reviewTitle: { color: C.text, fontSize: 14, fontWeight: "600" },
});
