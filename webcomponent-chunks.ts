const jsonFormsPackagePrefix = "@chobantonov/";

const ajvPackages = new Set([
  "ajv",
  "ajv-errors",
  "ajv-formats",
  "ajv-i18n",
  "ajv-keywords",
  "fast-deep-equal",
  "fast-uri",
  "json-schema-traverse",
  "uri-js",
]);

const shadcnRuntimePackages = new Set([
  "bits-ui",
  "mode-watcher",
  "runed",
  "shadcn-svelte",
  "svelte-toolbelt",
]);

const styleUtilityPackages = new Set([
  "clsx",
  "tailwind-merge",
  "tailwind-variants",
  "tw-animate-css",
]);

const normalizeId = (id: string) => id.replaceAll("\\", "/").split("?", 1)[0];

const packageNameFromNodeModules = (id: string) => {
  const marker = "/node_modules/";
  const markerIndex = id.lastIndexOf(marker);
  if (markerIndex === -1) return undefined;

  const segments = id.slice(markerIndex + marker.length).split("/");
  if (segments[0]?.startsWith("@")) {
    return segments[1] ? `${segments[0]}/${segments[1]}` : undefined;
  }

  return segments[0] || undefined;
};

const packageNameFromWorkspace = (id: string) => {
  const match = id.match(/\/packages\/(jsonforms-svelte(?:-[^/]+)?)\//);
  return match?.[1] ? `${jsonFormsPackagePrefix}${match[1]}` : undefined;
};

const packageChunkName = (packageName: string) =>
  `vendor-${packageName
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()}`;

const jsonFormsChunkName = (packageName: string, id: string) => {
  const unscopedName = packageName.slice(jsonFormsPackagePrefix.length);

  // Keep the web component's own source in its entry chunk.
  if (unscopedName.endsWith("-webcomponent")) return undefined;

  // Every extended renderer owns an eager AG Grid tester/loader and a
  // dynamically imported runtime. Keep those two parts separate per library.
  if (unscopedName.endsWith("-extended") && id.includes("/ag-grid/")) {
    return id.includes("/ag-grid/runtime/")
      ? `${unscopedName}-ag-grid-runtime`
      : `${unscopedName}-ag-grid-loader`;
  }

  return unscopedName;
};

/**
 * Produces stable, library-oriented chunks for the published web components.
 *
 * Workspace JSON Forms packages are separated explicitly, while third-party
 * packages get one chunk per library (with a few tightly coupled ecosystems
 * grouped together). This avoids a large catch-all chunk whose hash changes
 * whenever any unrelated dependency changes.
 */
export const webComponentManualChunks = (rawId: string) => {
  const virtual = rawId.startsWith("\0");
  if (virtual && !rawId.includes("commonjs")) return undefined;

  // CommonJS proxy ids retain the real module path after the leading NUL.
  // Classify those proxies with their owning package to avoid proxy modules
  // falling into the entry chunk and creating circular chunk imports.
  const id = normalizeId(virtual ? rawId.slice(1) : rawId);

  const packageName =
    packageNameFromWorkspace(id) ?? packageNameFromNodeModules(id);
  if (!packageName) return virtual ? "vendor-commonjs-runtime" : undefined;

  if (packageName.startsWith(jsonFormsPackagePrefix)) {
    return jsonFormsChunkName(packageName, id);
  }

  if (
    packageName === "ag-grid-community" ||
    packageName.startsWith("@ag-grid/") ||
    packageName.startsWith("ag-charts-") ||
    packageName.startsWith("ag-stack")
  ) {
    return "vendor-ag-grid";
  }

  if (ajvPackages.has(packageName)) return "vendor-ajv";
  if (packageName === "svelte" || packageName === "esm-env")
    return "vendor-svelte";
  if (packageName === "lodash" || packageName.startsWith("lodash."))
    return "vendor-lodash";
  if (packageName.startsWith("@skeletonlabs/")) return "vendor-skeleton";
  if (packageName.startsWith("@zag-js/") || packageName === "proxy-compare")
    return "vendor-zag-runtime";
  if (packageName === "flowbite" || packageName.startsWith("flowbite-"))
    return "vendor-flowbite";
  if (shadcnRuntimePackages.has(packageName)) return "vendor-shadcn-runtime";
  if (styleUtilityPackages.has(packageName)) return "vendor-style-utils";

  return packageChunkName(packageName);
};
