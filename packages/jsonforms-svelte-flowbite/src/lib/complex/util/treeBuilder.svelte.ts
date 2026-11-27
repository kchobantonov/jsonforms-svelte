import { createMixedTreeBuilder } from '@chobantonov/jsonforms-svelte-renderer-common';
import { useFlowbiteControl } from '../../util';

export const buildTreeFromData = createMixedTreeBuilder(useFlowbiteControl);
