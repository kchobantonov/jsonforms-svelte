import { expect, it, vi } from 'vite-plus/test';
import { createSpecButtonActionsExample } from './index';
import source from './uischema.json';
import data from './data.json';
import type { DemoActionEvent } from '../actions';

type Node = {
  type: string;
  name?: string;
  elements?: Node[];
  script?: string | ((this: DemoActionEvent, event: DemoActionEvent) => unknown);
};
const descendants = (node: Node): Node[] => [node, ...(node.elements ?? []).flatMap(descendants)];
it('keeps the wire fixture portable and appends native functions in host code', async () => {
  const example = createSpecButtonActionsExample(() => 'en');
  expect(descendants(source).filter((node) => typeof node.script === 'function')).toHaveLength(0);
  const nodes = descendants(example.uischema as Node);
  const functions = nodes.filter((node) => typeof node.script === 'function');
  expect(functions).toHaveLength(3);
  expect(nodes.find((node) => node.name === 'native')?.type).toBe('Category');
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});
  const event = { params: { tier: 'test' } } as unknown as DemoActionEvent;
  try {
    for (const node of functions) {
      const script = node.script as (this: DemoActionEvent, event: DemoActionEvent) => unknown;
      await script.call(event, event);
    }
    expect(log).toHaveBeenCalledTimes(3);
    expect(log).toHaveBeenLastCalledWith(event.params);
  } finally {
    log.mockRestore();
  }
});
it('registers actions and switches catalog locale without rebuilding the example', async () => {
  let locale = 'en';
  const example = createSpecButtonActionsExample(() => locale);
  expect(example.i18n?.translate?.('submit.label', '')).toBe('Submit');
  locale = 'bg';
  expect(example.i18n?.translate?.('submit.label', '')).toBe('Изпращане');
  const event = { action: 'reset', params: {}, context: { data: {} } } as DemoActionEvent;
  await example.onHandleAction?.(event);
  await event.callback?.(event);
  expect(event.context.data).toEqual(data);
  expect(event.context.data).not.toBe(data);
});
