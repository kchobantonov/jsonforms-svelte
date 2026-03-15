import { describe, expect, it } from "vitest";
import {
  buttonSemanticColors,
  toButtonSemanticColor,
} from "../src/lib/core/types.ts";

describe("button semantic colors", () => {
  it("normalizes supported color values", () => {
    expect(buttonSemanticColors).toEqual([
      "primary",
      "secondary",
      "alternative",
      "success",
      "warning",
      "error",
    ]);
    expect(toButtonSemanticColor(" Primary ")).toBe("primary");
    expect(toButtonSemanticColor("warning")).toBe("warning");
    expect(toButtonSemanticColor("ERROR")).toBe("error");
  });

  it("rejects framework-specific color tokens", () => {
    expect(toButtonSemanticColor(undefined)).toBeUndefined();
    expect(toButtonSemanticColor("red")).toBeUndefined();
    expect(toButtonSemanticColor("green")).toBeUndefined();
    expect(toButtonSemanticColor("dark")).toBeUndefined();
  });
});
