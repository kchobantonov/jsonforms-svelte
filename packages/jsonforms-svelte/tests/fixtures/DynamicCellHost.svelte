<script lang="ts">
  import DispatchCell from '../../src/lib/components/DispatchCell.svelte';
  import type { ControlElement } from '@jsonforms/core';
  const uischema = {
    type: 'Control',
    scope: '#/properties/name',
    $dynamic: { label: { bind: 'value' } },
  } as ControlElement;
</script>

<DispatchCell schema={{ type: 'string' }} {uischema} path="rows.0.name" enabled={true} />
