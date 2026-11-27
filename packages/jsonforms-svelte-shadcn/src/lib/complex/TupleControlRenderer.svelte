<script lang="ts">
  import {
    TuplePresentationSymbol,
    useJsonFormsControl,
    type ControlProps,
    TupleControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useShadcnControl, setIsDynamicProperty } from '../util';
  import { setContext } from 'svelte';
  import Dialog from '../components/DetailDialog.svelte';
  import AdditionalItems from './components/AdditionalItems.svelte';
  import Action from '../components/TupleAction.svelte';
  setContext(TuplePresentationSymbol, { Dialog, Action, AdditionalItems });
  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsControl(props));
  // TupleField owns clearing; primitive controls must not invent a numeric zero.
  setIsDynamicProperty(false);
</script>

<TupleControl
  {binding}
  rendererProps={props}
  borderClass="border-border"
  errorClass="text-destructive"
  hintClass="text-muted-foreground"
/>
