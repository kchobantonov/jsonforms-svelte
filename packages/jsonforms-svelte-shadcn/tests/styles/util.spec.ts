import { describe, expect, it } from 'vitest';
import type { Styles } from '../../src/lib/styles/styles';
import { classes, mergeStyles } from '../../src/lib/styles/util';

describe('styles/util', () => {
  it('builds class strings and trims the final result', () => {
    const variant = 'primary';

    expect(classes`  btn ${variant}  `).toBe('btn primary');
  });

  it('merges style class strings without mutating the source object', () => {
    const base: Partial<Styles> = {
      control: { root: 'base-root', input: 'base-input' },
      group: { root: 'group-root' },
    };
    const override: Partial<Styles> = {
      control: { root: 'override-root', asterisk: 'asterisk' },
      group: { label: 'group-label' },
    };

    const merged = mergeStyles(base, override);

    expect(merged.control?.root).toBe('base-root override-root');
    expect(merged.control?.input).toBe('base-input');
    expect(merged.control?.asterisk).toBe('asterisk');
    expect(merged.group?.root).toBe('group-root');
    expect(merged.group?.label).toBe('group-label');

    expect(base.control?.root).toBe('base-root');
    expect(base.control?.asterisk).toBeUndefined();
  });
});
