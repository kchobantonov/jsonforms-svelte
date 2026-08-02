<script lang="ts">
  import { JsonForms, type JsonFormsChangeEvent } from '@chobantonov/jsonforms-svelte';
  import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
  import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../src/lib';

  let data = $state({
    comments: [
      {
        firstName: 'Ada',
        age: 36,
        role: 'Researcher',
        tenure: 'P2Y6M',
        date: '2026-07-18',
        time: '09:30:00',
        dateTime: '2026-07-18T09:30:00',
        status: 'reviewed',
        favoriteColor: '#7c3aed',
        active: false,
        address: { street: '12 St James’s Square' },
        tags: ['mathematics', 'computing'],
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
            firstName: { type: 'string', title: 'First name' },
            age: { type: 'integer', title: 'Age' },
            role: {
              type: 'string',
              enum: ['Researcher', 'Leader'],
              title: 'Role',
            },
            tenure: { type: 'string', format: 'duration', title: 'Tenure' },
            date: { type: 'string', format: 'date', title: 'Date' },
            time: { type: 'string', format: 'time', title: 'Time' },
            dateTime: {
              type: 'string',
              format: 'date-time',
              title: 'DateTime',
            },
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
            address: {
              type: 'object',
              title: 'Address',
              properties: {
                street: { type: 'string', title: 'Street' },
              },
            },
            tags: {
              type: 'array',
              title: 'Tags',
              items: { type: 'string' },
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
    options: {
      variant: 'ag-grid',
      gridHeight: '260px',
      agGridOptions: {
        suppressColumnVirtualisation: true,
        defaultColDef: { width: 160, minWidth: 100 },
      },
    },
  };
</script>

<button type="button" onclick={() => outsideClicks++}>Outside action {outsideClicks}</button>
<output aria-label="Comment count">{data.comments.length}</output>
<JsonForms
  {data}
  {schema}
  {uischema}
  renderers={[...flowbiteRenderers, ...flowbiteExtendedRenderers]}
  cells={[...flowbiteCells, ...flowbiteExtendedCells]}
  onchange={(event: JsonFormsChangeEvent) => (data = event.data)}
/>
