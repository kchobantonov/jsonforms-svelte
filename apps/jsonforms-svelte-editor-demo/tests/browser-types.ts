/** Expected shape of the object-root fixtures exercised by these browser workflows.
 * These are test fixture types, not a restriction on the editor's public model API.
 */
export interface FixtureSchema {
  type?: string;
  properties?: Record<string, FixtureSchema>;
  [key: string]: unknown;
}
export interface FixtureUiNode {
  type: string;
  scope?: string;
  label?: string;
  options?: { multi?: boolean; [key: string]: unknown };
  elements?: FixtureUiNode[];
}
export interface BrowserSnapshot {
  documentId: string;
  revision: number;
  document: {
    schema: FixtureSchema & { properties: Record<string, FixtureSchema> };
    uischema: FixtureUiNode & { elements: FixtureUiNode[] };
  };
}
declare global {
  interface Window {
    changes: BrowserSnapshot[];
  }
}
