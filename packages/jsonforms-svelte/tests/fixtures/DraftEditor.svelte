<script lang="ts">
  import { onMount } from 'svelte';
  import { useOwnedErrors } from '../../src/lib/ownedErrors.svelte';
  import { useDispatch, useJsonForms } from '../../src/lib/jsonFormsCompositions.svelte';
  import { registerDetailDialogChange } from '../../src/lib/detailDialog.svelte';
  let { capture }: { capture: (context: unknown) => void } = $props();
  const store = useOwnedErrors()!;
  const dispatch = useDispatch();
  const form = useJsonForms();
  let blocked = $state(false);
  registerDetailDialogChange({ isBlocked: () => blocked });
  onMount(() =>
    capture({
      store,
      dispatch,
      form,
      setBlocked: (value: boolean) => {
        blocked = value;
      },
    }),
  );
</script>

<pre>{JSON.stringify(form.core?.additionalErrors)}</pre>
