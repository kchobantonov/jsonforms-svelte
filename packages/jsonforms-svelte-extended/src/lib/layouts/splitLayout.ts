import type { UISchemaElement } from '@jsonforms/core';

/** Initial weighted shares, adapted from the React reference at
 * 150fd688ae09f0f3b28e989649f3daf1d9f6d91d. A splitter has no span grid.
 */
export function initialSplitSizes(elements: UISchemaElement[]): number[] {
  const weights = elements.map((element) => {
    const layout = element.options?.layout;
    if (layout?.span !== undefined) return 1;
    const weight: unknown = layout?.weight;
    return typeof weight === 'number' && Number.isFinite(weight) && weight > 0 ? weight : 1;
  });
  const scale = weights.reduce((max, weight) => Math.max(max, weight), 0);
  const normalized = weights.map((weight) => weight / scale);
  const total = normalized.reduce((sum, weight) => sum + weight, 0);
  return normalized.map((weight) => (weight / total) * 100);
}

export function splitCssSize(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return `${value}px`;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

export interface SplitPaneSizing {
  fixed?: number;
  basis: number;
  weight: number;
  min: number;
  max: number;
}

/** Resolve the initial CSS sizing modes before handing percentages to native panels. */
export function resolveSplitSizing(
  panes: SplitPaneSizing[],
  available: number,
  runtime?: number[],
) {
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const lower = panes.map((pane) => Math.max(0, pane.min));
  const upper = panes.map((pane, i) => Math.max(lower[i], pane.max));
  const base = panes.map((pane, i) => clamp(pane.fixed ?? pane.basis, lower[i], upper[i]));
  const weights = panes.map((pane) => (pane.fixed === undefined ? pane.weight : 0));
  const scale = Math.max(1, ...weights);
  const normalized = weights.map((weight) => weight / scale);
  // Fixed and vertical Auto retain their initial size. Their drag bounds are
  // still the authored min/max, so a fixed initial width is not a locked pane.
  const initialMin = panes.map((_, i) => (weights[i] > 0 ? lower[i] : base[i]));
  const initialMax = panes.map((_, i) => (weights[i] > 0 ? upper[i] : base[i]));
  const extent = clamp(
    Math.max(0, available),
    initialMin.reduce((sum, value) => sum + value, 0),
    initialMax.reduce((sum, value) => sum + value, 0),
  );
  let pixels = base.slice();
  if (runtime?.length === panes.length) pixels = runtime.map((value) => (value * extent) / 100);
  const min = runtime ? lower : initialMin;
  const max = runtime ? upper : initialMax;
  pixels = pixels.map((value, i) => clamp(value, min[i], max[i]));
  for (let pass = 0; pass <= panes.length; pass++) {
    const delta = extent - pixels.reduce((sum, value) => sum + value, 0);
    if (Math.abs(delta) < 1e-6) break;
    const indices = panes
      .map((_, i) => i)
      .filter((i) => (delta > 0 ? pixels[i] < max[i] - 1e-6 : pixels[i] > min[i] + 1e-6));
    const totalWeight = indices.reduce((sum, i) => sum + (runtime ? 1 : normalized[i]), 0);
    if (!totalWeight) break;
    for (const i of indices)
      pixels[i] = clamp(
        pixels[i] + (delta * (runtime ? 1 : normalized[i])) / totalWeight,
        min[i],
        max[i],
      );
  }
  return {
    extent,
    sizes: pixels.map((value) => (extent > 0 ? (value * 100) / extent : 100 / panes.length)),
    minimumSizes: lower.map((value) => (extent > 0 ? Math.min(100, (value * 100) / extent) : 0)),
    maximumSizes: upper.map((value) => (extent > 0 ? Math.min(100, (value * 100) / extent) : 100)),
  };
}
