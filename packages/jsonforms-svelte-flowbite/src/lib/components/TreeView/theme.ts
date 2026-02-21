import { tv, type VariantProps } from 'tailwind-variants';

export type TreeViewVariants = VariantProps<typeof treeView>;
export type TreeNodeVariants = VariantProps<typeof treeNode>;

export const treeView = tv({
  // Small logical start padding prevents row clipping when horizontally scrolled to start.
  // Full inner padding keeps rounded selected rows from being clipped by the scroll viewport.
  base: 'w-full p-1',
  variants: {
    scrollable: {
      true: 'overflow-auto',
      false: '',
    },
  },
  defaultVariants: {
    scrollable: true,
  },
});

export const treeNode = tv({
  // Allow rows to grow past container width so very deep nesting can be scrolled horizontally.
  base: 'w-full min-w-max',
});

export const treeNodeContent = tv({
  base: 'group flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-start min-w-0 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-0 dark:focus:ring-primary-500',
  variants: {
    active: {
      true: 'bg-primary-700 text-white dark:bg-primary-600 dark:text-white',
      false: 'text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
      false: '',
    },
  },
  defaultVariants: {
    active: false,
    disabled: false,
  },
});

export const treeToggleButton = tv({
  base: 'flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors',
  variants: {
    active: {
      true: 'text-white hover:bg-primary-800 dark:text-white dark:hover:bg-primary-700',
      false:
        'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200',
    },
  },
  defaultVariants: {
    active: false,
  },
});

export const treeNodeChildren = tv({
  // Allow nested levels to expand width; TreeView container handles horizontal scrolling.
  base: 'ms-6 min-w-max border-s border-gray-200 dark:border-gray-600',
});
