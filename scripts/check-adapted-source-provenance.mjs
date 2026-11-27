import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const references = {
  react: {
    checkout: path.resolve(root, '../jsonforms-react-renderers'),
    commit: '150fd688ae09f0f3b28e989649f3daf1d9f6d91d',
  },
  spec: {
    checkout: path.resolve(root, '../jsonforms-extended-spec'),
    commit: 'f0183923295c495c60024fddca58dbe99e82e816',
  },
};

// Local path, source repository, source path at the commit named in the local comment.
const sources = [
  [
    'packages/jsonforms-svelte-renderer-common/src/lib/composition/combinators.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/combinators.ts',
  ],
  [
    'packages/jsonforms-svelte-renderer-common/src/lib/objects/conditionalFields.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/conditionalFields.ts',
  ],
  [
    'packages/jsonforms-svelte-renderer-common/src/lib/interaction/confirmation.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/confirmation.ts',
  ],
  [
    'packages/jsonforms-svelte-renderer-common/src/lib/core/detail.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/detail.ts',
  ],
  [
    'packages/jsonforms-svelte-renderer-common/src/lib/mixed/mixedComposition.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/mixedComposition.ts',
  ],
  [
    'packages/jsonforms-svelte-renderer-common/src/lib/mixed/recursiveTree.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/recursiveTree.ts',
  ],
  [
    'packages/jsonforms-svelte-extended/src/lib/color/colorProfile.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/colorFormat.ts',
  ],
  [
    'packages/jsonforms-svelte-extended/src/lib/cron/cron.ts',
    'react',
    'packages/jsonforms-react-extended-renderers/src/util/cron.ts',
  ],
  [
    'packages/jsonforms-svelte-extended/src/lib/file/fileOptions.ts',
    'react',
    'packages/jsonforms-react-renderer-common/src/FileArrayInput.tsx',
  ],
  [
    'packages/jsonforms-svelte-extended/src/lib/template/templateUrls.ts',
    'react',
    'packages/jsonforms-react-extended-renderers/src/util/templateUrls.ts',
  ],
  [
    'packages/jsonforms-svelte-extended/tests/color/colorProfile.spec.ts',
    'react',
    'packages/jsonforms-react-renderer-common/test/colorFormat.test.ts',
  ],
  ...[
    'array-detail-modes',
    'editor-details',
    'object-control',
    'recursive-tree',
    'tree-max-depth',
    'tuple-control',
  ].map((name) => [
    `packages/jsonforms-svelte-demo-common/tests/fixtures/specAdapters/${name}/uischemas.ts`,
    'spec',
    `examples/${name}/uischemas.mjs`,
  ]),
];

let failures = 0;
for (const [local, repository, upstream] of sources) {
  const { checkout, commit } = references[repository];
  try {
    const content = readFileSync(path.resolve(root, local), 'utf8');
    if (!content.includes(commit))
      throw new Error(`local provenance comment does not pin ${commit}`);
    execFileSync('git', ['-C', checkout, 'cat-file', '-e', `${commit}:${upstream}`], {
      stdio: 'pipe',
    });
  } catch (error) {
    failures++;
    console.error(`${local}: ${error.message}`);
  }
}

if (failures) process.exitCode = 1;
else
  console.log(
    `Verified ${sources.length} adapted-source pins and upstream paths at immutable commits.`,
  );
