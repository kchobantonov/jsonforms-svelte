import { describe, expect, it } from "vitest";
import {
  fromMonacoEditorValue,
  resolveMonacoLanguage,
  resolveMonacoOptions,
  toMonacoEditorValue,
} from "../src/lib/core/monaco";

describe("Monaco renderer helpers", () => {
  it("resolves fixed and data-driven languages", () => {
    expect(resolveMonacoLanguage({ language: "typescript" }, {})).toBe(
      "typescript",
    );
    expect(
      resolveMonacoLanguage(
        { ":language": "editor.language" },
        { editor: { language: "json" } },
      ),
    ).toBe("json");
  });

  it("converts JSON without committing invalid content", () => {
    expect(toMonacoEditorValue({ enabled: true }, "json", true)).toBe(
      '{\n  "enabled": true\n}',
    );
    expect(fromMonacoEditorValue('{"enabled":false}', "json", true)).toEqual({
      valid: true,
      value: { enabled: false },
    });
    expect(fromMonacoEditorValue("{", "json", true).valid).toBe(false);
    expect(fromMonacoEditorValue("", "json", true).valid).toBe(false);
  });

  it("reads renderer-neutral Monaco options", () => {
    expect(resolveMonacoOptions({ monaco: { rows: 12 } })).toEqual({
      rows: 12,
    });
    expect(resolveMonacoOptions(undefined)).toEqual({});
  });
});
