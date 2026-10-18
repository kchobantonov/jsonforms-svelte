<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import * as Command from '@jsonforms-svelte-shadcn-ui/command';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { getPortalTarget } from '../../util';
  interface Props {
    id: string;
    label: string;
    items: { id: string; label: string }[];
    value: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    invalid?: boolean;
    placeholder?: string;
    class?: string;
    onselect: (id: string) => void;
    onfocus?: () => void;
    onblur?: () => void;
  }

  const props: Props = $props();
  const message = useRendererMessages();
  let open = $state(false);
  let trigger: HTMLButtonElement | null = $state(null);
  $effect(() => {
    void props.items;
    void props.value;
    void props.disabled;
    void props.readonly;
    untrack(() => {
      open = false;
    });
  });
  async function select(id: string) {
    if (props.disabled || props.readonly) return;
    props.onselect(id);
    open = false;
    await tick();
    trigger?.focus();
  }
</script>

<Popover.Root
  bind:open={
    () => open,
    (next) => {
      open = next && !props.disabled && !props.readonly;
    }
  }
>
  <Popover.Trigger bind:ref={trigger}>
    {#snippet child({ props: triggerProps })}
      <Button
        {...triggerProps}
        id={props.id}
        role="combobox"
        aria-label={props.label}
        aria-expanded={open}
        aria-required={props.required}
        aria-invalid={props.invalid}
        aria-readonly={props.readonly}
        disabled={props.disabled}
        variant="outline"
        class={`relative pe-16 ${props.class ?? 'w-full justify-between'}`}
        onfocus={props.onfocus}
        onblur={props.onblur}
      >
        <span class="truncate text-start"
          >{props.items.find((item) => item.id === props.value)?.label ??
            props.placeholder ??
            message('control.selectOption')}</span
        >
        <ChevronDown class="absolute end-3 size-4 shrink-0 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    portalProps={{ to: getPortalTarget() }}
    class="w-[var(--bits-popover-anchor-width)] p-0"
  >
    <Command.Root
      filter={(_value, search, keywords) =>
        keywords?.some((label) => label.toLowerCase().includes(search.toLowerCase())) ? 1 : 0}
    >
      <Command.Input
        aria-label={message('arrayChoices.search')}
        placeholder={message('arrayChoices.search')}
      />
      <Command.List>
        <Command.Empty>{message('enum.noMatches')}</Command.Empty>
        <Command.Group>
          {#each props.items as item (item.id)}
            <Command.Item
              value={item.id}
              keywords={[item.label]}
              data-checked={item.id === props.value}
              onSelect={() => select(item.id)}>{item.label}</Command.Item
            >
          {/each}
        </Command.Group>
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
