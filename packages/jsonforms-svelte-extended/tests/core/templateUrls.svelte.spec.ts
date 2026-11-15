import { afterEach, expect, it, vi } from 'vite-plus/test';
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
  expect(JSON.stringify(warn.mock.calls)).not.toContain('private');
  expect(warn).toHaveBeenCalledTimes(5);
  expect(warn).toHaveBeenCalledWith('template.urlRefused', {
    severity: 'warning',
    message: 'Refused URL attribute data on object.',
    details: { tag: 'object', attribute: 'data' },
  });
  expect(warn.mock.calls.every(([code]) => code === 'template.urlRefused')).toBe(true);
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
it('requires image data opt-in and an image MIME even when the host allows data URLs', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const root = document.createElement('section');
  root.innerHTML =
    '<img src="data:image/png;base64,AAAA" srcset="data:text/html,private 1x"><video poster="data:text/html,private"></video><img src="data:text/html,private">';
  const broadPolicy = { ...defaultUrlPolicy, allowedSchemes: ['https', 'data'] };
  expect(sanitizeTemplateUrls(root, broadPolicy)).toBe(4);
  expect(root.querySelector('img')?.hasAttribute('src')).toBe(false);
  expect(root.querySelector('img')?.hasAttribute('srcset')).toBe(false);
  expect(root.querySelector('video')?.hasAttribute('poster')).toBe(false);
  expect(root.querySelectorAll('img')[1].hasAttribute('src')).toBe(false);

  root.innerHTML =
    '<img src="data:image/png;base64,AAAA" srcset="data:text/html,private 1x"><video poster="data:text/html,private"></video>';
  expect(sanitizeTemplateUrls(root, { ...broadPolicy, allowImageDataUrls: true })).toBe(2);
  expect(root.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
  expect(root.querySelector('img')?.hasAttribute('srcset')).toBe(false);
  expect(root.querySelector('video')?.hasAttribute('poster')).toBe(false);
});
it('does not treat audio or video source URLs as image loads', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const root = document.createElement('section');
  root.innerHTML =
    '<video><source src="data:image/png;base64,AAAA"></video><picture><source srcset="data:image/png;base64,AAAA 1x"></picture>';
  const policy = { ...defaultUrlPolicy, allowImageDataUrls: true };
  expect(sanitizeTemplateUrls(root, policy)).toBe(1);
  expect(root.querySelector('video source')?.hasAttribute('src')).toBe(false);
  expect(root.querySelector('picture source')?.hasAttribute('srcset')).toBe(true);
});
it('applies the image data policy to SVG image href attributes', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const root = document.createElement('section');
  root.innerHTML =
    '<svg><image href="data:image/png;base64,AAAA" xlink:href="data:text/html,private"></image><filter><feImage href="data:text/html,private"></feImage></filter></svg>';
  const policy = { ...defaultUrlPolicy, allowedSchemes: ['https', 'data'] };
  expect(sanitizeTemplateUrls(root, policy)).toBe(3);
  const image = root.querySelector('image')!;
  const filterImage = root.querySelector('feImage')!;
  expect(image.hasAttribute('href')).toBe(false);
  expect(image.hasAttribute('xlink:href')).toBe(false);
  expect(filterImage.hasAttribute('href')).toBe(false);

  image.setAttribute('href', 'data:image/png;base64,AAAA');
  image.setAttribute('xlink:href', 'data:text/html,private');
  filterImage.setAttribute('href', 'data:image/svg+xml,<svg/>');
  expect(sanitizeTemplateUrls(root, { ...policy, allowImageDataUrls: true })).toBe(1);
  expect(image.getAttribute('href')).toBe('data:image/png;base64,AAAA');
  expect(image.hasAttribute('xlink:href')).toBe(false);
  expect(filterImage.getAttribute('href')).toBe('data:image/svg+xml,<svg/>');
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

it('restores a refused literal URL on the same element when policy permits it again', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const root = document.createElement('section');
  root.innerHTML = '<a href="mailto:person@example.org">Mail</a>';
  const anchor = root.querySelector('a')!;
  const refused = new Map<Element, Map<string, string>>();
  const strict = { ...defaultUrlPolicy, allowedSchemes: ['https'] };
  expect(sanitizeTemplateUrls(root, strict, undefined, refused)).toBe(1);
  expect(anchor.hasAttribute('href')).toBe(false);
  expect(sanitizeTemplateUrls(root, defaultUrlPolicy, undefined, refused)).toBe(0);
  expect(root.querySelector('a')).toBe(anchor);
  expect(anchor.getAttribute('href')).toBe('mailto:person@example.org');
  expect(refused.size).toBe(0);
});
