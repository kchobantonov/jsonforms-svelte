import { useHoverClose } from '../interaction/hoverClose';
import { SvelteSet } from 'svelte/reactivity';
import type { ErrorObject } from 'ajv';
import { useErrorSummary } from '../validation/errorSummary.svelte';
import { useDynamicTreeResolver } from '../dynamic/dynamicTree.svelte.js';
import { dataPathSegments } from '../core/dataPath.js';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { useRendererMessages } from '../locale/rendererMessages.svelte.js';
import type { UISchemaElement } from '@jsonforms/core';
import { hasGroupValue } from './sectionData';
import { sectionBoundPaths, sectionErrors, sectionValidation } from './sectionValidation';
import { resolveSectionBoolean } from './sectionOptions';

/** Shared traversal for Group and Category data/validation indicators. */
export function useSectionIndicators(
  layout: () => {
    uischema: UISchemaElement;
    path: string;
    pathSegments?: readonly string[];
  },
) {
  const form = useJsonForms();
  const resolveTree = useDynamicTreeResolver();
  const effective = $derived(resolveTree(layout().uischema, layout().path, layout().pathSegments));
  const message = useRendererMessages();
  const paths = $derived(sectionBoundPaths(effective));
  const contextSegments = $derived(layout().pathSegments ?? dataPathSegments(layout().path));
  const validation = $derived(
    sectionValidation(form.core, contextSegments, effective, form.config, paths),
  );
  const errors = $derived(sectionErrors(form.core, contextSegments, paths));
  const dataIndicatorOption = $derived(
    resolveSectionBoolean(layout().uischema.options, form.config, 'showDataIndicator'),
  );
  const hasData = $derived.by(() => {
    if (!dataIndicatorOption) return false;
    const context = contextSegments.reduce<unknown>(
      (value, segment) =>
        value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      form.core?.data,
    );
    return paths.some((path) =>
      hasGroupValue(
        path.reduce<unknown>(
          (value, segment) =>
            value !== null && typeof value === 'object' && Object.hasOwn(value, segment)
              ? (value as Record<string, unknown>)[segment]
              : undefined,
          context,
        ),
      ),
    );
  });
  return {
    get hasData() {
      return hasData;
    },
    get dataLabel() {
      return message('group.dataIndicator');
    },
    get validation() {
      return validation;
    },
    get errors() {
      return errors;
    },
    get validationLabel() {
      return message(
        validation.count === undefined
          ? 'validation.containerHasErrors'
          : validation.count === 1
            ? 'validation.containerError'
            : 'validation.containerErrors',
        { count: validation.count },
      );
    },
  };
}

export interface SectionIndicatorProps {
  uischema: UISchemaElement;
  path: string;
  pathSegments?: readonly string[];
  class?: string;
  errorMessage?: string;
  errorErrors?: ErrorObject[];
  errorSource?: 'object' | 'additionalProperties' | 'array';
  showData?: boolean;
}

export function useSectionStatus(props: SectionIndicatorProps) {
  const indicators = useSectionIndicators(() => props);
  const hasOwnErrors = $derived(Boolean(props.errorMessage) || Boolean(props.errorErrors?.length));
  const summary = useErrorSummary(() =>
    hasOwnErrors
      ? [...new SvelteSet([...(props.errorErrors ?? []), ...indicators.errors])]
      : indicators.errors,
  );
  const attributes = $derived.by(() => {
    if (!hasOwnErrors)
      return {
        'data-container-validation-indicator': true,
        'data-error-count': indicators.validation.count,
      };
    const attribute = {
      object: 'data-object-own-errors',
      array: 'data-array-own-error-indicator',
      additionalProperties: 'data-additional-property-errors',
    }[props.errorSource ?? 'object'];
    return { [attribute]: true };
  });
  return {
    indicators,
    summary,
    get attributes() {
      return attributes;
    },
    get showSummary() {
      return !hasOwnErrors || Boolean(props.errorErrors?.length || indicators.errors.length);
    },
    get validationLabel() {
      return props.errorMessage || indicators.validationLabel;
    },
    get showValidation() {
      return hasOwnErrors || indicators.validation.show;
    },
  };
}

/** Keep a clicked status summary open when the pointer leaves the trigger. */
export function useSectionPopover(onEscape?: () => void) {
  let open = $state(false);
  let dismissed = $state(false);
  let pinned = false;
  const hover = useHoverClose(() => {
    if (!pinned) open = false;
  }, 150);
  function setOpen(value: boolean) {
    open = value && !dismissed;
    if (!open) pinned = false;
  }
  return {
    get open() {
      return open;
    },
    setOpen,
    get dismissed() {
      return dismissed;
    },
    focus() {
      dismissed = false;
    },
    cancelHoverClose: hover.cancel,
    closeAfterHover: hover.schedule,
    showOnHover() {
      hover.cancel();
      dismissed = false;
      open = true;
    },
    reveal(event: MouseEvent) {
      event.stopPropagation();
      hover.cancel();
      pinned = !pinned;
      dismissed = false;
      open = pinned;
    },
    keydown(event: KeyboardEvent) {
      if (!['Enter', ' ', 'Escape'].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      hover.cancel();
      pinned = event.key !== 'Escape';
      dismissed = !!onEscape && !pinned;
      open = pinned;
      if (event.key === 'Escape') onEscape?.();
    },
  };
}
