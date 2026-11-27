import { tick } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import monaco from '../core/monaco';
import type { MonacoApi } from '../core/monaco';
export interface DemoMonacoEditorProps extends HTMLAttributes<HTMLDivElement> {
  value: monaco.editor.ITextModel | string | null;
  language?: string;
  editorBeforeMount?: (api: MonacoApi) => void;
}

export function demoEditorTheme(
  family: string,
  getName: () => string,
  getMode: () => string,
  defineTheme: (dark: boolean) => monaco.editor.IStandaloneThemeData,
) {
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  async function refresh() {
    const name = getName();
    const mode = getMode();
    const dark = mode === 'dark' || (mode === 'system' && prefersDark);
    const lightName = `${family}-demo-light-${name}`;
    const darkName = `${family}-demo-dark-${name}`;
    await tick();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    monaco.editor.defineTheme(lightName, defineTheme(false));
    monaco.editor.defineTheme(darkName, defineTheme(true));
    monaco.editor.setTheme(dark ? darkName : lightName);
  }
  return { refresh };
}
