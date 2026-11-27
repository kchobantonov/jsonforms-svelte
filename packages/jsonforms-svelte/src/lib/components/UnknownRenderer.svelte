<script lang="ts">
  let { message = 'No applicable renderer found.' }: { message?: string } = $props();
</script>

<div role="status" style="color: red;">{message}</div>
