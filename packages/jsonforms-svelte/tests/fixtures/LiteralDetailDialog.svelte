<script lang="ts">
  import { onMount } from 'svelte';
  import { update } from '@jsonforms/core';
  import {
    useJsonForms,
    useJsonFormsControl,
    useDispatch,
    type ControlProps,
  } from '../../src/lib/jsonFormsCompositions.svelte';
  import { useDetailDialog } from '../../src/lib/detailDialog.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const parent = useJsonForms();
  const editor = useDetailDialog({
    get path() {
      return binding.control.path;
    },
    get schema() {
      return binding.control.schema;
    },
    get enabled() {
      return binding.control.enabled;
    },
    label: 'Detail',
    children: body,
  });
  const form = useJsonForms();
  const dispatch = useDispatch();
  onMount(() =>
    props.uischema.options?.capture?.({
      form,
      parent,
      editor,
      edit: (name: string) =>
        dispatch(
          update(binding.control.path ? binding.control.path + '.name' : 'name', () => name),
        ),
    }),
  );
</script>

{#snippet body()}{/snippet}
<output>{JSON.stringify(form.core?.data)}</output>
