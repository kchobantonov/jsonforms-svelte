import * as monaco from "monaco-editor";
import { StandaloneServices } from "monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js";
import { IStandaloneThemeService } from "monaco-editor/esm/vs/editor/standalone/common/standaloneTheme.js";
import "monaco-editor/esm/vs/language/css/monaco.contribution";
import "monaco-editor/esm/vs/language/html/monaco.contribution";
import "monaco-editor/esm/vs/language/json/monaco.contribution";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

export const ensureMonacoWorkers = () => {
  const target = globalThis as typeof globalThis & {
    MonacoEnvironment?: monaco.Environment;
  };
  target.MonacoEnvironment = {
    ...(target.MonacoEnvironment ?? {}),
    getWorker(_moduleId: string, label: string) {
      if (label === "json") return new jsonWorker();
      if (label === "css" || label === "scss" || label === "less")
        return new cssWorker();
      if (label === "html" || label === "handlebars" || label === "razor")
        return new htmlWorker();
      if (label === "typescript" || label === "javascript")
        return new tsWorker();
      return new editorWorker();
    },
  };
};

interface StandaloneThemeService {
  getColorTheme(): { themeName: string };
}

/**
 * Keep Monaco usable when the renderer is the only editor on the page. When a
 * demo or host application has installed a custom theme, leave it untouched.
 */
export const syncMonacoFallbackTheme = (dark: boolean) => {
  const themeService = StandaloneServices.get(
    IStandaloneThemeService,
  ) as StandaloneThemeService;
  const currentTheme = themeService.getColorTheme().themeName;
  if (currentTheme === "vs" || currentTheme === "vs-dark") {
    const nextTheme = dark ? "vs-dark" : "vs";
    if (currentTheme !== nextTheme) monaco.editor.setTheme(nextTheme);
  }
};

export { monaco };
