import { calendarTranslations } from './calendarTranslations';
import type { DatePickerRootProps } from '@skeletonlabs/skeleton-svelte';

export function calendarControlProps(
  control: { enabled: boolean; readonly?: boolean; errors?: string; required?: boolean },
  getRootNode: DatePickerRootProps['getRootNode'],
  positioning: unknown,
  focus: NonNullable<DatePickerRootProps['onFocusChange']>,
) {
  return {
    getRootNode,
    disabled: !control.enabled,
    readOnly: control.readonly,
    invalid: !!control.errors,
    required: control.required,
    positioning: {
      placement: 'bottom-start' as const,
      offset: { mainAxis: 4, crossAxis: 0 },
      shift: 0,
      ...(positioning ?? {}),
    },
    onFocusChange: focus,
  };
}

export function calendarPickerOptions<Vendor extends Record<string, unknown>>(
  vendor: Vendor,
  locale: string | undefined,
  focusedValue: DatePickerRootProps['focusedValue'],
  message: Parameters<typeof calendarTranslations>[0],
) {
  return {
    locale,
    focusedValue,
    ...vendor,
    translations: calendarTranslations(message, vendor.translations),
  };
}
