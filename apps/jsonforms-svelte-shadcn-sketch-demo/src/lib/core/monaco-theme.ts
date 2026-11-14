import { formatHex, parse } from 'culori';
import type * as monaco from 'monaco-editor';

/**
 * Resolves a CSS variable to a Hex string.
 * Returns undefined if the variable is missing or invalid.
 */
function resolveCSSColor(varName: string): string | undefined {
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

export function defineShadcnDemoTheme(isDark: boolean): monaco.editor.IStandaloneThemeData {
  const background = resolveCSSColor('--color-background');
  const card = resolveCSSColor('--color-card');
  const popover = resolveCSSColor('--color-popover');
  const foreground = resolveCSSColor('--color-foreground');
  const muted = resolveCSSColor('--color-muted');
  const mutedForeground = resolveCSSColor('--color-muted-foreground');
  const border = resolveCSSColor('--color-border');
  const primary = resolveCSSColor('--color-primary');
  const accent = resolveCSSColor('--color-accent');

  const themeColors: Record<string, string> = {};

  /**
   * Internal helper to only add defined colors to the theme object.
   * If a value is undefined, Monaco falls back to the 'base' theme value.
   */
  const set = (key: string, value: string | undefined) => {
    if (value) themeColors[key] = value;
  };

  const panelBackground = background ?? card;
  const elevatedBackground = card ?? popover ?? background;
  const borderColor = border;
  const mutedColor = mutedForeground;
  const foregroundColor = foreground;
  const hoverColor = accent ?? muted;

  // Background & text
  set('editor.background', panelBackground);
  set('editor.foreground', foregroundColor);

  // Line numbers
  set('editorLineNumber.foreground', mutedColor);
  set('editorLineNumber.activeForeground', primary);

  set('editorCursor.foreground', primary);
  set('editor.selectionBackground', accent);

  set('editor.lineHighlightBackground', elevatedBackground);

  // Indent guides
  set('editorIndentGuide.background', borderColor);

  // Gutter
  set('editorGutter.background', panelBackground);

  // Widgets (Popups, Suggest, Hover)
  set('editorWidget.background', elevatedBackground);
  set('editorWidget.border', borderColor);

  set('editorSuggestWidget.background', elevatedBackground);
  set('editorSuggestWidget.border', borderColor);
  set('editorSuggestWidget.selectedBackground', hoverColor);

  set('editorHoverWidget.background', elevatedBackground);
  set('editorHoverWidget.border', borderColor);

  // Scrollbar
  set('scrollbarSlider.background', borderColor);
  set('scrollbarSlider.hoverBackground', mutedColor);
  set('scrollbarSlider.activeBackground', primary);

  // Minimap
  set('minimap.background', panelBackground);
  set('minimap.selectionHighlight', accent);
  set('minimap.findMatchHighlight', primary);
  set('minimapSlider.background', borderColor);
  set('minimapSlider.hoverBackground', mutedColor);

  // Inputs / dropdown
  set('input.background', panelBackground);
  set('input.border', borderColor);

  set('dropdown.background', elevatedBackground);
  set('dropdown.border', borderColor);

  // Lists
  set('list.hoverBackground', hoverColor);
  set('list.activeSelectionBackground', hoverColor);

  set('menu.background', elevatedBackground);
  set('menu.selectionBackground', hoverColor);
  set('menu.selectionForeground', foregroundColor);

  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: themeColors,
  };
}
