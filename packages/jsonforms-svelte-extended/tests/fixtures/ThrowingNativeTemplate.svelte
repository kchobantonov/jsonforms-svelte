<script lang="ts">
  import type { NativeTemplateProps } from '../../src/lib/core/nativeTemplate';
  const props: NativeTemplateProps = $props();
  function fail(data: unknown): string {
    void data;
    throw new Error('Sensitive native template exception');
  }
</script>

{fail(props.data)}
