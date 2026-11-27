import type * as monaco from 'monaco-editor';
import { createDemoMonacoTheme, editorColorScale } from '@chobantonov/jsonforms-svelte-demo-common';

export function defineSkeletonDemoTheme(isDark: boolean): monaco.editor.IStandaloneThemeData {
  // Primary shades
  const primary = editorColorScale('primary', [100, 200, 400, 600, 800]);

  // Surface palette used by Skeleton cards and panels
  const surface = editorColorScale('surface', [50, 100, 200, 300, 400, 500, 700, 800, 900, 950]);

  // Grays
  const gray = editorColorScale('gray', [50, 100, 200, 300, 400, 500, 700, 800, 900]);

  const panelBackground = isDark ? (surface[950] ?? gray[900]) : (surface[50] ?? gray[50]);
  const elevatedBackground = isDark ? (surface[900] ?? gray[800]) : (surface[100] ?? gray[100]);
  const borderColor = isDark ? (surface[700] ?? gray[700]) : (surface[200] ?? gray[200]);
  const mutedColor = isDark ? (surface[500] ?? gray[500]) : (surface[400] ?? gray[400]);
  const foregroundColor = isDark ? (surface[50] ?? gray[100]) : (surface[950] ?? gray[900]);
  const hoverColor = isDark ? (surface[800] ?? gray[700]) : (surface[100] ?? gray[100]);
  return createDemoMonacoTheme(isDark, {
    panel: panelBackground,
    foreground: foregroundColor,
    elevated: elevatedBackground,
    border: borderColor,
    muted: mutedColor,
    hover: hoverColor,
    primary: isDark ? primary[400] : primary[600],
    selection: isDark ? primary[800] : primary[100],
    findMatch: isDark ? primary[400] : primary[200],
    scrollbarHover: isDark ? (surface[500] ?? gray[500]) : (surface[300] ?? gray[300]),
  });
}
