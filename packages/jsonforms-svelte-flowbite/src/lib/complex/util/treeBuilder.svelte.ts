import { createMixedTreeBuilder } from '@chobantonov/jsonforms-svelte-renderer-common';
import { useFlowbiteControl } from '../../util';

export { type TreeNodeData } from '@chobantonov/jsonforms-svelte-renderer-common';
export const buildTreeFromData = createMixedTreeBuilder(useFlowbiteControl);
