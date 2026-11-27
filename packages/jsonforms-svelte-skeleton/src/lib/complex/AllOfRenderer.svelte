<script lang="ts">
  import {
    AllOfContent,
    type ControlProps,
    useJsonFormsAllOfControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useSkeletonControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';

  const props: ControlProps = $props();
  const binding = useSkeletonControl(useJsonFormsAllOfControl(props));
</script>

<AllOfContent {binding}>
  {#snippet createButton(disabled, onclick, label)}
    <button class="btn preset-outlined" type="button" {disabled} {onclick}>{label}</button>
  {/snippet}
  {#snippet additionalProperties(disallowedPropertyNames)}
    <AdditionalProperties input={binding} {disallowedPropertyNames} />
  {/snippet}
</AllOfContent>
