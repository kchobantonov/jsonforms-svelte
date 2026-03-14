import { describe, expect, it } from 'vitest';
import { mapButtonColorToSkeletonClass } from '../../src/lib/controls/buttonColors';

describe('mapButtonColorToSkeletonClass', () => {
  it('maps semantic colors to Skeleton presets', () => {
    expect(mapButtonColorToSkeletonClass('primary')).toBe('preset-filled-primary-500');
    expect(mapButtonColorToSkeletonClass('secondary')).toBe('preset-outlined');
    expect(mapButtonColorToSkeletonClass('alternative')).toBe('preset-tonal');
    expect(mapButtonColorToSkeletonClass('success')).toBe('preset-filled-success-500');
    expect(mapButtonColorToSkeletonClass('warning')).toBe('preset-filled-warning-500');
    expect(mapButtonColorToSkeletonClass('error')).toBe('preset-filled-error-500');
  });

  it('falls back for unsupported framework-specific colors', () => {
    expect(mapButtonColorToSkeletonClass('red')).toBe('preset-filled');
    expect(mapButtonColorToSkeletonClass('green')).toBe('preset-filled');
    expect(mapButtonColorToSkeletonClass(undefined)).toBe('preset-filled');
  });
});
