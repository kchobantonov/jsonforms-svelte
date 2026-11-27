/** The Skeleton text-input utility changes the geometry of native checkboxes. */
export const checkboxClass = (classes?: string) =>
  (classes ?? '')
    .split(/\s+/)
    .filter((token) => token && token !== 'input')
    .join(' ');
