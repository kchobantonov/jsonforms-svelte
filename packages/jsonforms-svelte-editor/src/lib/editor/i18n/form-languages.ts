import { clone, object, type Document } from "../document/commands/index.js";
export function formLanguages(translations: unknown): string[] {
  return Object.entries(object(translations))
    .filter(
      ([, catalog]) =>
        catalog !== null &&
        typeof catalog === "object" &&
        !Array.isArray(catalog),
    )
    .map(([locale]) => locale);
}
export function addFormLanguage(document: Document, input: string): Document {
  const locale = Intl.getCanonicalLocales(input.trim())[0];
  if (!locale) throw new Error("Enter a valid language code.");
  const next = clone(document);
  if (
    next.translations !== undefined &&
    (next.translations === null ||
      typeof next.translations !== "object" ||
      Array.isArray(next.translations))
  )
    throw new Error("Translations must be an object.");
  const catalogs = object(next.translations);
  if (
    Object.keys(catalogs).some(
      (key) => key.toLowerCase() === locale.toLowerCase(),
    )
  )
    throw new Error("This language already exists.");
  catalogs[locale] = {};
  next.translations = catalogs;
  return next;
}
