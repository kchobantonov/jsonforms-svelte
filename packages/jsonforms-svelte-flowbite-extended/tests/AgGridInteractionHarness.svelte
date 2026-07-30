<script lang="ts">
  import { JsonForms, type JsonFormsChangeEvent } from '@chobantonov/jsonforms-svelte';
  import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
  import { flowbiteExtendedRenderers } from '../src/lib';

  let data = $state({ comments: [{ date: '2026-07-18', status: 'reviewed' }] });
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
          },
          required: ['date', 'status'],
        },
      },
    },
  };

  const uischema = {
    type: 'Control',
    scope: '#/properties/comments',
    options: { variant: 'ag-grid', gridHeight: '260px' },
  };
</script>

<button type="button" onclick={() => outsideClicks++}>Outside action {outsideClicks}</button>
<output aria-label="Comment count">{data.comments.length}</output>
<JsonForms
  {data}
  {schema}
  {uischema}
  renderers={[...flowbiteRenderers, ...flowbiteExtendedRenderers]}
  cells={flowbiteCells}
  onchange={(event: JsonFormsChangeEvent) => (data = event.data)}
/>
