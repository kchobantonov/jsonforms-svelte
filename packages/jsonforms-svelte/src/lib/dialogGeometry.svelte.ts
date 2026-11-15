import { tick } from 'svelte';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { toCss, type Dimension } from './layoutSizing';

export interface DetailDialogGeometryOptions {
  width?: Dimension;
  height?: Dimension;
  maximizable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
}
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
const dimension = (value: unknown): Dimension | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : typeof value === 'string' && value.trim() && !/[;{}\n\r]/.test(value)
      ? value
      : undefined;

/** Geometry only. Family-native dialogs retain focus trapping, portals, and actions. */
export function useDetailDialogGeometry(input: { open: () => boolean; options: () => unknown }) {
  const form = useJsonForms();
  const options = $derived({
    ...record(record(record(form.config).jsonformsExtended).dialog),
    ...record(input.options()),
  });
  let maximized = $state(false);
  let offset = $state.raw({ x: 0, y: 0 });
  let normalSize = $state.raw<{ width: number; height: number }>();
  let surface = $state.raw<HTMLElement>();
  const width = $derived(
    maximized ? 'calc(100vw - 32px)' : toCss(normalSize?.width ?? dimension(options.width) ?? 640),
  );
  const height = $derived(
    maximized
      ? 'calc(100dvh - 32px)'
      : normalSize?.height !== undefined
        ? `${normalSize.height}px`
        : dimension(options.height) !== undefined
          ? toCss(dimension(options.height)!)
          : 'auto',
  );

  function bounds() {
    if (!surface) return undefined;
    const rect = surface.getBoundingClientRect();
    const view = surface.ownerDocument.defaultView!;
    return {
      left: offset.x - rect.left,
      right: offset.x + Math.max(0, view.innerWidth - rect.width) - rect.left,
      top: offset.y - rect.top,
      bottom: offset.y + Math.max(0, view.innerHeight - rect.height) - rect.top,
    };
  }
  function clamp(x: number, y: number, limits = bounds()) {
    return limits
      ? {
          x: Math.max(limits.left, Math.min(limits.right, x)),
          y: Math.max(limits.top, Math.min(limits.bottom, y)),
        }
      : { x, y };
  }
  function constrain() {
    if (!input.open() || maximized) return;
    const next = clamp(offset.x, offset.y);
    if (next.x !== offset.x || next.y !== offset.y) offset = next;
  }
  function focus() {
    surface?.focus({ preventScroll: true });
  }
  $effect(() => {
    if (!input.open()) {
      maximized = false;
      offset = { x: 0, y: 0 };
      normalSize = undefined;
    } else {
      void tick().then(() => {
        if (input.open()) focus();
      });
    }
  });

  return {
    get maximized() {
      return maximized;
    },
    get maximizable() {
      return options.maximizable !== false;
    },
    get draggable() {
      return options.draggable === true && !maximized;
    },
    get style() {
      const x = maximized ? 0 : offset.x;
      const y = maximized ? 0 : offset.y;
      return `box-sizing:border-box;position:fixed;left:calc(50% + ${x}px);top:calc(50% + ${y}px);right:auto;bottom:auto;margin:0;translate:-50% -50%;transform:none;transition-property:none;width:${width};height:${height};min-width:min(280px,calc(100vw - 32px));min-height:min(160px,calc(100dvh - 32px));max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);display:${input.open() ? 'flex' : 'none'};flex-direction:column;overflow:hidden;resize:${options.resizable === true && !maximized ? 'both' : 'none'}`;
    },
    toggle() {
      maximized = !maximized;
    },
    focus,
    /** Attach to the native header, so its owning dialog also works in shadow roots. */
    header(node: HTMLElement) {
      const owner = node.closest<HTMLElement>('dialog, [role="dialog"]');
      if (!owner) return;
      node.setAttribute('data-detail-dialog-header', '');
      surface = owner;
      const view = owner.ownerDocument.defaultView!;
      let drag:
        | {
            pointer: number;
            x: number;
            y: number;
            left: number;
            top: number;
            bounds: ReturnType<typeof bounds>;
          }
        | undefined;
      const down = (event: PointerEvent) => {
        if (
          options.draggable !== true ||
          maximized ||
          event.button !== 0 ||
          (event.target as Element).closest('button, a, input, select, textarea')
        )
          return;
        event.preventDefault();
        drag = {
          pointer: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          left: offset.x,
          top: offset.y,
          bounds: bounds(),
        };
        node.setPointerCapture(event.pointerId);
      };
      const move = (event: PointerEvent) => {
        if (drag?.pointer !== event.pointerId) return;
        offset = clamp(
          drag.left + event.clientX - drag.x,
          drag.top + event.clientY - drag.y,
          drag.bounds,
        );
      };
      const end = (event: PointerEvent) => {
        if (drag?.pointer !== event.pointerId) return;
        drag = undefined;
        if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
      };
      const lost = () => {
        drag = undefined;
      };
      let resizeFrame: number | undefined;
      const resized = () => {
        resizeFrame = undefined;
        if (!input.open() || maximized) return;
        // Browser-native CSS resizing writes inline pixel dimensions. Remember them
        // so later dragging/maximization does not overwrite the user's chosen size.
        if (
          (owner.style.width && owner.style.width !== width) ||
          (owner.style.height && owner.style.height !== height)
        ) {
          const rect = owner.getBoundingClientRect();
          normalSize = { width: rect.width, height: rect.height };
        }
        constrain();
      };
      const observer = new ResizeObserver(() => {
        if (resizeFrame === undefined) resizeFrame = view.requestAnimationFrame(resized);
      });
      observer.observe(owner);
      view.addEventListener('resize', constrain);
      node.addEventListener('pointerdown', down);
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', end);
      node.addEventListener('pointercancel', end);
      node.addEventListener('lostpointercapture', lost);
      // Flowbite's native autofocus hook may choose the header; forward that focus
      // to the dialog container without selecting an editor's text.
      node.addEventListener('focus', focus);
      return {
        destroy() {
          observer.disconnect();
          if (resizeFrame !== undefined) view.cancelAnimationFrame(resizeFrame);
          view.removeEventListener('resize', constrain);
          node.removeEventListener('pointerdown', down);
          node.removeEventListener('pointermove', move);
          node.removeEventListener('pointerup', end);
          node.removeEventListener('pointercancel', end);
          node.removeEventListener('lostpointercapture', lost);
          node.removeEventListener('focus', focus);
          if (surface === owner) surface = undefined;
        },
      };
    },
  };
}
