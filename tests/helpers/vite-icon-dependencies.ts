import { readFileSync } from 'node:fs';

// Keep browser-test prebundling aligned with the actual icon mapping. Discovering
// these imports after the first test starts makes Vite reload that test's page.
const source = readFileSync(
  new URL(
    '../../packages/jsonforms-svelte-shadcn/src/lib/components/icons/icon-mappings.ts',
    import.meta.url,
  ),
  'utf8',
);
export const shadcnTestIconDependencies = Array.from(
  source.matchAll(
    /from ['"]((?:@lucide\/svelte|@tabler\/icons-svelte|remixicon-svelte)\/icons\/[^'"]+)['"]/g,
  ),
  (match) => match[1],
);
