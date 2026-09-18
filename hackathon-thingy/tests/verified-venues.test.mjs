import assert from 'node:assert/strict';
import { VERIFIED_STARTER_ACTIVITIES, verifiedVenue, venueExperience } from '../src/constants/verified-venues.ts';
assert.equal(VERIFIED_STARTER_ACTIVITIES.length, 3);
for (const activity of VERIFIED_STARTER_ACTIVITIES) {
  assert.ok(verifiedVenue(activity));
  assert.equal(venueExperience(activity).photos.length, 1);
  assert.equal(venueExperience(activity).rating, undefined);
  assert.deepEqual(venueExperience(activity).reviews, []);
  assert.equal(verifiedVenue({ ...activity, place: { ...activity.place, latitude: 0 } }), undefined);
}
const orchard = VERIFIED_STARTER_ACTIVITIES[0];
assert.ok(verifiedVenue({ ...orchard, place: { ...orchard.place, name: 'Orchard Farm Stall' } }));
console.log('Verified venue matching: passed');
