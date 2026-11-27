<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  let {
    SplitPane,
    Pane,
    direction = 'horizontal',
    dir = 'ltr',
    size,
    onResize,
    responsive = false,
    breakpoint = 768,
    showSecond = true,
    minSize,
    keyboardStep,
    resizable,
    transition,
  }: {
    SplitPane: Component<{
      direction: 'horizontal' | 'vertical';
      responsive: boolean;
      breakpoint: number;
      minSize: number;
      onResize?: (sizes: number[]) => void;
      children: Snippet;
    }>;
    Pane: Component<{ children: Snippet }>;
    direction?: 'horizontal' | 'vertical';
    dir?: 'ltr' | 'rtl';
    size: number;
    minSize: number;
    onResize?: (sizes: number[]) => void;
    responsive?: boolean;
    breakpoint?: number;
    showSecond?: boolean;
    keyboardStep?: number;
    resizable?: boolean;
    transition?: boolean;
  } = $props();
</script>

<div {dir} style:width={`${size}px`} style:height={`${size}px`}>
  <SplitPane
    {direction}
    {responsive}
    {breakpoint}
    {minSize}
    {onResize}
    {...keyboardStep === undefined ? {} : { keyboardStep }}
    {...resizable === undefined ? {} : { resizable }}
    {...transition === undefined ? {} : { transition }}
  >
    <Pane><input aria-label="First" value="Original" /></Pane>
    {#if showSecond}<Pane><input aria-label="Second" /></Pane>{/if}
  </SplitPane>
</div>
