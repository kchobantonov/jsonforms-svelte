import { describe, expect, it } from 'vitest';
import messages from './locales/messages.json';
import { rendererMessage } from './rendererMessages';

describe('renderer message catalogs', () => {
  it('resolves regional locales and falls back for languages without a bundled catalog', () => {
    expect(rendererMessage('BG_bg', 'control.clearValue')).toBe('Изчистване на стойността');
    expect(rendererMessage('en-US', 'control.clearValue')).toBe('Clear value');
    expect(rendererMessage('ja-JP', 'control.clearValue')).toBe('Clear value');
    expect(rendererMessage(undefined, 'unknown.message')).toBe('unknown.message');
    expect(rendererMessage('__proto__', 'control.clearValue')).toBe('Clear value');
  });

  it('ships matching message keys and parameter names in each catalog', () => {
    const keys = Object.keys(messages.en).sort();
    for (const catalog of Object.values(messages)) {
      expect(Object.keys(catalog).sort()).toEqual(keys);
      for (const key of keys) {
        const parameters = (value: string) =>
          [...value.matchAll(/\$?\{(\w+)\}/g)].map((match) => match[1]).sort();
        expect(parameters(catalog[key as keyof typeof catalog])).toEqual(
          parameters(messages.en[key as keyof typeof messages.en]),
        );
      }
    }
  });
});
