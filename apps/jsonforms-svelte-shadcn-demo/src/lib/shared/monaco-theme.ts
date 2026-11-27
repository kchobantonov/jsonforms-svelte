import type * as monaco from 'monaco-editor';
import { createDemoMonacoTheme, resolveCSSColor } from '@chobantonov/jsonforms-svelte-demo-common';

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

  const panelBackground = background ?? card;
  const elevatedBackground = card ?? popover ?? background;
  const borderColor = border;
  const mutedColor = mutedForeground;
  const foregroundColor = foreground;
  const hoverColor = accent ?? muted;
  return createDemoMonacoTheme(isDark, {
    panel: panelBackground,
    foreground: foregroundColor,
    elevated: elevatedBackground,
    border: borderColor,
    muted: mutedColor,
    hover: hoverColor,
    primary: primary,
    selection: accent,
    findMatch: primary,
    cursor: primary,
    editorSelection: accent,
    scrollbarHover: mutedColor,
  });
}
