import { getExamples } from './register.js';
import type { ExampleDescription } from './types.js';

// Load all example modules for side-effect registration.
const modules = import.meta.glob('./*/index.ts', { eager: true });
void modules;

export const examples: ExampleDescription[] = getExamples();
