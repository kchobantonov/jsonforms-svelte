import { parseDate, type DateValue } from '@skeletonlabs/skeleton-svelte';

export function currentDate(): DateValue {
  const now = new Date();
  return parseDate(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  );
}
