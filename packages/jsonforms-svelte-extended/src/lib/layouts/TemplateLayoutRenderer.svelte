<script lang="ts">
  import { type Component } from 'svelte';
  import {
    useJsonForms,
    useRendererMessages,
    useUIDiagnosticReporter,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { templateLanguage } from '../core/templateLanguage.js';
  import type { TemplateLayout } from '../core/types.js';
  import RactiveTemplateLayoutRenderer from './RactiveTemplateLayoutRenderer.svelte';

  const props: RendererProps<TemplateLayout> = $props();
  const form = useJsonForms();
  const message = useRendererMessages();
  const reportDiagnostic = useUIDiagnosticReporter();
  const language = $derived(templateLanguage(props.uischema, form.config));
  let JsxRenderer = $state<Component<RendererProps<TemplateLayout>> | null>(null);
  let loadError = $state(false);

  $effect(() => {
    if (language !== 'jsx' || JsxRenderer) return;
    let active = true;
    import('./JsxTemplateLayoutRenderer.svelte')
      .then((module) => {
        if (active) JsxRenderer = module.default;
      })
      .catch(() => {
        if (!active) return;
        loadError = true;
        reportDiagnostic('template.engineLoadFailed', {
          severity: 'error',
          message: 'The JSX template renderer could not be loaded.',
          details: { kind: 'jsx' },
        });
      });
    return () => {
      active = false;
    };
  });
</script>

{#if language === 'jsx'}
  {#if JsxRenderer}
    <JsxRenderer {...props} />
  {:else if loadError}
    <div role="alert">{message('template.engineLoadError')}</div>
  {:else}
    <div aria-busy="true">{message('template.loading')}</div>
  {/if}
{:else}
  <RactiveTemplateLayoutRenderer {...props} />
{/if}
