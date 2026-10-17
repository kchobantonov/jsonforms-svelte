/** Percentage bounds shared by the Svelte split-pane adapters. */
export function splitBounds(count: number, minimum: number, mins?: number[], maxs?: number[]) {
  let lower = Array.from({ length: count }, (_, i) =>
    Math.max(0, Math.min(100, Number.isFinite(mins?.[i]) ? mins![i] : minimum)),
  );
  const total = lower.reduce((sum, value) => sum + value, 0);
  if (total > 100) lower = lower.map((value) => (value * 100) / total);
  let upper = lower.map((value, i) =>
    Math.max(value, Math.min(100, Number.isFinite(maxs?.[i]) ? maxs![i] : 100)),
  );
  // Infeasible bounds can occur while a parent is hidden or being resized.
  // Keep the component usable; portable layout sizing resolves its own extent.
  if (upper.reduce((sum, value) => sum + value, 0) < 100) upper = upper.map(() => 100);
  return { lower, upper };
}

export function fitSplitSizes(requested: number[], lower: number[], upper: number[]): number[] {
  const sizes = requested.map((value, i) => Math.max(lower[i], Math.min(upper[i], value)));
  for (let pass = 0; pass <= sizes.length; pass++) {
    const delta = 100 - sizes.reduce((sum, value) => sum + value, 0);
    if (Math.abs(delta) < 1e-7) break;
    const candidates = sizes
      .map((_, i) => i)
      .filter((i) => (delta > 0 ? sizes[i] < upper[i] - 1e-7 : sizes[i] > lower[i] + 1e-7));
    if (!candidates.length) break;
    const share = delta / candidates.length;
    for (const i of candidates) sizes[i] = Math.max(lower[i], Math.min(upper[i], sizes[i] + share));
  }
  return sizes;
}
