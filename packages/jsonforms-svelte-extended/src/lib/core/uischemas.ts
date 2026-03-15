import {
  NOT_APPLICABLE,
  type JsonFormsUISchemaRegistryEntry,
  type UISchemaElement,
  type UISchemaTester,
  type ValidateFunctionContext,
} from "@jsonforms/core";

type UISchemaRegistryEntryInput = {
  tester: string | Function;
  uischema: UISchemaElement;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isUiSchemaElement = (value: unknown): value is UISchemaElement =>
  isObject(value) && typeof value.type === "string";

const createTester = (source: string, index: number): UISchemaTester => {
  return (uischema, schema, context) => {
    try {
      const tester = new Function(
        "uischema",
        "schema",
        "context",
        "NOT_APPLICABLE",
        `const tester = ${source}; return tester(uischema, schema, context);`,
      );

      const result = tester(uischema, schema, context, NOT_APPLICABLE);

      if (typeof result !== "number") {
        console.error(
          `Error at uischema tester[${index}]: invalid result type, expected number but got ${typeof result}`,
        );
        return NOT_APPLICABLE;
      }

      return result;
    } catch (error) {
      console.error(`Error at uischema tester[${index}]:`, error);
      return NOT_APPLICABLE;
    }
  };
};

const createValidateFunction = (
  source: string,
  config: Record<string, unknown> | undefined,
) => {
  return (context: ValidateFunctionContext): boolean => {
    try {
      const validate = new Function(
        "context",
        `const validate = ${source}; return validate(context);`,
      );
      const result = validate({
        ...context,
        config,
      });

      if (typeof result !== "boolean") {
        console.error(
          `UISchema validate: expected boolean, got ${typeof result}`,
        );
        return false;
      }

      return result;
    } catch (error) {
      console.error("UISchema validate error:", error);
      return false;
    }
  };
};

export const resolveUISchemaValidations = (
  uischema: UISchemaElement | undefined,
  config?: Record<string, unknown>,
): UISchemaElement | undefined => {
  if (!uischema) {
    return undefined;
  }

  const transformNode = (node: UISchemaElement): UISchemaElement => {
    const transformed = { ...node } as UISchemaElement & Record<string, unknown>;

    if (
      isObject(transformed.rule) &&
      isObject(transformed.rule.condition) &&
      typeof transformed.rule.condition.validate === "string"
    ) {
      transformed.rule = {
        ...(transformed.rule as Record<string, unknown>),
        condition: {
          ...(transformed.rule.condition as Record<string, unknown>),
          validate: createValidateFunction(
            transformed.rule.condition.validate,
            config,
          ),
        },
      } as typeof transformed.rule;
    }

    if (Array.isArray(transformed.elements)) {
      transformed.elements = transformed.elements.map((element) =>
        isUiSchemaElement(element) ? transformNode(element) : element,
      );
    }

    return transformed;
  };

  return transformNode(uischema);
};

export const parseAndTransformUISchemaRegistryEntries = (
  uischemaRegistryEntries?: readonly UISchemaRegistryEntryInput[],
  config?: Record<string, unknown>,
): JsonFormsUISchemaRegistryEntry[] => {
  return (uischemaRegistryEntries ?? [])
    .map((entry, index) => {
      if (typeof entry.tester === "string") {
        return {
          tester: createTester(entry.tester, index),
          uischema: resolveUISchemaValidations(entry.uischema, config)!,
        };
      }

      if (typeof entry.tester === "function") {
        return {
          tester: entry.tester as UISchemaTester,
          uischema: resolveUISchemaValidations(entry.uischema, config)!,
        };
      }

      return null;
    })
    .filter((entry) => entry !== null);
};
