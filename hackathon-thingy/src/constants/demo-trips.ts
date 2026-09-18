import { MAP_PLACES } from "./map-places";
import { VERIFIED_VENUES, VERIFIED_STARTER_ACTIVITIES } from "./verified-venues";

export const STARTER_ACTIVITIES = VERIFIED_STARTER_ACTIVITIES;
export const DEMO_PAST_TRIPS = [
  {
    id: "sample-overberg",
    name: "The long way to the farm",
    date: "August 22–23, 2026",
    origin: MAP_PLACES.origin,
    destination: MAP_PLACES.destination,
    description:
      "A weekend of orchard stops, mountain views and a slow afternoon at Tierfontein Farm. Everyone brought something for the table.",
    activities: STARTER_ACTIVITIES,
    memories: [
      {
        title: "Steam at Elgin Railway Market",
        person: "Kyle",
        seed: "kyle",
        image: { uri: VERIFIED_VENUES[1].photo },
        photoSource: VERIFIED_VENUES[1].website,
        photoCredit: VERIFIED_VENUES[1].name,
        caption: "The road was half the adventure.",
      },
      {
        title: "Worth stopping for",
        person: "Thandi",
        seed: "thandi",
        image: { uri: VERIFIED_VENUES[0].photo },
        photoSource: VERIFIED_VENUES[0].website,
        photoCredit: VERIFIED_VENUES[0].name,
        caption: "Coffee, apple pie, and no rush to leave.",
      },
    ],
  },
  {
    id: "sample-elgin",
    name: "A morning at the market",
    date: "July 18, 2026",
    origin: MAP_PLACES.origin,
    destination: MAP_PLACES.elgin,
    description:
      "A spontaneous Saturday drive with Sam and Tebogo. A farmstall lunch, a few shared photos and home before sunset.",
    activities: [STARTER_ACTIVITIES[1]],
    memories: [
      {
        title: "A table for four",
        person: "Sam",
        seed: "sam",
        image: { uri: VERIFIED_VENUES[1].photo },
        photoSource: VERIFIED_VENUES[1].website,
        photoCredit: VERIFIED_VENUES[1].name,
        caption: "We only meant to stop for coffee.",
      },
      {
        title: "A train at the market",
        person: "Tebogo",
        seed: "tebogo",
        image: { uri: VERIFIED_VENUES[1].photo },
        photoSource: VERIFIED_VENUES[1].website,
        photoCredit: VERIFIED_VENUES[1].name,
        caption: "Windows down all the way home.",
      },
    ],
  },
];
