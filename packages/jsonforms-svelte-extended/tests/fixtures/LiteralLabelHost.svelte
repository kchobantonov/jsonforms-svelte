<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsControl,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { LabelElement } from '@jsonforms/core';
  import { useLabelSummaryText } from '../../src/lib/presentation/labelSummaryText.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const label: LabelElement = {
    type: 'Label',
    i18n: 'summary',
    text: '{name} · {heading}',
    options: {
      interpolate: true,
      textParams: { name: '{item.name}', heading: '{data[0].heading}' },
    },
  };
  const summary = useLabelSummaryText(() => [label]);
  const path = $derived(binding.control.path ? binding.control.path + '.0' : '0');
  const row = $derived(Array.isArray(binding.control.data) ? binding.control.data[0] : undefined);
</script>

<div data-testid="visible-label">
  <DispatchRenderer schema={props.schema} uischema={label} {path} />
</div>
<output data-testid="search-text" data-revision={Boolean(summary.revision)}
  >{summary.text(label, path, row)}</output
>
