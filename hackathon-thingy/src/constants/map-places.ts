export type MapPlace = { name: string; latitude: number; longitude: number; span: number; address?: string };

/** Farm pin from the matching Erf 52 listing; other pins are sample stop area centres. */
export const MAP_PLACES = {
  origin: { name: 'Stellenbosch', latitude: -33.9367, longitude: 18.8614, span: 0.035 },
  destination: {
    name: 'Tierfontein Farm', latitude: -34.567357989868, longitude: 19.606368603176, span: 0.035,
    address: 'Erf 52, Baardskeerdersbos, 7220, South Africa',
  },
  elgin: { name: 'Elgin Valley', latitude: -34.151, longitude: 19.045, span: 0.075 },
  pass: { name: 'Houw Hoek Pass', latitude: -34.204, longitude: 19.146, span: 0.04 },
  village: { name: 'Baardskeerdersbos', latitude: -34.588, longitude: 19.570, span: 0.035 },
} satisfies Record<string, MapPlace>;
export function activityPlace(id: string): MapPlace {
  return id === 'farmstall' ? MAP_PLACES.elgin : id === 'viewpoint' ? MAP_PLACES.pass : id === 'village' ? MAP_PLACES.village : MAP_PLACES.destination;
}
