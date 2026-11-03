import {
  defaultErrorTranslator,
  getCombinedErrorMessage,
  type ControlElement,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { getContext, setContext } from 'svelte';
import type { ErrorObject } from 'ajv';
import { directObjectErrors, propertyNameErrors, rejectedPropertyErrors } from './objectErrors';
import { useRendererMessages } from './rendererMessages.svelte';
import { useJsonForms, useTranslator } from './jsonFormsCompositions.svelte';
import { dataPathSegments } from './dataPath';
import { scopeDataSegments } from './schemaScope';

const context = Symbol('object error boundary');
type Boundary = { uischema: UISchemaElement; path: string; message: string; errors: ErrorObject[] };
type ObjectControl = {
  schema: JsonSchema;
  uischema: ControlElement;
  path: string;
  pathSegments?: readonly string[];
};
const controlSegments = (control: ObjectControl): string[] =>
  control.pathSegments
    ? [...control.pathSegments, ...scopeDataSegments(control.uischema.scope)]
    : dataPathSegments(control.path);

export function provideObjectErrors(control: () => ObjectControl, detail: () => UISchemaElement) {
  const form = useJsonForms();
  const translator = useTranslator();
  const errors = $derived(
    directObjectErrors(
      form.core?.validationMode === 'NoValidation' ||
        form.core?.validationMode === 'ValidateAndHide'
        ? undefined
        : form.core?.errors,
      form.core?.additionalErrors,
      controlSegments(control()),
    ),
  );
  const message = $derived(
    getCombinedErrorMessage(
      errors,
      form.i18n?.translateError ?? defaultErrorTranslator,
      translator.value,
      control().schema,
      control().uischema,
      control().path,
    ),
  );
  const boundary: Boundary = {
    get uischema() {
      return detail();
    },
    get path() {
      return control().path;
    },
    get message() {
      return message;
    },
    get errors() {
      return errors;
    },
  };
  setContext(context, boundary);
  return boundary;
}

/** Only the resolved outer Group owns the object's direct errors. Authored inner
 * Groups continue to use their independently configured section indicators. */
export function useObjectErrors(layout: () => { uischema: UISchemaElement; path: string }) {
  const boundary = getContext<Boundary | undefined>(context);
  return {
    get message() {
      return boundary?.uischema === layout().uischema && boundary.path === layout().path
        ? boundary.message
        : undefined;
    },
    get errors() {
      return boundary?.uischema === layout().uischema && boundary.path === layout().path
        ? boundary.errors
        : undefined;
    },
  };
}

export function useAdditionalPropertyErrors(control: () => ObjectControl) {
  const form = useJsonForms();
  const translator = useTranslator();
  const message = useRendererMessages();
  const errors = $derived(
    rejectedPropertyErrors(
      form.core?.validationMode === 'NoValidation' ||
        form.core?.validationMode === 'ValidateAndHide'
        ? undefined
        : form.core?.errors,
      form.core?.additionalErrors,
      controlSegments(control()),
    ),
  );
  const text = $derived(
    errors
      .map((error) =>
        message('additionalProperties.rejected', {
          property: JSON.stringify(error.params.additionalProperty),
          message: getCombinedErrorMessage(
            [error],
            form.i18n?.translateError ?? defaultErrorTranslator,
            translator.value,
            control().schema,
            control().uischema,
            control().path,
          ),
        }),
      )
      .join('\n'),
  );
  return {
    get message() {
      return text;
    },
    get errors() {
      return errors;
    },
  };
}

export function usePropertyNameErrors(control: () => ObjectControl) {
  const form = useJsonForms();
  const errors = $derived(
    propertyNameErrors(
      form.core?.validationMode === 'NoValidation' ||
        form.core?.validationMode === 'ValidateAndHide'
        ? undefined
        : form.core?.errors,
      form.core?.additionalErrors,
      controlSegments(control()),
    ),
  );
  return {
    get errors() {
      return errors;
    },
  };
}
