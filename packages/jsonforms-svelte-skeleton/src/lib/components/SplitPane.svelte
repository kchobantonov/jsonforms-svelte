<script lang="ts">
  import type { Snippet } from 'svelte';
  import { setContext } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    SplitPaneContextSymbol,
    type SplitPaneContextValue,
    type SplitPaneDirection,
  } from './splitPaneContext';

  interface Props {
    direction?: SplitPaneDirection;
    minSize?: number;
    responsive?: boolean;
    breakpoint?: number;
    transition?: boolean;
    transitionDuration?: number;
    keyboardStep?: number;
    initialSizes?: number[];
    onResize?: (sizes: number[]) => void;
    children?: Snippet;
    class?: string;
  }

  let {
    direction = 'horizontal',
    minSize = 100,
    responsive = true,
    breakpoint = 768,
    transition: transitionProp = true,
    transitionDuration = 150,
    keyboardStep = 2,
    initialSizes,
    onResize,
    children,
    class: className = '',
  }: Props = $props();

  const tolerance = 0.5;
  const minChangeThreshold = 0.01;
  const minDelta = 1;

  let transition = $derived(transitionProp);
  let isDragging = $state(false);
  let startPos = $state(0);
  let sizes = $state<number[]>([]);
  let container = $state<HTMLDivElement | null>(null);
  let currentDirection = $state<SplitPaneDirection>('horizontal');
  let registeredPanes = $state(0);
  let containerSize = $state(0);

  function registerPane() {
    const index = registeredPanes;
    registeredPanes += 1;
    return index;
  }

  function getPaneStyle(index: number): string {
    if (sizes[index] === undefined) {
      return '';
    }

    const size = `${sizes[index]}%`;
    const transitionStyle = transition
      ? `${currentDirection === 'horizontal' ? 'width' : 'height'} ${transitionDuration}ms ease`
      : 'none';

    if (currentDirection === 'horizontal') {
      return `width: ${size}; height: 100%; transition: ${transitionStyle};`;
    }

    return `height: ${size}; width: 100%; transition: ${transitionStyle};`;
  }

  function shouldRenderDivider(paneIndex: number): boolean {
    return paneIndex < registeredPanes - 1;
  }

  function clampPaneSizes(index: number, targetSize: number, minPercent: number, total: number) {
    if (index < 0 || index + 1 >= sizes.length) {
      return false;
    }

    let nextPrimary = Math.min(total - minPercent, Math.max(minPercent, targetSize));
    let nextSecondary = total - nextPrimary;

    if (nextSecondary < minPercent) {
      nextSecondary = minPercent;
      nextPrimary = total - nextSecondary;
    }

    if (Math.abs(nextPrimary - sizes[index]) > minChangeThreshold) {
      sizes[index] = nextPrimary;
      sizes[index + 1] = nextSecondary;
      return true;
    }

    return false;
  }

  function applyResize(currentPos: number, index: number) {
    if (!isDragging || !container) {
      return;
    }

    if (index < 0 || index + 1 >= sizes.length) {
      return;
    }

    const delta = currentPos - startPos;
    if (Math.abs(delta) < minDelta) {
      return;
    }

    const currentContainerSize =
      currentDirection === 'horizontal' ? container.offsetWidth : container.offsetHeight;
    if (currentContainerSize < 1) {
      return;
    }

    const deltaPercent = (delta / currentContainerSize) * 100;
    const minPercent = (minSize / currentContainerSize) * 100;
    const total = sizes[index] + sizes[index + 1];
    const targetSize = sizes[index] + deltaPercent;

    if (clampPaneSizes(index, targetSize, minPercent, total)) {
      startPos = currentPos;
    }
  }

  function handlePointerDown(event: PointerEvent, index: number) {
    event.preventDefault();
    isDragging = true;
    transition = false;
    startPos = currentDirection === 'horizontal' ? event.clientX : event.clientY;

    const handlePointerMove = (nextEvent: PointerEvent) => {
      const currentPos =
        currentDirection === 'horizontal' ? nextEvent.clientX : nextEvent.clientY;
      applyResize(currentPos, index);
    };

    const handlePointerUp = () => {
      isDragging = false;
      transition = transitionProp;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    document.body.style.cursor = currentDirection === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (!container || index < 0 || index + 1 >= sizes.length) {
      return;
    }

    const isHorizontal = currentDirection === 'horizontal';
    const increaseKeys = isHorizontal ? ['ArrowRight'] : ['ArrowDown'];
    const decreaseKeys = isHorizontal ? ['ArrowLeft'] : ['ArrowUp'];
    const currentContainerSize = isHorizontal ? container.offsetWidth : container.offsetHeight;

    if (currentContainerSize < 1) {
      return;
    }

    const minPercent = (minSize / currentContainerSize) * 100;
    const total = sizes[index] + sizes[index + 1];

    let handled = false;

    if (increaseKeys.includes(event.key)) {
      handled = clampPaneSizes(index, sizes[index] + keyboardStep, minPercent, total);
    } else if (decreaseKeys.includes(event.key)) {
      handled = clampPaneSizes(index, sizes[index] - keyboardStep, minPercent, total);
    } else if (event.key === 'Enter' || event.key === ' ') {
      const equal = 100 / registeredPanes;
      sizes = sizes.map(() => equal);
      handled = true;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  function getNormalizedInitialSizes(minPercent?: number): number[] | null {
    if (!initialSizes || initialSizes.length !== registeredPanes) {
      return null;
    }

    if (!initialSizes.every((size) => size >= 0 && Number.isFinite(size))) {
      return null;
    }

    const sum = initialSizes.reduce((acc, value) => acc + value, 0);
    if (sum <= 0.01) {
      return null;
    }

    let normalizedSizes = initialSizes.map((size) => (size / sum) * 100);

    if (minPercent !== undefined && normalizedSizes.some((size) => size < minPercent)) {
      normalizedSizes = normalizedSizes.map((size) => Math.max(size, minPercent));
      const normalizedSum = normalizedSizes.reduce((acc, value) => acc + value, 0);
      normalizedSizes = normalizedSizes.map((size) => (size / normalizedSum) * 100);
    }

    return normalizedSizes;
  }

  const contextValue: SplitPaneContextValue = {
    registerPane,
    getPaneStyle,
    getPaneSize: (index) => sizes[index] ?? (registeredPanes > 0 ? 100 / registeredPanes : 0),
    shouldRenderDivider,
    getDirection: () => currentDirection,
    getIsDragging: () => isDragging,
    onPointerDown: handlePointerDown,
    onKeyDown: handleKeyDown,
  };

  setContext(SplitPaneContextSymbol, contextValue);

  $effect(() => {
    if (minSize <= 0) {
      console.warn(`minSize must be positive, got ${minSize}.`);
    }
    if (keyboardStep <= 0) {
      console.warn(`keyboardStep must be positive, got ${keyboardStep}.`);
    }
  });

  $effect(() => {
    if (!isDragging) {
      transition = transitionProp;
    }
  });

  $effect(() => {
    if (!container) {
      return;
    }

    const updateSize = () => {
      const node = container;
      if (!node) {
        return;
      }

      containerSize =
        currentDirection === 'horizontal' ? node.offsetWidth : node.offsetHeight;
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  });

  $effect(() => {
    if (!responsive) {
      currentDirection = direction;
      return;
    }

    if (typeof window === 'undefined') {
      currentDirection = direction;
      return;
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const updateDirection = () => {
      if (!isDragging) {
        currentDirection = mediaQuery.matches ? 'vertical' : direction;
      }
    };

    updateDirection();
    mediaQuery.addEventListener('change', updateDirection);

    return () => mediaQuery.removeEventListener('change', updateDirection);
  });

  $effect(() => {
    if (registeredPanes === 0) {
      sizes = [];
      return;
    }

    if (containerSize < 1) {
      if (sizes.length !== registeredPanes) {
        sizes = getNormalizedInitialSizes() ?? Array.from({ length: registeredPanes }, () => 100 / registeredPanes);
      }
      return;
    }

    const minPercent = (minSize / containerSize) * 100;
    const totalMinRequired = minPercent * registeredPanes;

    if (totalMinRequired > 100) {
      const equal = 100 / registeredPanes;
      sizes = Array.from({ length: registeredPanes }, () => equal);
      return;
    }

    const pixelSizes = sizes.map((size) => (size / 100) * containerSize);
    const violatesMinSize = pixelSizes.some((pixelSize) => pixelSize < minSize - tolerance);

    if (violatesMinSize) {
      let nextSizes = sizes.map((size) => Math.max((size / 100) * containerSize, minSize));
      const totalPixels = nextSizes.reduce((acc, value) => acc + value, 0);

      if (totalPixels > containerSize) {
        nextSizes = nextSizes.map((size) => (size / totalPixels) * containerSize);
      }

      sizes = nextSizes.map((pixelSize) => (pixelSize / containerSize) * 100);
    }

    if (sizes.length !== registeredPanes) {
      const normalizedInitialSizes = getNormalizedInitialSizes(minPercent);
      if (normalizedInitialSizes) {
        sizes = normalizedInitialSizes;
        return;
      }
    }

    if (sizes.length !== registeredPanes) {
      const equal = Math.max(100 / registeredPanes, minPercent);
      sizes = Array.from({ length: registeredPanes }, () => equal);
    }
  });

  $effect(() => {
    if (sizes.length > 0 && onResize) {
      onResize(sizes);
    }
  });
</script>

<div
  bind:this={container}
  class={twMerge(
    'relative flex h-full w-full overflow-hidden select-none',
    currentDirection === 'vertical' ? 'flex-col' : '',
    className,
  )}
>
  {@render children?.()}
</div>
