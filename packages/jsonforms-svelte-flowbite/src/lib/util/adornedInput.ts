import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HTMLInputAttributes } from 'svelte/elements';

/** With a custom child, Flowbite supplies classes and rest props separately from its input events. */
export function adornedInputAttributes(
  props: HTMLInputAttributes,
  input: Pick<HTMLInputAttributes, 'value' | 'oninput' | 'onfocus' | 'onblur'> & {
    clearable?: boolean;
  },
) {
  const { value, oninput, onfocus, onblur } = input;
  return {
    ...props,
    class: twMerge(
      clsx(props.class),
      'ps-9',
      value !== undefined && value !== '' && input.clearable ? 'pe-9' : '',
    ),
    value,
    oninput,
    onfocus,
    onblur,
  };
}
