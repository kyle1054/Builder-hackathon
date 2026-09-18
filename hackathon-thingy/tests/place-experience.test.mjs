import assert from 'node:assert/strict';
import { googlePlaceExperience } from '../src/services/place-experience.ts';
const details = {
  rating: 4.6, userRatingCount: 42, googleMapsUri: 'https://maps.google.com/place',
  photos: [{ name: 'places/test/photos/one', authorAttributions: [{ displayName: 'Photographer', uri: 'https://example.com/author' }] }],
  reviews: [{ rating: 4, text: { text: 'A useful stop.' }, relativePublishTimeDescription: 'A week ago', authorAttribution: { displayName: 'Traveller', uri: 'https://example.com/reviewer' } }],
};
const result = googlePlaceExperience(details, { 'places/test/photos/one': 'https://example.com/resolved-photo.jpg' });
assert.equal(result.demo, false);
assert.equal(result.rating, 4.6);
assert.equal(result.reviewCount, 42);
assert.equal(result.photos[0].authors[0].name, 'Photographer');
assert.equal(result.photos[0].url, 'https://example.com/resolved-photo.jpg');
assert.equal(result.reviews[0].text, 'A useful stop.');
assert.equal(result.reviews[0].author, 'Traveller');
assert.deepEqual(googlePlaceExperience({}, {}).photos, []);
assert.deepEqual(googlePlaceExperience(details, {}).photos, []);
assert.deepEqual(googlePlaceExperience(details, { 'places/test/photos/one': 'javascript:alert(1)' }).photos, []);
console.log('Place experience mapping: passed');
