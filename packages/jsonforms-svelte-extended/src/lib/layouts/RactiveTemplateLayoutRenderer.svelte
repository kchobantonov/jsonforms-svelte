<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { TemplateLayout } from '../core/types';
  import ScriptTemplateLayout from './ScriptTemplateLayout.svelte';
  import {
    RactiveTemplateController,
    TemplateEngineLoadError,
  } from '../template/ractiveTemplateController';
  const props: RendererProps<TemplateLayout> = $props();
</script>

<ScriptTemplateLayout
  {...props}
  kind="ractive"
  loadError={(error) => error instanceof TemplateEngineLoadError}
  createController={(onSlots, allowed, policy, report) =>
    new RactiveTemplateController(onSlots, allowed, undefined, policy, report)}
/>
