import { describe, expect, it, vi } from 'vitest';
import { createAppearanceTheme } from '../src/lib/runtime/ag-grid-runtime';

describe('AG Grid appearance theme', () => {
  it('inherits the host color scheme so design-system light-dark tokens follow dark mode', () => {
    const withParams = vi.fn(() => ({}) as never);
    const runtime = {
      themeQuartz: { withParams },
    } as unknown as Parameters<typeof createAppearanceTheme>[0];

    createAppearanceTheme(runtime);

    expect(withParams).toHaveBeenCalledWith(
      expect.objectContaining({
        browserColorScheme: 'inherit',
        backgroundColor: 'var(--jsonforms-ag-grid-background)',
        foregroundColor: 'var(--jsonforms-ag-grid-foreground)',
      }),
    );
  });
});
