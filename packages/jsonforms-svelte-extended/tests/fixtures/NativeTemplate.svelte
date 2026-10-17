<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { NativeTemplateProps } from '../../src/lib/core/nativeTemplate';
  const {
    data,
    errors,
    enabled,
    readonly,
    translate,
    Slot,
    context,
    urlPolicy,
  }: NativeTemplateProps = $props();
  onDestroy(() => {
    if (typeof context.onNativeDestroy === 'function') context.onNativeDestroy();
  });
</script>

<p data-testid="native-data">{JSON.stringify(data)}</p>
<p data-testid="native-url-policy">{JSON.stringify(urlPolicy)}</p>
<p data-testid="native-errors">{errors.length}</p>
<p data-testid="native-permissions">
  {enabled ? 'enabled' : 'disabled'} / {readonly ? 'readonly' : 'editable'}
</p>
<p>{translate('native.title', 'Native component')}</p>
<Slot name="field" />
<Slot name="missing"><p>Native fallback</p></Slot>
