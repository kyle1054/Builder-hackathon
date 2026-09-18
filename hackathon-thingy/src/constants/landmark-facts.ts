export const LANDMARK_FACTS = [
  {
    id: "kogelberg",
    title: "A whole world of fynbos",
    area: "Kogelberg region",
    latitude: -34.331,
    longitude: 18.96,
    radiusKm: 8,
    body: "The Kogelberg Biosphere Reserve protects a remarkable concentration of fynbos plants. About 150 plant taxa here are endemic: they occur naturally only in this area.",
    source: "Department of Forestry, Fisheries and the Environment",
    url: "https://www.dffe.gov.za/kogelberg-biosphere-reserve",
  },
  {
    id: "hermanus",
    title: "Listen for the kelp horn",
    area: "Hermanus",
    latitude: -34.419,
    longitude: 19.243,
    radiusKm: 2,
    body: "Hermanus has a Whale Crier who uses a kelp horn to draw attention to whale sightings. The horn was first heard here in August 1992.",
    source: "Hermanus Tourism",
    url: "https://hermanus-tourism.co.za/about-hermanus/whale-crier/",
  },
];
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = Math.PI / 180,
    dLat = (b.latitude - a.latitude) * rad,
    dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
