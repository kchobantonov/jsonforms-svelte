import { checkCellValidationError } from '../../jsonforms-svelte-renderer-common/tests/formAssertions';
export * from '../../jsonforms-svelte-renderer-common/tests/renderForm';

export const expectCellValidationError = (container: HTMLElement) =>
  checkCellValidationError(container, 'aria-label');
