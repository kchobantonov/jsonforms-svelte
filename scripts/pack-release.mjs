import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Build first. Rehearse the pending Changesets versions without modifying the checkout.
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.resolve(
  process.argv[2] ?? path.join(tmpdir(), "jsonforms-release-packs"),
);
const staging = mkdtempSync(path.join(tmpdir(), "jsonforms-release-"));
const run = (command, args, cwd = root) =>
  execFileSync(command, args, { cwd, stdio: "inherit" });
mkdirSync(output, { recursive: true });
try {
  const planPath = path.join(staging, "plan.json");
  run("pnpm", ["exec", "changeset", "status", "--output", planPath]);
  const plan = JSON.parse(readFileSync(planPath, "utf8"));
  const versions = new Map(plan.releases.map((p) => [p.name, p.newVersion]));
  const overrides = {};
  for (const directory of readdirSync(path.join(root, "packages"))) {
    const packageRoot = path.join(root, "packages", directory);
    const original = JSON.parse(
      readFileSync(path.join(packageRoot, "package.json"), "utf8"),
    );
    if (original.private) continue;
    const unpack = path.join(staging, directory);
    mkdirSync(unpack);
    const raw = path.join(unpack, "original.tgz");
    run(
      "pnpm",
      ["--config.ignore-scripts=true", "pack", "--out", raw],
      packageRoot,
    );
    run("tar", ["-xzf", raw, "-C", unpack]);
    const packedRoot = path.join(unpack, "package");
    const manifestPath = path.join(packedRoot, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.version = versions.get(original.name) ?? original.version;
    for (const field of [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ]) {
      for (const [name, range] of Object.entries(original[field] ?? {})) {
        if (range.startsWith("workspace:") && versions.has(name)) {
          const prefix = range.slice("workspace:".length);
          manifest[field][name] =
            (prefix === "^" || prefix === "~" ? prefix : "") +
            versions.get(name);
        }
      }
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    if (/"(?:workspace|catalog|link|file):/.test(JSON.stringify(manifest))) {
      throw new Error(
        `${manifest.name}: unresolved local dependency in packed manifest`,
      );
    }
    run("pnpm", [
      "--filter",
      original.name,
      "exec",
      "publint",
      packedRoot,
      "--pack",
      "false",
    ]);
    if (directory.endsWith("-webcomponent")) {
      run("pnpm", [
        "--filter",
        original.name,
        "exec",
        "tsc",
        "--noEmit",
        "--strict",
        "--lib",
        "es2020,dom",
        "--skipLibCheck",
        "false",
        path.join(packedRoot, "types/index.d.ts"),
      ]);
    }
    const tarball = path.join(output, `${directory}-${manifest.version}.tgz`);
    run(
      "pnpm",
      ["--config.ignore-scripts=true", "pack", "--out", tarball],
      packedRoot,
    );
    overrides[manifest.name] = `file:${tarball}`;
  }
  writeFileSync(
    path.join(output, "overrides.json"),
    JSON.stringify(overrides, null, 2) + "\n",
  );
  console.log(`Validated release tarballs and overrides: ${output}`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
