/** Keep the optional parser and evaluator in independent lazy chunks. */
export const loadMarkdown = () => import('./MarkdownContent.svelte');
export const loadInterpolation = () => import('./celTemplate');
