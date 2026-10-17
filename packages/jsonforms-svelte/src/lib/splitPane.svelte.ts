import { onDestroy, untrack, tick } from 'svelte';
import { rendererMessage } from './rendererMessages';
import { fitSplitSizes, splitBounds } from './splitPane';
export interface SplitPaneOptions {
  direction?: 'horizontal' | 'vertical';
  minSize?: number;
  responsive?: boolean;
  breakpoint?: number;
  transition?: boolean;
  transitionDuration?: number;
  keyboardStep?: number;
  initialSizes?: number[];
  sizes?: number[];
  minimumSizes?: number[];
  maximumSizes?: number[];
  resizable?: boolean;
  resizeLabel?: string;
  onResize?: (sizes: number[]) => void;
}

let activeDrag: (() => void) | undefined;

export function useSplitPane(options: () => SplitPaneOptions) {
  const {
    direction = 'horizontal',
    minSize = 100,
    responsive = true,
    breakpoint = 768,
    transition: transitionProp = true,
    transitionDuration = 150,
    keyboardStep = 2,
    initialSizes,
    sizes: controlledSizes,
    minimumSizes,
    maximumSizes,
    resizable = true,
    resizeLabel = rendererMessage(undefined, 'splitLayout.resize'),
    onResize,
  } = $derived(options());
  const minChangeThreshold = 0.01;
  const minDelta = 1;

  let transition = $derived(transitionProp);
  let isDragging = $state(false);
  let startPos = $state(0);
  let sizes = $state<number[]>([]);
  let container = $state<HTMLDivElement | null>(null);
  let currentDirection = $state<'horizontal' | 'vertical'>('horizontal');
  const stacked = $derived(
    responsive && direction === 'horizontal' && currentDirection === 'vertical',
  );
  let registrations = $state<string[]>([]);
  const registeredPanes = $derived(registrations.length);
  let containerSize = $state(0);
  let measuring = $state(false);
  let savedSizes: number[] | undefined;
  $effect.pre(() => {
    if (stacked) {
      savedSizes = untrack(() => [...sizes]);
      return;
    }
    if (!savedSizes) return;
    const restore = savedSizes;
    savedSizes = undefined;
    measuring = true;
    let cancelled = false;
    void tick().then(() => {
      if (cancelled) return;
      if (container) containerSize = availableSize(container);
      sizes = restore;
      measuring = false;
    });
    return () => {
      cancelled = true;
    };
  });

  function registerPane(id: string) {
    untrack(() => {
      registrations = [...registrations, id];
    });
    return () => {
      registrations = registrations.filter((value) => value !== id);
    };
  }

  function getPaneStyle(index: number): string {
    if (stacked) return 'flex: none; width: 100%; height: auto;';
    if (sizes[index] === undefined) {
      return '';
    }

    const transitionStyle = transition
      ? `${currentDirection === 'horizontal' ? 'width' : 'height'} ${transitionDuration}ms ease`
      : 'none';

    if (currentDirection === 'horizontal') {
      return `flex: ${sizes[index]} 1 0; width: 0; height: var(--split-cross-size, 100%); transition: ${transitionStyle};`;
    }

    return `flex: ${sizes[index]} 1 0; height: 0; width: var(--split-cross-size, 100%); transition: ${transitionStyle};`;
  }

  function shouldRenderDivider(paneIndex: number): boolean {
    return !stacked && paneIndex < registeredPanes - 1;
  }

  const bounds = $derived(
    splitBounds(
      registeredPanes,
      containerSize > 0
        ? Math.min(100 / Math.max(1, registeredPanes), (minSize / containerSize) * 100)
        : 0,
      minimumSizes,
      maximumSizes,
    ),
  );

  function clampPaneSizes(index: number, targetSize: number, _minPercent: number, total: number) {
    if (index < 0 || index + 1 >= sizes.length) return false;
    const lower = Math.max(bounds.lower[index], total - bounds.upper[index + 1]);
    const upper = Math.min(bounds.upper[index], total - bounds.lower[index + 1]);
    const next = Math.max(lower, Math.min(upper, targetSize));
    if (Math.abs(next - sizes[index]) < minChangeThreshold) return false;
    sizes = sizes.map((value, i) => (i === index ? next : i === index + 1 ? total - next : value));
    return true;
  }

  function availableSize(node: HTMLElement) {
    const horizontal = currentDirection === 'horizontal';
    const style = getComputedStyle(node);
    const gap = Number.parseFloat(horizontal ? style.columnGap : style.rowGap) || 0;
    const children = Array.from(node.children);
    return Math.max(
      0,
      (horizontal ? node.clientWidth : node.clientHeight) -
        children
          .filter((child) => child.getAttribute('role') === 'separator')
          .reduce(
            (sum, child) =>
              sum +
              (horizontal
                ? child.getBoundingClientRect().width
                : child.getBoundingClientRect().height),
            0,
          ) -
        gap * Math.max(0, children.length - 1),
    );
  }

  function applyResize(currentPos: number, index: number) {
    if (!resizable || !isDragging || !container) {
      return;
    }

    if (index < 0 || index + 1 >= sizes.length) {
      return;
    }

    const rtl =
      currentDirection === 'horizontal' && getComputedStyle(container).direction === 'rtl';
    const delta = (currentPos - startPos) * (rtl ? -1 : 1);
    if (Math.abs(delta) < minDelta) {
      return;
    }

    const currentContainerSize = availableSize(container);
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

  let stopDragging: (() => void) | undefined;
  let dragMembership = $state('');
  let dragDirection = $state<'horizontal' | 'vertical'>('horizontal');
  onDestroy(() => stopDragging?.());
  $effect(() => {
    if (
      !resizable ||
      (isDragging &&
        (dragMembership !== registrations.join('|') || dragDirection !== currentDirection))
    )
      stopDragging?.();
  });

  function startDrag(event: MouseEvent | PointerEvent | TouchEvent, index: number) {
    if (!resizable || isDragging || activeDrag || ('button' in event && event.button !== 0)) return;
    const touch = 'changedTouches' in event ? event.changedTouches[0] : undefined;
    if ('changedTouches' in event && !touch) return;
    event.preventDefault();
    event.stopPropagation();
    const point = touch ?? (event as MouseEvent);
    const axis = currentDirection;
    dragMembership = registrations.join('|');
    dragDirection = axis;
    const rtl = container ? getComputedStyle(container).direction : 'ltr';
    isDragging = true;
    transition = false;
    startPos = axis === 'horizontal' ? point.clientX : point.clientY;
    const pointer = event.type === 'pointerdown' ? (event as PointerEvent).pointerId : undefined;
    const moveType = touch ? 'touchmove' : pointer !== undefined ? 'pointermove' : 'mousemove';
    const endType = touch ? 'touchend' : pointer !== undefined ? 'pointerup' : 'mouseup';
    const cancelType = touch ? 'touchcancel' : 'pointercancel';
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    const finish = () => {
      isDragging = false;
      transition = transitionProp;
      window.removeEventListener(moveType, move);
      window.removeEventListener(endType, end);
      window.removeEventListener(cancelType, end);
      window.removeEventListener('blur', finish);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      stopDragging = undefined;
      if (activeDrag === finish) activeDrag = undefined;
    };
    const move = (next: Event) => {
      if (
        !container ||
        currentDirection !== axis ||
        getComputedStyle(container).direction !== rtl
      ) {
        finish();
        return;
      }
      if (pointer !== undefined && (next as PointerEvent).pointerId !== pointer) return;
      const position = touch
        ? Array.from((next as TouchEvent).touches).find(
            (value) => value.identifier === touch.identifier,
          )
        : (next as MouseEvent);
      if (!position) return;
      if (next.cancelable) next.preventDefault();
      applyResize(axis === 'horizontal' ? position.clientX : position.clientY, index);
    };
    const end = (next: Event) => {
      if (pointer !== undefined && (next as PointerEvent).pointerId !== pointer) return;
      if (
        touch &&
        !Array.from((next as TouchEvent).changedTouches).some(
          (value) => value.identifier === touch.identifier,
        )
      )
        return;
      finish();
    };
    stopDragging = finish;
    activeDrag = finish;
    window.addEventListener(moveType, move, { passive: false });
    window.addEventListener(endType, end);
    window.addEventListener(cancelType, end);
    window.addEventListener('blur', finish);
    document.body.style.cursor = axis === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }

  function handleKeyDown(event: KeyboardEvent, index: number) {
    if (!resizable || !container || index < 0 || index + 1 >= sizes.length) {
      return;
    }

    const isHorizontal = currentDirection === 'horizontal';
    const rtl = isHorizontal && getComputedStyle(container).direction === 'rtl';
    const increaseKeys = isHorizontal ? [rtl ? 'ArrowLeft' : 'ArrowRight'] : ['ArrowDown'];
    const decreaseKeys = isHorizontal ? [rtl ? 'ArrowRight' : 'ArrowLeft'] : ['ArrowUp'];
    const currentContainerSize = availableSize(container);

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
    } else if (event.key === 'Home') {
      handled = clampPaneSizes(index, 0, minPercent, total);
    } else if (event.key === 'End') {
      handled = clampPaneSizes(index, 100, minPercent, total);
    } else if (event.key === 'Enter' || event.key === ' ') {
      const equal = 100 / registeredPanes;
      sizes = fitSplitSizes(
        sizes.map(() => equal),
        bounds.lower,
        bounds.upper,
      );
      handled = true;
    }

    if (handled || [...increaseKeys, ...decreaseKeys, 'Home', 'End'].includes(event.key)) {
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

  const contextValue = {
    registerPane,
    getHandleMinimums: () =>
      sizes
        .slice(0, -1)
        .map((_, index) =>
          Math.max(bounds.lower[index], sizes[index] + sizes[index + 1] - bounds.upper[index + 1]),
        ),
    getHandleMaximums: () =>
      sizes
        .slice(0, -1)
        .map((_, index) =>
          Math.min(bounds.upper[index], sizes[index] + sizes[index + 1] - bounds.lower[index + 1]),
        ),
    getIndex: (id: string) => registrations.indexOf(id),
    getPaneStyle,
    getPaneSize: (index: number) =>
      sizes[index] ?? (registeredPanes > 0 ? 100 / registeredPanes : 0),
    shouldRenderDivider,
    getMinSize: (index: number) =>
      Math.max(
        bounds.lower[index] ?? 0,
        (sizes[index] ?? 0) + (sizes[index + 1] ?? 0) - (bounds.upper[index + 1] ?? 100),
      ),
    getMaxSize: (index: number) =>
      Math.min(
        bounds.upper[index] ?? 100,
        (sizes[index] ?? 100) + (sizes[index + 1] ?? 0) - (bounds.lower[index + 1] ?? 0),
      ),
    getDirection: () => currentDirection,
    getIsDragging: () => isDragging,
    isResizable: () => resizable && !stacked,
    isStacked: () => stacked,
    getResizeLabel: () => resizeLabel,
    onPointerDown: startDrag,
    onMouseDown: startDrag,
    onTouchStart: startDrag,
    onKeyDown: handleKeyDown,
  };

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

      containerSize = availableSize(node);
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
      currentDirection = mediaQuery.matches ? 'vertical' : direction;
    };

    updateDirection();
    mediaQuery.addEventListener('change', updateDirection);

    return () => mediaQuery.removeEventListener('change', updateDirection);
  });

  $effect(() => {
    if (!registeredPanes) {
      sizes = [];
      return;
    }
    if (stacked || measuring) return;
    const previous = untrack(() => sizes);
    const requested =
      controlledSizes?.length === registeredPanes
        ? controlledSizes
        : previous.length === registeredPanes
          ? previous
          : (getNormalizedInitialSizes() ??
            Array.from({ length: registeredPanes }, () => 100 / registeredPanes));
    const next = fitSplitSizes(requested, bounds.lower, bounds.upper);
    if (next.some((value, i) => Math.abs(value - (previous[i] ?? -1)) > 1e-7)) sizes = next;
  });

  $effect(() => {
    if (sizes.length > 0 && onResize) {
      onResize(sizes);
    }
  });

  return {
    ...contextValue,
    get node() {
      return container;
    },
    set node(value: HTMLDivElement | null) {
      container = value;
    },
  };
}
