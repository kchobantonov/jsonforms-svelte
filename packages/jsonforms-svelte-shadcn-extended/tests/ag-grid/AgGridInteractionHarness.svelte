<script lang="ts">
  import Harness from '../../../jsonforms-svelte-extended/tests/fixtures/AgGridInteractionHarness.svelte';
  import { shadcnCells, shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
  import { shadcnExtendedCells, shadcnExtendedRenderers } from '../../src/lib';
</script>

<Harness
  renderers={[...shadcnRenderers, ...shadcnExtendedRenderers]}
  cells={[...shadcnCells, ...shadcnExtendedCells]}
/>
