import { describe, expect, it } from "vitest";
import {
  COLOR_PATTERN,
  isColor,
  toColorInputValue,
} from "../../src/lib/core/color.ts";

describe("color utilities", () => {
  it("uses the supported three, six, and eight digit hex pattern", () => {
    expect(COLOR_PATTERN).toBe(
      "^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$",
    );
    expect(isColor("#abc")).toBe(true);
    expect(isColor("#A1b2C3")).toBe(true);
    expect(isColor("#A1b2C3d4")).toBe(true);
    expect(isColor("#abcd")).toBe(false);
    expect(isColor("#ggg")).toBe(false);
  });

  it("normalizes supported colors for a native color input", () => {
    expect(toColorInputValue("#abc")).toBe("#aabbcc");
    expect(toColorInputValue("#A1b2C3")).toBe("#A1b2C3");
    expect(toColorInputValue("#A1b2C3d4")).toBe("#A1b2C3");
    expect(toColorInputValue("invalid")).toBe("#000000");
  });
});
