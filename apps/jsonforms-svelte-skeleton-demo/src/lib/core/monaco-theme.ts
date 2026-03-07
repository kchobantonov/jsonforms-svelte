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

export function defineSkeletonDemoTheme(isDark: boolean): monaco.editor.IStandaloneThemeData {
  // Primary shades
  const primary100 = resolveCSSColor('--color-primary-100');
  const primary200 = resolveCSSColor('--color-primary-200');
  const primary400 = resolveCSSColor('--color-primary-400');
  const primary600 = resolveCSSColor('--color-primary-600');
  const primary800 = resolveCSSColor('--color-primary-800');

  // Surface palette used by Skeleton cards and panels
  const surface50 = resolveCSSColor('--color-surface-50');
  const surface100 = resolveCSSColor('--color-surface-100');
  const surface200 = resolveCSSColor('--color-surface-200');
  const surface300 = resolveCSSColor('--color-surface-300');
  const surface400 = resolveCSSColor('--color-surface-400');
  const surface500 = resolveCSSColor('--color-surface-500');
  const surface700 = resolveCSSColor('--color-surface-700');
  const surface800 = resolveCSSColor('--color-surface-800');
  const surface900 = resolveCSSColor('--color-surface-900');
  const surface950 = resolveCSSColor('--color-surface-950');

  // Grays
  const gray50 = resolveCSSColor('--color-gray-50');
  const gray100 = resolveCSSColor('--color-gray-100');
  const gray200 = resolveCSSColor('--color-gray-200');
  const gray300 = resolveCSSColor('--color-gray-300');
  const gray400 = resolveCSSColor('--color-gray-400');
  const gray500 = resolveCSSColor('--color-gray-500');
  const gray700 = resolveCSSColor('--color-gray-700');
  const gray800 = resolveCSSColor('--color-gray-800');
  const gray900 = resolveCSSColor('--color-gray-900');

  const themeColors: Record<string, string> = {};

  /**
   * Internal helper to only add defined colors to the theme object.
   * If a value is undefined, Monaco falls back to the 'base' theme value.
   */
  const set = (key: string, value: string | undefined) => {
    if (value) themeColors[key] = value;
  };

  const panelBackground = isDark ? (surface950 ?? gray900) : (surface50 ?? gray50);
  const elevatedBackground = isDark ? (surface900 ?? gray800) : (surface100 ?? gray100);
  const borderColor = isDark ? (surface700 ?? gray700) : (surface200 ?? gray200);
  const mutedColor = isDark ? (surface500 ?? gray500) : (surface400 ?? gray400);
  const foregroundColor = isDark ? (surface50 ?? gray100) : (surface950 ?? gray900);
  const hoverColor = isDark ? (surface800 ?? gray700) : (surface100 ?? gray100);

  // Background & text
  set('editor.background', panelBackground);
  set('editor.foreground', foregroundColor);

  // Line numbers
  set('editorLineNumber.foreground', mutedColor);
  set('editorLineNumber.activeForeground', isDark ? primary400 : primary600);

  // Cursor
  // set('editorCursor.foreground', isDark ? primary400 : primary600);

  // Selection
  // set('editor.selectionBackground', isDark ? primary800 : primary100);

  // Current line highlight
  //set('editor.lineHighlightBackground', isDark ? gray800 : gray100);
  set('editor.lineHighlightBackground', elevatedBackground);

  // Indent guides
  set('editorIndentGuide.background', borderColor);

  // Gutter
  set('editorGutter.background', panelBackground);

  // Widgets (Popups, Suggest, Hover)
  set('editorWidget.background', elevatedBackground);
  set('editorWidget.border', borderColor);

  // set('editorSuggestWidget.background', isDark ? gray900 : gray50);
  // set('editorSuggestWidget.border', isDark ? gray700 : gray200);
  // set('editorSuggestWidget.selectedBackground', isDark ? gray800 : gray100);
  set('editorSuggestWidget.background', elevatedBackground);
  set('editorSuggestWidget.border', borderColor);
  set('editorSuggestWidget.selectedBackground', hoverColor);

  set('editorHoverWidget.background', elevatedBackground);
  set('editorHoverWidget.border', borderColor);

  // Scrollbar
  set('scrollbarSlider.background', borderColor);
  set(
    'scrollbarSlider.hoverBackground',
    isDark ? (surface500 ?? gray500) : (surface300 ?? gray300),
  );
  set('scrollbarSlider.activeBackground', isDark ? primary400 : primary600);

  // Minimap
  set('minimap.background', panelBackground);
  set('minimap.selectionHighlight', isDark ? primary800 : primary100);
  set('minimap.findMatchHighlight', isDark ? primary400 : primary200);
  set('minimapSlider.background', borderColor);
  set('minimapSlider.hoverBackground', isDark ? (surface500 ?? gray500) : (surface300 ?? gray300));

  // Inputs / dropdown
  set('input.background', panelBackground);
  set('input.border', borderColor);

  set('dropdown.background', elevatedBackground);
  set('dropdown.border', borderColor);

  // Lists
  set('list.hoverBackground', hoverColor);
  set('list.activeSelectionBackground', hoverColor);

  // Menu
  // set('menu.background', isDark ? gray900 : gray50);
  // set('menu.selectionBackground', isDark ? gray800 : gray100);
  // set('menu.selectionForeground', isDark ? gray100 : gray900);
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
