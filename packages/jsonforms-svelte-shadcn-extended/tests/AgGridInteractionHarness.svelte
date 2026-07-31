<script lang="ts">
  import { JsonForms, type JsonFormsChangeEvent } from '@chobantonov/jsonforms-svelte';
  import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
  import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src/lib';

  let data = $state({
    comments: [
      {
        date: '2026-07-18',
        status: 'reviewed',
        favoriteColor: '#7c3aed',
        active: false,
      },
    ],
  });
  let outsideClicks = $state(0);

  const schema = {
    type: 'object',
    properties: {
      comments: {
        type: 'array',
        title: 'Comments',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date', title: 'Date' },
            status: {
              type: 'string',
              enum: ['new', 'reviewed', 'resolved'],
              title: 'Status',
            },
            favoriteColor: {
              type: 'string',
              format: 'color',
              title: 'Favorite color',
            },
            active: { type: 'boolean', title: 'Active' },
          },
          required: ['date', 'status'],
        },
      },
    },
  };

  const uischema = {
    type: 'Control',
    scope: '#/properties/comments',
    options: {
      variant: 'ag-grid',
      gridHeight: '260px',
      agGridOptions: { suppressColumnVirtualisation: true },
    },
  };
</script>

<button type="button" onclick={() => outsideClicks++}>Outside action {outsideClicks}</button>
<output aria-label="Comment count">{data.comments.length}</output>
<JsonForms
  {data}
  {schema}
  {uischema}
  renderers={[...shadcnRenderers, ...shadcnExtendedRenderers]}
  cells={[...shadcnCells, ...shadcnExtendedCells]}
  onchange={(event: JsonFormsChangeEvent) => (data = event.data)}
/>
