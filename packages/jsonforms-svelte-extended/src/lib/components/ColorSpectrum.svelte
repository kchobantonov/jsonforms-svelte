<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { parseColor, rgbToHsb, hsbToRgb } from '../core/colorProfile';
  import { untrack } from 'svelte';
  let {
    value,
    disabled,
    onchange,
  }: {
    value: unknown;
    disabled: boolean;
    onchange(color: { r: number; g: number; b: number; a: number }): void;
  } = $props();
  const message = useRendererMessages();
  let hue = $state(0);
  let saturation = $state(0);
  let brightness = $state(100);
  let dragging = $state(false);
  $effect(() => {
    const color = parseColor(value);
    if (color) {
      const hsv = rgbToHsb(color);
      untrack(() => {
        // Hue is still meaningful when the pointer reaches white or black.
        if (hsv.s > 0 && hsv.b > 0) hue = hsv.h;
        if (hsv.b > 0) saturation = hsv.s;
        brightness = hsv.b;
      });
    }
    if (disabled) dragging = false;
  });
  function commit() {
    if (disabled) return;
    onchange({ ...hsbToRgb(hue, saturation, brightness), a: parseColor(value)?.a ?? 1 });
  }
  function point(event: PointerEvent) {
    if (disabled) return;
    const rect =
      event.currentTarget instanceof HTMLElement
        ? event.currentTarget.getBoundingClientRect()
        : undefined;
    if (!rect?.width || !rect.height) return;
    saturation = Math.round(
      Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
    );
    brightness = Math.round(
      Math.max(0, Math.min(100, 100 - ((event.clientY - rect.top) / rect.height) * 100)),
    );
    commit();
  }
  function key(event: KeyboardEvent) {
    if (disabled) return;
    const step = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowLeft':
        saturation = Math.max(0, saturation - step);
        break;
      case 'ArrowRight':
        saturation = Math.min(100, saturation + step);
        break;
      case 'ArrowDown':
        brightness = Math.max(0, brightness - step);
        break;
      case 'ArrowUp':
        brightness = Math.min(100, brightness + step);
        break;
      case 'Home':
        saturation = 0;
        break;
      case 'End':
        saturation = 100;
        break;
      default:
        return;
    }
    event.preventDefault();
    commit();
  }
</script>

<div class="spectrum" data-color-spectrum>
  <div
    class="area"
    role="slider"
    tabindex={disabled ? -1 : 0}
    aria-disabled={disabled}
    aria-label={message('color.spectrum')}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={saturation}
    aria-valuetext={`${message('color.hsb.s')}: ${Math.round(saturation)}, ${message('color.hsb.b')}: ${Math.round(brightness)}`}
    style:background-color={`hsl(${hue} 100% 50%)`}
    onkeydown={key}
    onpointerdown={(event) => {
      if (disabled || event.button !== 0) return;
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragging = true;
      point(event);
    }}
    onpointermove={(event) => {
      if (dragging) point(event);
    }}
    onpointerup={() => {
      dragging = false;
    }}
    onpointercancel={() => {
      dragging = false;
    }}
    onlostpointercapture={() => {
      dragging = false;
    }}
  >
    <span class="thumb" style:left={`${saturation}%`} style:top={`${100 - brightness}%`}></span>
  </div>
  <input
    class="hue"
    type="range"
    min="0"
    max="360"
    step="1"
    value={hue}
    {disabled}
    aria-label={message('color.hsb.h')}
    oninput={(event) => {
      hue = Number(event.currentTarget.value);
      commit();
    }}
  />
</div>

<style>
  .spectrum {
    display: grid;
    gap: 0.75rem;
  }
  .area {
    position: relative;
    height: 10rem;
    border-radius: 0.375rem;
    touch-action: none;
    cursor: crosshair;
    background-image:
      linear-gradient(to top, black, transparent), linear-gradient(to right, white, transparent);
  }
  .area:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
  }
  .thumb {
    position: absolute;
    width: 0.75rem;
    height: 0.75rem;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 1px black;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
  .hue {
    width: 100%;
    margin: 0;
    height: 0.875rem;
    appearance: none;
    border-radius: 999px;
    background: linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red);
    cursor: pointer;
  }
  .hue::-webkit-slider-thumb {
    appearance: none;
    width: 1rem;
    height: 1rem;
    border: 2px solid white;
    border-radius: 50%;
    background: transparent;
    box-shadow: 0 0 0 1px black;
  }
  .hue::-moz-range-thumb {
    width: 0.75rem;
    height: 0.75rem;
    border: 2px solid white;
    border-radius: 50%;
    background: transparent;
    box-shadow: 0 0 0 1px black;
  }
</style>
