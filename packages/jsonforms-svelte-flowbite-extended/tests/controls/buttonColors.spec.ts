import { describe, expect, it } from 'vitest';
import { mapButtonColorToFlowbiteColor } from '../../src/lib/controls/buttonColors';

describe('mapButtonColorToFlowbiteColor', () => {
  it('maps semantic colors to Flowbite colors', () => {
    expect(mapButtonColorToFlowbiteColor('primary')).toBe('primary');
    expect(mapButtonColorToFlowbiteColor('secondary')).toBe('secondary');
    expect(mapButtonColorToFlowbiteColor('alternative')).toBe('alternative');
    expect(mapButtonColorToFlowbiteColor('success')).toBe('green');
    expect(mapButtonColorToFlowbiteColor('warning')).toBe('yellow');
    expect(mapButtonColorToFlowbiteColor('error')).toBe('red');
  });

  it('rejects direct framework color names from the shared schema field', () => {
    expect(mapButtonColorToFlowbiteColor('green')).toBeUndefined();
    expect(mapButtonColorToFlowbiteColor('red')).toBeUndefined();
    expect(mapButtonColorToFlowbiteColor('dark')).toBeUndefined();
    expect(mapButtonColorToFlowbiteColor(undefined)).toBeUndefined();
  });
});
