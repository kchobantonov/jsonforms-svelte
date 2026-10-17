import { expect, it } from 'vitest';
import { createAjv } from './validate';

it('registers cron in document validation without changing the stored expression', () => {
  const ajv = createAjv();
  const validate = ajv.compile({
    type: 'object',
    properties: { schedule: { type: 'string', format: 'cron' } },
  });
  for (const schedule of ['@daily', '0 0 9 * * MON-FRI', '0 0 9 L * *', '0 0 9 * * FRI#2']) {
    const data = { schedule };
    expect(validate(data)).toBe(true);
    expect(data.schedule).toBe(schedule);
  }
  expect(validate({ schedule: '0 9 * * *' })).toBe(false);
  expect(validate.errors?.[0]).toMatchObject({ keyword: 'format', instancePath: '/schedule' });
});
