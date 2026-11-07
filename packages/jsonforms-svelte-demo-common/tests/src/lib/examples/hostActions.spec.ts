import { expect, it, vi } from 'vite-plus/test';
import { resolveDemoHostAction } from '../../../../src/lib/examples/hostActions';

it('registers portable locale and theme commands with the host', () => {
  const setLocale = vi.fn();
  const toggleMode = vi.fn();
  const host = { setLocale, toggleMode };
  resolveDemoHostAction('changeLang', { lang: 'bg' }, host)?.();
  resolveDemoHostAction('setLocale', { locale: 'en' }, host)?.();
  resolveDemoHostAction('toggleMode', {}, host)?.();
  expect(setLocale.mock.calls).toEqual([['bg'], ['en']]);
  expect(toggleMode).toHaveBeenCalledOnce();
  expect(resolveDemoHostAction('unknown', {}, host)).toBeUndefined();
  expect(resolveDemoHostAction('changeLang', { lang: 42 }, host)).toBeUndefined();
});
