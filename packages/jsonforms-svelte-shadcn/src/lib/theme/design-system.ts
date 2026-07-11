export const designSystemStyles = [
  { value: 'vega', label: 'Vega' },
  { value: 'nova', label: 'Nova' },
  { value: 'maia', label: 'Maia' },
  { value: 'lyra', label: 'Lyra' },
  { value: 'mira', label: 'Mira' },
  { value: 'luma', label: 'Luma' },
  { value: 'sera', label: 'Sera' },
  { value: 'rhea', label: 'Rhea' },
] as const;

export const designSystemBaseColors = [
  { value: 'neutral', label: 'Neutral', color: '0 0% 45%' },
  { value: 'stone', label: 'Stone', color: '25 5% 45%' },
  { value: 'zinc', label: 'Zinc', color: '240 4% 46%' },
  { value: 'mauve', label: 'Mauve', color: '300 4% 46%' },
  { value: 'olive', label: 'Olive', color: '80 4% 45%' },
  { value: 'mist', label: 'Mist', color: '210 5% 46%' },
  { value: 'taupe', label: 'Taupe', color: '30 4% 45%' },
] as const;

export const designSystemThemes = [
  ...designSystemBaseColors,
  { value: 'amber', label: 'Amber', color: '38 92% 50%' },
  { value: 'blue', label: 'Blue', color: '221 83% 53%' },
  { value: 'cyan', label: 'Cyan', color: '189 94% 43%' },
  { value: 'emerald', label: 'Emerald', color: '160 84% 39%' },
  { value: 'fuchsia', label: 'Fuchsia', color: '292 84% 61%' },
  { value: 'green', label: 'Green', color: '142 76% 36%' },
  { value: 'indigo', label: 'Indigo', color: '239 84% 67%' },
  { value: 'lime', label: 'Lime', color: '84 81% 44%' },
  { value: 'orange', label: 'Orange', color: '21 90% 48%' },
  { value: 'pink', label: 'Pink', color: '330 81% 60%' },
  { value: 'purple', label: 'Purple', color: '271 81% 56%' },
  { value: 'red', label: 'Red', color: '0 72% 51%' },
  { value: 'rose', label: 'Rose', color: '347 77% 50%' },
  { value: 'sky', label: 'Sky', color: '199 89% 48%' },
  { value: 'teal', label: 'Teal', color: '173 80% 40%' },
  { value: 'violet', label: 'Violet', color: '258 90% 66%' },
  { value: 'yellow', label: 'Yellow', color: '48 96% 53%' },
] as const;

export const designSystemIconLibraries = [
  { value: 'lucide', label: 'Lucide' },
  { value: 'tabler', label: 'Tabler' },
  { value: 'hugeicons', label: 'HugeIcons' },
  { value: 'phosphor', label: 'Phosphor' },
  { value: 'remixicon', label: 'Remix Icon' },
] as const;

export const designSystemFonts = [
  { value: 'geist', label: 'Geist', family: 'Geist, ui-sans-serif, system-ui, sans-serif' },
  { value: 'inter', label: 'Inter', family: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { value: 'noto-sans', label: 'Noto Sans', family: '"Noto Sans", ui-sans-serif, sans-serif' },
  {
    value: 'nunito-sans',
    label: 'Nunito Sans',
    family: '"Nunito Sans", ui-sans-serif, sans-serif',
  },
  { value: 'figtree', label: 'Figtree', family: 'Figtree, ui-sans-serif, sans-serif' },
  { value: 'roboto', label: 'Roboto', family: 'Roboto, ui-sans-serif, sans-serif' },
  { value: 'raleway', label: 'Raleway', family: 'Raleway, ui-sans-serif, sans-serif' },
  { value: 'dm-sans', label: 'DM Sans', family: '"DM Sans", ui-sans-serif, sans-serif' },
  {
    value: 'public-sans',
    label: 'Public Sans',
    family: '"Public Sans", ui-sans-serif, sans-serif',
  },
  { value: 'outfit', label: 'Outfit', family: 'Outfit, ui-sans-serif, sans-serif' },
  { value: 'oxanium', label: 'Oxanium', family: 'Oxanium, ui-sans-serif, sans-serif' },
  { value: 'manrope', label: 'Manrope', family: 'Manrope, ui-sans-serif, sans-serif' },
  {
    value: 'space-grotesk',
    label: 'Space Grotesk',
    family: '"Space Grotesk", ui-sans-serif, sans-serif',
  },
  { value: 'montserrat', label: 'Montserrat', family: 'Montserrat, ui-sans-serif, sans-serif' },
  {
    value: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    family: '"IBM Plex Sans", ui-sans-serif, sans-serif',
  },
  {
    value: 'source-sans-3',
    label: 'Source Sans 3',
    family: '"Source Sans 3", ui-sans-serif, sans-serif',
  },
  {
    value: 'instrument-sans',
    label: 'Instrument Sans',
    family: '"Instrument Sans", ui-sans-serif, sans-serif',
  },
  { value: 'geist-mono', label: 'Geist Mono', family: '"Geist Mono", ui-monospace, monospace' },
  {
    value: 'jetbrains-mono',
    label: 'JetBrains Mono',
    family: '"JetBrains Mono", ui-monospace, monospace',
  },
  { value: 'noto-serif', label: 'Noto Serif', family: '"Noto Serif", ui-serif, serif' },
  { value: 'roboto-slab', label: 'Roboto Slab', family: '"Roboto Slab", ui-serif, serif' },
  { value: 'merriweather', label: 'Merriweather', family: 'Merriweather, ui-serif, serif' },
  { value: 'lora', label: 'Lora', family: 'Lora, ui-serif, serif' },
  {
    value: 'playfair-display',
    label: 'Playfair Display',
    family: '"Playfair Display", ui-serif, serif',
  },
  { value: 'eb-garamond', label: 'EB Garamond', family: '"EB Garamond", ui-serif, serif' },
  {
    value: 'instrument-serif',
    label: 'Instrument Serif',
    family: '"Instrument Serif", ui-serif, serif',
  },
] as const;

export const designSystemRadii = [
  { value: 'default', label: 'Default', radius: '0.5rem' },
  { value: 'none', label: 'None', radius: '0rem' },
  { value: 'small', label: 'Small', radius: '0.45rem' },
  { value: 'medium', label: 'Medium', radius: '0.625rem' },
  { value: 'large', label: 'Large', radius: '0.875rem' },
] as const;

export const designSystemMenuColors = [
  { value: 'default', label: 'Default / Solid' },
  { value: 'default-translucent', label: 'Default / Translucent' },
  { value: 'inverted', label: 'Inverted / Solid' },
  { value: 'inverted-translucent', label: 'Inverted / Translucent' },
] as const;

export const designSystemMenuAccents = [
  { value: 'subtle', label: 'Subtle' },
  { value: 'bold', label: 'Bold' },
] as const;

type ValueOf<T extends readonly { value: string }[]> = T[number]['value'];

export interface ShadcnDesignSystemConfig extends Record<string, unknown> {
  style: ValueOf<typeof designSystemStyles>;
  baseColor: ValueOf<typeof designSystemBaseColors>;
  theme: ValueOf<typeof designSystemThemes>;
  chartColor: ValueOf<typeof designSystemThemes>;
  iconLibrary: ValueOf<typeof designSystemIconLibraries>;
  fontHeading: ValueOf<typeof designSystemFonts> | 'inherit';
  font: ValueOf<typeof designSystemFonts>;
  radius: ValueOf<typeof designSystemRadii>;
  menuColor: ValueOf<typeof designSystemMenuColors>;
  menuAccent: ValueOf<typeof designSystemMenuAccents>;
}

export const defaultShadcnDesignSystem: ShadcnDesignSystemConfig = {
  style: 'nova',
  baseColor: 'neutral',
  theme: 'neutral',
  chartColor: 'neutral',
  iconLibrary: 'lucide',
  fontHeading: 'inherit',
  font: 'inter',
  radius: 'default',
  menuColor: 'default',
  menuAccent: 'subtle',
};

const hasValue = <T extends readonly { value: string }[]>(options: T, value: unknown) =>
  options.some((option) => option.value === value);

export function normalizeShadcnDesignSystem(value: unknown): ShadcnDesignSystemConfig {
  const candidate =
    value && typeof value === 'object' ? (value as Partial<ShadcnDesignSystemConfig>) : {};
  const baseColor = hasValue(designSystemBaseColors, candidate.baseColor)
    ? candidate.baseColor!
    : defaultShadcnDesignSystem.baseColor;

  return {
    style: hasValue(designSystemStyles, candidate.style)
      ? candidate.style!
      : defaultShadcnDesignSystem.style,
    baseColor,
    theme: hasValue(designSystemThemes, candidate.theme) ? candidate.theme! : baseColor,
    chartColor: hasValue(designSystemThemes, candidate.chartColor)
      ? candidate.chartColor!
      : defaultShadcnDesignSystem.chartColor,
    iconLibrary: hasValue(designSystemIconLibraries, candidate.iconLibrary)
      ? candidate.iconLibrary!
      : defaultShadcnDesignSystem.iconLibrary,
    fontHeading:
      candidate.fontHeading === 'inherit' || hasValue(designSystemFonts, candidate.fontHeading)
        ? candidate.fontHeading!
        : defaultShadcnDesignSystem.fontHeading,
    font: hasValue(designSystemFonts, candidate.font)
      ? candidate.font!
      : defaultShadcnDesignSystem.font,
    radius: hasValue(designSystemRadii, candidate.radius)
      ? candidate.radius!
      : defaultShadcnDesignSystem.radius,
    menuColor: hasValue(designSystemMenuColors, candidate.menuColor)
      ? candidate.menuColor!
      : defaultShadcnDesignSystem.menuColor,
    menuAccent: hasValue(designSystemMenuAccents, candidate.menuAccent)
      ? candidate.menuAccent!
      : defaultShadcnDesignSystem.menuAccent,
  };
}

export function randomizeShadcnDesignSystem(): ShadcnDesignSystemConfig {
  const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;
  const baseColor = pick(designSystemBaseColors).value;
  return {
    style: pick(designSystemStyles).value,
    baseColor,
    theme: pick(designSystemThemes).value,
    chartColor: pick(designSystemThemes).value,
    iconLibrary: pick(designSystemIconLibraries).value,
    fontHeading: Math.random() < 0.7 ? 'inherit' : pick(designSystemFonts).value,
    font: pick(designSystemFonts).value,
    radius: pick(designSystemRadii).value,
    menuColor: pick(designSystemMenuColors).value,
    menuAccent: pick(designSystemMenuAccents).value,
  };
}

const baseColorVariables: Record<
  ShadcnDesignSystemConfig['baseColor'],
  { hue: string; saturation: string }
> = {
  neutral: { hue: '0', saturation: '0%' },
  stone: { hue: '24', saturation: '6%' },
  zinc: { hue: '240', saturation: '5%' },
  mauve: { hue: '300', saturation: '6%' },
  olive: { hue: '80', saturation: '8%' },
  mist: { hue: '210', saturation: '8%' },
  taupe: { hue: '30', saturation: '7%' },
};

const styleMetrics: Record<ShadcnDesignSystemConfig['style'], { control: string; radius: string }> =
  {
    vega: { control: '2.25rem', radius: '0.5rem' },
    nova: { control: '2rem', radius: '0.5rem' },
    maia: { control: '2.5rem', radius: '1rem' },
    lyra: { control: '2.25rem', radius: '0rem' },
    mira: { control: '1.75rem', radius: '0.375rem' },
    luma: { control: '2.5rem', radius: '1rem' },
    sera: { control: '2.5rem', radius: '0rem' },
    rhea: { control: '2rem', radius: '1rem' },
  };

export function buildShadcnDesignSystemCss(
  input: unknown,
  rootSelector = ':root',
  darkSelector = "[data-mode='dark']",
): string {
  const config = normalizeShadcnDesignSystem(input);
  const base = baseColorVariables[config.baseColor];
  const theme = designSystemThemes.find((item) => item.value === config.theme)!;
  const chart = designSystemThemes.find((item) => item.value === config.chartColor)!;
  const font = designSystemFonts.find((item) => item.value === config.font)!;
  const heading =
    config.fontHeading === 'inherit'
      ? font
      : designSystemFonts.find((item) => item.value === config.fontHeading)!;
  const radius = designSystemRadii.find((item) => item.value === config.radius)!;
  const metrics = styleMetrics[config.style];
  const baseLightPrimary = `${base.hue} ${base.saturation} 10%`;
  const baseDarkPrimary = `${base.hue} ${base.saturation} 90%`;
  const matchesBaseColor = theme.value === config.baseColor;
  const effectiveRadius = config.radius === 'default' ? metrics.radius : radius.radius;
  const accent = config.menuAccent === 'bold' ? theme.color : '210 40% 96.1%';
  const attributeRoot = (attribute: string) =>
    rootSelector === ':host' ? `:host(${attribute})` : `${rootSelector}${attribute}`;
  const systemDarkSelector =
    rootSelector === ':host'
      ? ":host([data-mode='system'])"
      : `${rootSelector}[data-mode='system']`;

  return `${rootSelector} {
  --foreground: ${baseLightPrimary};
  --secondary: ${base.hue} ${base.saturation} 96%;
  --secondary-foreground: ${baseLightPrimary};
  --muted: ${base.hue} ${base.saturation} 96%;
  --muted-foreground: ${base.hue} ${base.saturation} 46%;
  --border: ${base.hue} ${base.saturation} 90%;
  --input: ${base.hue} ${base.saturation} 90%;
  --primary: ${matchesBaseColor ? baseLightPrimary : theme.color};
  --ring: ${matchesBaseColor ? baseLightPrimary : theme.color};
  --accent: ${accent};
  --chart-1: ${chart.color};
  --font-sans: ${font.family};
  --font-heading: ${heading.family};
  --radius: ${effectiveRadius};
  --design-control-height: ${metrics.control};
  font-family: var(--font-sans);
}
${darkSelector}, ${darkSelector} * {
  --background: ${base.hue} ${base.saturation} 10%;
  --foreground: ${base.hue} ${base.saturation} 98%;
  --card: ${base.hue} ${base.saturation} 10%;
  --card-foreground: ${base.hue} ${base.saturation} 98%;
  --popover: ${base.hue} ${base.saturation} 10%;
  --popover-foreground: ${base.hue} ${base.saturation} 98%;
  --secondary: ${base.hue} ${base.saturation} 17%;
  --secondary-foreground: ${base.hue} ${base.saturation} 98%;
  --muted: ${base.hue} ${base.saturation} 17%;
  --muted-foreground: ${base.hue} ${base.saturation} 65%;
  --border: ${base.hue} ${base.saturation} 17%;
  --input: ${base.hue} ${base.saturation} 17%;
  --primary: ${matchesBaseColor ? baseDarkPrimary : theme.color};
  --ring: ${matchesBaseColor ? baseDarkPrimary : theme.color};
  --accent: ${config.menuAccent === 'bold' ? theme.color : '217.2 32.6% 17.5%'};
}
@media (prefers-color-scheme: dark) {
  ${systemDarkSelector}, ${systemDarkSelector} * {
    --background: ${base.hue} ${base.saturation} 10%;
    --foreground: ${base.hue} ${base.saturation} 98%;
    --card: ${base.hue} ${base.saturation} 10%;
    --card-foreground: ${base.hue} ${base.saturation} 98%;
    --popover: ${base.hue} ${base.saturation} 10%;
    --popover-foreground: ${base.hue} ${base.saturation} 98%;
    --secondary: ${base.hue} ${base.saturation} 17%;
    --secondary-foreground: ${base.hue} ${base.saturation} 98%;
    --muted: ${base.hue} ${base.saturation} 17%;
    --muted-foreground: ${base.hue} ${base.saturation} 65%;
    --border: ${base.hue} ${base.saturation} 17%;
    --input: ${base.hue} ${base.saturation} 17%;
    --primary: ${matchesBaseColor ? baseDarkPrimary : theme.color};
    --ring: ${matchesBaseColor ? baseDarkPrimary : theme.color};
    --accent: ${config.menuAccent === 'bold' ? theme.color : '217.2 32.6% 17.5%'};
  }
}
${attributeRoot(`[data-style='${config.style}']`)} :is([data-slot='input'], [data-slot='select-trigger'], [data-slot='native-select']) {
  min-height: var(--design-control-height);
  border-radius: var(--radius);
}
${attributeRoot(`[data-style='${config.style}']`)} :is([data-slot='textarea'], [data-slot='card'], [data-slot='popover-content']) {
  border-radius: var(--radius);
}
${attributeRoot(`[data-style='${config.style}']`)} [data-slot='button'] {
  border-radius: var(--radius);
}
${attributeRoot("[data-style='sera']")} {
  letter-spacing: 0.01em;
}
${rootSelector} :is(h1, h2, h3, h4, h5, h6, legend) {
  font-family: var(--font-heading);
}
${attributeRoot("[data-menu-color^='inverted']")} .design-menu-target {
  background: hsl(var(--foreground));
  color: hsl(var(--background));
}
${attributeRoot("[data-menu-color$='translucent']")} .design-menu-target {
  opacity: 0.94;
  backdrop-filter: blur(18px);
}
${attributeRoot("[data-menu-accent='bold']")} .design-menu-target [data-slot='button']:hover {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
${attributeRoot("[data-icon-library='tabler']")} svg {
  stroke-width: 1.75;
}
${attributeRoot("[data-icon-library='hugeicons']")} svg {
  stroke-width: 1.5;
}
${attributeRoot("[data-icon-library='phosphor']")} svg {
  stroke-width: 2.25;
}
${attributeRoot("[data-icon-library='remixicon']")} svg {
  stroke-width: 2.5;
}`;
}
