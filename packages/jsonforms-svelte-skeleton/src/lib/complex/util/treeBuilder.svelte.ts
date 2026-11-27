import { createMixedTreeBuilder } from '@chobantonov/jsonforms-svelte-renderer-common';
import { useSkeletonControl } from '../../util';

export {
  type TreeNodeData,
  type MixedTreeNode as TreeNode,
} from '@chobantonov/jsonforms-svelte-renderer-common';
export const buildTreeFromData = createMixedTreeBuilder(useSkeletonControl);
