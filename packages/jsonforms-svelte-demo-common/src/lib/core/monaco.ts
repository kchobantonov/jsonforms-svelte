import * as monaco from 'monaco-editor';
import { ensureMonacoWorkers } from '@chobantonov/jsonforms-svelte-extended';

ensureMonacoWorkers();
export default monaco;
export type MonacoApi = typeof monaco;
