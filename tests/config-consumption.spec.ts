import { existsSync } from 'node:fs';
import { expect, it } from 'vite-plus/test';
import inventory from './fixtures/spec-conformance/config-consumption.json';
import additions from './fixtures/spec-conformance/svelte-config-additions.json';
import review from './fixtures/spec-conformance/svelte-config-review.json';
import disclosureReview from './fixtures/spec-conformance/svelte-config-review-disclosure.json';
import collectionReview from './fixtures/spec-conformance/svelte-config-review-collection.json';
import radioReview from './fixtures/spec-conformance/svelte-config-review-radio.json';
import monacoReview from './fixtures/spec-conformance/svelte-config-review-monaco.json';
import sortReview from './fixtures/spec-conformance/svelte-config-review-sort.json';
import additionalNamesReview from './fixtures/spec-conformance/svelte-config-review-additional-names.json';
import readonlyReview from './fixtures/spec-conformance/svelte-config-review-readonly.json';
import fieldPresentationReview from './fixtures/spec-conformance/svelte-config-review-field-presentation.json';
import suggestionsReview from './fixtures/spec-conformance/svelte-config-review-suggestions.json';
import multilineReview from './fixtures/spec-conformance/svelte-config-review-multiline.json';
import textBasicsReview from './fixtures/spec-conformance/svelte-config-review-text-basics.json';
import autocompleteReview from './fixtures/spec-conformance/svelte-config-review-autocomplete.json';
import temporalReview from './fixtures/spec-conformance/svelte-config-review-temporal.json';
import restrictReview from './fixtures/spec-conformance/svelte-config-review-restrict.json';
import showActionsReview from './fixtures/spec-conformance/svelte-config-review-show-actions.json';
import actionLabelsReview from './fixtures/spec-conformance/svelte-config-review-action-labels.json';
import compositeActionsReview from './fixtures/spec-conformance/svelte-config-review-composite-actions.json';
import collectionPermissionsReview from './fixtures/spec-conformance/svelte-config-review-collection-permissions.json';
import collapseNewItemsReview from './fixtures/spec-conformance/svelte-config-review-collapse-new-items.json';
import localPresentationReview from './fixtures/spec-conformance/svelte-config-review-local-presentation.json';
import detailOptionsReview from './fixtures/spec-conformance/svelte-config-review-detail-options.json';
import collectionPresentationReview from './fixtures/spec-conformance/svelte-config-review-collection-presentation.json';
import compositePresentationReview from './fixtures/spec-conformance/svelte-config-review-composite-presentation.json';
import preTouchReview from './fixtures/spec-conformance/svelte-config-review-pre-touch.json';
import activeBranchReview from './fixtures/spec-conformance/svelte-config-review-active-branch.json';
import colorReview from './fixtures/spec-conformance/svelte-config-review-color.json';
import stepperReview from './fixtures/spec-conformance/svelte-config-review-stepper.json';
import monacoLanguageReview from './fixtures/spec-conformance/svelte-config-review-monaco-language.json';
import monacoBehaviorReview from './fixtures/spec-conformance/svelte-config-review-monaco-behavior.json';
import focusReview from './fixtures/spec-conformance/svelte-config-review-focus.json';
import monacoDimensionsReview from './fixtures/spec-conformance/svelte-config-review-monaco-dimensions.json';
import heightReview from './fixtures/spec-conformance/svelte-config-review-height.json';
import resizableReview from './fixtures/spec-conformance/svelte-config-review-resizable.json';
import markupReview from './fixtures/spec-conformance/svelte-config-review-markup.json';
import dynamicValuesReview from './fixtures/spec-conformance/svelte-config-review-dynamic-values.json';
import templateLanguageReview from './fixtures/spec-conformance/svelte-config-review-template-language.json';
import agGridOptionsReview from './fixtures/spec-conformance/svelte-config-review-ag-grid-options.json';
import removedAcceptInitialReview from './fixtures/spec-conformance/svelte-config-review-removed-accept-initial.json';
import removedCellsTableReview from './fixtures/spec-conformance/svelte-config-review-removed-cells-table.json';
import namespaceReview from './fixtures/spec-conformance/svelte-config-review-namespace.json';
import monacoAppearanceReview from './fixtures/spec-conformance/svelte-config-review-monaco-appearance.json';
import gapsJson from './fixtures/spec-conformance/svelte-config-gaps.json';
import common from './fixtures/spec-conformance/schemas/jsonforms-config.schema.json';
import extended from './fixtures/spec-conformance/schemas/jsonforms-extended-config.schema.json';
import extendedUi from './fixtures/spec-conformance/schemas/jsonforms-extended-uischema.schema.json';
import ui from './fixtures/spec-conformance/schemas/jsonforms-uischema.schema.json';

const gaps: Array<{ path: string }> = gapsJson;
import localOptions from './fixtures/spec-conformance/svelte-local-option-inventory.json';
import buttonLocalReview from './fixtures/spec-conformance/svelte-local-option-review-button.json';
import categorizationLocalReview from './fixtures/spec-conformance/svelte-local-option-review-categorization.json';
import presentationLocalReview from './fixtures/spec-conformance/svelte-local-option-review-presentation.json';
import listDetailLocalReview from './fixtures/spec-conformance/svelte-local-option-review-list-detail.json';
import layoutLocalReview from './fixtures/spec-conformance/svelte-local-option-review-layout.json';
import controlLayoutLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-layout.json';
import controlTemporalLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-temporal.json';
import controlNumericLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-numeric.json';
import controlMaskLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-mask.json';
import controlHintsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-hints.json';
import controlEditingLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-editing.json';
import controlTextChoiceLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-text-choice.json';
import controlFormatLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-format.json';
import controlChoicePresentationLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-choice-presentation.json';
import controlVariantLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-variant.json';
import controlChoicesLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-choices.json';
import controlConfirmationLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-confirmation.json';
import controlActionPermissionsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-action-permissions.json';
import controlSortActionsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-sort-actions.json';
import controlCompositeClearLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-composite-clear.json';
import controlTupleBorderLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-tuple-border.json';
import controlAdditionalCollectionsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-additional-collections.json';
import controlCollectionPresentationLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-collection-presentation.json';
import controlArrayDisclosureLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-array-disclosure.json';
import controlIndicatorsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-indicators.json';
import controlDataIndicatorLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-data-indicator.json';
import controlNavButtonsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-nav-buttons.json';
import controlItemLabelLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-item-label.json';
import controlSummaryLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-summary.json';
import controlFileBoundsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-file-bounds.json';
import controlPickerActionsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-picker-actions.json';
import controlTableDetailLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-table-detail.json';
import controlValidationPolicyLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-validation-policy.json';
import controlRowDetailLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-row-detail.json';
import controlDialogLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-dialog.json';
import controlTypeDetailsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-type-details.json';
import controlMonacoLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-monaco.json';
import controlMonacoPresentationLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-monaco-presentation.json';
import controlRemainingPresentationsLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-remaining-presentations.json';
import controlGridAndInapplicableLocalReview from './fixtures/spec-conformance/svelte-local-option-review-control-grid-and-inapplicable.json';

type Schema = Record<string, unknown>;

function expandEvidencePath(path: string): string[] {
  const alternatives = /\{([^{}]+)\}/.exec(path);
  if (!alternatives) return [path];
  return alternatives[1]
    .split(',')
    .flatMap((part) =>
      expandEvidencePath(
        path.slice(0, alternatives.index) +
          part +
          path.slice(alternatives.index + alternatives[0].length),
      ),
    );
}

function expectEvidenceFiles(
  items: ReadonlyArray<{ path: string; tests: readonly string[] }>,
): void {
  const missing = items.flatMap((item) =>
    item.tests.flatMap((path) =>
      expandEvidencePath(path)
        .filter((file) => !existsSync(new URL(`../${file}`, import.meta.url)))
        .map((file) => `${item.path}: ${file}`),
    ),
  );
  expect(missing).toEqual([]);
}

const schemas: Record<string, Schema> = {
  'jsonforms-config.schema.json': common,
  'jsonforms-extended-config.schema.json': extended,
  'jsonforms-extended-uischema.schema.json': extendedUi,
  'jsonforms-uischema.schema.json': ui,
};

function resolve(ref: string, source: string): [Schema, string] {
  const [file, pointer = ''] = ref.split('#');
  const target = file || source;
  let value: unknown = schemas[target];
  if (!value) throw new Error(`Unknown schema reference: ${ref}`);
  for (const segment of pointer.split('/').slice(1)) {
    value = (value as Schema)[segment.replaceAll('~1', '/').replaceAll('~0', '~')];
  }
  return [value as Schema, target];
}

function hasPath(node: Schema, file: string, path: string[], seen = new Set<string>()): boolean {
  if (!path.length) return true;
  if (typeof node.$ref === 'string') {
    const key = `${file}:${node.$ref}:${path.join('.')}`;
    if (!seen.has(key)) {
      seen.add(key);
      const [target, targetFile] = resolve(node.$ref, file);
      if (hasPath(target, targetFile, path, seen)) return true;
    }
  }
  for (const branch of (node.allOf as Schema[] | undefined) ?? []) {
    if (hasPath(branch, file, path, seen)) return true;
  }
  const [head, ...tail] = path;
  const properties = node.properties as Record<string, Schema> | undefined;
  const child = head === '*' ? node.additionalProperties : properties?.[head];
  return !!child && typeof child === 'object' && hasPath(child as Schema, file, tail, seen);
}

function declaredPaths(
  node: Schema,
  file: string,
  prefix: string,
  result = new Set<string>(),
  seen = new Set<string>(),
): Set<string> {
  if (typeof node.$ref === 'string') {
    const key = `${file}:${node.$ref}:${prefix}`;
    if (!seen.has(key)) {
      const [target, targetFile] = resolve(node.$ref, file);
      declaredPaths(target, targetFile, prefix, result, new Set([...seen, key]));
    }
  }
  for (const branch of (node.allOf as Schema[] | undefined) ?? []) {
    declaredPaths(branch, file, prefix, result, seen);
  }
  for (const [name, child] of Object.entries((node.properties as Record<string, Schema>) ?? {})) {
    const path = `${prefix}.${name}`;
    result.add(path);
    declaredPaths(child, file, path, result, seen);
  }
  const additional = node.additionalProperties;
  if (additional && typeof additional === 'object' && Object.hasOwn(additional, 'properties')) {
    const path = `${prefix}.*`;
    result.add(path);
    declaredPaths(additional as Schema, file, path, result, seen);
  }
  return result;
}

it('pins distinct canonical config-consumption entries', () => {
  expect(inventory.properties).toHaveLength(144);
  const paths = inventory.properties.map(({ path }) => path);
  expect(new Set(paths).size).toBe(paths.length);
  expect(paths.every((path) => path.startsWith('config.'))).toBe(true);
  expect(paths).toContain('config.restrict');
  expect(paths).not.toContain('config.jsonformsExtended.restrict');
});

it('keeps restrict flat and rejects the former extension setting in the pinned schema', () => {
  const flat = (common.properties as Schema).restrict as Schema;
  const namespaced = (common.$defs as Schema).extended as Schema;
  expect(flat.type).toBe('boolean');
  expect(namespaced.not).toEqual({ required: ['restrict'] });
  expect((namespaced.properties as Schema).restrict).toBeUndefined();
  expect(((extended.$defs as Schema).extendedOnly as Schema).properties).not.toHaveProperty(
    'restrict',
  );
});

it('finds every declared canonical config entry in the pinned schemas', () => {
  const missing = inventory.properties
    .filter(({ declaredAfter }) => declaredAfter)
    .map(({ path }) => path)
    .filter(
      (path) =>
        !hasPath(extended, 'jsonforms-extended-config.schema.json', path.split('.').slice(1)),
    );
  expect(missing).toEqual([]);
});

it('tracks every newly declared config path beyond the canonical inventory', () => {
  const canonical = new Set(inventory.properties.map(({ path }) => path));
  const current = declaredPaths(extended, 'jsonforms-extended-config.schema.json', 'config');
  const unlisted = [...current].filter((path) => !canonical.has(path)).sort();
  expect(unlisted).toEqual(additions.map(({ path }) => path).sort());
  for (const item of additions) {
    expect(item).toMatchObject({
      origin: expect.any(String),
      namespace: expect.any(String),
      type: expect.any(String),
      default: expect.any(String),
      effect: expect.any(String),
      precedence: expect.any(String),
      consumer: expect.any(String),
      tests: expect.any(Array),
      status: expect.stringContaining('reviewed'),
    });
    expect(item.tests.length).toBeGreaterThan(0);
  }
});

const reviewed = [
  ...review,
  ...disclosureReview,
  ...collectionReview,
  ...radioReview,
  ...monacoReview,
  ...sortReview,
  ...additionalNamesReview,
  ...readonlyReview,
  ...fieldPresentationReview,
  ...suggestionsReview,
  ...multilineReview,
  ...textBasicsReview,
  ...autocompleteReview,
  ...temporalReview,
  ...restrictReview,
  ...showActionsReview,
  ...actionLabelsReview,
  ...compositeActionsReview,
  ...collectionPermissionsReview,
  ...collapseNewItemsReview,
  ...localPresentationReview,
  ...detailOptionsReview,
  ...collectionPresentationReview,
  ...compositePresentationReview,
  ...preTouchReview,
  ...activeBranchReview,
  ...colorReview,
  ...stepperReview,
  ...monacoLanguageReview,
  ...monacoBehaviorReview,
  ...focusReview,
  ...monacoDimensionsReview,
  ...heightReview,
  ...resizableReview,
  ...markupReview,
  ...dynamicValuesReview,
  ...templateLanguageReview,
  ...agGridOptionsReview,
  ...removedAcceptInitialReview,
  ...removedCellsTableReview,
  ...namespaceReview,
  ...monacoAppearanceReview,
];

it('keeps reviewed Svelte rows distinct and tied to canonical paths', () => {
  const canonical = new Set(inventory.properties.map(({ path }) => path));
  expect(new Set(reviewed.map(({ path }) => path)).size).toBe(reviewed.length);
  expect(reviewed.filter(({ path }) => canonical.has(path))).toHaveLength(144);
  expect(reviewed.filter(({ path }) => !canonical.has(path)).map(({ path }) => path)).toEqual([
    'config.jsonformsSvelte.layoutDefaults.minItemWidth',
  ]);
  expect(new Set(gaps.map(({ path }) => path)).size).toBe(gaps.length);
  expect(gaps.some(({ path }) => reviewed.some((item) => item.path === path))).toBe(false);
  for (const item of reviewed) {
    expect(
      canonical.has(item.path) ||
        item.path === 'config.jsonformsSvelte.layoutDefaults.minItemWidth',
    ).toBe(true);
    expect(item).toMatchObject({
      namespace: expect.any(String),
      type: expect.any(String),
      default: expect.any(String),
      effect: expect.any(String),
      precedence: expect.any(String),
      consumer: expect.any(String),
      tests: expect.any(Array),
      status: expect.stringContaining('reviewed'),
    });
    expect(item.tests.length).toBeGreaterThan(0);
  }
  for (const item of gaps) {
    expect(canonical.has(item.path)).toBe(true);
    expect(item).toMatchObject({
      namespace: expect.any(String),
      type: expect.any(String),
      default: expect.any(String),
      effect: expect.any(String),
      precedence: expect.any(String),
      consumer: expect.stringContaining('missing:'),
      tests: [],
      status: expect.stringContaining('gap:'),
    });
  }
  expectEvidenceFiles(reviewed);
});

it('reviews every child of the jsonformsExtended namespace container', () => {
  const nested = inventory.properties
    .map(({ path }) => path)
    .filter((path) => path.startsWith('config.jsonformsExtended.'));
  const reviewedPaths = new Set(reviewed.map(({ path }) => path));
  expect(nested.filter((path) => !reviewedPaths.has(path))).toEqual([]);
});

it('keeps the legacy global minimum width outside the portable config schema', () => {
  expect(
    hasPath(extended, 'jsonforms-extended-config.schema.json', [
      'jsonformsExtended',
      'layoutDefaults',
      'minItemWidth',
    ]),
  ).toBe(false);
});

it('tracks every declared option path for each published UI-schema role', () => {
  const roles = new Map<string, Set<string>>();
  for (const file of localOptions.sourceSchemas) {
    const schema = schemas[file];
    const definitions = schema.$defs as Record<string, Schema>;
    for (const [role, definition] of Object.entries(definitions)) {
      if (['element', 'layoutItemOptions', 'monacoOptions'].includes(role)) continue;
      const options = (definition.properties as Record<string, Schema> | undefined)?.options;
      if (!options) continue;
      const paths = roles.get(role) ?? new Set<string>();
      declaredPaths(options, file, 'options', paths);
      roles.set(role, paths);
    }
  }
  expect(Object.keys(localOptions.roles).sort()).toEqual([...roles.keys()].sort());
  for (const [role, paths] of roles) {
    expect(localOptions.roles[role as keyof typeof localOptions.roles]).toEqual([...paths].sort());
  }
});

it('ties reviewed local options to declared role paths and complete evidence', () => {
  const reviewed = [
    ...buttonLocalReview,
    ...categorizationLocalReview,
    ...presentationLocalReview,
    ...listDetailLocalReview,
    ...layoutLocalReview,
    ...controlLayoutLocalReview,
    ...controlTemporalLocalReview,
    ...controlNumericLocalReview,
    ...controlMaskLocalReview,
    ...controlHintsLocalReview,
    ...controlEditingLocalReview,
    ...controlTextChoiceLocalReview,
    ...controlFormatLocalReview,
    ...controlChoicePresentationLocalReview,
    ...controlVariantLocalReview,
    ...controlChoicesLocalReview,
    ...controlConfirmationLocalReview,
    ...controlActionPermissionsLocalReview,
    ...controlSortActionsLocalReview,
    ...controlCompositeClearLocalReview,
    ...controlTupleBorderLocalReview,
    ...controlAdditionalCollectionsLocalReview,
    ...controlCollectionPresentationLocalReview,
    ...controlArrayDisclosureLocalReview,
    ...controlIndicatorsLocalReview,
    ...controlDataIndicatorLocalReview,
    ...controlNavButtonsLocalReview,
    ...controlItemLabelLocalReview,
    ...controlSummaryLocalReview,
    ...controlFileBoundsLocalReview,
    ...controlPickerActionsLocalReview,
    ...controlTableDetailLocalReview,
    ...controlValidationPolicyLocalReview,
    ...controlRowDetailLocalReview,
    ...controlDialogLocalReview,
    ...controlTypeDetailsLocalReview,
    ...controlMonacoLocalReview,
    ...controlMonacoPresentationLocalReview,
    ...controlRemainingPresentationsLocalReview,
    ...controlGridAndInapplicableLocalReview,
  ];
  expect(reviewed).toHaveLength(177);
  const keys = reviewed.map(({ role, path }) => `${role}:${path}`);
  expect(new Set(keys).size).toBe(keys.length);
  for (const item of reviewed) {
    expect(localOptions.roles[item.role as keyof typeof localOptions.roles]).toContain(item.path);
    expect(item).toMatchObject({
      namespace: expect.any(String),
      type: expect.any(String),
      default: expect.any(String),
      effect: expect.any(String),
      precedence: expect.any(String),
      consumer: expect.any(String),
      tests: expect.any(Array),
      status: expect.stringContaining('reviewed'),
    });
    expect(item.tests.length).toBeGreaterThan(0);
  }
  expectEvidenceFiles(reviewed);
  for (const role of [
    'button',
    'categorization',
    'imageView',
    'label',
    'listWithDetail',
    'group',
    'horizontalLayout',
    'layout',
    'separator',
  ] as const) {
    expect(keys.filter((key) => key.startsWith(`${role}:`)).sort()).toEqual(
      localOptions.roles[role].map((path) => `${role}:${path}`).sort(),
    );
  }
  expect(keys.filter((key) => key.startsWith('control:')).sort()).toEqual(
    [
      'layout',
      'layout.span',
      'layout.weight',
      'layout.width',
      'layout.height',
      'layout.minWidth',
      'layout.maxWidth',
      'layout.minHeight',
      'layout.maxHeight',
      'ampm',
      'dateFormat',
      'dateSaveFormat',
      'dateTimeFormat',
      'dateTimeSaveFormat',
      'timeFormat',
      'timeSaveFormat',
      'views',
      'slider',
      'step',
      'mask',
      'returnMaskedValue',
      'tokens',
      'tokensReplace',
      'eager',
      'reversed',
      'placeholder',
      'hideRequiredAsterisk',
      'showUnfocusedDescription',
      'focus',
      'clearable',
      'readonly',
      'restrict',
      'multi',
      'suggestion',
      'autocomplete',
      'format',
      'table',
      'detail',
      'enableFilterErrorsBeforeTouch',
      'filterErrorKeywordsBeforeTouch',
      'validateActiveBranch',
      'propagateErrors',
      'rowDetail',
      'rowDetail.presentation',
      'rowDetail.placement',
      'rowDetail.resizable',
      'rowDetail.collapsed',
      'rowDetail.detail',
      'rowDetail.dialog',
      'rowDetail.dialog.width',
      'rowDetail.dialog.height',
      'rowDetail.dialog.maximizable',
      'rowDetail.dialog.draggable',
      'rowDetail.dialog.resizable',
      'dialog',
      'dialog.width',
      'dialog.height',
      'dialog.maximizable',
      'dialog.draggable',
      'dialog.resizable',
      'array-detail',
      'boolean-detail',
      'integer-detail',
      'null-detail',
      'number-detail',
      'object-detail',
      'string-detail',
      'monaco',
      'monaco.autoGrow',
      'monaco.initActions',
      'monaco.maxRows',
      'monaco.minRows',
      'monaco.options',
      'monaco.rows',
      ':language',
      'convertJson',
      'height',
      'language',
      'mode',
      'theme',
      'width',
      'colorSaveFormat',
      'colorTextEntry',
      'conditionalFields',
      'recursiveTree',
      'recursiveTree.childrenProperty',
      'recursiveTree.detail',
      'recursiveTree.labelProperty',
      'structuredLayout',
      'agGridOptions',
      'cells',
      'columnDefs',
      'components',
      'interpolate',
      'toggle',
      'vertical',
      'showRadio',
      'variant',
      'choices',
      'confirmation',
      'confirmation.typeChange',
      'confirmation.branchChange',
      'confirmation.delete',
      'disableAdd',
      'disableRemove',
      'showSortButtons',
      'showEmptyButton',
      'emptyLabel',
      'showBorder',
      'additionalProperties',
      'additionalProperties.pagination',
      'additionalItems',
      'additionalItems.pagination',
      'allowAdditionalPropertiesIfMissing',
      'allowEmptyPropertyNames',
      'pagination',
      'hideAvatar',
      'hideArraySummaryValidation',
      'collapsed',
      'collapsible',
      'collapseNewItems',
      'showValidationIndicator',
      'showValidationIndicatorCount',
      'showTypeIndicator',
      'showDataIndicator',
      'showNavButtons',
      'elementLabelProp',
      'summary',
      'summary.type',
      'summary.scope',
      'formatMinimum',
      'formatExclusiveMinimum',
      'formatMaximum',
      'formatExclusiveMaximum',
      'showActions',
      'okLabel',
      'cancelLabel',
    ]
      .map((path) => `control:options.${path}`)
      .sort(),
  );
});
