<script lang="ts">
  interface Props {
    width?: string | number;
    height?: string | number;
    animate?: boolean;
    primaryColor?: string;
    secondaryColor?: string;
    onSurfaceColor?: string;
  }

  let {
    width = 20,
    height = 20,
    animate = false,
    primaryColor = '#EF562F',
    secondaryColor = '#B4D44E',
    onSurfaceColor = '#111827',
  }: Props = $props();

  let play = $state(false);

  const clamp = (value: number): number => Math.min(255, Math.max(0, value));
  const darken = (color: string, percent: number): string => {
    const raw = color.replace('#', '');
    const parsed = Number.parseInt(raw, 16);
    if (Number.isNaN(parsed)) return color;

    const amount = Math.round(2.55 * percent);
    const r = clamp((parsed >> 16) - amount);
    const g = clamp(((parsed >> 8) & 0x00ff) - amount);
    const b = clamp((parsed & 0x0000ff) - amount);

    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1).toUpperCase()}`;
  };

  const primaryDarkerColor = $derived(darken(primaryColor, 40));

  $effect(() => {
    if (!animate) {
      play = false;
      return;
    }

    play = false;
    const timer = setTimeout(() => {
      play = true;
    }, 10);

    return () => clearTimeout(timer);
  });
</script>

<svg
  id="webcomponent-logo"
  data-name="WebComponent Logo"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 161 132"
  {width}
  {height}
  class={play ? 'animate' : undefined}
>
  <g fill="none" fill-rule="evenodd">
    <path fill={primaryDarkerColor} d="M160.6 65.9l-17.4 29.3-24.4-29.7 24.4-28.9z" />
    <path fill={secondaryColor} d="M141.3 100.2l-26.5-31.7-15.9 26.6 24.7 36.1z" />
    <path fill={primaryDarkerColor} d="M141 31.4l-26.2 31.8-15.9-26.6L123.6.9z" />
    <path fill={primaryColor} d="M61.1 31.4H141L123.4.9H78.7z" />
    <path fill={primaryColor} d="M114.8 63.3H159l-15.9-26.8H98.8" />
    <path fill={secondaryColor} d="M141.3 100.3H61l17.6 30.5h45z" />
    <path fill={onSurfaceColor} d="M78.6 130.8L41 65.8 79.1.8H37.9L.4 65.8l37.5 65z" />
    <path fill={secondaryColor} d="M114.8 68.4H159l-15.9 26.8H98.8" />
  </g>
</svg>

<style>
  .animate {
    animation: spin 3s ease-in-out infinite;
    transform-origin: center;
    transform-box: fill-box;
  }

  @keyframes spin {
    0% {
      transform: rotateY(0deg);
    }
    100% {
      transform: rotateY(360deg);
    }
  }
</style>
