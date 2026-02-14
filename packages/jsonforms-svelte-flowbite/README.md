# @chobantonov/jsonforms-svelte-flowbite

Flowbite-styled JSONForms components for Svelte 5, built with [Flowbite Svelte](https://flowbite-svelte.com/).

## Installation

```bash
npm install @chobantonov/jsonforms-svelte-flowbite flowbite-svelte
# or
pnpm add @chobantonov/jsonforms-svelte-flowbite flowbite-svelte
```

**Note**: This package requires both `flowbite-svelte` and Tailwind CSS to be installed and configured in your project.

## Setup

### 1. Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configure Tailwind

Update your `tailwind.config.js`:

```js
export default {
  content: [
    './src/**/*.{html,js,svelte,ts}',
    './node_modules/flowbite-svelte/dist'
    './node_modules/flowbite-svelte-icons/dist'
    './node_modules/@chobantonov/jsonforms-svelte/dist'
    './node_modules/@chobantonov/jsonforms-svelte-flowbite/dist'
  ],
  theme: {
    extend: {}
  },
  plugins: [
    require('flowbite/plugin')
  ]
}
```

### 3. Add Tailwind directives

Create or update your `app.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

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

## License

MIT
