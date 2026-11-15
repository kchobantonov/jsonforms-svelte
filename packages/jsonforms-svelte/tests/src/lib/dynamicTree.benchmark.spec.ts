import { expect, it } from 'vite-plus/test';
import { hasDynamicTree } from '../../../src/lib/dynamicTree';
it('measures cached static-tree checks independently of the initial scan', () => {
  const ui = { type: 'Group', elements: Array.from({ length: 2000 }, () => ({ type: 'Control' })) };
  const coldStart = performance.now();
  const present = hasDynamicTree(ui);
  const cold = performance.now() - coldStart;
  expect(present).toBe(false);
  const samples: number[] = [];
  let found = 0;
  for (let round = 0; round < 11; round++) {
    const start = performance.now();
    for (let i = 0; i < 100000; i++) if (hasDynamicTree(ui)) found++;
    if (round) samples.push(((performance.now() - start) * 1000) / 100000);
  }
  samples.sort((a, b) => a - b);
  console.log(
    `static 2000-child tree: initial ${cold.toFixed(3)} ms; cached ${samples[5].toFixed(3)} microseconds/check`,
  );
  expect(found).toBe(0);
});
