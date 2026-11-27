import { useArrayTable } from '../collections/arrayTable.svelte';
import {
  useJsonFormsArrayControl,
  useJsonFormsControl,
  type ControlProps,
} from './jsonFormsCompositions.svelte';
import { withReactiveProps } from '@chobantonov/jsonforms-svelte';
import type {
  DispatchPropsOfControl,
  DispatchPropsOfMultiEnumControl,
  UISchemaElement,
} from '@jsonforms/core';
import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import {
  useArrayPresentation,
  type ArrayPresentationControl,
} from '../collections/arrayPresentation.svelte';
import {
  useControlPresentation,
  type PresentationControl,
} from '../controls/controlPresentation.svelte';
import type { useRendererStyles } from '../layout/styles';
import { mergeRendererOptions } from './options';
import { useAppliedRendererOptions, useComputedLabel } from './rendererOptions.svelte';

export interface ConfiguredElement {
  config: unknown;
  uischema: UISchemaElement;
}

export function createRendererBindings<
  Options extends Record<string, unknown> & { clearable?: boolean },
  Props extends Record<string, unknown>,
  Vendor extends string,
  DefaultValue = unknown,
>(vendor: Vendor, useStyles: (element: UISchemaElement) => ReturnType<typeof useRendererStyles>) {
  function vendorMethods(options: () => Options, control?: () => PresentationControl) {
    function props(path: string): Props {
      const supplied = get(options()[vendor], path);
      const result = supplied && isPlainObject(supplied) ? supplied : {};
      if (!control) return result;
      if (path === 'input' || path === 'textarea')
        return { ...result, readonly: control().readonly };
      return { ...result };
    }
    return { [`${vendor}Props`]: props } as Record<`${Vendor}Props`, typeof props>;
  }

  function useControlAppliedOptions<T extends ConfiguredElement, I extends { control: T }>(
    input: I,
  ) {
    const resolved = useAppliedRendererOptions<Options>(() => input.control);
    return {
      ...vendorMethods(() => resolved.value),
      get value() {
        return resolved.value;
      },
    };
  }

  function useLabel<T extends ConfiguredElement, I extends { label: T }>(input: I) {
    const styles = useStyles(input.label.uischema);
    const options = $derived(
      mergeRendererOptions<Options>(input.label.config, input.label.uischema.options),
    );
    return withReactiveProps(input, {
      ...vendorMethods(() => options),
      get appliedOptions() {
        return options;
      },
      get styles() {
        return styles.value;
      },
    });
  }

  function useControl<
    T extends PresentationControl,
    I extends { control: T } & (DispatchPropsOfControl | DispatchPropsOfMultiEnumControl),
    V = DefaultValue,
  >(
    input: I,
    adaptValue: (value: V) => unknown = (value) => value,
    debounceWait?: number,
    focusable?: () => boolean,
  ) {
    const options = useControlAppliedOptions(input);
    const label = useComputedLabel(input, options);
    const styles = useStyles(input.control.uischema);
    return useControlPresentation(
      input,
      options,
      styles,
      label,
      vendorMethods(
        () => options.value,
        () => input.control,
      ),
      adaptValue,
      debounceWait,
      focusable,
    );
  }

  function useTextControl(props: ControlProps, clearValue: string | undefined) {
    const adaptValue = (value: unknown) => value || clearValue;
    const binding = useControl(useJsonFormsControl(props), adaptValue);
    return { binding, adaptValue };
  }

  function useLayout<T extends ConfiguredElement, I extends { layout: T }>(input: I) {
    const options = useAppliedRendererOptions<Options>(() => input.layout);
    return withReactiveProps(input, {
      ...vendorMethods(() => options.value),
      get appliedOptions() {
        return options.value;
      },
      get styles() {
        return useStyles(input.layout.uischema).value;
      },
    });
  }

  function useArrayControl<T extends ArrayPresentationControl, I extends { control: T }>(input: I) {
    const options = useControlAppliedOptions(input);
    const label = useComputedLabel(input, options);
    const { childLabelForIndex, overriddenInput } = useArrayPresentation(input);
    const styles = useStyles(input.control.uischema);
    return withReactiveProps(overriddenInput, {
      ...vendorMethods(() => options.value),
      get appliedOptions() {
        return options.value;
      },
      get styles() {
        return styles.value;
      },
      get computedLabel() {
        return label.value;
      },
      get rawChildErrors() {
        return input.control.childErrors;
      },
      childLabelForIndex,
    });
  }
  return {
    useTableControl(props: ControlProps, notice?: Parameters<typeof useArrayTable>[2]) {
      const binding = useArrayControl(useJsonFormsArrayControl(props));
      return { binding, table: useArrayTable(props, binding, notice) };
    },
    useControlAppliedOptions,
    useLabel,
    useControl,
    useTextControl,
    useLayout,
    useArrayControl,
  };
}
