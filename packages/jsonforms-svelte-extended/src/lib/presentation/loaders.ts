/** Keep the optional parser and evaluator in independent lazy chunks. */
let markdownPromise: Promise<typeof import('./MarkdownContent.svelte')> | undefined;
let interpolationPromise: Promise<typeof import('./celTemplate')> | undefined;

export const loadMarkdown = () => (markdownPromise ??= import('./MarkdownContent.svelte'));
export const loadInterpolation = () => (interpolationPromise ??= import('./celTemplate'));
