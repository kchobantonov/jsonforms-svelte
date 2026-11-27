interface ControlHelpBinding {
  control: { description?: string; errors?: string };
  controlWrapper: { persistentHint?: boolean };
  appliedOptions: { hideControlWrapper?: unknown } | Record<string, unknown>;
  isFocused: boolean;
}

export function controlHelpVisible(
  binding: ControlHelpBinding,
  hasErrors = !!binding.control.errors?.trim(),
  focused = binding.isFocused,
): boolean {
  return (
    !binding.appliedOptions.hideControlWrapper &&
    (hasErrors ||
      (!!binding.control.description && (focused || !!binding.controlWrapper.persistentHint)))
  );
}

export function joinDescriptionIds(...ids: unknown[]): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

export function stringDescriptionIds(...ids: unknown[]): string {
  return ids.filter((id): id is string => typeof id === 'string' && id.length > 0).join(' ');
}

export function choiceCardDescriptionIds(
  binding: ControlHelpBinding & { control: { id: string } },
  invalidValue: unknown,
) {
  const { id, errors } = binding.control;
  return joinDescriptionIds(
    controlHelpVisible(binding, !!errors) ? `${id}-help` : undefined,
    invalidValue !== undefined ? `${id}-invalid-value` : undefined,
  );
}

export function sliderDescriptionIds(
  binding: ControlHelpBinding & { control: { id: string } },
  authored: unknown,
  stateId: string,
  sliderError: unknown,
  focused = binding.isFocused,
) {
  const hasErrors = !!binding.control.errors?.trim() || !!sliderError;
  return stringDescriptionIds(
    authored,
    stateId,
    controlHelpVisible(binding, hasErrors, focused) ? `${binding.control.id}-help` : undefined,
  );
}
