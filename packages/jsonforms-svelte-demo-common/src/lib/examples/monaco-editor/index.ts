import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createStaticExample, type DemoExample } from '../definitions.js';

const schema: JsonSchema = {
  type: 'object',
  properties: {
    language: {
      type: 'string',
      oneOf: [
        { const: 'javascript', title: 'JavaScript' },
        { const: 'typescript', title: 'TypeScript' },
        { const: 'html', title: 'HTML' },
        { const: 'json', title: 'JSON' },
      ],
    },
    code: { type: 'string', description: 'The editor language follows the selection above.' },
    javascript: {
      type: 'string',
      description: 'This editor grows with its content up to twelve rows.',
    },
    settings: {
      type: 'object',
      description: 'Invalid JSON stays in the editor until it can be parsed.',
      properties: {
        name: { type: 'string' },
        enabled: { type: 'boolean' },
        retries: { type: 'integer' },
      },
    },
  },
};

const uischema: UISchemaElement = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/language', label: 'Language' },
    {
      type: 'Control',
      scope: '#/properties/code',
      label: 'Dynamic language editor',
      options: {
        format: 'code',
        ':language': 'language',
        monaco: {
          rows: 8,
          options: { minimap: { enabled: false } },
          initActions: ['editor.action.formatDocument'],
        },
      },
    },
    {
      type: 'Control',
      scope: '#/properties/javascript',
      label: 'Auto-growing JavaScript editor',
      options: {
        format: 'code',
        language: 'javascript',
        monaco: {
          autoGrow: true,
          minRows: 3,
          maxRows: 12,
          options: { minimap: { enabled: true } },
        },
      },
    },
    {
      type: 'Control',
      scope: '#/properties/settings',
      label: 'JSON object editor',
      options: {
        format: 'code',
        language: 'json',
        convertJson: true,
        monaco: { rows: 10 },
      },
    },
  ],
};

export const createMonacoEditorExample = (): DemoExample =>
  createStaticExample({
    name: 'monaco-editor',
    label: 'Monaco Editor',
    schema,
    uischema,
    data: {
      language: 'javascript',
      code: "const greeting = 'Hello from JSON Forms';\nconsole.log(greeting);",
      javascript:
        'function sum(left, right) {\n  return left + right;\n}\n\nconsole.log(sum(20, 22));',
      settings: { name: 'demo', enabled: true, retries: 3 },
    },
  });
