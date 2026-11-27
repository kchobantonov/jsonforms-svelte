<svelte:options
  customElement={{
    shadow: 'open',
  }}
/>

<script lang="ts">
  import ShadcnHost, { type ShadcnHostProps } from './ShadcnHost.svelte';
  import type { ShadcnElementSkin } from './registerShadcnElement';

  let {
    data = undefined,
    schema = undefined,
    uischema = undefined,
    uischemas = undefined,
    config = {},
    external = undefined,
    readonly = false,
    validationMode = 'ValidateAndShow',
    locale = 'en',
    mode = 'system',
    theme = 'slate',
    designSystem = undefined,
    translations = undefined,
    additionalErrors = [],
    externalSchemas = [],
    ajv: suppliedAjv = undefined,
    customStyle = '',
  }: ShadcnHostProps = $props();

  const hostElement = $host<HTMLElement & { readonly skin: ShadcnElementSkin }>();
</script>

<ShadcnHost
  {hostElement}
  baseStyles={hostElement.skin.styles}
  attach={hostElement.skin.attach}
  {data}
  {schema}
  {uischema}
  {uischemas}
  {config}
  {external}
  {readonly}
  {validationMode}
  {locale}
  {mode}
  {theme}
  {designSystem}
  {translations}
  {additionalErrors}
  {externalSchemas}
  ajv={suppliedAjv}
  {customStyle}
/>
