import { expect, it } from 'vite-plus/test';
import { createRendererAjv } from './validator';
import {
  resolveTemporalDataBounds,
  resolveTemporalDataPointer,
  temporalDateMode,
  temporalRestrict,
  temporalTimeColumns,
  temporalSaveFormatIsValid,
  timeValueWithinOffsetBounds,
} from './temporalOptions';
it('orders offset-bearing time bounds on the validator reference date', () => {
  const bounds = { formatMinimum: '09:00:00Z', formatExclusiveMaximum: '13:00:00Z' };
  expect(timeValueWithinOffsetBounds('00:00:00-10:00', bounds)).toBe(true);
  expect(timeValueWithinOffsetBounds('02:59:00-10:00', bounds)).toBe(true);
  expect(timeValueWithinOffsetBounds('03:00:00-10:00', bounds)).toBe(false);
  expect(timeValueWithinOffsetBounds('23:00:00-10:00', bounds)).toBe(false);
  expect(timeValueWithinOffsetBounds('09:00:00Z', bounds)).toBe(true);
  expect(timeValueWithinOffsetBounds('08:59:00Z', bounds)).toBe(false);
  expect(timeValueWithinOffsetBounds('09:00:00', { formatMinimum: '08:00:00' })).toBeUndefined();
});
it('agrees with schema validation for inclusive and exclusive offset time bounds', () => {
  const ajv = createRendererAjv();
  const cases = [
    {
      bounds: { formatExclusiveMinimum: '09:00:00Z', formatMaximum: '13:00:00Z' },
      values: [
        '08:59:59Z',
        '09:00:00Z',
        '09:00:01Z',
        '00:00:00-10:00',
        '03:00:00-10:00',
        '03:00:01-10:00',
      ],
    },
    {
      bounds: { formatMinimum: '09:00:00Z', formatExclusiveMaximum: '13:00:00Z' },
      values: ['08:59:59Z', '09:00:00Z', '12:59:59Z', '13:00:00Z', '00:00:00-10:00'],
    },
    {
      bounds: { formatMinimum: '09:00:00Z', formatMaximum: '14:00:00' },
      values: ['09:00:00Z', '10:00:00Z', '11:00:00-04:00', '14:00:00Z'],
    },
  ];
  for (const { bounds, values } of cases) {
    const validate = ajv.compile({ type: 'string', format: 'time', ...bounds });
    for (const value of values) {
      expect(timeValueWithinOffsetBounds(value, bounds), value).toBe(validate(value));
    }
  }
});
it('resolves temporal restriction from local and flat config, ignoring the removed namespace', () => {
  expect(temporalRestrict(undefined, undefined)).toBe(true);
  expect(temporalRestrict(undefined, { restrict: false })).toBe(false);
  expect(temporalRestrict(undefined, { jsonformsExtended: { restrict: false } })).toBe(true);
  expect(temporalRestrict({ restrict: false }, { restrict: true })).toBe(false);
  expect(temporalRestrict({ restrict: true }, { restrict: false })).toBe(true);
  expect(
    temporalRestrict(
      { restrict: false },
      { jsonformsExtended: { restrict: true }, restrict: true },
    ),
  ).toBe(false);
  expect(
    temporalRestrict(
      { restrict: true },
      { jsonformsExtended: { restrict: false }, restrict: false },
    ),
  ).toBe(true);
});
it('resolves relative sibling bounds and escaped or empty member names safely', () => {
  const data = {
    range: { from: '2026-10-01', '': '2026-10-02', 'a/b': '2026-10-03', 'a~b': '2026-10-04' },
  };
  expect(resolveTemporalDataPointer('1/from', 'range.to', data)).toBe('2026-10-01');
  expect(resolveTemporalDataPointer('1/', 'range.to', data)).toBe('2026-10-02');
  expect(resolveTemporalDataPointer('1/a~1b', 'range.to', data)).toBe('2026-10-03');
  expect(resolveTemporalDataPointer('1/a~0b', 'range.to', data)).toBe('2026-10-04');
  expect(
    resolveTemporalDataPointer('1/from.date', 'range.to', {
      range: { 'from.date': '2026-10-05', from: { date: '2026-10-06' } },
    }),
  ).toBe('2026-10-05');
  expect(
    resolveTemporalDataPointer('1/from', ['range', 'to.date'], {
      range: { from: '2026-10-07', 'to.date': '2026-10-08' },
    }),
  ).toBe('2026-10-07');
  expect(resolveTemporalDataPointer('1/toString', 'range.to', data)).toBeUndefined();
  expect(resolveTemporalDataPointer('3/from', 'range.to', data)).toBeUndefined();
  expect(resolveTemporalDataPointer('1#', 'range.to', data)).toBeUndefined();
});
it('resolves absolute temporal bounds from the document root without inherited members', () => {
  const data = {
    range: { from: '2026-10-10', '': '2026-10-11', 'a/b': '2026-10-12', 'a~b': '2026-10-13' },
  };
  expect(resolveTemporalDataPointer('/range/from', 'elsewhere.to', data)).toBe('2026-10-10');
  expect(resolveTemporalDataPointer('/range/', 'elsewhere.to', data)).toBe('2026-10-11');
  expect(resolveTemporalDataPointer('/range/a~1b', 'elsewhere.to', data)).toBe('2026-10-12');
  expect(resolveTemporalDataPointer('/range/a~0b', 'elsewhere.to', data)).toBe('2026-10-13');
  expect(resolveTemporalDataPointer('', 'elsewhere.to', data)).toBe(data);
  expect(resolveTemporalDataPointer('/range/toString', 'elsewhere.to', data)).toBeUndefined();
  expect(
    resolveTemporalDataBounds({ formatMinimum: { $data: '/range/from' } }, 'elsewhere.to', data),
  ).toEqual({
    formatMinimum: '2026-10-10',
  });
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
it('resolves bounds in composed temporal branches without changing data keywords or other formats', () => {
  const schema = {
    allOf: [
      { type: 'string', format: 'date', formatMinimum: { $data: '1/from' } },
      { type: 'string', format: 'date', formatMaximum: { $data: '/until' } },
    ],
    default: { formatMinimum: { $data: '/until' } },
    oneOf: [{ type: 'string', format: 'file', formatMinimum: { $data: '/size' } }],
  };
  const result = resolveTemporalDataBounds(schema, ['to.date'], {
    from: '2026-10-10',
    until: '2026-10-20',
    size: 12,
  });
  expect(result.allOf).toEqual([
    { type: 'string', format: 'date', formatMinimum: '2026-10-10' },
    { type: 'string', format: 'date', formatMaximum: '2026-10-20' },
  ]);
  expect(result.default).toEqual(schema.default);
  expect(result.oneOf).toEqual(schema.oneOf);
  expect(schema.allOf[0].formatMinimum).toEqual({ $data: '1/from' });
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
it('selects calendar mode from views, then display format rather than storage format', () => {
  expect(temporalDateMode(['year', 'month'], 'YYYY-MM-DD')).toBe('month');
  expect(temporalDateMode(['day'], 'YYYY-MM')).toBe('date');
  expect(temporalDateMode(['hours'], 'YYYY-MM')).toBe('month');
  expect(temporalDateMode(undefined, 'YYYY-MM')).toBe('month');
  expect(temporalDateMode(undefined, 'YYYY-MM-DD')).toBe('date');
});
it('detects missing seconds, offsets and padding only for schema-selected temporal formats', () => {
  expect(temporalSaveFormatIsValid('time', '04:05:06+00:00')).toBe(true);
  expect(temporalSaveFormatIsValid('time', '04:05')).toBe(false);
  expect(temporalSaveFormatIsValid('time', '04:05:06')).toBe(false);
  expect(temporalSaveFormatIsValid('time', '4:05:06+00:00')).toBe(false);
  expect(temporalSaveFormatIsValid('date-time', '2001-02-03T04:05:06Z')).toBe(true);
  expect(temporalSaveFormatIsValid(undefined, '2001/2/3 4:05 am')).toBe(true);
});
