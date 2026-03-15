import type {
  JsonFormsUISchemaRegistryEntry,
  UISchemaElement,
  ValidateFunctionContext,
} from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import {
  parseAndTransformUISchemaRegistryEntries,
  resolveUISchemaValidations,
} from "../../src/lib/core/uischemas.ts";

const sampleUiSchema = {
  type: "Label",
  text: "Hello",
} as unknown as JsonFormsUISchemaRegistryEntry["uischema"];

describe("parseAndTransformUISchemaRegistryEntries", () => {
  it("revives tester functions encoded as strings", () => {
    const [entry] = parseAndTransformUISchemaRegistryEntries([
      {
        tester: "() => 7",
        uischema: sampleUiSchema,
      },
    ]);

    expect(typeof entry.tester).toBe("function");
    expect(entry.tester(sampleUiSchema, {} as never, {} as never)).toBe(7);
  });

  it("leaves existing function testers untouched", () => {
    const tester = () => 3;
    const [entry] = parseAndTransformUISchemaRegistryEntries([
      {
        tester,
        uischema: sampleUiSchema,
      },
    ]);

    expect(entry.tester).toBe(tester);
  });

  it("falls back to NOT_APPLICABLE for invalid tester strings", () => {
    const [entry] = parseAndTransformUISchemaRegistryEntries([
      {
        tester: "not valid javascript",
        uischema: sampleUiSchema,
      },
    ]);

    expect(entry.tester(sampleUiSchema, {} as never, {} as never)).toBe(-1);
  });

  it("returns an empty array for undefined input", () => {
    expect(parseAndTransformUISchemaRegistryEntries(undefined)).toEqual([]);
  });

  it("transforms nested rule.condition.validate strings inside registry uischemas", () => {
    const [entry] = parseAndTransformUISchemaRegistryEntries(
      [
        {
          tester: () => 1,
          uischema: {
            type: "Group",
            label: "Wrapped",
            elements: [
              {
                type: "Control",
                scope: "#/properties/value",
                rule: {
                  effect: "SHOW",
                  condition: {
                    scope: "#",
                    validate:
                      "(context) => Boolean(context?.config?.featureEnabled)",
                  },
                },
              },
            ],
          } as UISchemaElement,
        },
      ],
      { featureEnabled: true },
    );

    const nested = (entry.uischema as { elements: UISchemaElement[] }).elements[0] as {
      rule: { condition: { validate: (context: ValidateFunctionContext) => boolean } };
    };

    expect(typeof nested.rule.condition.validate).toBe("function");
    expect(
      nested.rule.condition.validate({
        rootData: {},
        instancePath: "",
        parentData: undefined,
      } as unknown as ValidateFunctionContext),
    ).toBe(true);
  });
});

describe("resolveUISchemaValidations", () => {
  it("turns string validate functions into executable functions with config access", () => {
    const transformed = resolveUISchemaValidations(
      {
        type: "Control",
        scope: "#/properties/value",
        rule: {
          effect: "ENABLE",
          condition: {
            scope: "#",
            validate: "(context) => context.config?.featureEnabled === true",
          },
        },
      } as UISchemaElement,
      { featureEnabled: true },
    ) as {
      rule: { condition: { validate: (context: ValidateFunctionContext) => boolean } };
    };

    expect(typeof transformed.rule.condition.validate).toBe("function");
    expect(
      transformed.rule.condition.validate({
        rootData: {},
        instancePath: "",
        parentData: undefined,
      } as unknown as ValidateFunctionContext),
    ).toBe(true);
  });
});
