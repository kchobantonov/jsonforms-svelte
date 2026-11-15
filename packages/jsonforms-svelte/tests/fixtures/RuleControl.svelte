<script lang="ts">
  import { useJsonForms, useJsonFormsControl, type ControlProps } from '../../src/lib/index';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const form = useJsonForms();
</script>

<output data-testid="rule-visible">{String(binding.control.visible)}</output>
<output data-testid="rule-enabled">{String(binding.control.enabled)}</output>
<output data-testid="rule-readonly">{String(binding.control.readonly)}</output>
<output data-testid="rule-data">{JSON.stringify(form.core?.data)}</output>
