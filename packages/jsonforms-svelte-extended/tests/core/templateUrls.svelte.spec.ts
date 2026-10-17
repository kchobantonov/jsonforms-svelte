import { afterEach, expect, it, vi } from 'vitest';
import { defaultUrlPolicy } from '@chobantonov/jsonforms-svelte';
import { sanitizeTemplateUrls } from '../../src/lib/core/templateUrls';
afterEach(() => vi.restoreAllMocks());

it('checks URL attributes and object data without printing their contents', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const root = document.createElement('section');
  root.innerHTML =
    '<a href="java&#10;script:private()" ping="https://example.org javascript:private()">link</a><object data="data:text/html,private"></object><form action="javascript:private()"><button formaction="javascript:private()">send</button></form>';
  expect(sanitizeTemplateUrls(root)).toBe(5);
  expect(root.querySelector('[href],[ping],[data],[action],[formaction]')).toBeNull();
  expect(warn.mock.calls.flat().join(' ')).not.toContain('private');
  expect(
    warn.mock.calls.flat().every((message) => String(message).startsWith('template.urlRefused:')),
  ).toBe(true);
});
it('preserves opted-in image data candidates and refuses mixed srcset lists', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const root = document.createElement('section');
  root.innerHTML =
    '<img srcset="data:image/png;base64,AAAA 1x, data:image/png;base64,BBBB 2x"><img srcset="data:image/png;base64,AAAA 1x, javascript:bad() 2x">';
  const policy = { ...defaultUrlPolicy, allowImageDataUrls: true };
  expect(sanitizeTemplateUrls(root, policy)).toBe(1);
  expect(root.querySelector('img')?.getAttribute('srcset')).toContain('BBBB');
  expect(root.querySelectorAll('img')[1].hasAttribute('srcset')).toBe(false);
});
it('protects blank targets while leaving delegated renderer DOM to its owner', () => {
  const root = document.createElement('section');
  root.innerHTML =
    '<a href="https://example.org" target="_blank" rel="opener external">link</a><div><a href="blob:owned">download</a></div>';
  const delegated = root.querySelector('div')!;
  expect(sanitizeTemplateUrls(root, defaultUrlPolicy, (node) => !delegated.contains(node))).toBe(0);
  expect(root.querySelector('a')?.rel.split(' ').sort()).toEqual([
    'external',
    'noopener',
    'noreferrer',
  ]);
  expect(delegated.querySelector('a')?.getAttribute('href')).toBe('blob:owned');
});
