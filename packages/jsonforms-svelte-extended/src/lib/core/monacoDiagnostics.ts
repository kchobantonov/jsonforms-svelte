import { WorkerManager } from 'monaco-editor/esm/vs/language/css/workerManager.js';
import type * as Monaco from 'monaco-editor';
import { supportsMonacoDiagnosticReader } from './monacoDiagnosticSupport';

type Diagnostic = { severity?: number; category?: number; code?: number };
type LanguageWorker = { doValidation(uri: string): Promise<Diagnostic[]> };
type Manager = {
  getLanguageServiceWorker(...resources: Monaco.Uri[]): Promise<LanguageWorker>;
  dispose(): void;
};
const managers = new Map<object, { manager: Manager; users: number }>();

async function jsonWorkerFactory(monaco: typeof Monaco) {
  // Monaco registers the JSON language service asynchronously after the first
  // JSON model is created. A diagnostic read can win that race on first mount.
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      return await monaco.json.getWorker();
    } catch (error) {
      if (error !== 'JSON not registered!' || attempt === 99) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  throw new Error('JSON worker unavailable');
}

/** Query owned diagnostic generations instead of trusting unversioned marker events. */
export function createMonacoDiagnosticReader(monaco: typeof Monaco) {
  const leases = new Set<object>();
  let disposed = false;
  const managerFor = async (language: string): Promise<Manager> => {
    const defaults =
      language === 'scss'
        ? monaco.css.scssDefaults
        : language === 'less'
          ? monaco.css.lessDefaults
          : monaco.css.cssDefaults;
    if (disposed) throw new Error('Diagnostic reader disposed');
    let entry = managers.get(defaults);
    if (!entry) {
      entry = { manager: new WorkerManager(defaults), users: 0 };
      managers.set(defaults, entry);
    }
    if (!leases.has(defaults)) {
      leases.add(defaults);
      entry.users += 1;
    }
    return entry.manager;
  };
  return {
    supports(language: string) {
      return supportsMonacoDiagnosticReader(language);
    },
    async read(model: Monaco.editor.ITextModel): Promise<number> {
      const language = model.getLanguageId();
      const uri = model.uri;
      if (language === 'typescript' || language === 'javascript') {
        const defaults =
          language === 'typescript'
            ? monaco.typescript.typescriptDefaults
            : monaco.typescript.javascriptDefaults;
        const options = defaults.getDiagnosticsOptions();
        const factory = await (language === 'typescript'
          ? monaco.typescript.getTypeScriptWorker()
          : monaco.typescript.getJavaScriptWorker());
        const worker = await factory(uri);
        const results = await Promise.all([
          options.noSyntaxValidation ? [] : worker.getSyntacticDiagnostics(uri.toString()),
          options.noSemanticValidation ? [] : worker.getSemanticDiagnostics(uri.toString()),
          options.noSuggestionDiagnostics ? [] : worker.getSuggestionDiagnostics(uri.toString()),
        ]);
        return results
          .flat()
          .filter((d) => d.category === 1 && !options.diagnosticCodesToIgnore?.includes(d.code))
          .length;
      }
      let worker: LanguageWorker;
      if (language === 'json') {
        if (monaco.json.jsonDefaults.diagnosticsOptions.validate === false) return 0;
        // Monaco's public worker type omits this runtime language-service method.
        worker = (await (await jsonWorkerFactory(monaco))(uri)) as unknown as LanguageWorker;
      } else {
        worker = await (await managerFor(language)).getLanguageServiceWorker(uri);
      }
      return (await worker.doValidation(uri.toString())).filter((d) => d.severity === 1).length;
    },
    dispose() {
      disposed = true;
      for (const key of leases) {
        const entry = managers.get(key)!;
        if (--entry.users === 0) {
          entry.manager.dispose();
          managers.delete(key);
        }
      }
      leases.clear();
    },
  };
}
