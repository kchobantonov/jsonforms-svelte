import specCatalog from './spec-catalog.json';
import specProvenance from './spec-provenance.json';
import { createSpecAgGridExample } from './spec-ag-grid/index.js';
import { createSpecKitchenSinkExample } from './spec-kitchen-sink/index.js';
import { createSpecAdditionalErrorsExample } from './spec-additional-errors/index.js';
export { useDemoServerErrors } from './server-errors.svelte.js';
import { createSpecTemplateLayoutExample } from './spec-template-layout/index.js';
import { createSpecTemplateSlotsExample } from './spec-template-slots/index.js';
import { createSpecDraft07MetaschemaExample } from './spec-draft-07-metaschema/index.js';
import { createSpecPresentationExample } from './spec-presentation/index.js';
import { createSpecTemporalControlsExample } from './spec-temporal-controls/index.js';
import { createSpecDestructiveConfirmationExample } from './spec-destructive-confirmation/index.js';
import { createSpecArrayControlsExample } from './spec-array-controls/index.js';
import { createSpecObjectControlExample } from './spec-object-control/index.js';
import { createSpecPreTouchErrorsExample } from './spec-pre-touch-errors/index.js';
import { createSpecContainerValidationIndicatorExample } from './spec-container-validation-indicator/index.js';
import { createSpecCategorizationExample } from './spec-categorization/index.js';
import { createSpecNumericControlsExample } from './spec-numeric-controls/index.js';
import { createSpecNullControlExample } from './spec-null-control/index.js';
import { createSpecTupleControlExample } from './spec-tuple-control/index.js';
import { createSpecAdditionalPropertiesExample } from './spec-additional-properties/index.js';
import { createSpecTableRowDetailsExample } from './spec-table-row-details/index.js';
import { createSpecPropertyPaginationExample } from './spec-property-pagination/index.js';
import { createSpecCollectionPaginationExample } from './spec-collection-pagination/index.js';
import { createSpecAdditionalItemsPaginationExample } from './spec-additional-items-pagination/index.js';
import { createSpecArrayDetailModesExample } from './spec-array-detail-modes/index.js';
import { createSpecEditorDetailsExample } from './spec-editor-details/index.js';
import { createSpecTreeMaxDepthExample } from './spec-tree-max-depth/index.js';
import { createSpecRecursiveTreeExample } from './spec-recursive-tree/index.js';
import { createSpecCronControlExample } from './spec-cron-control/index.js';
import { createSpecMixedControlExample } from './spec-mixed-control/index.js';
import { createSpecArrayChoicesExample } from './spec-array-choices/index.js';
import { createSpecConditionalFieldsExample } from './spec-conditional-fields/index.js';
import { createSpecCombinatorsExample } from './spec-combinators/index.js';
import { createSpecValidatorProfileExample } from './spec-validator-profile/index.js';
import { createSpecButtonActionsExample } from './spec-button-actions/index.js';
import { createSpecStringControlsExample } from './spec-string-controls/index.js';
import { createSpecBooleanControlsExample } from './spec-boolean-controls/index.js';
import { createSpecPasswordControlExample } from './spec-password-control/index.js';
import { createSpecColorControlExample } from './spec-color-control/index.js';
import { createSpecCodeEditorExample } from './spec-code-editor/index.js';
import { createSpecFileControlExample } from './spec-file-control/index.js';
import { createSpecSplitLayoutExample } from './spec-split-layout/index.js';
import { createSpecJsonEditorExample } from './spec-json-editor/index.js';
import { createSpecJsonInferenceExample } from './spec-json-inference/index.js';
import { createSpecGroupLayoutExample } from './spec-group-layout/index.js';
import { createSpecLayoutSizingExample } from './spec-layout-sizing/index.js';
import { createSpecLabelInterpolationExample } from './spec-label-interpolation/index.js';
import { createSpecMarkupLabelExample } from './spec-markup-label/index.js';
import { createSpecChoiceControlsExample } from './spec-choice-controls/index.js';
import { createPatternPropertiesExample } from './pattern-properties/index.js';
import { createBracketPropertiesExample } from './bracket-properties/index.js';
import { createScalarCompositionExample } from './scalar-composition/index.js';
import { createTuplesExample } from './tuples/index.js';
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
import { type DemoExample, type DemoExamplesVariant } from './definitions.js';
import { createJobExample } from './job/index.js';
import { createMainExample } from './main/index.js';
import { createMonacoEditorExample } from './monaco-editor/index.js';
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
    createSpecNullControlExample(getLocale),
    createSpecAgGridExample(getLocale),
    createSpecKitchenSinkExample(getLocale),
    createSpecAdditionalErrorsExample(getLocale),
    createSpecTemplateLayoutExample(getLocale),
    createSpecTemplateSlotsExample(getLocale),
    createSpecDraft07MetaschemaExample(getLocale),
    createSpecPresentationExample(getLocale),
    createSpecTemporalControlsExample(getLocale),
    createSpecNumericControlsExample(getLocale),
    createSpecCategorizationExample(getLocale),
    createSpecContainerValidationIndicatorExample(getLocale),
    createSpecObjectControlExample(getLocale),
    createSpecDestructiveConfirmationExample(getLocale),
    createSpecArrayControlsExample(getLocale),
    createSpecPreTouchErrorsExample(getLocale),
    createSpecTupleControlExample(getLocale),
    createSpecAdditionalPropertiesExample(getLocale),
    createSpecCronControlExample(getLocale),
    createSpecMixedControlExample(getLocale),
    createSpecRecursiveTreeExample(getLocale),
    createSpecCollectionPaginationExample(getLocale),
    createSpecTableRowDetailsExample(getLocale),
    createSpecPropertyPaginationExample(getLocale),
    createSpecAdditionalItemsPaginationExample(getLocale),
    createSpecTreeMaxDepthExample(getLocale),
    createSpecArrayDetailModesExample(getLocale),
    createSpecEditorDetailsExample(getLocale),
    createSpecArrayChoicesExample(getLocale),
    createSpecConditionalFieldsExample(getLocale),
    createSpecCombinatorsExample(getLocale),
    createSpecValidatorProfileExample(getLocale),
    createSpecJsonEditorExample(getLocale),
    createSpecJsonInferenceExample(getLocale),
    createSpecChoiceControlsExample(getLocale),
    createSpecLabelInterpolationExample(getLocale),
    createSpecMarkupLabelExample(getLocale),
    createSpecLayoutSizingExample(getLocale),
    createSpecGroupLayoutExample(getLocale),
    createSpecSplitLayoutExample(getLocale),
    createSpecFileControlExample(getLocale),
    createSpecCodeEditorExample(getLocale),
    createSpecColorControlExample(getLocale),
    createSpecPasswordControlExample(getLocale),
    createSpecBooleanControlsExample(getLocale),
    createSpecButtonActionsExample(getLocale),
    createSpecStringControlsExample(getLocale),
    createScalarCompositionExample(),
    createPatternPropertiesExample(),
    createTuplesExample(getLocale),
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
    createJobExample(getLocale),
    createMainExample(getLocale),
    createMonacoEditorExample(),
  ];

  customExamples.push(createTableCellsExample());

  const catalogById = new Map(specCatalog.map((entry) => [entry.id, entry]));
  const sourceById = new Map(specProvenance.imported.map((entry) => [entry.id, entry.source]));
  for (const example of customExamples) {
    if (!example.name.startsWith('spec-')) continue;
    const id = example.name.slice(5);
    const entry = catalogById.get(id);
    const source = sourceById.get(id);
    if (!entry || !source) throw new Error(`Missing spec catalog/provenance entry: ${id}`);
    // Mutate this fresh host example instead of spreading it: spreading would
    // freeze its live i18n getter and trusted host adapters.
    example.label = `Spec: ${entry.title}`;
    example.spec = {
      id,
      revision: specProvenance.revision,
      source,
      hostRequirements: entry.hostRequirements,
    };
  }
  const builtinExamples = getExamples() as DemoExample[];
  const mergedExamples = [...builtinExamples, ...customExamples];
  const uniqueByName = new Map(mergedExamples.map((example) => [example.name, example]));

  return Array.from(uniqueByName.values()).sort((a, b) => a.label.localeCompare(b.label));
};

export const createSkeletonDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('skeleton', getLocale);

export const createFlowbiteDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('flowbite', getLocale);

export const createShadcnDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('shadcn', getLocale);
