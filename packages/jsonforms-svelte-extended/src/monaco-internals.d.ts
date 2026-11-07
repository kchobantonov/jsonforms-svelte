declare module 'monaco-editor/esm/vs/editor/standalone/browser/standaloneServices.js' {
  export const StandaloneServices: {
    get(serviceId: unknown): unknown;
  };
}

declare module 'monaco-editor/esm/vs/editor/standalone/common/standaloneTheme.js' {
  export const IStandaloneThemeService: unknown;
}

declare module 'monaco-editor/esm/vs/language/css/workerManager.js' {
  export class WorkerManager {
    constructor(defaults: unknown);
    getLanguageServiceWorker(
      ...resources: import('monaco-editor').Uri[]
    ): Promise<{ doValidation(uri: string): Promise<{ severity?: number }[]> }>;
    dispose(): void;
  }
}
