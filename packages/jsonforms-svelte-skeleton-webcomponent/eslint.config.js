import { createSvelteConfig } from '../../scripts/eslint-config.js';
import svelteConfig from './svelte.config.js';

export default createSvelteConfig({ directory: import.meta.dirname, svelteConfig });
