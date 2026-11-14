<script lang="ts">
  import { useUIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';

  let {
    code,
    message,
    path,
  }: {
    code: string;
    message: string;
    path: string;
  } = $props();
  const reportDiagnostic = useUIDiagnosticReporter();
  let reported: string | undefined;
  $effect(() => {
    const identity = JSON.stringify([code, path]);
    if (reported === identity) return;
    reported = identity;
    reportDiagnostic(code, { severity: 'warning', message, path });
  });
</script>
