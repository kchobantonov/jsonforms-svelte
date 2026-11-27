<script lang="ts">
  import { onMount } from 'svelte';
  import { useChoiceCards } from '../../src/lib/composition/choiceCards.svelte.ts';
  import type { ControlProps } from '../../src/lib/index.js';
  import { useOwnedErrors } from '../../src/lib/validation/ownedErrors.svelte.ts';
  import { type OwnedErrorStore, registerDetailDialogChange } from '../../src/lib/index.js';

  const props: ControlProps = $props();
  const cards = useChoiceCards(props);
  const store = useOwnedErrors();
  let pendingValue: string | undefined;
  registerDetailDialogChange({
    flush: () => {
      if (pendingValue !== undefined)
        cards.binding.handleChange(cards.binding.control.path, pendingValue);
      pendingValue = undefined;
    },
  });
  onMount(() => {
    props.uischema.options?.capture?.(store as OwnedErrorStore);
    props.uischema.options?.capturePendingValue?.((value: string) => (pendingValue = value));
  });

  async function selectB() {
    await cards.select(1);
    props.uischema.options?.onSelectionSettled?.();
  }
</script>

<button type="button" onclick={selectB}>Choose B</button>
<span data-selected>{cards.selected}</span>
