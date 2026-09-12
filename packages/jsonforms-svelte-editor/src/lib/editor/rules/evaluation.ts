import {
  createAjv,
  evalVisibility,
  RuleEffect,
  type UISchemaElement,
} from "@jsonforms/core";
import { object } from "../document/commands/index.js";
const ajv = createAjv({ strict: false });
/** Root-context evaluation; the runtime Preview remains authoritative for inherited state. */
export function ruleMatch(
  rule: unknown,
  data: unknown,
  config: unknown,
): string {
  try {
    const candidate = {
      type: "Control",
      rule: { ...object(rule), effect: RuleEffect.SHOW },
    } as UISchemaElement;
    return evalVisibility(candidate, data, "", ajv, config)
      ? "Matches"
      : "Does not match";
  } catch {
    return "Cannot evaluate";
  }
}
