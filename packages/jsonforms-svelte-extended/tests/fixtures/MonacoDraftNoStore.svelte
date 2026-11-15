<script lang="ts">
  import { useMonacoDraft } from '../../src/lib/core/monacoDraft.svelte';

  let { path, propagateErrors }: { path: string; propagateErrors: boolean } = $props();
  const draft = useMonacoDraft({
    value: '',
    schema: { type: 'string' },
    get path() {
      return path;
    },
    language: 'json',
    convertJson: false,
    enabled: true,
    get propagateErrors() {
      return propagateErrors;
    },
    locale: 'en',
    translate: undefined,
    onChange() {},
  });
</script>

<p>{draft.text}</p>
