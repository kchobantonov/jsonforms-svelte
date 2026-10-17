import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';

/** Keep generated outputs out of every package's lint scope, including fresh checkouts. */
const ignores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.svelte-kit/**',
  '**/coverage/**',
  '**/test-results/**',
  '**/.output/**',
  '**/.vercel/**',
  '**/.netlify/**',
  '**/.wrangler/**',
];

/** Package-specific Svelte config and TS roots must not leak between workspaces. */
export function createSvelteConfig({ directory, svelteConfig }, ...overrides) {
  return defineConfig(
    { ignores },
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
    prettier,
    ...svelte.configs.prettier,
    {
      languageOptions: { globals: { ...globals.browser, ...globals.node } },
      // Destructured fields can intentionally be excluded from forwarded rest props.
      rules: { '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }] },
    },
    {
      files: ['**/*.ts', '**/*.svelte'],
      // TypeScript checks names in TS and Svelte scripts; ESLint still checks plain JS.
      rules: { 'no-undef': 'off' },
    },
    {
      files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: directory,
          extraFileExtensions: ['.svelte'],
          parser: ts.parser,
          svelteConfig,
        },
      },
    },
    ...overrides,
  );
}

export const scriptsConfig = defineConfig(
  { ignores },
  js.configs.recommended,
  ...ts.configs.recommended,
  prettier,
  { languageOptions: { globals: globals.node } },
  { files: ['**/*.ts'], rules: { 'no-undef': 'off' } },
);
