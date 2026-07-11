import type { Styles } from './styles';

export const defaultStyles: Styles = {
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
  group: {
    root: 'group',
    label: 'group-label',
    item: 'group-item',
    bare: 'group-bare',
    alignLeft: 'group-align-left',
  },
  arrayList: {
    root: 'array-list',
    toolbar: 'array-list-toolbar',
    title: 'array-list-title',
    validationIcon: 'array-list-validation',
    addButton: 'array-list-add',
    label: 'array-list-label',
    noData: 'array-list-no-data',
    item: 'array-list-item',
    itemHeader: 'array-list-item-header',
    itemLabel: 'array-list-item-label',
    itemContent: 'array-list-item-content',
    itemMoveUp: 'array-list-item-move-up',
    itemMoveDown: 'array-list-item-move-down',
    itemDelete: 'array-list-item-delete',
  },
  listWithDetail: {
    root: 'list-with-detail',
    toolbar: 'list-with-detail-toolbar',
    addButton: 'list-with-detail-add',
    label: 'list-with-detail-label',
    noData: 'list-with-detail-no-data',
    item: 'list-with-detail-item',
    itemLabel: 'list-with-detail-item-label',
    itemContent: 'list-with-detail-item-content',
    itemMoveUp: 'list-with-detail-item-move-up',
    itemMoveDown: 'list-with-detail-item-move-down',
    itemDelete: 'list-with-detail-item-delete',
  },
  label: {
    root: 'text-sm font-medium text-foreground',
  },
  categorization: {
    root: 'categorization',
  },
};
