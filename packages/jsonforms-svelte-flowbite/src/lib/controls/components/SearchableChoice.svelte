<script lang="ts">
  import { tick, untrack } from 'svelte';
  import {
    Button,
    Dropdown,
    DropdownGroup,
    DropdownItem,
    Search,
    CloseButton,
  } from 'flowbite-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { ChevronDownOutline } from 'flowbite-svelte-icons';
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
    clearable?: boolean;
    onclear?: () => void;
    onselect: (id: string) => void;
    onfocus?: () => void;
    onblur?: () => void;
  }

  const props: Props = $props();
  const message = useRendererMessages();
  const key = $props.id();
  let open = $state(false);
  let query = $state('');
  let container: HTMLDivElement | undefined = $state();
  let search: HTMLInputElement | undefined = $state();
  const filtered = $derived(
    props.items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
  );
  $effect(() => {
    void props.items;
    void props.value;
    void props.disabled;
    void props.readonly;
    untrack(() => {
      open = false;
      query = '';
    });
  });
  $effect(() => {
    if (open) {
      query = '';
      tick().then(() => search?.focus());
    }
  });
  async function select(id: string) {
    if (props.disabled || props.readonly) return;
    props.onselect(id);
    open = false;
    await tick();
    container?.querySelector<HTMLButtonElement>('[data-choice-trigger]')?.focus();
    open = false;
  }
  function navigate(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      open = false;
      tick().then(() => {
        container?.querySelector<HTMLButtonElement>('[data-choice-trigger]')?.focus();
        open = false;
      });
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    if (event.target === search && !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const buttons = Array.from(
      container?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [],
    );
    if (!buttons.length) return;
    event.preventDefault();
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : event.key === 'ArrowDown'
            ? (current + 1) % buttons.length
            : current < 0
              ? buttons.length - 1
              : (current - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  }
</script>

<div bind:this={container} class="group relative w-full">
  <Button
    id={props.id}
    data-choice-trigger={key}
    role="combobox"
    aria-label={props.label}
    aria-expanded={open}
    aria-haspopup="dialog"
    aria-required={props.required}
    aria-invalid={props.invalid}
    aria-readonly={props.readonly}
    disabled={props.disabled}
    color="alternative"
    class={`relative pe-16 ${props.class ?? 'w-full justify-between'}`}
    onfocus={props.onfocus}
    onblur={props.onblur}
  >
    <span class="truncate text-start"
      >{props.items.find((item) => item.id === props.value)?.label ??
        props.placeholder ??
        message('control.selectOption')}</span
    >
    <ChevronDownOutline class="absolute end-3 size-4 shrink-0" />
  </Button>
  <Dropdown
    bind:isOpen={
      () => open,
      (next) => {
        open = next && !props.disabled && !props.readonly;
      }
    }
    role="dialog"
    aria-label={message('arrayChoices.search')}
    class="max-h-80 w-72 max-w-full overflow-auto"
    placement="bottom-start"
    onkeydown={navigate}
  >
    <div class="p-2">
      <Search
        bind:elementRef={search}
        bind:value={query}
        aria-label={message('arrayChoices.search')}
        placeholder={message('arrayChoices.search')}
        required={false}
      />
    </div>
    <DropdownGroup role="listbox" aria-label={props.label}>
      {#each filtered as item (item.id)}
        <DropdownItem
          role="option"
          aria-selected={item.id === props.value}
          onclick={() => select(item.id)}>{item.label}</DropdownItem
        >
      {/each}
    </DropdownGroup>
    {#if filtered.length === 0}<p class="px-3 py-2 text-sm" role="status">
        {message('enum.noMatches')}
      </p>{/if}
  </Dropdown>
  {#if props.clearable && !props.disabled && !props.readonly}
    <CloseButton
      color="gray"
      ariaLabel={message('control.clearValue')}
      name={message('control.clearValue')}
      class="absolute end-7 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
      onclick={(event: MouseEvent) => {
        event.preventDefault();
        if (!props.disabled && !props.readonly) props.onclear?.();
      }}
    />
  {/if}
</div>
