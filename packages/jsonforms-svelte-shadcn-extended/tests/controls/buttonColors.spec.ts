import { expect, it } from 'vite-plus/test';
import { mapButtonColorToShadcnVariant } from '../../src/lib/controls/buttonColors';

it.each([
  ['primary', 'default'],
  ['secondary', 'outline'],
  ['alternative', 'secondary'],
  ['success', 'default'],
  ['warning', 'outline'],
  ['error', 'destructive'],
])('maps semantic %s to the native %s variant used by the React reference', (color, variant) => {
  expect(mapButtonColorToShadcnVariant(color)).toBe(variant);
});
it('uses the native default for unsupported framework-specific colors', () => {
  for (const color of ['red', 'green', undefined])
    expect(mapButtonColorToShadcnVariant(color)).toBe('default');
});
