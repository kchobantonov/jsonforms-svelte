import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import type { useJsonFormsControlWithDetail } from '../core/jsonFormsCompositions.svelte';
import { useErrorSummary, useNameConstraintMessage } from '../validation/errorSummary.svelte';
import { usePendingControlChanges } from '../interaction/detailDialog.svelte';
import {
  useAdditionalPropertyErrors,
  usePropertyNameErrors,
} from '../validation/objectErrors.svelte';
import { tick } from 'svelte';
import { useAdditionalPropertyEditor } from './additionalPropertyEditor.svelte';

export function usePropertyRename(
  getInput: () => ReturnType<typeof useJsonFormsControlWithDetail>,
  getOptions: () => Record<string, unknown>,
  editor: ReturnType<typeof useAdditionalPropertyEditor>,
  onClose?: () => void,
) {
  const input = $derived(getInput());
  const control = $derived(input.control);
  const appliedOptions = $derived(getOptions());
  const { collection, command, validateName, message } = editor;
  const nameErrors = usePropertyNameErrors(() => control);
  let renamingPropertyName = $state<string | null>(null);
  let renameValue = $state('');

  const existingRenameSummary = useErrorSummary(() =>
    renamingPropertyName === null ? [] : (nameErrors.errors.get(renamingPropertyName) ?? []),
  );
  const nameConstraintMessage = useNameConstraintMessage();
  const renameValidation = $derived(
    renamingPropertyName === null ? null : validateName(renameValue, renamingPropertyName),
  );
  const renameError = $derived.by(() => {
    if (renameValue === renamingPropertyName && existingRenameSummary.entries.length)
      return existingRenameSummary.entries.map((entry) => entry.message).join('\n');
    if (!renameValidation || renameValidation.valid) return null;
    return (
      nameConstraintMessage(renameValidation.errors) ??
      (renameValidation.error === 'required'
        ? message('additionalProperties.nameRequired')
        : renameValidation.error === 'already-defined'
          ? message('additionalProperties.nameTaken', { name: renameValidation.name })
          : message('additionalProperties.nameInvalid', { name: renameValidation.name }))
    );
  });

  const owner = () => [control.path, control.schema, control.rootSchema];
  let renameOwner = $state.raw<unknown[] | undefined>();
  let renameComposing = $state(false);
  const canRename = (name: string) =>
    control.enabled &&
    !control.readonly &&
    control.visible &&
    Object.hasOwn(control.data ?? {}, name) &&
    !(appliedOptions.restrict && control.schema.required?.includes(name));

  function openRenameDialog(propName: string, onOpen: () => void) {
    return command(
      () => canRename(propName),
      () => {
        onOpen();
        renameOwner = cloneDeep(owner());
        renamingPropertyName = propName;
        renameValue = propName;
      },
    );
  }

  $effect(() => {
    if (
      renamingPropertyName !== null &&
      (!canRename(renamingPropertyName) || !isEqual(owner(), renameOwner))
    ) {
      closeRenameDialog();
    }
  });

  function closeRenameDialog(): void {
    renamingPropertyName = null;
    renameValue = '';
    renameComposing = false;
    renameOwner = undefined;
    onClose?.();
  }

  function commitRename(event: SubmitEvent): void {
    event.preventDefault();
    const source = renamingPropertyName;
    const proposed = renameValue;
    void command(
      () =>
        source !== null &&
        source === renamingPropertyName &&
        proposed === renameValue &&
        !renameComposing &&
        !renameError &&
        canRename(source) &&
        isEqual(owner(), renameOwner),
      renameProperty,
    );
  }

  function renameProperty(): void {
    if (renamingPropertyName === null) return;

    const validation = validateName(renameValue, renamingPropertyName);
    if (validation.valid && validation.name === renamingPropertyName) {
      closeRenameDialog();
      return;
    }
    if (!validation.valid) {
      return;
    }
    const renamedProperty = validation.name;

    if (typeof control.data === 'object' && control.data !== null && !Array.isArray(control.data)) {
      const updatedData = Object.fromEntries(
        Object.entries(control.data).map(([key, value]) => [
          key === renamingPropertyName ? renamedProperty : key,
          value,
        ]),
      );
      const previousName = renamingPropertyName;
      input.handleChange(control.path, updatedData);
      if (
        Object.hasOwn(control.data ?? {}, renamedProperty) &&
        !Object.hasOwn(control.data ?? {}, previousName)
      )
        collection.identities.rename(previousName, renamedProperty);
      closeRenameDialog();
    }
  }
  return {
    canRename,
    openRenameDialog,
    closeRenameDialog,
    commitRename,
    nameErrors,
    get inputAttributes() {
      return {
        id: control.id + '-rename-property',
        placeholder: message('additionalProperties.namePlaceholder'),
        oncompositionstart: () => {
          renameComposing = true;
        },
        oncompositionend: () => {
          renameComposing = false;
        },
        'aria-invalid': renameError ? ('true' as const) : undefined,
        'aria-describedby': renameError ? control.id + '-rename-error' : undefined,
      };
    },
    get submitDisabled() {
      return !!renameError || renameComposing;
    },
    get name() {
      return renamingPropertyName;
    },
    get value() {
      return renameValue;
    },
    set value(next: string) {
      renameValue = next;
    },
    get composing() {
      return renameComposing;
    },
    set composing(next: boolean) {
      renameComposing = next;
    },
    get error() {
      return renameError;
    },
  };
}

export interface AdditionalPropertiesProps {
  input: ReturnType<typeof useJsonFormsControlWithDetail>;
  disallowedPropertyNames?: string[];
  embedded?: boolean;
}

/** Coordinate the editor and its rename dialog with the native dialog's focus lifecycle. */
export function useEditableAdditionalProperties<
  R extends { value: ReturnType<Parameters<typeof useAdditionalPropertyEditor>[1]> },
>(
  props: AdditionalPropertiesProps,
  resolveOptions: (binding: Pick<AdditionalPropertiesProps['input'], 'control'>) => R,
  setDynamic: (value: boolean) => void,
  translations: Parameters<typeof useAdditionalPropertyEditor>[3],
  restoreOnClose = false,
) {
  const resolvedOptions = resolveOptions({
    get control() {
      return props.input.control;
    },
  });
  setDynamic(true);
  const getInput = () => props.input;
  const getOptions = () => resolvedOptions.value;
  const getDisallowedNames = () => props.disallowedPropertyNames ?? [];
  const rejected = useAdditionalPropertyErrors(() => getInput().control);
  usePendingControlChanges();
  const editor = useAdditionalPropertyEditor(
    getInput,
    getOptions,
    getDisallowedNames,
    translations,
  );
  let renameTrigger: HTMLButtonElement | HTMLAnchorElement | undefined;
  function takeTrigger() {
    const trigger = renameTrigger;
    renameTrigger = undefined;
    return trigger;
  }
  function restoreRenameFocus() {
    const trigger = takeTrigger();
    void tick().then(() => {
      if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus();
    });
  }
  const rename = usePropertyRename(
    getInput,
    getOptions,
    editor,
    restoreOnClose ? restoreRenameFocus : undefined,
  );
  function openRenameDialog(name: string, trigger: HTMLButtonElement | HTMLAnchorElement) {
    return rename.openRenameDialog(name, () => {
      renameTrigger = trigger;
    });
  }
  function renameAction(name: string) {
    return {
      label: editor.translations.renameTooltip ?? editor.message('additionalProperties.rename'),
      ariaLabel: editor.propertyActionLabel('rename', name),
      disabled: !rename.canRename(name),
      onclick: (event: MouseEvent) =>
        openRenameDialog(name, event.currentTarget as HTMLButtonElement),
    };
  }
  function removeAction(name: string) {
    const blocked = !!getOptions().restrict && !!getInput().control.schema.required?.includes(name);
    return {
      label: blocked
        ? editor.message('additionalProperties.deleteBlocked')
        : (editor.translations.removeTooltip ?? editor.message('additionalProperties.delete')),
      ariaLabel: editor.propertyActionLabel('remove', name),
      disabled: editor.removePropertyDisabled || blocked,
      onclick: () => editor.removeProperty(name),
    };
  }
  return {
    resolvedOptions,
    rejected,
    editor,
    rename,
    openRenameDialog,
    get addAction() {
      const fallback = editor.message('additionalProperties.add');
      return {
        label: editor.translations.addTooltip ?? fallback,
        ariaLabel: editor.translations.addAriaLabel ?? fallback,
        disabled: editor.addPropertyDisabled,
        onclick: editor.addProperty,
      };
    },
    renameAction,
    removeAction,
    restoreRenameFocus,
    takeTrigger,
  };
}
