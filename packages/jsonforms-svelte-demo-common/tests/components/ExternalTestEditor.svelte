<script lang="ts">
  let { value = $bindable(''), ...rest } = $props();
</script>

<textarea bind:value aria-label={rest['aria-label']}></textarea>
