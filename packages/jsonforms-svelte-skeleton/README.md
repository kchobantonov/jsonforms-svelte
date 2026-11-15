# @chobantonov/jsonforms-svelte-skeleton

See the [renderer family capabilities](../../docs/renderers/README.md) for the
Skeleton registration, option defaults, runtime profile and known limits.

Skeleton-themed JSON Forms renderers for Svelte 5.

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-skeleton @skeletonlabs/skeleton @skeletonlabs/skeleton-svelte
```

## Usage

```ts
import { skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
```

## Choice search

Skeleton defaults to searchable finite choices, including multi-selects. Set
`options.autocomplete: false` to disable typing into a multi-select while
keeping its choice list available.

## Tailwind

Make sure your app styles include Skeleton and the package sources:

```css
@import 'tailwindcss';
@import '@skeletonlabs/skeleton';
```

Add these paths to your Tailwind sources:

```txt
./src/**/*.{html,js,svelte,ts}
./node_modules/@skeletonlabs/skeleton-svelte/dist
./node_modules/@chobantonov/jsonforms-svelte/dist
./node_modules/@chobantonov/jsonforms-svelte-skeleton/dist
```
