# @chobantonov/jsonforms-svelte-shadcn

Shadcn-themed JSON Forms renderers for Svelte 5.

## Installation

```bash
pnpm add @chobantonov/jsonforms-svelte-shadcn
```

## Usage

```ts
import { shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
```

## Tailwind

Make sure your app styles include Tailwind and the package sources:

```css
@import 'tailwindcss';
```

Add these paths to your Tailwind sources:

```txt
./src/**/*.{html,js,svelte,ts}
./node_modules/@chobantonov/jsonforms-svelte/dist
./node_modules/@chobantonov/jsonforms-svelte-shadcn/dist
```

The shadcn-style primitives used by the renderers are generated-style local Svelte components
exported by this package; there is no runtime dependency on the `shadcn-svelte` CLI.
