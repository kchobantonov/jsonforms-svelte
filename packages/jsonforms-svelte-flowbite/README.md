# @chobantonov/jsonforms-svelte-flowbite

Flowbite-styled JSONForms components for Svelte 5, built with [Flowbite Svelte](https://flowbite-svelte.com/).

See the [renderer family capabilities](../../docs/renderers/README.md) for the
Flowbite registration, option defaults, runtime profile and known limits.

## Installation

```bash
npm install @chobantonov/jsonforms-svelte-flowbite flowbite-svelte
# or
pnpm add @chobantonov/jsonforms-svelte-flowbite flowbite-svelte
```

This package requires Flowbite Svelte and Tailwind CSS in the host app.

## Setup

### 1. Install Tailwind CSS and Flowbite

```bash
npm install -D tailwindcss @tailwindcss/vite
npm install flowbite flowbite-svelte flowbite-svelte-icons
```

### 2. Configure Tailwind sources

Add these directives to `src/app.css`, adjusting the relative `@source` paths
if the stylesheet lives elsewhere:

```css
@import 'tailwindcss';
@plugin 'flowbite/plugin';

@source './';
@source '../node_modules/flowbite-svelte/dist';
@source '../node_modules/flowbite-svelte-icons/dist';
@source '../node_modules/@chobantonov/jsonforms-svelte/dist';
@source '../node_modules/@chobantonov/jsonforms-svelte-flowbite/dist';
```

Include the extended package sources shown in its README when registering
extended renderers. The [Flowbite demo stylesheet](../../apps/jsonforms-svelte-flowbite-demo/src/app.css)
contains a working theme example.

## Features

- Built with [Flowbite Svelte](https://flowbite-svelte.com/) components
- Svelte 5 runes (`$state`, `$props`, `$bindable`, `$derived`)
- TypeScript support
- JSONForms renderer pattern
- Full form validation with error display
- Accessible components (via Flowbite)
- Responsive design
- Dark mode ready (with Flowbite)

## Dependencies

This package depends on:

- `@chobantonov/jsonforms-svelte`
- `flowbite-svelte` (UI components)
- `svelte` 5.x (peer dependency)

## Choice search

Flowbite defaults to non-searchable single finite choices and searchable finite multi-selects. Set `options.autocomplete` explicitly to `true` or `false` to request the same search behavior across families; `false` hides the multi-select search field.

## License

MIT
