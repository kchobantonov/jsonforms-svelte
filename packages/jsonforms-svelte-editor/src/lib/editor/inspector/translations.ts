import { formLanguages } from "../i18n/form-languages.js";
import type { InitialForm, JsonValue } from "../document/types.js";
const record = (value: unknown): Record<string, JsonValue> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : {};
export function translationValue(
  document: InitialForm,
  locale: string,
  prefix: string,
  suffix: string,
): JsonValue | undefined {
  return [locale, ...prefix.split("."), suffix].reduce<JsonValue | undefined>(
    (value, segment) => record(value)[segment],
    document.translations,
  );
}
export function applyTranslations(
  document: InitialForm,
  node: Record<string, JsonValue>,
  data: Record<string, unknown>,
) {
  if (!("i18n" in data)) return;
  const previous = node.i18n;
  const prefix = typeof data.i18n === "string" ? data.i18n.trim() : "";
  if (prefix) node.i18n = prefix;
  else delete node.i18n;
  // Key edits select a namespace; never copy stale values from the old namespace.
  if (!prefix || prefix !== previous) return;
  if (
    Object.keys(data).some(
      (key) =>
        key.startsWith("translatedLabel:") ||
        key.startsWith("translatedDescription:"),
    )
  ) {
    for (const locale of formLanguages(document.translations)) {
      const values: Record<string, unknown> = {
        i18n: prefix,
        translationLocale: locale,
      };
      for (const field of ["translatedLabel", "translatedDescription"])
        if (`${field}:${locale}` in data)
          values[field] = data[`${field}:${locale}`];
      applyTranslations(document, node, values);
    }
    return;
  }
  const locale =
    typeof data.translationLocale === "string"
      ? data.translationLocale.trim()
      : "";
  if (!locale) return;
  const segments = [locale, ...prefix.split(".")];
  if (
    segments.some(
      (key) => !key || ["__proto__", "constructor", "prototype"].includes(key),
    )
  )
    throw new Error("Choose a valid translation key and locale.");
  for (const [field, suffix] of [
    ["translatedLabel", node.type === "Label" ? "text" : "label"],
    ["translatedDescription", "description"],
  ] as const) {
    if (!(field in data)) continue;
    const value = data[field];
    if (value === undefined || value === "") {
      let parent: unknown = document.translations;
      for (const segment of segments) parent = record(parent)[segment];
      delete record(parent)[suffix];
      continue;
    }
    if (typeof value !== "string") continue;
    if (
      document.translations !== undefined &&
      record(document.translations) !== document.translations
    )
      throw new Error("Translations must be an object.");
    let parent = record((document.translations ??= {}));
    for (const segment of segments) {
      const current = parent[segment];
      if (current !== undefined && record(current) !== current)
        throw new Error("Translation key conflicts with an existing value.");
      parent = record((parent[segment] ??= {}));
    }
    parent[suffix] = value;
  }
}
