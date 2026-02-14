<script lang="ts">
  import maxBy from 'lodash/maxBy';
  import type { Snippet } from 'svelte';
  import { useJsonFormsDispatchCell, type ControlProps } from '../jsonFormsCompositions.svelte.js';
  import UnknownRenderer from './UnknownRenderer.svelte';

  export interface DispatchCellProps extends ControlProps {
    // For forwarding snippets
    [key: string]: Snippet | unknown;
  }

  let props: DispatchCellProps = $props();
  const {
    schema,
    uischema,
    path,
    enabled = true,
    renderers,
    cells,
    config,
    ...rest
  } = $derived(props);

  const snippets = $derived(
    Object.fromEntries(Object.entries(rest).filter(([_, value]) => typeof value === 'function')),
  );

  const binding = useJsonFormsDispatchCell(props);

  // Determine which cell to render
  const DeterminedCell = $derived.by(() => {
    const testerContext = {
      rootSchema: binding.cell.rootSchema,
      config: config,
    };

    const cell = maxBy(binding.cell.cells, (r) =>
      r.tester(binding.cell.uischema, binding.cell.schema, testerContext),
    );

    if (
      cell === undefined ||
      cell.tester(binding.cell.uischema, binding.cell.schema, testerContext) === -1
    ) {
      return UnknownRenderer;
    }

    return cell.cell;
  });
</script>

<DeterminedCell {...binding.cell} {...snippets}></DeterminedCell>
