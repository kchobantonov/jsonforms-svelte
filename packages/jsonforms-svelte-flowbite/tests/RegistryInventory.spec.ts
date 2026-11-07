import * as library from '../src/lib';
import { rendererRegistryContract } from '../../../tests/helpers/renderer-registry';

rendererRegistryContract(
  import.meta.glob<{ entry: unknown }>('../src/lib/**/*.entry.ts', { eager: true }),
  library,
  [library.flowbiteRenderers, library.flowbiteCells],
);
