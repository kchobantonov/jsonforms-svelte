import { formatHex, parse } from 'culori';
import type { editor } from 'monaco-editor';

/**
 * Resolves a CSS variable to a Hex string.
 * Returns undefined if the variable is missing or invalid.
 */
export function resolveCSSColor(varName: string): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

  if (!raw) return undefined;

  try {
    const color = parse(raw);
    return color ? formatHex(color) : undefined;
  } catch {
    return undefined;
  }
}

export function editorColorScale(name: 'primary' | 'gray' | 'surface', shades: number[]) {
  return Object.fromEntries(
    shades.map((shade) => [shade, resolveCSSColor(`--color-${name}-${shade}`)]),
  ) as Record<number, string | undefined>;
}

interface EditorPalette {
  panel?: string;
  foreground?: string;
  muted?: string;
  primary?: string;
  cursor?: string;
  editorSelection?: string;
  elevated?: string;
  border?: string;
  hover?: string;
  scrollbarHover?: string;
  selection?: string;
  findMatch?: string;
}

export function createDemoMonacoTheme(
  isDark: boolean,
  palette: EditorPalette,
  overrides: Record<string, string | undefined> = {},
): editor.IStandaloneThemeData {
  const colors: Record<string, string | undefined> = {
    'editor.background': palette.panel,
    'editor.foreground': palette.foreground,
    'editorLineNumber.foreground': palette.muted,
    'editorLineNumber.activeForeground': palette.primary,
    'editorCursor.foreground': palette.cursor,
    'editor.selectionBackground': palette.editorSelection,
    'editor.lineHighlightBackground': palette.elevated,
    'editorIndentGuide.background': palette.border,
    'editorGutter.background': palette.panel,
    'editorWidget.background': palette.elevated,
    'editorWidget.border': palette.border,
    'editorSuggestWidget.background': palette.elevated,
    'editorSuggestWidget.border': palette.border,
    'editorSuggestWidget.selectedBackground': palette.hover,
    'editorHoverWidget.background': palette.elevated,
    'editorHoverWidget.border': palette.border,
    'scrollbarSlider.background': palette.border,
    'scrollbarSlider.hoverBackground': palette.scrollbarHover,
    'scrollbarSlider.activeBackground': palette.primary,
    'minimap.background': palette.panel,
    'minimap.selectionHighlight': palette.selection,
    'minimap.findMatchHighlight': palette.findMatch,
    'minimapSlider.background': palette.border,
    'minimapSlider.hoverBackground': palette.scrollbarHover,
    'input.background': palette.panel,
    'input.border': palette.border,
    'dropdown.background': palette.elevated,
    'dropdown.border': palette.border,
    'list.hoverBackground': palette.hover,
    'list.activeSelectionBackground': palette.hover,
    'menu.background': palette.elevated,
    'menu.selectionBackground': palette.hover,
    'menu.selectionForeground': palette.foreground,
    ...overrides,
  };
  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: Object.fromEntries(
      Object.entries(colors).filter((entry): entry is [string, string] => !!entry[1]),
    ),
  };
}
