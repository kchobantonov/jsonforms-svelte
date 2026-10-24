import { expect, it } from 'vite-plus/test';
import { sliderState } from './slider';

it('uses zero-based multiples and exclusive bounds without binary rounding', () => {
  const profile = sliderState({ type: 'number', minimum: 0.1, maximum: 0.6, multipleOf: 0.2 }, 0.3);
  expect([profile.minimum, profile.maximum, profile.step, profile.position]).toEqual([
    0.2, 0.6, 0.2, 0.4,
  ]);
  expect(profile.invalid).toBe(true);
  expect(profile.accepts(0.3)).toBe(false);
  expect(profile.accepts(0.6)).toBe(true);
  const exclusive = sliderState(
    { type: 'number', exclusiveMinimum: -0.4, exclusiveMaximum: 0.4, multipleOf: 0.2 },
    0,
  );
  expect([exclusive.minimum, exclusive.maximum]).toEqual([-0.2, 0.2]);
});
it('intersects fractional multiples with integer values', () => {
  const profile = sliderState({ type: 'integer', minimum: 1, maximum: 10, multipleOf: 1.5 }, 3);
  expect([profile.minimum, profile.maximum, profile.step]).toEqual([3, 9, 3]);
  expect(profile.accepts(4.5)).toBe(false);
});
it('distinguishes missing, zero, null and numeric strings without committing defaults', () => {
  const schema = { type: 'number', minimum: 0, maximum: 10, default: 5 };
  expect(sliderState(schema, undefined)).toMatchObject({
    missing: true,
    invalid: false,
    position: 5,
  });
  expect(sliderState(schema, 0)).toMatchObject({ missing: false, invalid: false, position: 0 });
  for (const value of ['2', null, false, {}, 20])
    expect(sliderState(schema, value).invalid).toBe(true);
});
it('rejects unusable grids and unsupported numeric representation', () => {
  expect(sliderState({ minimum: 1, maximum: 1.5, multipleOf: 2 }, undefined).usable).toBe(false);
  expect(sliderState({ minimum: 0, maximum: 10, multipleOf: 0 }, undefined).usable).toBe(false);
  expect(sliderState({ minimum: 0, maximum: 1e20 }, undefined).usable).toBe(false);
  expect(sliderState({ minimum: 1, maximum: 2, multipleOf: 1e-20 }, undefined).usable).toBe(false);
});
