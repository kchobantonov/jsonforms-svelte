import type * as monaco from 'monaco-editor';
import { createDemoMonacoTheme, editorColorScale } from '@chobantonov/jsonforms-svelte-demo-common';

export function defineFlowbiteTheme(isDark: boolean): monaco.editor.IStandaloneThemeData {
  // Primary shades
  const primary = editorColorScale('primary', [100, 200, 400, 600, 800]);

  // Grays
  const gray = editorColorScale('gray', [50, 100, 200, 300, 400, 500, 700, 800, 900]);

  return createDemoMonacoTheme(
    isDark,
    {
      panel: isDark ? gray[800] : gray[50],
      foreground: isDark ? gray[100] : gray[900],
      elevated: isDark ? gray[800] : gray[50],
      border: isDark ? gray[700] : gray[200],
      muted: isDark ? gray[500] : gray[400],
      hover: isDark ? gray[900] : gray[100],
      primary: isDark ? primary[400] : primary[600],
      selection: isDark ? primary[800] : primary[100],
      findMatch: isDark ? primary[400] : primary[200],
      scrollbarHover: isDark ? gray[500] : gray[300],
    },
    {
      'editor.lineHighlightBackground': isDark ? gray[900] : gray[100],
      'editorGutter.background': isDark ? gray[800] : gray[100],
      'editorHoverWidget.background': isDark ? gray[900] : gray[50],
      'input.border': isDark ? gray[700] : gray[300],
      'dropdown.background': isDark ? gray[900] : gray[50],
      'list.hoverBackground': isDark ? gray[700] : gray[100],
      'list.activeSelectionBackground': isDark ? gray[800] : gray[200],
    },
  );
}
