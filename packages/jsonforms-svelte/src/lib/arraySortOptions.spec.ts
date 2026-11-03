import { expect, it } from 'vite-plus/test';
import { showArraySortButtons } from './arraySortOptions';

it('enables array sort actions only for a true shared setting', () => {
  expect(showArraySortButtons(undefined)).toBe(false);
  expect(showArraySortButtons({ showSortButtons: true })).toBe(true);
  expect(showArraySortButtons({ showSortButtons: false })).toBe(false);
  expect(showArraySortButtons({ showSortButtons: 'true' })).toBe(false);
});
