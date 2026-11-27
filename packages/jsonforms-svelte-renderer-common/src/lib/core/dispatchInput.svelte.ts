import { rendererSnippets } from '@chobantonov/jsonforms-svelte';
import { untrack } from 'svelte';
import { dynamicPresentation } from '../dynamic/dynamicTree';
import { useDynamicTreeResolver } from '../dynamic/dynamicTree.svelte';
import { useUIDiagnosticReporter } from '../validation/authorDiagnostic.svelte';
import type { RendererProps } from './jsonFormsCompositions.svelte';
import { dataPathSegments } from './dataPath';

export function useDispatchInput<P extends RendererProps>(
  props: P,
  extraProps: () => Record<string, unknown>,
  cellMode: boolean,
) {
  const readSnippets = () => rendererSnippets(extraProps());
  let snippets = $state(untrack(readSnippets));
  let initialized = false;
  $effect(() => {
    const next = readSnippets();
    if (!initialized) {
      initialized = true;
      return;
    }
    const keys = Object.keys(next);
    if (
      keys.length !== Object.keys(snippets).length ||
      keys.some((key) => next[key] !== snippets[key])
    ) {
      snippets = next;
    }
  });

  const resolveTree = useDynamicTreeResolver();
  const resolution = $derived.by(() => {
    const element = resolveTree(
      props.uischema,
      props.path,
      props.pathSegments ?? dataPathSegments(props.path),
      cellMode,
    );
    return dynamicPresentation(element) ?? { element, failures: [] as readonly string[] };
  });
  // Resolve structural children before testers or visual renderers inspect them.
  const effectiveProps = new Proxy(props, {
    get(target, key) {
      return key === 'uischema' ? resolution.element : Reflect.get(target, key);
    },
  });
  const reportDiagnostic = useUIDiagnosticReporter();
  let reportedFailures = '';
  $effect(() => {
    const failures = resolution.failures;
    const signature = JSON.stringify([props.path, failures]);
    if (signature === reportedFailures) return;
    reportedFailures = signature;
    for (const failure of failures)
      reportDiagnostic('dynamic.invalid', {
        severity: 'warning',
        message: failure,
        path: props.path,
      });
  });

  return {
    effectiveProps,
    reportDiagnostic,
    get element() {
      return resolution.element;
    },
    get snippets() {
      return snippets;
    },
  };
}
