<script lang="ts">
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';

  let value = $state('');
</script>

<Select.Root type="single" {value} onValueChange={(next) => (value = next)}>
  <Select.Trigger aria-label="Choices"><Select.Value placeholder="Choose" /></Select.Trigger>
  <Select.Content>
    <Select.Item value="choice-0" label="Alpha">Visible Alpha and details</Select.Item>
    <Select.Item value="choice-1" label="Beta">Visible Beta and details</Select.Item>
  </Select.Content>
</Select.Root>
<output data-testid="selection">{value}</output>
