import { beforeAll } from 'vite-plus/test';
import { loadDynamicUiExpressions } from '../../../src/lib/dynamicRuntime';
beforeAll(loadDynamicUiExpressions);
import { expect, it } from 'vite-plus/test';
import type { UISchemaElement } from '@jsonforms/core';
import {
  createDynamicUiMemo,
  createDynamicUiCache,
  createDynamicUiResolver,
  resolveDynamicUi,
} from '../../../src/lib/dynamicUi';

const authored = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Name',
  $dynamic: { label: { bind: 'external.settings.label' } },
} as unknown as UISchemaElement;
const staticElement = { type: 'Control', scope: '#/properties/name' } as UISchemaElement;
const dataAuthored = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Name',
  $dynamic: { label: { bind: 'data.field0' } },
} as unknown as UISchemaElement;
const configAuthored = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Name',
  $dynamic: { label: { bind: 'config.field0' } },
} as unknown as UISchemaElement;
const external = { settings: { label: 'Dynamic name' } };
const smallData = { name: 'Ada' };
const largeData = Object.fromEntries(
  Array.from({ length: 2_000 }, (_, index) => [`field${index}`, `value${index}`]),
);
const largeConfig = { ...largeData, jsonformsExtended: { ignored: true } };

function measure(label: string, count: number, run: () => void) {
  for (let index = 0; index < Math.min(count, 10); index++) run();
  const samples = Array.from({ length: 5 }, () => {
    const start = performance.now();
    for (let index = 0; index < count; index++) run();
    return ((performance.now() - start) * 1_000) / count;
  }).sort((a, b) => a - b);
  console.log(`${label}: ${samples[2].toFixed(1)} microseconds/op`);
}

function measureFresh(label: string, occurrences: number) {
  const samples = Array.from({ length: 100 }, (_, index) => {
    const nextData = { ...largeData, field0: `update${index}` };
    const start = performance.now();
    for (let occurrence = 0; occurrence < occurrences; occurrence++)
      resolveDynamicUi(dataAuthored, { data: nextData, path: `field${occurrence}`, external });
    return (performance.now() - start) * 1_000;
  }).sort((a, b) => a - b);
  console.log(`${label}: ${samples[50].toFixed(1)} microseconds/update`);
}

it('measures dynamic resolution cost', () => {
  measure('static large', 5_000, () =>
    resolveDynamicUi(staticElement, { data: largeData, path: '', external }),
  );
  measure('dynamic small', 2_000, () =>
    resolveDynamicUi(authored, { data: smallData, path: '', external }),
  );
  measure('dynamic large', 200, () =>
    resolveDynamicUi(authored, { data: largeData, path: '', external }),
  );
  measure('50 dynamic, shared large', 10, () => {
    for (let index = 0; index < 50; index++)
      resolveDynamicUi(authored, { data: largeData, path: `field${index}`, external });
  });
  const memo = createDynamicUiMemo();
  measure('dynamic large with memo', 200, () =>
    memo(resolveDynamicUi(authored, { data: largeData, path: '', external })),
  );
  const resolve = createDynamicUiResolver();
  measure('cached occurrence, unchanged external root', 2_000, () =>
    resolve(authored, { data: largeData, path: '', external }),
  );
  measure('data binding, large form', 200, () =>
    resolveDynamicUi(dataAuthored, { data: largeData, path: '', external }),
  );
  measure('50 data bindings, shared large', 10, () => {
    for (let index = 0; index < 50; index++)
      resolveDynamicUi(dataAuthored, { data: largeData, path: `field${index}`, external });
  });
  measure('50 config bindings, shared large', 10, () => {
    for (let index = 0; index < 50; index++)
      resolveDynamicUi(configAuthored, {
        data: smallData,
        config: largeConfig,
        path: `field${index}`,
      });
  });
  measureFresh('fresh data, one binding', 1);
  measureFresh('fresh data, 50 bindings', 50);
  expect(resolveDynamicUi(dataAuthored, { data: largeData, path: '' }).element).toMatchObject({
    label: 'value0',
  });
});

it('compares repeated consumers with isolated and form-scoped resolution', () => {
  const ui = {
    type: 'Control',
    scope: '#/properties/name',
    $dynamic: {
      label: { expression: "external.label == '' ? 'Name' : external.label" },
      options: {
        readonly: { bind: 'external.readonly' },
        gap: { expression: 'external.compact ? 8 : 24' },
      },
    },
  } as unknown as UISchemaElement;
  for (const count of [1, 2, 50]) {
    for (const shared of [false, true]) {
      const cache = shared ? createDynamicUiCache() : undefined;
      const consumers = Array.from({ length: count }, () => createDynamicUiResolver(cache));
      const samples: number[] = [];
      for (let index = 0; index < 520; index++) {
        const input = {
          data: largeData,
          path: '',
          external: { label: `Name ${index}`, readonly: false, compact: index % 2 === 0 },
        };
        const start = performance.now();
        for (const resolve of consumers) resolve(ui, input);
        if (index >= 20) samples.push((performance.now() - start) * 1000);
      }
      samples.sort((a, b) => a - b);
      console.log(
        `${count} consumers, ${shared ? 'form cache' : 'isolated'}: ${samples[250].toFixed(1)} microseconds/update`,
      );
      expect(
        consumers[0](ui, {
          data: largeData,
          path: '',
          external: { label: 'Final', readonly: false, compact: true },
        }).element,
      ).toMatchObject({ label: 'Final' });
    }
  }
});
