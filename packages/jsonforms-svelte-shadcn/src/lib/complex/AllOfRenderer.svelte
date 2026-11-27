<script lang="ts">
  import {
    AllOfContent,
    type ControlProps,
    useJsonFormsAllOfControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { useShadcnControl } from '../util';
  import AdditionalProperties from './components/AdditionalProperties.svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsAllOfControl(props));
</script>

<AllOfContent {binding}>
  {#snippet createButton(disabled, onclick, label)}
    <Button variant="outline" type="button" {disabled} {onclick}>{label}</Button>
  {/snippet}
  {#snippet additionalProperties(disallowedPropertyNames)}
    <AdditionalProperties input={binding} {disallowedPropertyNames} />
  {/snippet}
</AllOfContent>
