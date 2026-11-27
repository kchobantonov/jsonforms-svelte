<script lang="ts">
  import {
    type RendererProps,
    useDynamicTreeResolver,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { TemplateLayout } from '../core/types';
  import ScriptTemplateLayout from './ScriptTemplateLayout.svelte';
  import {
    JsxTemplateController,
    JsxTemplateEngineLoadError,
  } from '../template/jsxTemplateController';
  const props: RendererProps<TemplateLayout> = $props();
  const resolveTree = useDynamicTreeResolver();
</script>

<ScriptTemplateLayout
  {...props}
  kind="jsx"
  {resolveTree}
  loadError={(error) => error instanceof JsxTemplateEngineLoadError}
  createController={(onSlots, allowed, policy, report) =>
    new JsxTemplateController(onSlots, allowed, policy, report)}
/>
