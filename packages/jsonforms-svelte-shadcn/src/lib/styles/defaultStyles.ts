import { createDefaultStyles, type Styles } from '@chobantonov/jsonforms-svelte-renderer-common';

export const defaultStyles: Styles = createDefaultStyles({
  control: {
    root: 'w-full min-w-0 space-y-1.5',
    input:
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
  },
  verticalLayout: {
    root: 'w-full',
    item: 'min-w-0',
  },
  horizontalLayout: {
    root: 'w-full',
    item: 'min-w-0',
  },
  label: {
    root: 'text-sm font-medium text-foreground',
  },
});
