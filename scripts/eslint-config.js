import js from '@eslint/js';
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
    { ignores: ['**/*', '!**/', '!**/*.svelte', '!**/*.svelte.ts', '!**/*.svelte.js', ...ignores] },
    js.configs.recommended,
    ...ts.configs.recommended,
    ...svelte.configs.recommended,
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
    {
      // These collections only deduplicate diagnostics, track traversal, or compute a
      // fresh derived snapshot. Their mutations must not invalidate Svelte effects.
      files: [
        '**/categorySelection.svelte.ts',
        '**/conditionalFields.svelte.ts',
        '**/detailDialog.svelte.ts',
        '**/groupState.svelte.ts',
        '**/initialFocusDiagnostic.svelte.ts',
        '**/layoutSizing.svelte.ts',
        '**/JsonForms.svelte',
        '**/TemplateLayoutRenderer.svelte',
        '**/splitLayout.svelte.ts',
        '**/store/index.svelte.ts',
      ],
      rules: { 'svelte/prefer-svelte-reactivity': 'off' },
    },
    ...overrides,
  );
}
