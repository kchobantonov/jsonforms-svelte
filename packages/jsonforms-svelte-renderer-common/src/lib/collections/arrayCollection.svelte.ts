import { validRemovalIndices } from './collectionIdentity';
import { useDeletionConfirmation } from '../interaction/deletionConfirmation.svelte';
import { useCollectionAction } from './collectionAction.svelte';
import { useJsonForms } from '@chobantonov/jsonforms-svelte';
import { composePaths, getControlPath, type ArrayTranslations } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import type { ControlProps, useJsonFormsArrayControl } from '../core/jsonFormsCompositions.svelte';
import { dataPathSegments } from '../core/dataPath';
import { scopeDataSegments } from '../core/schemaScope';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { errorTargetSegments } from '../validation/errorSummary';
import { useArrayPanelState } from '../layout/groupState.svelte';
import { useCollectionPagination } from './collectionPagination.svelte';
import { collectionErrorPositions } from './collectionPagination';

export type ArrayCollectionBinding = ReturnType<typeof useJsonFormsArrayControl> & {
  control: ReturnType<typeof useJsonFormsArrayControl>['control'] & {
    translations?: ArrayTranslations;
  };
  appliedOptions: Record<string, unknown>;
  childLabelForIndex?(index: number): string;
};

export function useArrayCollection(
  props: ControlProps,
  binding: ArrayCollectionBinding,
  paginateByDefault: boolean,
) {
  const jsonforms = useJsonForms();
  const message = useRendererMessages();
  const controlPathSegments = $derived([
    ...(props.pathSegments ?? dataPathSegments(props.path)),
    ...scopeDataSegments(props.uischema.scope),
  ]);

  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);
  const headerErrors = $derived.by(() => {
    const errors = binding.control.childErrors;
    if (!binding.appliedOptions.hideArraySummaryValidation) return errors;
    const path = controlPathSegments;
    return errors.filter((error) => {
      const target = errorTargetSegments(error);
      return target.length === path.length && path.every((part, index) => target[index] === part);
    });
  });
  const keys = $derived(Array.from({ length: dataLength }, (_, index) => index));
  const errorPositions = $derived(
    collectionErrorPositions(jsonforms.core, controlPathSegments, keys),
  );
  const page = useCollectionPagination({
    get keys() {
      return keys;
    },
    get local() {
      return binding.control.uischema.options?.pagination;
    },
    get config() {
      return binding.control.config;
    },
    get errors() {
      return errorPositions;
    },
    kind: 'array',
    defaultEnabled: paginateByDefault,
  });

  const addDisabled = $derived(
    binding.appliedOptions.disableAdd === true ||
      !binding.control.enabled ||
      (Boolean(binding.appliedOptions.restrict) &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  const runCollectionAction = useCollectionAction(() => binding.control, page.prepare);
  function arrayMessage(key: `${keyof ArrayTranslations}`) {
    return binding.control.translations?.[key] ?? message(`array.${key}`);
  }

  function moveButtons(visible: () => boolean, beforeMove?: (from: number, to: number) => void) {
    function move(event: Event, from: number, direction: -1 | 1) {
      event.stopPropagation();
      const to = from + direction;
      void runCollectionAction(
        () =>
          visible() &&
          Number.isInteger(from) &&
          from >= 0 &&
          from < dataLength &&
          to >= 0 &&
          to < dataLength,
        () => {
          beforeMove?.(from, to);
          const action = direction === -1 ? binding.moveUp : binding.moveDown;
          action?.(binding.control.path, from)();
        },
      );
    }
    function moveButton(index: number, direction: 'up' | 'down') {
      return {
        disabled:
          !binding.control.enabled || (direction === 'up' ? index <= 0 : index >= dataLength - 1),
        onclick: (event: Event) => move(event, index, direction === 'up' ? -1 : 1),
      };
    }
    return {
      moveAction(index: number, direction: 'up' | 'down') {
        return {
          ...moveButton(index, direction),
          label: arrayMessage(direction),
          ariaLabel: arrayMessage(direction === 'up' ? 'upAriaLabel' : 'downAriaLabel'),
        };
      },
      moveButton,
      moveUpClick: (event: Event, index: number) => move(event, index, -1),
      moveDownClick: (event: Event, index: number) => move(event, index, 1),
    };
  }
  function canRemoveIndices(indices: number[]) {
    return (
      indices.length > 0 &&
      binding.appliedOptions.disableRemove !== true &&
      (!binding.appliedOptions.restrict ||
        dataLength - indices.length >= (binding.control.arraySchema?.minItems ?? 0))
    );
  }

  function removal(
    kind: 'arrayTable' | 'listWithDetail' | 'arrayLayout',
    apply: (indices: number[]) => void,
  ) {
    const deletion = useDeletionConfirmation(
      () => ({ ...binding.control, options: binding.control.uischema.options }),
      kind,
      () => page.prepare(),
    );
    function request(toDelete: number[]) {
      const indices = validRemovalIndices(toDelete, dataLength);
      deletion.request(
        () => indices.map((index) => binding.control.data[index]),
        () => apply(indices),
        () => canRemoveIndices(indices),
      );
    }
    return {
      deletion,
      request,
      removeItemsClick(event: Event, indices: number[]) {
        event.stopPropagation();
        request(indices);
      },
    };
  }

  function childErrors(index: number): ErrorObject[] {
    const rowPath = composePaths(binding.control.path, `${index}`);
    return binding.control.childErrors.filter((error) => {
      const path = getControlPath(error);
      return path === rowPath || path.startsWith(rowPath + '.');
    });
  }

  function childLabelForIndex(index: number): string {
    return (
      binding.childLabelForIndex?.(index) || message('collection.itemLabel', { index: index + 1 })
    );
  }

  return {
    message,
    runCollectionAction,
    removal,
    moveButtons,
    canRemoveIndices,
    panel,
    page,
    arrayMessage,
    get removeDisabled() {
      const minimum = binding.control.arraySchema?.minItems;
      return (
        binding.appliedOptions.disableRemove === true ||
        !binding.control.enabled ||
        (!!binding.appliedOptions.restrict && minimum !== undefined && dataLength <= minimum)
      );
    },
    childErrors,
    childLabelForIndex,
    get dataLength() {
      return dataLength;
    },
    get headerErrors() {
      return headerErrors;
    },
    get addDisabled() {
      return addDisabled;
    },
    get controlPathSegments() {
      return controlPathSegments;
    },
    get errorPositions() {
      return errorPositions;
    },
  };
}
