import { describe, expect, it } from 'vitest';
import { webComponentManualChunks } from '../../../webcomponent-chunks.js';

describe('web component chunk policy', () => {
  it('keeps the AG Grid loader and runtime in separate chunks', () => {
    expect(
      webComponentManualChunks(
        '/workspace/packages/jsonforms-svelte-ag-grid/dist/LazyAgGridArrayControlRenderer.svelte',
      ),
    ).toBe('jsonforms-svelte-ag-grid-loader');
    expect(
      webComponentManualChunks(
        '/workspace/packages/jsonforms-svelte-ag-grid/dist/runtime/AgGridArrayControlRenderer.svelte',
      ),
    ).toBe('jsonforms-svelte-ag-grid-runtime');
    expect(
      webComponentManualChunks(
        '/workspace/node_modules/.pnpm/ag-grid-community@36.0.1/node_modules/ag-grid-community/dist/package/main.esm.mjs',
      ),
    ).toBe('vendor-ag-grid');
  });

  it('assigns workspace and third-party modules to stable library chunks', () => {
    expect(
      webComponentManualChunks(
        '/workspace/packages/jsonforms-svelte-shadcn/dist/controls/StringControlRenderer.svelte',
      ),
    ).toBe('jsonforms-svelte-shadcn');
    expect(
      webComponentManualChunks(
        '/workspace/node_modules/.pnpm/dayjs@1.11.19/node_modules/dayjs/dayjs.min.js',
      ),
    ).toBe('vendor-dayjs');
    expect(
      webComponentManualChunks(
        '\0/workspace/node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/lodash.js?commonjs-proxy',
      ),
    ).toBe('vendor-lodash');
  });

  it('keeps the current web component source in its entry chunk', () => {
    expect(
      webComponentManualChunks(
        '/workspace/packages/jsonforms-svelte-shadcn-webcomponent/src/lib/JsonFormsWebComponent.svelte',
      ),
    ).toBeUndefined();
  });
});
