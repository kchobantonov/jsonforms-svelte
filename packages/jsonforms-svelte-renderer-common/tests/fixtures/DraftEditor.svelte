<script lang="ts">
  import { onMount } from 'svelte';
  import { useOwnedErrors } from '../../src/lib/validation/ownedErrors.svelte.ts';
  import { useDispatch, useJsonForms } from '@chobantonov/jsonforms-svelte';
  import { registerDetailDialogChange } from '../../src/lib/index.js';
  let { capture }: { capture: (context: unknown) => void } = $props();
  const store = useOwnedErrors()!;
  const dispatch = useDispatch();
  const form = useJsonForms();
  let blocked = $state(false);
  let flush: (() => void) | undefined;
  registerDetailDialogChange({
    isBlocked: () => blocked,
    flush: () => flush?.(),
  });
  onMount(() =>
    capture({
      store,
      dispatch,
      form,
      setBlocked: (value: boolean) => {
        blocked = value;
      },
      setFlush: (callback: () => void) => {
        flush = callback;
      },
    }),
  );
</script>

<pre>{JSON.stringify(form.core?.additionalErrors)}</pre>
