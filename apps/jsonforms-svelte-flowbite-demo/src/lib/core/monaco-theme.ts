import type * as monaco from 'monaco-editor';
import { parse, formatHex } from 'culori';

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

export function defineFlowbiteTheme(isDark: boolean): monaco.editor.IStandaloneThemeData {
  // Primary shades
  const primary100 = resolveCSSColor('--color-primary-100');
  const primary200 = resolveCSSColor('--color-primary-200');
  const primary400 = resolveCSSColor('--color-primary-400');
  const primary600 = resolveCSSColor('--color-primary-600');
  const primary800 = resolveCSSColor('--color-primary-800');

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

  // Background & text
  //set('editor.background', isDark ? gray900 : gray50);
  set('editor.background', isDark ? gray800 : gray50);
  set('editor.foreground', isDark ? gray100 : gray900);

  // Line numbers
  set('editorLineNumber.foreground', isDark ? gray500 : gray400);
  set('editorLineNumber.activeForeground', isDark ? primary400 : primary600);

  // Cursor
  // set('editorCursor.foreground', isDark ? primary400 : primary600);

  // Selection
  // set('editor.selectionBackground', isDark ? primary800 : primary100);

  // Current line highlight
  //set('editor.lineHighlightBackground', isDark ? gray800 : gray100);
  set('editor.lineHighlightBackground', isDark ? gray900 : gray100);

  // Indent guides
  set('editorIndentGuide.background', isDark ? gray700 : gray200);

  // Gutter
  set('editorGutter.background', isDark ? gray800 : gray100);

  // Widgets (Popups, Suggest, Hover)
  set('editorWidget.background', isDark ? gray800 : gray50);
  set('editorWidget.border', isDark ? gray700 : gray200);

  // set('editorSuggestWidget.background', isDark ? gray900 : gray50);
  // set('editorSuggestWidget.border', isDark ? gray700 : gray200);
  // set('editorSuggestWidget.selectedBackground', isDark ? gray800 : gray100);
  set('editorSuggestWidget.background', isDark ? gray800 : gray50);
  set('editorSuggestWidget.border', isDark ? gray700 : gray200);
  set('editorSuggestWidget.selectedBackground', isDark ? gray900 : gray100);

  set('editorHoverWidget.background', isDark ? gray900 : gray50);
  set('editorHoverWidget.border', isDark ? gray700 : gray200);

  // Scrollbar
  set('scrollbarSlider.background', isDark ? gray700 : gray200);
  set('scrollbarSlider.hoverBackground', isDark ? gray500 : gray300);
  set('scrollbarSlider.activeBackground', isDark ? primary400 : primary600);

  // Minimap
  //set('minimap.background', isDark ? gray900 : gray50);
  set('minimap.background', isDark ? gray800 : gray50);
  set('minimap.selectionHighlight', isDark ? primary800 : primary100);
  set('minimap.findMatchHighlight', isDark ? primary400 : primary200);
  set('minimapSlider.background', isDark ? gray700 : gray200);
  set('minimapSlider.hoverBackground', isDark ? gray500 : gray300);

  // Inputs / dropdown
  set('input.background', isDark ? gray800 : gray50);
  set('input.border', isDark ? gray700 : gray300);

  set('dropdown.background', isDark ? gray900 : gray50);
  set('dropdown.border', isDark ? gray700 : gray200);

  // Lists
  set('list.hoverBackground', isDark ? gray700 : gray100);
  set('list.activeSelectionBackground', isDark ? gray800 : gray200);

  // Menu
  // set('menu.background', isDark ? gray900 : gray50);
  // set('menu.selectionBackground', isDark ? gray800 : gray100);
  // set('menu.selectionForeground', isDark ? gray100 : gray900);
  set('menu.background', isDark ? gray800 : gray50);
  set('menu.selectionBackground', isDark ? gray900 : gray100);
  set('menu.selectionForeground', isDark ? gray100 : gray900);

  return {
    base: isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
    colors: themeColors,
  };
}