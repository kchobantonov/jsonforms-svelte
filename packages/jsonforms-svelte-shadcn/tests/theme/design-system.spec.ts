import { describe, expect, it } from 'vitest';
import {
  buildShadcnDesignSystemCss,
  defaultShadcnDesignSystem,
  designSystemBaseColors,
  designSystemIconLibraries,
  designSystemStyles,
  normalizeShadcnDesignSystem,
  randomizeShadcnDesignSystem,
} from '../../src/lib/theme/design-system';

describe('Shadcn design system', () => {
  it('normalizes invalid persisted values', () => {
    expect(normalizeShadcnDesignSystem({ style: 'missing', baseColor: 'missing' })).toEqual(
      defaultShadcnDesignSystem,
    );
  });

  it('generates native and shadow-root theme styles', () => {
    const config = normalizeShadcnDesignSystem({
      ...defaultShadcnDesignSystem,
      style: 'maia',
      baseColor: 'mauve',
      theme: 'violet',
      radius: 'large',
    });
    const nativeCss = buildShadcnDesignSystemCss(config);
    const shadowCss = buildShadcnDesignSystemCss(config, ':host', ":host([data-mode='dark'])");

    expect(nativeCss).toContain(":root[data-style='maia']");
    expect(nativeCss).toContain('--radius: 0.875rem');
    expect(nativeCss).toContain('@media (prefers-color-scheme: dark)');
    expect(shadowCss).toContain(":host([data-style='maia'])");
    expect(shadowCss).toContain(":host([data-mode='system'])");
  });

  it('uses contrasting primary foregrounds for neutral themes', () => {
    const css = buildShadcnDesignSystemCss(defaultShadcnDesignSystem);

    expect(css).toContain('--primary: 0 0% 10%');
    expect(css).toContain('--primary-foreground: 0 0% 98%');
    expect(css).toContain('--primary: 0 0% 90%');
    expect(css).toContain('--primary-foreground: 0 0% 10%');
  });

  it('randomizes only supported settings', () => {
    const randomized = randomizeShadcnDesignSystem();

    expect(designSystemStyles.some((item) => item.value === randomized.style)).toBe(true);
    expect(designSystemBaseColors.some((item) => item.value === randomized.baseColor)).toBe(true);
    expect(designSystemIconLibraries.some((item) => item.value === randomized.iconLibrary)).toBe(
      true,
    );
  });
});
