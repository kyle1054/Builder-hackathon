import type { PlanActivity } from "@/services/trip-planner";
import type { PlaceExperience } from "@/services/place-experience";

// Venue-owned websites checked 18 September 2026. Photos remain attributed to their source.
export const VERIFIED_VENUES = [
  {
    id: "orchard-farm-stall", name: "The Orchard Farm Stall", aliases: ["Orchard Farm Stall", "The Orchard Farmstall", "Orchard Farmstall"],
    latitude: -34.16197165634038, longitude: 19.01002385889151,
    address: "N2 and R321 Oudebrug intersection, Grabouw",
    website: "https://theorchardfarmstall.co.za/",
    photo: "https://theorchardfarmstall.co.za/wp-content/uploads/2025/04/Cozy-indoor-and-outdoor-seating-800x533.jpg",
    description: "A real farm stall just off the N2 at Grabouw, with a café, baked goods and local produce. Stop for coffee or a meal before continuing through the Overberg.",
    duration: 30,
  },
  {
    id: "elgin-railway-market", name: "Elgin Railway Market", aliases: [],
    latitude: -34.152473, longitude: 19.04294,
    address: "Oak Avenue, Elgin, 7180",
    website: "https://www.elginrailwaymarket.co.za/",
    photo: "https://www.elginrailwaymarket.co.za/wp-content/uploads/2024/06/22-elgin-railway-market-1024x683.webp",
    description: "Food and craft stalls inside a converted apple warehouse, with steam trains arriving beside the market. Full market trading is normally on weekends; check the venue website for your travel date.",
    duration: 45,
  },
  {
    id: "houw-hoek-farm-stall", name: "Houw Hoek Farm Stall", aliases: ["Houw Hoek Farmstall"],
    latitude: -34.2068147, longitude: 19.1485866,
    address: "N2, Houw Hoek, near the mountain pass",
    website: "https://houwhoekfarmstall.com/",
    photo: "https://houwhoekfarmstall.com/wp-content/uploads/2024/10/Houw-Hoek-Farm-Stall-Website-8.jpg",
    description: "A family-run farm stall beside the N2, established in 1980. Its bakery, pies and restaurant make it a practical refreshment stop near Houw Hoek Pass.",
    duration: 20,
  },
];
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
export function verifiedVenue(activity: PlanActivity) {
  return VERIFIED_VENUES.find(v =>
    [v.name, ...v.aliases].some(name => normalize(name) === normalize(activity.place.name)) &&
    Math.abs(activity.place.latitude - v.latitude) < 0.025 && Math.abs(activity.place.longitude - v.longitude) < 0.025,
  );
}
export function venueExperience(activity: PlanActivity): PlaceExperience {
  const venue = verifiedVenue(activity);
  return { demo: false, photos: venue ? [{ url: venue.photo, authors: [{ name: venue.name, url: venue.website }] }] : [], reviews: [] };
}
export const VERIFIED_STARTER_ACTIVITIES: PlanActivity[] = VERIFIED_VENUES.map(v => ({
  id: v.id, title: v.name, description: v.description, duration: v.duration,
  place: { name: v.name, latitude: v.latitude, longitude: v.longitude, span: 0.015, address: v.address }, included: true,
}));
