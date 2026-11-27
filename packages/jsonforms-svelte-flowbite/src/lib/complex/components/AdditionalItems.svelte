<script lang="ts">
  import ConfirmationDialog from './ConfirmationDialog.svelte';
  import {
    TupleTail,
    type AdditionalItemsProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CollectionPager from '../../components/CollectionPager.svelte';
  import Action from '../../components/TupleAction.svelte';
  import ValidationIcon from '../../controls/components/ValidationIcon.svelte';
  const props: AdditionalItemsProps = $props();
</script>

<TupleTail
  {...props}
  {Action}
  {CollectionPager}
  {ValidationIcon}
  {ConfirmationDialog}
  errorColor="text-red-600 dark:text-red-400"
/>
