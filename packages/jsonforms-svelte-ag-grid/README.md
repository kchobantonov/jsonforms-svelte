# @chobantonov/jsonforms-svelte-ag-grid

Theme-aware AG Grid array rendering shared by the Shadcn, Skeleton, and Flowbite JSON Forms Svelte renderer sets.

The family-specific extended package registers a lightweight tester. AG Grid itself and the full renderer runtime are loaded with dynamic imports only after a control with `options.variant: 'ag-grid'` wins renderer selection. Subsequent grids reuse the browser and package-level module caches.

## Usage

Install this package with the extended renderer package for your design system:

```bash
pnpm add ag-grid-community @chobantonov/jsonforms-svelte-ag-grid @chobantonov/jsonforms-svelte-shadcn-extended
```

Register the extended renderers as usual, then opt an array control into the grid:

```ts
const uischema = {
  type: 'Control',
  scope: '#/properties/items',
  options: {
    variant: 'ag-grid',
    gridHeight: '420px',
    restrict: true,
    showSortButtons: true,
    agGridOptions: {
      pagination: true,
      paginationPageSize: 10,
      columnDefs: [{ field: 'name', flex: 1 }],
    },
  },
};
```

Columns are inferred from the array item schema. `agGridOptions.columnDefs` overrides inferred columns by `field`, while cell editing is dispatched through the registered JSON Forms cells so validation, enablement, configuration, and change handling remain in the JSON Forms state flow.

The Shadcn, Skeleton, and Flowbite adapters map AG Grid theme parameters to their host CSS tokens. Token and light/dark mode changes update an existing grid without reloading or recreating it.
