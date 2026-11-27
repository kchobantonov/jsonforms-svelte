<script lang="ts">
  import Harness from '../../../jsonforms-svelte-extended/tests/fixtures/AgGridInteractionHarness.svelte';
  import { flowbiteCells, flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
  import { flowbiteExtendedCells, flowbiteExtendedRenderers } from '../../src/lib';
</script>

<Harness
  renderers={[...flowbiteRenderers, ...flowbiteExtendedRenderers]}
  cells={[...flowbiteCells, ...flowbiteExtendedCells]}
/>
