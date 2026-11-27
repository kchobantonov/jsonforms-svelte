import type { UISchemaElement } from '@jsonforms/core';
import merge from 'lodash/merge';
import { getContext } from 'svelte';

const createEmptyStyles = (): Styles => ({
  control: {},
  verticalLayout: {},
  horizontalLayout: {},
  group: {},
  arrayList: {},
  listWithDetail: {},
  label: {},
  categorization: {},
});

export interface Styles {
  control: {
    root?: string;
    input?: string;
    asterisk?: string;
  };
  verticalLayout: {
    root?: string;
    item?: string;
  };
  horizontalLayout: {
    root?: string;
    item?: string;
  };
  group: {
    root?: string;
    label?: string;
    item?: string;
    bare?: string;
    alignLeft?: string;
  };
  arrayList: {
    root?: string;
    toolbar?: string;
    title?: string;
    validationIcon?: string;
    container?: string;
    addButton?: string;
    label?: string;
    noData?: string;
    item?: string;
    itemContainer?: string;
    itemHeader?: string;
    itemLabel?: string;
    itemContent?: string;
    itemMoveUp?: string;
    itemMoveDown?: string;
    itemDelete?: string;
  };
  listWithDetail: {
    root?: string;
    toolbar?: string;
    addButton?: string;
    label?: string;
    noData?: string;
    item?: string;
    itemLabel?: string;
    itemContent?: string;
    itemMoveUp?: string;
    itemMoveDown?: string;
    itemDelete?: string;
  };
  label: {
    root?: string;
  };
  categorization: {
    root?: string;
  };
}

export function useRendererStyles(key: symbol, defaultStyles: Styles, element?: UISchemaElement) {
  const userStyles = getContext<Styles>(key) || defaultStyles;
  const styles = element?.options?.styles
    ? merge(createEmptyStyles(), userStyles, element.options.styles)
    : userStyles;
  return {
    get value() {
      return styles;
    },
  };
}

/** Create independent defaults for each renderer registry. */
export function createDefaultStyles(overrides: Partial<Styles> = {}): Styles {
  return {
    control: {
      root: 'control',
      input: 'input',
    },
    verticalLayout: {
      root: 'vertical-layout',
      item: 'vertical-layout-item',
    },
    horizontalLayout: {
      root: 'horizontal-layout',
      item: 'horizontal-layout-item',
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
      root: 'label-element',
    },
    categorization: {
      root: 'categorization',
    },
    ...overrides,
  };
}
