import specCatalog from '@chobantonov/jsonforms-extended-spec/examples/catalog.json';
import { examples as sharedSpecExamples } from '@chobantonov/jsonforms-extended-spec/examples';
export { useDemoServerErrors } from './server-errors.svelte.js';
export { resolveDemoHostAction } from './hostActions.js';
import { createSpecTemplateLayoutExample } from './nativeSpecExamples/template-layout/index.js';
import { createPatternPropertiesExample } from './pattern-properties/index.js';
import { createBracketPropertiesExample } from '../fixtures/bracket-properties/index.js';
import { createScalarCompositionExample } from './scalar-composition/index.js';
import { createScalarContradictionExamples } from './scalar-contradiction/index.js';
import { createObjectContradictionExamples } from './object-contradiction/index.js';
import { createRecursiveCompositionExamples } from './recursive-composition/index.js';
import {
  createNestedAnchorRecursionExample,
  createNestedIdRecursionExample,
  createRecursiveOneOfExample,
  createRootRecursiveOneOfExample,
  createUnknownAnchorExample,
} from '../fixtures/recursive-oneof/index.js';
import { createTuplesExample } from './tuples/index.js';
import { createTupleDraft2020Example } from './tuple-draft-2020/index.js';
import {
  createAnonymousSuppliedReferenceExample,
  createNestedSuppliedReferenceExample,
  createSuppliedReferenceExample,
} from '../fixtures/supplied-reference/index.js';
import { createDynamicReferenceExample } from '../fixtures/dynamic-reference/index.js';
import { createConfigInitialFocusExample } from '../fixtures/config-initial-focus/index.js';
import { createConfigMarkupExamples } from '../fixtures/config-markup/index.js';
import { createConfigDynamicValuesExamples } from '../fixtures/config-dynamic-values/index.js';
import { createConfigTemplateLanguageExamples } from '../fixtures/config-template-language/index.js';
import { createConfigGridOptionsExamples } from '../fixtures/config-grid-options/index.js';
import { createConfigRemovedLocationExamples } from '../fixtures/config-removed-locations/index.js';
import { createConfigPresentationOptionExamples } from '../fixtures/config-presentation-options/index.js';
import { createConfigListDetailOptionExamples } from '../fixtures/config-list-detail-options/index.js';
import { createConfigNumericStepExample } from '../fixtures/config-numeric-step/index.js';
import { createConfigControlHintsExample } from '../fixtures/config-control-hints/index.js';
import { createConfigControlEditingExample } from '../fixtures/config-control-editing/index.js';
import { createConfigLocalFormatExample } from '../fixtures/config-local-format/index.js';
import {
  createConfigHeightExamples,
  createConfigResizableExamples,
} from '../fixtures/config-height/index.js';
import {
  createConfigChoiceFocusExamples,
  createConfigExtendedFocusExamples,
  createConfigMonacoFocusExample,
  createConfigMonacoDimensionExamples,
  createConfigSliderFocusExample,
} from '../fixtures/config-choice-focus/index.js';
import {
  createConditionalReferenceExamples,
  createRecursiveConditionalReferenceExample,
} from '../fixtures/conditional-reference/index.js';
import { createHorizontalSizingExample } from './horizontal-sizing/index.js';
import { createPresentationRenderersExample } from './presentation-renderers/index.js';
import { createSelectionRenderersExample } from './selection-renderers/index.js';
import { getExamples } from '@jsonforms/examples';
import { createAgGridExample } from './ag-grid/index.js';
import { createButtonExample } from './button/index.js';
import { createColorExample } from './color/index.js';
import { createCombinatorPropertiesExample } from './combinator-properties/index.js';
import { createDurationExample } from './duration/index.js';
import { createErrorMessageExample } from './error-message/index.js';
import { createExtendedControlOptionsExample } from './extended-control-options/index.js';
import { createFileExample } from './file/index.js';
import {
  createLocalizedExample,
  type DemoExample,
  type DemoExamplesVariant,
} from './definitions.js';
import { createMainExample } from './main/index.js';
import { createMonacoEditorExample } from './monaco-editor/index.js';
import { localizeSpecDocument } from './spec-localization.js';
import { localizeSpecAgGridHeaders } from './spec-ag-grid-headers.js';
import { localizeDetailSchema } from './spec-detail-localization.js';
import { withButtonActionsHost } from './spec-button-actions.js';
import type { JsonSchema } from '@jsonforms/core';
import { createNullControlExample } from './null-control/index.js';
import { createSplitLayoutExample } from './split-layout/index.js';
import { createTemplateLayoutExample } from './template-layout/index.js';
import { createTemplateSlotExample } from './template-slot/index.js';
import { createTableCellsExample } from './table-cells/index.js';

export type { DemoExample, DemoExamplesVariant } from './definitions.js';

export const createDemoExamples = (
  variant: DemoExamplesVariant,
  getLocale: () => string,
): DemoExample[] => {
  const customExamples: DemoExample[] = [
    ...sharedSpecExamples.map(
      ({ id, title, hostRequirements: _hostRequirements, translations, ...fixture }) => {
        const sourceSchema =
          ['table-row-details', 'array-detail-modes', 'editor-details'].includes(id) &&
          fixture.schema
            ? localizeDetailSchema(fixture.schema as JsonSchema)
            : fixture.schema;
        const namespace = Object.keys(translations?.en ?? {})
          .find((key) => /^spec[^.]+\.(?:schema|ui)\./.test(key))
          ?.split('.')[0];
        const localized = {
          ...fixture,
          ...(sourceSchema
            ? {
                schema: localizeSpecDocument(
                  sourceSchema,
                  namespace ? `${namespace}.schema` : '',
                  translations?.en,
                ),
              }
            : {}),
          ...(fixture.uischema
            ? {
                uischema: localizeSpecDocument(
                  fixture['dynamic-uischema'] ?? fixture.uischema,
                  namespace ? `${namespace}.ui` : '',
                  translations?.en,
                ),
              }
            : {}),
          ...(fixture.uischemas
            ? { uischemas: localizeSpecDocument(fixture.uischemas, '', translations?.en) }
            : {}),
          ...(fixture.configuration
            ? {
                configuration: {
                  ...fixture.configuration,
                  uischema: localizeSpecDocument(
                    fixture.configuration.uischema,
                    namespace ? `${namespace}.configuration.ui` : '',
                    translations?.en,
                  ),
                },
              }
            : {}),
          name: `spec-${id}`,
          label: `Spec: ${title}`,
        } as DemoExample;
        if (id === 'ag-grid')
          localizeSpecAgGridHeaders(
            localized.uischema,
            getLocale,
            translations as Record<string, Record<string, string>>,
          );
        return createLocalizedExample(
          id === 'button-actions' ? withButtonActionsHost(localized) : localized,
          translations ?? {},
          getLocale,
        );
      },
    ),
    Object.assign(createSpecTemplateLayoutExample(getLocale), {
      name: 'native-template-layout',
      label: 'Native: Svelte template',
    }),
    ...createScalarContradictionExamples(getLocale),
    ...createObjectContradictionExamples(getLocale),
    ...createRecursiveCompositionExamples(getLocale),
    createRecursiveOneOfExample(getLocale),
    createRootRecursiveOneOfExample(getLocale),
    createNestedIdRecursionExample(getLocale),
    createNestedAnchorRecursionExample(getLocale),
    createUnknownAnchorExample(getLocale),
    createSuppliedReferenceExample(getLocale),
    createAnonymousSuppliedReferenceExample(getLocale),
    createNestedSuppliedReferenceExample(getLocale),
    createDynamicReferenceExample(getLocale),
    createConfigInitialFocusExample(getLocale),
    ...createConfigMarkupExamples(getLocale),
    ...createConfigDynamicValuesExamples(getLocale),
    ...createConfigTemplateLanguageExamples(getLocale),
    ...createConfigGridOptionsExamples(getLocale),
    ...createConfigRemovedLocationExamples(getLocale),
    ...createConfigPresentationOptionExamples(getLocale),
    ...createConfigListDetailOptionExamples(getLocale),
    createConfigNumericStepExample(getLocale),
    createConfigControlHintsExample(getLocale),
    createConfigControlEditingExample(getLocale),
    createConfigLocalFormatExample(getLocale),
    ...createConfigHeightExamples(getLocale),
    ...createConfigResizableExamples(getLocale),
    ...createConfigChoiceFocusExamples(getLocale),
    createConfigSliderFocusExample(getLocale),
    createConfigMonacoFocusExample(getLocale),
    ...createConfigMonacoDimensionExamples(getLocale),
    ...createConfigExtendedFocusExamples(getLocale),
    ...createConditionalReferenceExamples(getLocale),
    createRecursiveConditionalReferenceExample(getLocale),
    createScalarCompositionExample(),
    createPatternPropertiesExample(),
    createTuplesExample(getLocale),
    createTupleDraft2020Example(getLocale),
    createBracketPropertiesExample(),
    createAgGridExample(),
    createPresentationRenderersExample(),
    createHorizontalSizingExample(getLocale),
    createSelectionRenderersExample(),
    createButtonExample(getLocale),
    createColorExample(),
    createCombinatorPropertiesExample(),
    createDurationExample(),
    createErrorMessageExample(getLocale),
    createExtendedControlOptionsExample(variant),
    createNullControlExample(),
    createSplitLayoutExample(getLocale),
    createTemplateLayoutExample(getLocale),
    createTemplateSlotExample(),
    createFileExample(getLocale),
    createMainExample(getLocale),
    createMonacoEditorExample(),
  ];

  customExamples.push(createTableCellsExample());

  const catalogById = new Map(specCatalog.map((entry) => [entry.id, entry]));
  for (const example of customExamples) {
    example.exampleSource = example.name.startsWith('spec-') ? 'spec' : 'development';
    if (example.exampleSource !== 'spec') continue;
    const id = example.name.slice(5);
    const entry = catalogById.get(id);
    if (!entry) throw new Error(`Missing spec catalog entry: ${id}`);
    // Mutate this fresh host example instead of spreading it: spreading would
    // freeze its live i18n getter and trusted host adapters.
    example.label = `Spec: ${entry.title}`;
    example.spec = {
      id,
      revision: 'unreleased',
      source: `https://github.com/kchobantonov/jsonforms-extended-spec/tree/main/examples/${id}`,
      hostRequirements: entry.hostRequirements,
    };
  }
  const builtinExamples: DemoExample[] = getExamples().map((example) => ({
    ...example,
    name: `jsonforms-${example.name}`,
    label: `JsonForms: ${example.label}`,
    exampleSource: 'jsonforms',
  }));
  // Keep old deep links and development fixtures available without listing them.
  const legacyExamples: DemoExample[] = getExamples().map((example) => ({
    ...example,
    exampleSource: 'development',
  }));
  const mergedExamples = [...legacyExamples, ...customExamples, ...builtinExamples];
  const uniqueByName = new Map(mergedExamples.map((example) => [example.name, example]));

  return Array.from(uniqueByName.values()).sort((a, b) => a.label.localeCompare(b.label));
};

export const createSkeletonDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('skeleton', getLocale);

export const createFlowbiteDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('flowbite', getLocale);

export const createShadcnDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('shadcn', getLocale);

/** Public navigation excludes development fixtures; direct routes retain the full registry. */
export function filterPublicDemoExamples(
  examples: readonly DemoExample[],
  source: string = 'spec',
  search = '',
): DemoExample[] {
  const query = search.trim().toLocaleLowerCase();
  return examples.filter(
    (example) =>
      (example.exampleSource === 'spec' || example.exampleSource === 'jsonforms') &&
      (source === 'all' || example.exampleSource === source) &&
      (!query ||
        example.name.toLocaleLowerCase().includes(query) ||
        example.label.toLocaleLowerCase().includes(query)),
  );
}
