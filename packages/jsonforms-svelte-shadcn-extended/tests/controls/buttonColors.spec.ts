import { describe, expect, it } from 'vitest';
import { mapButtonColorToShadcnClass } from '../../src/lib/controls/buttonColors';

describe('mapButtonColorToShadcnClass', () => {
  it('maps semantic colors to Shadcn theme classes', () => {
    expect(mapButtonColorToShadcnClass('primary')).toBe('bg-primary text-primary-foreground');
    expect(mapButtonColorToShadcnClass('secondary')).toBe(
      'border-border bg-background text-foreground hover:bg-muted',
    );
    expect(mapButtonColorToShadcnClass('alternative')).toBe(
      'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    );
    expect(mapButtonColorToShadcnClass('success')).toBe(
      'bg-emerald-600 text-white hover:bg-emerald-600/90',
    );
    expect(mapButtonColorToShadcnClass('warning')).toBe(
      'bg-amber-500 text-black hover:bg-amber-500/90',
    );
    expect(mapButtonColorToShadcnClass('error')).toBe(
      'bg-destructive/10 text-destructive hover:bg-destructive/20',
    );
  });

  it('falls back for unsupported framework-specific colors', () => {
    expect(mapButtonColorToShadcnClass('red')).toBe('bg-primary text-primary-foreground');
    expect(mapButtonColorToShadcnClass('green')).toBe('bg-primary text-primary-foreground');
    expect(mapButtonColorToShadcnClass(undefined)).toBe('bg-primary text-primary-foreground');
  });
});
