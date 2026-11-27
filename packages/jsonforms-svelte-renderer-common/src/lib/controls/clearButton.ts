/** Keep focus on the field when the user clears its value with a pointer. */
export function clearButtonAttributes(label: string, onclick: () => void) {
  return {
    title: label,
    'aria-label': label,
    onmousedown: (event: MouseEvent) => event.preventDefault(),
    onclick,
  };
}
