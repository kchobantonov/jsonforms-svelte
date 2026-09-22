import { expect, it } from "vitest";
import {
  createTranslator,
  defaultErrorTranslator,
  type JsonFormsState,
} from "@jsonforms/core";
import { createAjv } from "../../src/lib/core/validate";
import { scalarErrorMessage } from "../../../jsonforms-svelte/src/lib/scalarErrors";

it("preserves ajv-i18n localization and allows field error overrides for scalar compositions", () => {
  let locale = "bg-BG";
  const validate = createAjv(() => ({ locale })).compile({
    type: "object",
    properties: {
      value: { type: "integer", oneOf: [{ multipleOf: 3 }, { multipleOf: 5 }] },
    },
  });
  expect(validate({ value: 15 })).toBe(false);
  const errors = validate.errors!;
  const localized = errors.find((error) => error.keyword === "oneOf")!.message!;
  expect(localized).not.toBe("must match exactly one schema in oneOf");
  const before = JSON.stringify(errors);
  const state = {
    jsonforms: {
      core: { errors },
      i18n: {
        translateError: defaultErrorTranslator,
        translate: createTranslator((_key, fallback) => fallback),
        locale,
      },
    },
  } as unknown as JsonFormsState;
  const ui = { type: "Control", scope: "#", i18n: "quantity" };
  expect(
    scalarErrorMessage(state, { type: "integer" }, ui as any, "value"),
  ).toBe(localized);
  state.jsonforms.i18n!.translate = createTranslator((key, fallback) =>
    key === "quantity.error.oneOf" ? "Custom quantity error" : fallback,
  );
  expect(
    scalarErrorMessage(state, { type: "integer" }, ui as any, "value"),
  ).toBe("Custom quantity error");
  expect(JSON.stringify(errors)).toBe(before);
  locale = "en";
  expect(validate({ value: 15 })).toBe(false);
  expect(
    validate.errors!.find((error) => error.keyword === "oneOf")!.message,
  ).toBe('must match exactly one schema in "oneOf"');
});

it("preserves translated ajv-errors messages unless overridden by the control catalog", () => {
  const translate = createTranslator((key, fallback) =>
    key === "error.errorMessage.quantityChoice"
      ? "Use exactly one permitted multiple"
      : fallback,
  );
  const validate = createAjv({ locale: "bg", translate }).compile({
    type: "object",
    properties: {
      value: {
        type: "integer",
        oneOf: [{ multipleOf: 3 }, { multipleOf: 5 }],
        errorMessage: { oneOf: "quantityChoice" },
      },
    },
  });
  expect(validate({ value: 15 })).toBe(false);
  const state = {
    jsonforms: {
      core: { errors: validate.errors },
      i18n: { translateError: defaultErrorTranslator, locale: "bg", translate },
    },
  } as unknown as JsonFormsState;
  expect(
    scalarErrorMessage(
      state,
      { type: "integer" },
      { type: "Control", scope: "#" } as any,
      "value",
    ),
  ).toBe("Use exactly one permitted multiple");
});
