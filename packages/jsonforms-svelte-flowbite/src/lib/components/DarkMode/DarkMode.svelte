<script lang="ts">
  import clsx from 'clsx';
  import { getTheme } from 'flowbite-svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { darkmode } from './theme';

  export type ThemeMode = 'light' | 'dark' | 'system';

  export interface DarkmodeProps extends HTMLButtonAttributes {
    lightIcon?: Snippet;
    darkIcon?: Snippet;
    size?: 'sm' | 'md' | 'lg';
    ariaLabel?: string;
    dark?: boolean;
    mode?: ThemeMode;
    cycleMode?: boolean;
    syncWithDocument?: boolean;
  }

  let {
    class: className,
    lightIcon,
    darkIcon,
    size = 'md',
    ariaLabel = 'Dark mode',
    dark = $bindable<boolean | undefined>(undefined),
    mode = $bindable<ThemeMode | undefined>(undefined),
    cycleMode = false,
    syncWithDocument = false,
    ...restProps
  }: DarkmodeProps = $props();

  const theme = $derived(getTheme('darkmode'));
  let prefersDark = $state(false);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  $effect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDark = mediaQuery.matches;

    const onChange = (event: MediaQueryListEvent) => {
      prefersDark = event.matches;
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  });

  const isDark = $derived.by(() => {
    if (dark !== undefined) {
      return dark;
    }
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return prefersDark;
  });

  const toggleMode = (currentMode: ThemeMode): ThemeMode => {
    if (cycleMode) {
      if (currentMode === 'light') return 'dark';
      if (currentMode === 'dark') return 'system';
      return 'light';
    }
    return isDark ? 'light' : 'dark';
  };

  const toggleTheme = () => {
    if (dark !== undefined) {
      dark = !dark;
      return;
    }

    const currentMode = mode ?? 'system';
    mode = toggleMode(currentMode);
  };

  $effect(() => {
    if (!syncWithDocument || typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
  });
</script>

<button
  onclick={toggleTheme}
  aria-label={ariaLabel}
  type="button"
  {...restProps}
  class={darkmode({ class: clsx(theme, className) })}
  tabindex={0}
>
  {#if isDark}
    {#if lightIcon}
      {@render lightIcon()}
    {:else}
      <svg
        role="img"
        aria-label="Light mode"
        class={sizes[size]}
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          fill-rule="evenodd"
          clip-rule="evenodd"
        />
      </svg>
    {/if}
  {:else if darkIcon}
    {@render darkIcon()}
  {:else}
    <svg
      role="img"
      aria-label="Dark mode"
      class={sizes[size]}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  {/if}
</button>
