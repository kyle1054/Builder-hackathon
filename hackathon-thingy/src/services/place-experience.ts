/** Presentation data only. Keep Google content out of persisted trip drafts. */
export type PlaceExperience = {
  demo: boolean;
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
  photos: { url: string; authors: { name: string; url?: string }[] }[];
  reviews: { author: string; authorUrl?: string; rating?: number; text: string; date?: string }[];
};
export type GooglePlaceDetails = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[];
  reviews?: { rating?: number; text?: { text?: string }; relativePublishTimeDescription?: string; authorAttribution?: { displayName?: string; uri?: string } }[];
};
const safeUrl = (value?: string) => value && /^https:\/\//i.test(value) ? value : undefined;
/** Resolve photo resource names through the server, never with a client API key. */
export function googlePlaceExperience(details: GooglePlaceDetails, resolvedPhotos: Record<string, string>): PlaceExperience {
  return {
    demo: false,
    rating: typeof details.rating === "number" ? details.rating : undefined,
    reviewCount: details.userRatingCount,
    mapsUrl: safeUrl(details.googleMapsUri),
    photos: (details.photos ?? []).flatMap(photo => {
      const url = safeUrl(resolvedPhotos[photo.name]);
      return url ? [{ url, authors: (photo.authorAttributions ?? []).map(a => ({ name: a.displayName ?? "Photo contributor", url: safeUrl(a.uri) })) }] : [];
    }),
    reviews: (details.reviews ?? []).filter(r => r.text?.text).map(r => ({ author: r.authorAttribution?.displayName ?? "Google reviewer", authorUrl: safeUrl(r.authorAttribution?.uri), rating: r.rating, text: r.text!.text!, date: r.relativePublishTimeDescription })),
  };
}
export const DEMO_PLACE_EXPERIENCE: PlaceExperience = {
  demo: true, rating: 4.6, reviewCount: 24, photos: [],
  reviews: [
    { author: "Sample traveller", rating: 5, text: "A lovely break from the drive. We spent about half an hour here and were glad we stopped.", date: "Demo review" },
    { author: "Sample traveller", rating: 4, text: "Worth a stop if you have time. Check access and opening hours before heading out.", date: "Demo review" },
  ],
};
