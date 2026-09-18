# Activity photos and reviews

The review screen now uses venue-owned photos for geographically matched Orchard Farm Stall and Houw Hoek Farm Stall entries. It does not render fabricated ratings or reviews. Unmatched places fall back to their map. New starter trips contain these two real venues; existing saved itineraries are not silently replaced.

Photo and location sources checked 18 September 2026:
- Orchard official home/contact: https://theorchardfarmstall.co.za/ and https://theorchardfarmstall.co.za/contact/ . Coordinates from the site's GeoCoordinates metadata. Photo: https://theorchardfarmstall.co.za/wp-content/uploads/2025/04/Cozy-indoor-and-outdoor-seating-800x533.jpg
- Houw Hoek official home/contact: https://houwhoekfarmstall.com/ and https://houwhoekfarmstall.com/contact/ . Location from the official map link (approximate map centre). Photo: https://houwhoekfarmstall.com/wp-content/uploads/2024/10/Houw-Hoek-Farm-Stall-Website-8.jpg

Photos were visually inspected and are linked to their venue source in the card. These are third-party venue-owned images, not assets licensed as our own; reuse permission has not been established. The app currently loads them from the venue URLs, with map fallback if unavailable. No generated venue photo fallback remains in activity review cards.

`QuestStopPreview` accepts a `PlaceExperience`. `googlePlaceExperience` converts a Google Places New response and server-resolved photo URLs into that view model. The mapping has fixture tests for ratings, counts, review text, credits, missing photos and unsafe URLs. This is a prepared display adapter, not a connected Google integration.

## Connecting real data

1. Enable billing and Places API (New). Keep the restricted web-service key on a server, not in an EXPO_PUBLIC environment variable.
2. Resolve each activity to a Google place ID using Text Search with its name and coordinates; require a geographic/name match instead of accepting the first result blindly.
3. An authenticated server endpoint fetches Place Details with an explicit field mask: id,displayName,location,primaryTypeDisplayName,rating,userRatingCount,photos,reviews,googleMapsUri. Rate-limit requests and cap photo/review counts.
4. Resolve photo resource names using Place Photos (New), preserving photographer credits and source URLs. Do not persist expiring photo resource names or copy Google review content into trip drafts. Persist place IDs and fetch current details as needed.
5. Pass the response through `googlePlaceExperience`, then provide it to the card. Missing photos/ratings/reviews have honest empty states; never substitute demo reviews into a live result.
6. Complete attribution before release: Google Maps branding, all available author names/profile links/avatars, individual photo/review Google Maps source links and review-order notice. The current adapter preserves basic credits; remaining source/author fields must be added when the live endpoint is implemented.
7. Google Places results shown on a map must use a Google map. Do not add Google-sourced POIs to the current Mapbox route map. Decide the Google map/detail-screen presentation before connecting live search.
8. Test live success, unmatched places, no-photo/no-review results, API denial/quota failures and photo expiry on web and iPhone.

Adding a key alone does not enable this. The server endpoint and place matching are still required.

References:
- https://developers.google.com/maps/documentation/places/web-service/place-details
- https://developers.google.com/maps/documentation/places/web-service/place-photos
- https://developers.google.com/maps/documentation/places/web-service/policies
