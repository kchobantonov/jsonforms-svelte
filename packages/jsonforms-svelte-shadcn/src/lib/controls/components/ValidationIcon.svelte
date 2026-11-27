<script lang="ts">
  import {
    ValidationIconFrame,
    type ValidationIconProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { CircleAlertIcon as ExclamationCircleSolid } from '$lib/components/icons';
  import ValidationBadge from './ValidationBadge.svelte';

  const props: ValidationIconProps = $props();
</script>

<ValidationIconFrame Badge={ValidationBadge} Icon={ExclamationCircleSolid} {...props} />
