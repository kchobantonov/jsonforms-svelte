/** Placement sizing extension shared by runtime layouts and design canvases. */
export const HORIZONTAL_COLUMNS = 16;
export function isValidColumns(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === 'auto' ||
    (typeof value === 'number' && Number.isInteger(value) && value >= 2 && value <= 16)
  );
}
export function horizontalLayoutWidths(
  values: readonly unknown[],
  gap = 'calc(var(--spacing, 0.25rem) * 4)',
) {
  const fixed = values.map((value) =>
    typeof value === 'number' && isValidColumns(value) ? value : undefined,
  );
  const rows: number[][] = [[]];
  let used = 0;
  const allAuto = fixed.every((value) => value === undefined);
  fixed.forEach((value, index) => {
    const minimum = value ?? 2;
    if (!allAuto && used + minimum > 16) {
      rows.push([]);
      used = 0;
    }
    rows.at(-1)!.push(index);
    used += minimum;
  });
  return rows.flatMap((indices, row) => {
    const reserved = indices.reduce((sum, index) => sum + (fixed[index] ?? 0), 0);
    const autos = indices.filter((index) => fixed[index] === undefined).length;
    return indices.map((index) => {
      const columns = fixed[index] ?? (16 - reserved) / autos;
      const fraction = columns / 16;
      return {
        row,
        columns,
        style: `flex: 0 0 calc(${fraction * 100}% - ${gap} * ${(indices.length - 1) * fraction}); min-width: 0;`,
        diagnostic: isValidColumns(values[index])
          ? undefined
          : 'Columns must be Auto or an integer from 2 through 16.',
      };
    });
  });
}
