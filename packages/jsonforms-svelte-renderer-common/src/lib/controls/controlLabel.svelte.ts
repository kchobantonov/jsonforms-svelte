import { getContext } from 'svelte';
import { LiteralLabelAccessorySymbol, type LiteralLabelAccessory } from './labelAccessory';
import type { RendererControlWrapperProps } from './controlWrapperProps';

export function useControlLabel(
  props: RendererControlWrapperProps & { appliedOptions: Record<string, unknown> },
) {
  const getAccessory = getContext<(() => LiteralLabelAccessory) | undefined>(
    LiteralLabelAccessorySymbol,
  );
  const hasErrors = $derived(!!props.errors?.trim());
  const showDescription = $derived(
    !hasErrors && !!props.description && (props.isFocused || props.persistentHint),
  );
  const accessory = $derived(getAccessory?.());
  return {
    get helperAttributes() {
      return {
        id: props.id + '-help',
        role: hasErrors ? ('alert' as const) : ('note' as const),
        'aria-live': hasErrors ? ('assertive' as const) : ('polite' as const),
      };
    },
    get hasErrors() {
      return hasErrors;
    },
    get helpMessage() {
      return hasErrors ? props.errors : showDescription ? props.description : '';
    },
    get showAsterisk() {
      return props.label && props.required && !props.appliedOptions.hideRequiredAsterisk;
    },
    get accessory() {
      return accessory?.label === props.label ? accessory?.snippet : undefined;
    },
  };
}
