<script lang="ts">
  import {
    AllOfContent,
    type ControlProps,
    useJsonFormsAllOfControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useFlowbiteControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';
  import { Button } from 'flowbite-svelte';

  const props: ControlProps = $props();
  const binding = useFlowbiteControl(useJsonFormsAllOfControl(props));
</script>

<AllOfContent {binding}>
  {#snippet createButton(disabled, onclick, label)}
    <Button type="button" {disabled} {onclick}>{label}</Button>
  {/snippet}
  {#snippet additionalProperties(disallowedPropertyNames)}
    <AdditionalProperties input={binding} {disallowedPropertyNames} />
  {/snippet}
</AllOfContent>
