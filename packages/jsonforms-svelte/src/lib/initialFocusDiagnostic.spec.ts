import { expect, it, vi } from 'vite-plus/test';
import { InitialFocusDiagnostic } from './initialFocusDiagnostic.svelte';

it('reports simultaneous requests once without choosing or mutating either target', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const diagnostic = new InitialFocusDiagnostic();
    const first = Symbol();
    const second = Symbol();
    diagnostic.update(first, 'first');
    await Promise.resolve();
    expect(warn).not.toHaveBeenCalled();
    diagnostic.update(second, 'second');
    await Promise.resolve();
    expect(warn).toHaveBeenCalledExactlyOnceWith('focus.conflict', {
      paths: ['first', 'second'],
    });
    diagnostic.update(first, undefined);
    diagnostic.update(first, 'first');
    await Promise.resolve();
    expect(warn).toHaveBeenCalledTimes(1);
  } finally {
    warn.mockRestore();
  }
});

it('does not report a request removed before the mounted view settles', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const diagnostic = new InitialFocusDiagnostic();
    const first = Symbol();
    const second = Symbol();
    diagnostic.update(first, 'first');
    diagnostic.update(second, 'second');
    diagnostic.update(second, undefined);
    await Promise.resolve();
    expect(warn).not.toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
