import { createAjv as createDefaultAjv } from "@jsonforms/core";
import type { Options } from "ajv";
import ajvErrors from "ajv-errors";
import { ajvTranslations } from "./ajv-i18n/index.js";
import { ajvKeywords } from "./keywords.js";
import type { I18nGetter } from "./types.js";
import { COLOR_REGEX } from "./color.js";

export const createAjv = (i18n?: I18nGetter) => {
  const options: Options = {
    useDefaults: true,
    $data: true,
    discriminator: true,
  };

  const ajv = createDefaultAjv(options);

  ajv.addFormat("color", {
    type: "string",
    validate: (value: string) => COLOR_REGEX.test(value),
  });

  ajvKeywords(ajv);
  ajvErrors(ajv);
  ajvTranslations(ajv, { i18n });

  return ajv;
};
