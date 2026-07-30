import { describe, expect, it } from 'vitest';
import { toManagedGridOptions } from '../src/lib/runtime/initial-grid-options.js';

describe('toManagedGridOptions', () => {
  it('keeps reactive options and removes options that are valid only during grid creation', () => {
    const getRowId = ({ data }: { data: { id: string } }) => data.id;
    const components = { Example: class Example {} };

    expect(
      toManagedGridOptions({
        getRowId,
        components,
        pagination: true,
        paginationPageSize: 25,
        suppressRowDrag: true,
      }),
    ).toEqual({
      pagination: true,
      paginationPageSize: 25,
      suppressRowDrag: true,
    });
  });
});
