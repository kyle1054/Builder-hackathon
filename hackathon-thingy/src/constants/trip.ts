import { MAP_PLACES } from './map-places';

export type Interest = 'Scenic' | 'Food' | 'Local lore' | 'Curiosity';
export type ActivityStatus = 'planned' | 'suggested' | 'skipped';
export const TRIP = {
  origin: MAP_PLACES.origin.name,
  destination: MAP_PLACES.destination.name,
  destinationAddress: MAP_PLACES.destination.address,
  title: `${MAP_PLACES.origin.name} to ${MAP_PLACES.destination.name}`,
  region: 'The Overberg',
  description: 'Leave Stellenbosch for a drive through the orchards and mountain passes of the Overberg. Stop in Elgin, pause at Houw Hoek, and continue through Stanford and Baardskeerdersbos to Tierfontein Farm, Erf 52. Leave time for a village wander before settling in at the farm.',
  note: 'Sample itinerary. Stop locations and timings are illustrative.',
};
export const TRIP_ACTIVITIES = [
  { id: 'farmstall', category: 'Food' as Interest, title: 'An orchard lunch', place: 'Elgin Valley', progress: 38, detour: 7, duration: 25, image: 'farm' as const, summary: 'Apple pie, coffee and a table overlooking the orchards.', description: 'Pull off the main road for a relaxed farmstall stop. Pick up something for lunch, find a table outside and leave a little room for apple pie. A good chance for everyone to stretch their legs.', bring: 'Bring an appetite. Allow 25 minutes at the stop.' },
  { id: 'viewpoint', category: 'Scenic' as Interest, title: 'A pause above the valley', place: 'Houw Hoek Pass', progress: 52, detour: 5, duration: 10, image: 'road' as const, summary: 'A short break for the mountain views and a photo together.', description: 'Take a breather as the route climbs through the mountains. This scenic stop is a chance to get out of the car, take in the valley and capture a photo for the trip journal. Use a designated parking area before stopping.', bring: 'A light layer and your camera. Allow 10 minutes.' },
  { id: 'village', category: 'Local lore' as Interest, title: 'The village on foot', place: 'Baardskeerdersbos', progress: 94, detour: 0, duration: 20, image: 'farm' as const, summary: 'Trade the car for a short walk through the village.', description: 'Before reaching the farm, stop in Baardskeerdersbos, leave the car and explore at walking pace. Follow the main street, look at the old buildings and find a spot to sit. Add anything that catches your eye to your private Chronicle.', bring: 'Comfortable shoes. Allow 20 minutes.' },
  { id: 'find', category: 'Curiosity' as Interest, title: 'Find something unexpected', place: 'Tierfontein Farm', progress: 99, detour: 0, duration: 10, image: 'road' as const, summary: 'One small detail each. A leaf, a view, a flower by the farm.', description: 'At Tierfontein Farm, give everyone ten minutes to find a detail they would normally walk past. Photograph it and add a sentence to the Chronicle. Compare your finds when you meet back at the farm.', bring: 'Your phone and a little curiosity. Allow 10 minutes.' },
];
export type TripActivity = typeof TRIP_ACTIVITIES[number];
