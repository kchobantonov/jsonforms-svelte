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
