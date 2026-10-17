import {
  defaultErrorTranslator,
  type ErrorTranslator,
  type JsonFormsI18nState,
} from '@jsonforms/core';
import type { Ajv, ErrorObject, Plugin } from 'ajv';
import localize from 'ajv-i18n/localize';
import type { I18nGetter } from '../types.js';
import { localize_bg } from './bg';

const validatorMessage = Symbol('validatorMessage');
const authoredMessage = Symbol('authoredMessage');
type DisplayError = ErrorObject & { [validatorMessage]?: string; [authoredMessage]?: string };

/** Localize a copy of our validator errors; host additionalErrors remain untouched. */
export const createPresentationErrorTranslator =
  (locale?: string): ErrorTranslator =>
  (error, translate, uischema) => {
    const source = error as DisplayError;
    if (!Object.hasOwn(source, validatorMessage) && !Object.hasOwn(source, authoredMessage)) {
      return defaultErrorTranslator(error, translate, uischema);
    }
    const display = { ...source };
    if (Object.hasOwn(source, authoredMessage)) {
      const message = source[authoredMessage]!;
      display.message = translate(`error.errorMessage.${message}`, message, { error });
    } else {
      display.message = source[validatorMessage];
      const language = locale?.replaceAll('_', '-');
      const available =
        language && (Object.hasOwn(localize, language) ? language : language.split('-')[0]);
      const localizer =
        available && Object.hasOwn(localize, available)
          ? localize[available as keyof typeof localize]
          : localize.en;
      localizer([display]);
    }
    return defaultErrorTranslator(display, translate, uischema);
  };

function injectAdditionalLocales() {
  // add missing BG locale - https://github.com/ajv-validator/ajv-i18n/pull/312 until this is merged and released
  const bg = 'bg' as keyof typeof localize;
  if (!localize[bg]) {
    localize[bg] = localize_bg;
  }

  // override the required message so that the missingProperty is not displayed as not translated text
  localize[bg] = (errors) => {
    if (!(errors && errors.length)) return;

    localize_bg(errors);
    for (const e of errors) {
      if (e.keyword === 'required') {
        e.message = 'полето е задължително';
      }
    }
  };
}

export interface I18NOptions {
  i18n?: I18nGetter;
}

const resolveI18n = (value?: I18nGetter): JsonFormsI18nState | undefined => {
  return typeof value === 'function' ? value() : value;
};

export const ajvTranslations: Plugin<I18NOptions> = (ajv: Ajv, options?: I18NOptions): Ajv => {
  injectAdditionalLocales();

  const compileFunction = ajv.compile;
  ajv.compile = Object.assign((...compileProps: Parameters<typeof compileFunction>) => {
    const validateFunction = compileFunction.apply(ajv, compileProps);

    const newValidateFunction = Object.assign(
      (...innerProps: Parameters<typeof validateFunction>) => {
        const validationResult = validateFunction.apply(compileFunction, innerProps);

        if (!validationResult && validateFunction.errors) {
          for (const error of validateFunction.errors as DisplayError[]) {
            if (error.keyword !== 'errorMessage') error[validatorMessage] = error.message;
          }
          const i18n = resolveI18n(options?.i18n);

          const language: keyof typeof localize | undefined = i18n
            ? (i18n.locale as keyof typeof localize)
            : undefined;

          const localized =
            language &&
            (localize[language] || localize[language.split('-')[0] as keyof typeof localize]);
          if (localized) {
            localized(
              // exclude errorMessage keyword since the message itself will be comming from the schema itself and possible then translated
              validateFunction.errors.filter((error) => error.keyword !== 'errorMessage'),
            );
          }

          validateFunction.errors = unwrapErrorMessageErrors(
            validateFunction.errors,
            options?.i18n,
          );
        }
        Object.assign(newValidateFunction, validateFunction);
        return validationResult;
      },
      validateFunction,
    );

    return newValidateFunction;
  }, compileFunction);

  return ajv;
};

export const unwrapErrorMessageErrors = (
  errors: ErrorObject[],
  i18n?: I18nGetter,
): ErrorObject[] => {
  const currentI18n = resolveI18n(i18n);

  const unwrap = (error: ErrorObject, authored?: string): ErrorObject[] => {
    if (error.keyword === 'errorMessage' && Array.isArray(error.params?.errors)) {
      return error.params.errors.flatMap((child: ErrorObject) =>
        unwrap(child, authored ?? error.message),
      );
    }
    if (authored === undefined) return [error];
    return [
      {
        ...error,
        [authoredMessage]: authored,
        message: currentI18n?.translate
          ? currentI18n.translate(`error.errorMessage.${authored}`, authored)
          : authored,
      } as DisplayError,
    ];
  };
  return errors
    .filter((error) => (error as ErrorObject & { emUsed?: boolean }).emUsed !== true)
    .flatMap((error) => unwrap(error));
};
