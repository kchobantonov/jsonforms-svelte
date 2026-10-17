import { expect, it } from 'vitest';
import {
  resolveTemporalDataBounds,
  resolveTemporalDataPointer,
  temporalRestrict,
  temporalTimeColumns,
  temporalSaveFormatIsValid,
} from './temporalOptions';
it('resolves temporal restrict without treating the core seeded false as an authored option', () => {
  expect(temporalRestrict(undefined, { restrict: false })).toBe(true);
  expect(temporalRestrict(undefined, { jsonformsExtended: { restrict: false } })).toBe(false);
  expect(temporalRestrict({ restrict: false }, { jsonformsExtended: { restrict: true } })).toBe(
    false,
  );
  expect(temporalRestrict({ restrict: true }, { jsonformsExtended: { restrict: false } })).toBe(
    true,
  );
});
it('resolves relative sibling bounds and escaped or empty member names safely', () => {
  const data = {
    range: { from: '2026-10-01', '': '2026-10-02', 'a/b': '2026-10-03', 'a~b': '2026-10-04' },
  };
  expect(resolveTemporalDataPointer('1/from', 'range.to', data)).toBe('2026-10-01');
  expect(resolveTemporalDataPointer('1/', 'range.to', data)).toBe('2026-10-02');
  expect(resolveTemporalDataPointer('1/a~1b', 'range.to', data)).toBe('2026-10-03');
  expect(resolveTemporalDataPointer('1/a~0b', 'range.to', data)).toBe('2026-10-04');
  expect(resolveTemporalDataPointer('1/toString', 'range.to', data)).toBeUndefined();
  expect(resolveTemporalDataPointer('3/from', 'range.to', data)).toBeUndefined();
  expect(resolveTemporalDataPointer('1#', 'range.to', data)).toBeUndefined();
});
it('retains literal bounds and drops unresolved references without mutating schema or data', () => {
  const schema = { formatMinimum: { $data: '1/from' }, formatMaximum: '2027-01-01' };
  expect(resolveTemporalDataBounds(schema, 'range.to', { range: { from: '2026-10-01' } })).toEqual({
    formatMinimum: '2026-10-01',
    formatMaximum: '2027-01-01',
  });
  expect(resolveTemporalDataBounds(schema, 'range.to', { range: {} })).toEqual({
    formatMaximum: '2027-01-01',
  });
  expect(schema.formatMinimum).toEqual({ $data: '1/from' });
});

it('keeps time views independent of serialization and ignores date-only views', () => {
  expect(temporalTimeColumns(['hours', 'minutes'])).toEqual({
    hours: true,
    minutes: true,
    seconds: false,
  });
  expect(temporalTimeColumns(['seconds'])).toEqual({ hours: false, minutes: false, seconds: true });
  expect(temporalTimeColumns(['year', 'month'])).toBeUndefined();
  expect(temporalTimeColumns([])).toBeUndefined();
});
it('detects missing seconds, offsets and padding only for schema-selected temporal formats', () => {
  expect(temporalSaveFormatIsValid('time', '04:05:06+00:00')).toBe(true);
  expect(temporalSaveFormatIsValid('time', '04:05')).toBe(false);
  expect(temporalSaveFormatIsValid('time', '04:05:06')).toBe(false);
  expect(temporalSaveFormatIsValid('time', '4:05:06+00:00')).toBe(false);
  expect(temporalSaveFormatIsValid('date-time', '2001-02-03T04:05:06Z')).toBe(true);
  expect(temporalSaveFormatIsValid(undefined, '2001/2/3 4:05 am')).toBe(true);
});
