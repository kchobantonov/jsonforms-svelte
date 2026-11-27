import * as monaco from 'monaco-editor';
import { StandaloneServices } from 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js';
import { IStandaloneThemeService } from 'monaco-editor/esm/vs/editor/standalone/common/standaloneTheme.js';
import 'monaco-editor/esm/vs/language/css/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/html/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution.js';
export { ensureMonacoWorkers } from './monacoWorkers';

interface StandaloneThemeService {
  getColorTheme(): { themeName: string };
}

export const activeMonacoThemeName = () =>
  (StandaloneServices.get(IStandaloneThemeService) as StandaloneThemeService).getColorTheme()
    .themeName;

/**
 * Keep Monaco usable when the renderer is the only editor on the page. When a
 * demo or host application has installed a custom theme, leave it untouched.
 */
export const syncMonacoFallbackTheme = (dark: boolean) => {
  // The standalone theme service is shared by every Monaco editor in this
  // document. Never repaint a host-owned or second form editor.
  if (monaco.editor.getEditors().length !== 1) return;
  const currentTheme = activeMonacoThemeName();
  if (currentTheme === 'vs' || currentTheme === 'vs-dark') {
    const nextTheme = dark ? 'vs-dark' : 'vs';
    if (currentTheme !== nextTheme) monaco.editor.setTheme(nextTheme);
  }
};

export { monaco };

export { createMonacoDiagnosticReader } from './monacoDiagnostics';
