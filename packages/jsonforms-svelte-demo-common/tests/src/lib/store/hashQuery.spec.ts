import { expect, it } from 'vite-plus/test';
import {
  exampleHashHref,
  readDemoQuery,
  splitHashQuery,
  writeDemoQuery,
} from '../../../../src/lib/store/hashQuery';

it('reads either query location with hash precedence and decoded values', () => {
  const url = new URL(
    'https://example.test/demo?form-only=true&active-tab=data#/examples/a%20b?form-only=false&active-tab=uiSchema',
  );
  expect(readDemoQuery(url, 'form-only')).toBe('false');
  expect(readDemoQuery(url, 'active-tab')).toBe('uiSchema');
  expect(readDemoQuery(url, 'missing')).toBeNull();
  expect(
    readDemoQuery(
      new URL('https://example.test/demo?active-tab=data#/examples/a%20b'),
      'active-tab',
    ),
  ).toBe('data');
  expect(splitHashQuery(url.hash).route).toBe('/examples/a%20b');
});

it('writes a canonical hash setting once and preserves unrelated parameters and route encoding', () => {
  const url = new URL(
    'https://example.test/demo?active-tab=data&campaign=spring#/examples/a%20b?drawer=true&tag=one%20two',
  );
  const written = writeDemoQuery(url, 'active-tab', 'ui Schema');
  expect(written).toBe(
    '/demo?campaign=spring#/examples/a%20b?drawer=true&tag=one+two&active-tab=ui+Schema',
  );
  expect(readDemoQuery(new URL(written, url), 'active-tab')).toBe('ui Schema');
  expect(written).not.toContain('%2520');
  expect(writeDemoQuery(new URL(written, url), 'active-tab', undefined)).toBe(
    '/demo?campaign=spring#/examples/a%20b?drawer=true&tag=one+two',
  );
});

it('normalizes an ordinary query value to the hash without changing another setting', () => {
  const url = new URL(
    'https://example.test/demo?form-only=true&keep=1#/examples/legacy%20name?drawer=false',
  );
  const written = writeDemoQuery(url, 'form-only', 'false');
  expect(written).toBe('/demo?keep=1#/examples/legacy%20name?drawer=false&form-only=false');
  expect(readDemoQuery(new URL(written, url), 'form-only')).toBe('false');
});

it('encodes a selected example and retains all current hash-query settings', () => {
  expect(
    exampleHashHref(
      'Readonly Fields',
      '#/examples/spec-cron-control?form-only=false&drawer=true&tag=one%20two',
    ),
  ).toBe('#/examples/Readonly%20Fields?form-only=false&drawer=true&tag=one+two');
});
