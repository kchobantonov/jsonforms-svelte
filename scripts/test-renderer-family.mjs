import { spawnSync } from 'node:child_process';

const family = process.argv[2];
if (!['flowbite', 'shadcn', 'skeleton'].includes(family)) {
  throw new Error(
    'Usage: node scripts/test-renderer-family.mjs <flowbite|shadcn|skeleton> [--build]',
  );
}

function run(args, cwd = process.cwd()) {
  const result = spawnSync('pnpm', args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.argv.includes('--build')) run(['run', `build:${family}`]);
for (const suffix of ['', '-extended', '-webcomponent']) {
  run(['--filter', `@chobantonov/jsonforms-svelte-${family}${suffix}`, 'test']);
}
run(['--filter', `jsonforms-svelte-${family}-demo`, 'test']);
run(['exec', 'vp', 'test', 'demos', '--run', '-t', `${family} /`], 'tests');
