import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { onMount } from 'svelte';
import { controlHelpVisible, stringDescriptionIds } from '../controls/controlHelp';
import {
  type ControlProps,
  useJsonFormsArrayChoicesControl,
  useAuthoredConfig,
} from '../core/jsonFormsCompositions.svelte.js';
import { useJsonForms, useTranslator } from '@chobantonov/jsonforms-svelte';
import { dataPathSegments } from '../core/dataPath.js';
import { scopeDataSegments } from '../core/schemaScope.js';
import { resolveRestrict } from '../core/options.js';
import { enumChoicesWithImportedValues } from '../controls/enumChoices.js';
import { defaultErrorTranslator, getCombinedErrorMessage } from '@jsonforms/core';
import {
  addChoice,
  arrayChoiceItemErrors,
  arrayChoicesOf,
  canAddChoice,
  canRemoveChoice,
  removeChoiceAt,
  resolveItemSchema,
  sameChoice,
  selectArrayChoices,
} from './arrayChoices';

/** Shared guarded mutations; presentation adapters own their native widgets. */
export function useArrayChoices(props: ControlProps) {
  const message = useRendererMessages();
  let draft = $state('');
  const binding = useJsonFormsArrayChoicesControl(props);
  const authored = useAuthoredConfig();
  const form = useJsonForms();
  const translator = useTranslator();
  const values = $derived(
    Array.isArray(binding.control.data) ? (binding.control.data as unknown[]) : [],
  );
  const finite = $derived(
    arrayChoicesOf(resolveItemSchema(binding.control.schema, binding.control.rootSchema)) !==
      undefined,
  );
  const choices = $derived(
    enumChoicesWithImportedValues(binding.control.options, binding.control.data),
  );
  const itemErrors = $derived.by(() => {
    const path = [
      ...(props.pathSegments ?? dataPathSegments(props.path)),
      ...scopeDataSegments(props.uischema.scope),
    ];
    const primary =
      form.core?.validationMode === 'NoValidation' ||
      form.core?.validationMode === 'ValidateAndHide'
        ? []
        : (form.core?.errors ?? []);
    return arrayChoiceItemErrors(
      [...primary, ...(form.core?.additionalErrors ?? [])],
      path,
      values.length,
    );
  });
  const itemMessages = $derived(
    itemErrors.map((errors, index) =>
      getCombinedErrorMessage(
        errors,
        form.i18n?.translateError ?? defaultErrorTranslator,
        translator.value,
        resolveItemSchema(binding.control.schema, binding.control.rootSchema),
        props.uischema,
        binding.control.path ? `${binding.control.path}.${index}` : String(index),
      ),
    ),
  );
  const errors = $derived(
    [
      binding.control.errors,
      ...itemMessages.map((message, index) =>
        message ? `${String(values[index])}: ${message}` : '',
      ),
    ]
      .filter(Boolean)
      .join('\n'),
  );
  const limits = $derived({
    minItems: binding.control.schema.minItems,
    maxItems: binding.control.schema.maxItems,
    restrict: resolveRestrict(props.uischema.options, authored.value),
  });
  const disabled = $derived(
    !binding.control.enabled || !binding.control.visible || binding.control.readonly,
  );
  // An invalid non-array remains visible to validation until explicitly replaced by its owner.
  const editable = $derived(
    binding.control.data === undefined || Array.isArray(binding.control.data),
  );
  const canAdd = $derived(!disabled && editable && canAddChoice(values, limits));
  const canRemove = $derived(!disabled && editable && canRemoveChoice(values, limits));
  function accepts(value: string): boolean {
    return (
      canAdd &&
      value !== '' &&
      (!finite ||
        (binding.control.options ?? []).some((option) => sameChoice(option.value, value))) &&
      (binding.control.schema.uniqueItems !== true ||
        !values.some((item) => sameChoice(item, value)))
    );
  }
  function add(value: string): boolean {
    if (!accepts(value)) return false;
    const next = addChoice(values, value, binding.control.schema.uniqueItems === true);
    if (next === values) return false;
    binding.handleChange(binding.control.path, next);
    return true;
  }
  function remove(index: number) {
    if (!canRemove) return;
    const next = removeChoiceAt(values, index);
    if (next !== values) binding.handleChange(binding.control.path, next);
  }
  function addDraft() {
    if (add(draft)) draft = '';
  }
  function handleDraftKey(event: KeyboardEvent) {
    if (event.isComposing) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      addDraft();
    } else if (event.key === 'Backspace' && draft === '') {
      event.preventDefault();
      remove(values.length - 1);
    }
  }
  const nativeChoices = $derived(
    choices.map((choice, index) => ({
      ...choice,
      id: `choice-${index}`,
    })),
  );
  const selectedIds = $derived(
    nativeChoices
      .filter((choice) => values.some((value) => sameChoice(value, choice.value)))
      .map((choice) => choice.id),
  );
  function select(ids: string[]) {
    if (disabled || !editable) return;
    const next = selectArrayChoices(values, nativeChoices, selectedIds, ids, limits);
    if (next !== values) binding.handleChange(binding.control.path, next);
  }
  const chips = $derived(props.uischema.options?.variant === 'chips');
  const focusable = () => !disabled && (!chips || canAdd);
  function initialFocus(root: () => HTMLElement | undefined, requested: () => boolean) {
    onMount(() => {
      if (!requested() || !focusable()) return;
      const frame = requestAnimationFrame(() => {
        const container = root();
        if (!container?.isConnected || !focusable()) return;
        const primary = [...container.querySelectorAll<HTMLElement>('[id]')].find(
          (node) => node.id === `${binding.control.id}-input`,
        );
        (primary?.matches('select[hidden]')
          ? container.querySelector<HTMLElement>('[role="listbox"]')
          : primary
        )?.focus();
      });
      return () => cancelAnimationFrame(frame);
    });
  }
  return {
    binding,
    initialFocus,
    focusable,
    get chips() {
      return chips;
    },
    describedBy(presentation: Parameters<typeof controlHelpVisible>[0], existing: unknown) {
      return (
        stringDescriptionIds(
          existing,
          controlHelpVisible(presentation, !!errors?.trim())
            ? `${binding.control.id}-help`
            : undefined,
        ) || undefined
      );
    },
    draftAttributes(describedBy: string | undefined, placeholder: string | undefined) {
      const { id, required } = binding.control;
      return {
        id: `${id}-input`,
        list: finite ? `${id}-choices` : undefined,
        disabled: !canAdd,
        'aria-invalid': !!errors,
        'aria-required': required,
        'aria-describedby': describedBy,
        placeholder: placeholder ?? message('chips.addPlaceholder'),
        onkeydown: handleDraftKey,
      };
    },
    addButton(validate = false) {
      return {
        disabled: validate ? !accepts(draft) : !canAdd || !draft,
        'aria-label': message('arrayChoices.add'),
        onclick: addDraft,
      };
    },
    get draft() {
      return draft;
    },
    set draft(value: string) {
      draft = value;
    },
    addDraft,
    handleDraftKey,
    accepts,
    select,
    get nativeChoices() {
      return nativeChoices;
    },
    get selectedIds() {
      return selectedIds;
    },
    get values() {
      return values;
    },
    get choices() {
      return choices;
    },
    get errors() {
      return errors;
    },
    itemErrors: (index: number) => itemErrors[index] ?? [],
    itemError: (index: number) => itemMessages[index] ?? '',
    get finite() {
      return finite;
    },
    get disabled() {
      return disabled;
    },
    get canAdd() {
      return canAdd;
    },
    get canRemove() {
      return canRemove;
    },
    label: (value: unknown) =>
      choices.find((choice) => sameChoice(choice.value, value))?.label ?? String(value),
    add,
    remove,
  };
}
