import { describe, it, expect } from 'vitest';
import { horizontalLayoutWidths, isValidColumns } from '../src/lib/horizontalLayout';
describe('horizontal column allocation', () => {
  it('keeps fixed widths as full-row fractions and shares Auto space', () => {
    for (const [input, expected] of [
      [[4], [4]],
      [
        [4, undefined],
        [4, 12],
      ],
      [
        [4, undefined, undefined],
        [4, 6, 6],
      ],
      [
        [4, 4],
        [4, 4],
      ],
      [
        [undefined, undefined, undefined],
        [16 / 3, 16 / 3, 16 / 3],
      ],
    ] as [unknown[], number[]][]) {
      expect(horizontalLayoutWidths(input).map((item) => item.columns)).toEqual(expected);
    }
  });
  it('wraps in order, reserves two columns per Auto and does not round fractions', () => {
    expect(
      horizontalLayoutWidths([14, undefined, 4]).map(({ row, columns }) => [row, columns]),
    ).toEqual([
      [0, 14],
      [0, 2],
      [1, 4],
    ]);
    expect(
      horizontalLayoutWidths([16, 4, undefined]).map(({ row, columns }) => [row, columns]),
    ).toEqual([
      [0, 16],
      [1, 4],
      [1, 12],
    ]);
    expect(horizontalLayoutWidths(Array(17).fill(undefined)).every((item) => item.row === 0)).toBe(
      true,
    );
  });
  it('diagnoses invalid imported values and treats them as Auto', () => {
    for (const value of [1, 17, 3.5, '4', true, NaN]) {
      expect(isValidColumns(value)).toBe(false);
      expect(horizontalLayoutWidths([value])[0].columns).toBe(16);
      expect(horizontalLayoutWidths([value])[0].diagnostic).toBeTruthy();
    }
    for (const value of [undefined, null, 'auto', 2, 16]) expect(isValidColumns(value)).toBe(true);
    expect(horizontalLayoutWidths([])).toEqual([]);
  });
});
