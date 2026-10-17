<script lang="ts">
  import type { NativeTemplateProps } from '../../src/lib/core/nativeTemplate';
  const { data, Slot }: NativeTemplateProps = $props();
</script>

<output data-testid="template-document">{JSON.stringify(data)}</output>

<Slot name="field" />
