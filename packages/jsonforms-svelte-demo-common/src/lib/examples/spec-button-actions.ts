import type { UISchemaElement } from '@jsonforms/core';
import type { DemoExample } from './definitions.js';
import type { DemoActionEvent } from './actions.js';

type UiNode = UISchemaElement & { elements?: UiNode[] };

/** Add the trusted, non-serializable host portion of the portable button fixture. */
export function withButtonActionsHost(example: DemoExample): DemoExample {
  const initialData = structuredClone(example.data);
  const ui = example.uischema as UiNode;
  const findCategorization = (node: UiNode): UiNode | undefined =>
    node.type === 'Categorization'
      ? node
      : node.elements?.map(findCategorization).find((result) => result !== undefined);
  const categorization = findCategorization(ui);
  categorization?.elements?.push({
    type: 'Category',
    name: 'native',
    label: 'TypeScript',
    elements: [
      {
        type: 'Button',
        label: 'Arrow function',
        i18n: 'nativeArrow',
        script: (event: DemoActionEvent) => console.log(event.params),
      },
      {
        type: 'Button',
        label: 'Classic function',
        i18n: 'nativeClassic',
        script: function (this: DemoActionEvent) {
          console.log(this.params);
        },
      },
      {
        type: 'Button',
        label: 'Async function',
        i18n: 'nativeAsync',
        script: async (event: DemoActionEvent) => {
          await new Promise((resolve) => setTimeout(resolve, 250));
          console.log(event.params);
        },
      },
    ],
  } as UiNode);

  return {
    ...example,
    uischema: ui,
    onHandleAction: (event) => {
      if (event.action === 'slowExample') {
        event.callback = async (source) => {
          console.log('slowExample', source.context.data);
          await new Promise((resolve) => setTimeout(resolve, 250));
        };
      } else if (event.action === 'discard') {
        event.callback = (source) => {
          source.context.data = { ...(source.context.data as object), fullName: '' };
        };
      } else if (event.action === 'reset') {
        event.callback = (source) => {
          source.context.data = structuredClone(initialData);
        };
      }
    },
  };
}
