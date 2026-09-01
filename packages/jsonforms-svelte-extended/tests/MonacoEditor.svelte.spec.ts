import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import MonacoEditor from "../src/lib/components/MonacoEditor.svelte";

const editorElement = () =>
  document.querySelector<HTMLElement>(
    ".jsonforms-monaco-editor .monaco-editor",
  );

const renderedTokens = () =>
  Array.from(
    editorElement()?.querySelectorAll<HTMLElement>(".view-line span span") ??
      [],
  ).map((token) => (token.textContent ?? "").replaceAll("\u00a0", " "));

afterEach(() => {
  document.documentElement.removeAttribute("data-mode");
  document.documentElement.style.removeProperty("color-scheme");
});

describe("MonacoEditor", () => {
  it("uses a complete dark theme and reacts to language changes", async () => {
    document.documentElement.setAttribute("data-mode", "dark");
    const value = "const greeting = 'Hello';";
    const view = render(MonacoEditor, {
      props: {
        value,
        language: "javascript",
        rows: 3,
        surfaceBackground: "#fff",
        darkSurfaceBackground: "#1e2939",
      },
    });

    await vi.waitFor(
      () => {
        expect(editorElement()?.classList.contains("vs-dark")).toBe(true);
        expect(getComputedStyle(editorElement()!).backgroundColor).toBe(
          "rgb(30, 41, 57)",
        );
        expect(renderedTokens()).toContain("const");
      },
      { timeout: 10_000 },
    );

    await view.rerender({
      value,
      language: "json",
      rows: 3,
      surfaceBackground: "#fff",
      darkSurfaceBackground: "#1e2939",
    });

    await vi.waitFor(() => {
      expect(renderedTokens()).toEqual([value]);
    });

    document.documentElement.removeAttribute("data-mode");
    document.documentElement.style.colorScheme = "light";
    await vi.waitFor(() => {
      expect(
        document
          .querySelector(".jsonforms-monaco-editor")
          ?.classList.contains("jsonforms-monaco-editor--light"),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe(
        "rgb(255, 255, 255)",
      );
    });

    document.documentElement.style.colorScheme = "dark";
    await vi.waitFor(() => {
      expect(
        document
          .querySelector(".jsonforms-monaco-editor")
          ?.classList.contains("jsonforms-monaco-editor--dark"),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe(
        "rgb(30, 41, 57)",
      );
    });

    document.documentElement.style.colorScheme = "light";
    await vi.waitFor(() => {
      expect(
        document
          .querySelector(".jsonforms-monaco-editor")
          ?.classList.contains("jsonforms-monaco-editor--light"),
      ).toBe(true);
      expect(getComputedStyle(editorElement()!).backgroundColor).toBe(
        "rgb(255, 255, 255)",
      );
    });
  });

  it("treats removal of the dark class as light for class-based themes", async () => {
    document.documentElement.classList.add("dark");
    const view = render(MonacoEditor, {
      props: {
        value: "value",
        darkClassBasedTheme: true,
      },
    });

    await vi.waitFor(() => {
      expect(
        document
          .querySelector(".jsonforms-monaco-editor")
          ?.classList.contains("jsonforms-monaco-editor--dark"),
      ).toBe(true);
    });

    document.documentElement.classList.remove("dark");
    await vi.waitFor(() => {
      expect(
        document
          .querySelector(".jsonforms-monaco-editor")
          ?.classList.contains("jsonforms-monaco-editor--light"),
      ).toBe(true);
    });

    await view.unmount();
  });
});
