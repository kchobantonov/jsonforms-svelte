import { expect, it } from 'vite-plus/test';
import { showArraySortButtons } from './arraySortOptions';

it.each(['layout', 'table'] as const)('ORs generic and %s-specific sort flags', (presentation) => {
  const specific =
    presentation === 'layout' ? 'showArrayLayoutSortButtons' : 'showArrayTableSortButtons';
  const other =
    presentation === 'layout' ? 'showArrayTableSortButtons' : 'showArrayLayoutSortButtons';
  expect(showArraySortButtons(undefined, presentation)).toBe(false);
  expect(showArraySortButtons({ [specific]: true }, presentation)).toBe(true);
  expect(showArraySortButtons({ showSortButtons: true, [specific]: false }, presentation)).toBe(
    true,
  );
  expect(showArraySortButtons({ showSortButtons: false, [specific]: true }, presentation)).toBe(
    true,
  );
  expect(showArraySortButtons({ [other]: true }, presentation)).toBe(false);
  expect(showArraySortButtons({ showSortButtons: 'true', [specific]: 1 }, presentation)).toBe(
    false,
  );
});
