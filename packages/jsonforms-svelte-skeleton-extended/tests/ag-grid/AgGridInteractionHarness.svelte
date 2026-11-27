<script lang="ts">
  import Harness from '../../../jsonforms-svelte-extended/tests/fixtures/AgGridInteractionHarness.svelte';
  import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
  import { skeletonExtendedCells, skeletonExtendedRenderers } from '../../src/lib';
</script>

<Harness
  renderers={[...skeletonRenderers, ...skeletonExtendedRenderers]}
  cells={[...skeletonCells, ...skeletonExtendedCells]}
/>
