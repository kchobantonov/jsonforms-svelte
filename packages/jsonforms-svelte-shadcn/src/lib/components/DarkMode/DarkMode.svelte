<script module lang="ts">
  export type { DarkmodeProps, ThemeMode } from '@chobantonov/jsonforms-svelte-renderer-common';
</script>

<script lang="ts">
  import {
    DarkModeButton,
    type DarkmodeProps as Props,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { darkmode } from './theme';
  import clsx from 'clsx';

  let { dark = $bindable(), mode = $bindable(), class: className, ...props }: Props = $props();
</script>

<DarkModeButton {...props} bind:dark bind:mode class={darkmode({ class: clsx(className) })} />
