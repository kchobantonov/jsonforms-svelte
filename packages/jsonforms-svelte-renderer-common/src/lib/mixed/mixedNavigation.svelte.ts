import { getContext, setContext } from 'svelte';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import type { useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import {
  LiteralLabelAccessorySymbol,
  type LiteralLabelAccessory,
} from '../controls/labelAccessory';
import { LiteralDataContextSymbol, type LiteralDataContext } from '../objects/literalDataContext';
import { encodeMixedSegment } from './mixedLiteral';
import { resolveMixedStructuredLayout } from './mixedSchema';
import { findMixedNodeByPath } from './treeNavigation';
import type { TreeNodeControl, TreeNode, TreeNodeData } from './treeBuilder.svelte';

// Named by declarations emitted for useMixedTreeView.
export interface NavigationContext {
  treeEnabled?: boolean;
  rootControl: TreeNodeControl;
  selectedPath: string;
  selectPath: (path: string) => void;
  viewPath: (path: string) => void;
}

export function useMixedNavigation(
  navigationKey: symbol,
  binding: Pick<ReturnType<typeof useJsonFormsControl>, 'control'>,
  view: {
    readonly selectedPath: string;
    readonly nodes: TreeNode<TreeNodeData>[] | undefined;
    selectPath(path: string): void;
    clearSearch(): void;
    parentPath(path: string): string;
  },
) {
  const jsonforms = useJsonForms();
  const literalLabelAccessory = getContext<(() => LiteralLabelAccessory) | undefined>(
    LiteralLabelAccessorySymbol,
  );
  const literalData = getContext<LiteralDataContext | undefined>(LiteralDataContextSymbol);
  const treeNodePath = $derived(
    literalData
      ? [
          ...literalData.segments(),
          ...(binding.control.path ? binding.control.path.split('.') : []),
        ]
          .map(encodeMixedSegment)
          .join('.')
      : binding.control.path,
  );
  const hideRepeatedLabel = $derived(
    !!literalLabelAccessory && literalLabelAccessory().label === binding.control.label,
  );
  const parentNavContext = getContext<NavigationContext | undefined>(navigationKey);
  const isRoot = $derived(!parentNavContext || parentNavContext.treeEnabled === false);
  const structuredLayout = $derived(
    resolveMixedStructuredLayout(binding.control.uischema.options, jsonforms.config),
  );

  const navContext: NavigationContext = {
    get rootControl() {
      return binding.control;
    },
    get selectedPath() {
      return view.selectedPath;
    },
    selectPath: (path) => view.selectPath(path),
    viewPath(path) {
      view.clearSearch();
      const root = binding.control.path;
      let target = path;
      while (target !== root && !findMixedNodeByPath(view.nodes, target)) {
        const parent = view.parentPath(target);
        if (parent === target) {
          target = root;
          break;
        }
        target = parent;
      }
      view.selectPath(findMixedNodeByPath(view.nodes, target) ? target : root);
    },
  };

  // Forward an existing tree context; nested presentation starts independent children.
  setContext<NavigationContext>(navigationKey, {
    get treeEnabled() {
      return isRoot ? structuredLayout === 'tree' : parentNavContext?.treeEnabled;
    },
    get rootControl() {
      return isRoot ? navContext.rootControl : parentNavContext!.rootControl;
    },
    get selectedPath() {
      return isRoot ? navContext.selectedPath : parentNavContext!.selectedPath;
    },
    selectPath(targetPath) {
      (isRoot ? navContext : parentNavContext!).selectPath(targetPath);
    },
    viewPath(targetPath) {
      (isRoot ? navContext : parentNavContext!).viewPath(targetPath);
    },
  });

  return {
    navContext,
    parentNavContext,
    get isRoot() {
      return isRoot;
    },
    get structuredLayout() {
      return structuredLayout;
    },
    get treeNodePath() {
      return treeNodePath;
    },
    get hideRepeatedLabel() {
      return hideRepeatedLabel;
    },
  };
}
