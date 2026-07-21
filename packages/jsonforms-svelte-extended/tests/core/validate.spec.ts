import { describe, expect, it } from "vitest";
import { createAjv } from "../../src/lib/core/validate.ts";

describe("createAjv", () => {
  it("validates the custom color format", () => {
    const validate = createAjv().compile({ type: "string", format: "color" });

    expect(validate("#abc")).toBe(true);
    expect(validate("#A1b2C3")).toBe(true);
    expect(validate("#A1b2C3d4")).toBe(true);
    expect(validate("#abcd")).toBe(false);
    expect(validate("red")).toBe(false);
  });

  it("supports ajv-errors and translates errorMessage keys", () => {
    const ajv = createAjv({
      locale: "en",
      translate: (key: string, defaultMessage: string | undefined) => {
        if (key === "error.errorMessage.age.required") {
          return "Age is required";
        }

        return defaultMessage ?? key;
      },
    });

    const validate = ajv.compile({
      type: "object",
      required: ["age"],
      errorMessage: {
        required: {
          age: "age.required",
        },
      },
      properties: {
        age: {
          type: "integer",
        },
      },
    });

    expect(validate({})).toBe(false);
    expect(
      validate.errors?.some((error) => error.message === "Age is required"),
    ).toBe(true);
  });
});
