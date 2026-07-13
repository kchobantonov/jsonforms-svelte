<script lang="ts" module>
  import type { SVGAttributes } from 'svelte/elements';
  import type { IconName } from './icon-mappings';
  import type { IconLibrary } from './icon-library.svelte';

  export type IconProps = SVGAttributes<SVGSVGElement> & {
    name: IconName;
    library?: IconLibrary;
  };
</script>

<script lang="ts">
  import { HugeiconsIcon } from '@hugeicons/svelte';
  import type { Component as ComponentType } from 'svelte';
  import { componentIcons, hugeIcons } from './icon-mappings';
  import { currentIconLibrary } from './icon-library.svelte';

  let { name, library: requestedLibrary, ...props }: IconProps = $props();
  const library = $derived(requestedLibrary ?? $currentIconLibrary);
  const Component = $derived(
    (library === 'hugeicons' ? undefined : componentIcons[library][name]) as
      | ComponentType<Record<string, unknown>>
      | undefined,
  );
  const hugeIcon = $derived(hugeIcons[name] as any);
  const restProps = $derived(props as Record<string, unknown>);
</script>

{#if library === 'hugeicons'}
  <HugeiconsIcon icon={hugeIcon} strokeWidth={2} {...restProps} />
{:else if Component}
  <Component {...restProps} />
{/if}
