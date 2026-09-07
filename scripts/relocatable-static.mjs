import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// SvelteKit's hash-router entry HTML uses root-relative assets even with
// paths.relative enabled. Make that entry portable as part of each demo build;
// the shell can then copy the finished artifact without modifying anything.
/**
 * @param {import('@sveltejs/kit').Adapter} adapter
 * @param {string} outputDirectory
 * @returns {import('@sveltejs/kit').Adapter}
 */
export default function relocatableStatic(adapter, outputDirectory = 'build') {
  return {
    ...adapter,
    name: 'relocatable-static',
    async adapt(builder) {
      const { paths, router } = builder.config.kit;
      if (paths.base || paths.assets || !paths.relative || router.type !== 'hash') {
        throw new Error(
          'Relocatable demos require hash routing, relative paths, and no base/assets prefix.',
        );
      }
      await adapter.adapt(builder);
      const entry = path.resolve(outputDirectory, 'index.html');
      const html = await readFile(entry, 'utf8');
      await writeFile(
        entry,
        html
          .replace(/(\b(?:href|src)=)(["'])\/(?!\/)/g, '$1$2./')
          .replace(/(\bimport\(\s*)(["'])\/(?!\/)/g, '$1$2./'),
      );
    },
  };
}
