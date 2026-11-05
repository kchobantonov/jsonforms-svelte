<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  interface Props {
    data: unknown;
    errors: unknown[];
    readonly: boolean;
    translate: (key: string, fallback?: string) => string;
    Slot: Component<{ name: string; children?: Snippet }>;
  }
  const { data, errors, readonly, translate, Slot }: Props = $props();
  const registration = $derived(
    (data ?? {}) as { customerName?: string; priority?: boolean; contacts?: { name: string }[] },
  );
</script>

<div>
  <p data-greeting>{translate('specTemplateLayout.greeting')} {registration.customerName}</p>
  <p data-branch>
    {translate(
      registration.priority ? 'specTemplateLayout.priority' : 'specTemplateLayout.standard',
    )}
  </p>
  <p data-list>
    {translate('specTemplateLayout.contacts')}: {(registration.contacts ?? [])
      .map((contact) => contact.name)
      .join(', ')}
  </p>
  <p>
    <span data-pill>{translate('specTemplateLayout.native.errors')}: {errors.length}</span> · {translate(
      readonly ? 'specTemplateLayout.native.readonly' : 'specTemplateLayout.native.editable',
    )}
  </p>
  <Slot name="nativeNote" />
  <Slot name="notDeclared"><p>{translate('specTemplateLayout.native.fallback')}</p></Slot>
</div>
