import type { TemplateExecutor, TemplateOptions } from "lodash";
import merge from "lodash/merge";
import templateFn from "lodash/template";

const interpolate = /{{([\s\S]+?)}}/g;

export const template = (
  templateString?: string,
  options?: TemplateOptions,
): TemplateExecutor => {
  return templateFn(
    templateString,
    merge({ interpolate: interpolate }, options),
  );
};
