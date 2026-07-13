import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import Icon from '../../src/lib/components/icons/Icon.svelte';
import { setIconLibrary } from '../../src/lib/components/icons/icon-library.svelte';

describe('Icon', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-icon-library');
    cleanup();
  });

  it('changes the rendered glyph when the icon library changes', async () => {
    document.documentElement.dataset.iconLibrary = 'lucide';
    setIconLibrary('lucide');
    const view = render(Icon, { props: { name: 'trash', class: 'size-4' } });

    await vi.waitFor(() => expect(view.container.querySelector('svg')).toBeTruthy());
    let previousGlyph = view.container.querySelector('svg')?.innerHTML;

    for (const library of ['tabler', 'hugeicons', 'phosphor', 'remixicon']) {
      document.documentElement.dataset.iconLibrary = library;
      setIconLibrary(library);
      await vi.waitFor(() => {
        expect(view.container.querySelector('svg')?.innerHTML).not.toBe(previousGlyph);
      });
      previousGlyph = view.container.querySelector('svg')?.innerHTML;
    }
  });
});
