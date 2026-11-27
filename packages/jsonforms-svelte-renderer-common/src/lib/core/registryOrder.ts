/** Keep tester precedence consistent across renderer sets, including ties in rank. */
function registryOrder<K extends string>(...keys: K[]) {
  return <T extends Record<K, unknown>>(entries: T): T[K][] => keys.map((key) => entries[key]);
}

export const cellRegistry = registryOrder(
  'anyOfStringOrEnumCellEntry',
  'booleanToggleCellEntry',
  'multiStringCellEntry',
  'oneOfRadioGroupCellEntry',
  'passwordCellEntry',
  'radioGroupCellEntry',
  'sliderCellEntry',
  'stringMaskCellEntry',
  'booleanCellEntry',
  'dateCellEntry',
  'dateTimeCellEntry',
  'enumCellEntry',
  'integerCellEntry',
  'numberCellEntry',
  'numberFormatCellEntry',
  'oneOfEnumCellEntry',
  'textCellEntry',
  'timeCellEntry',
  'compositeCellEntry',
);

export const controlRegistry = registryOrder(
  'anyOfStringOrEnumControlRendererEntry',
  'booleanControlRendererEntry',
  'booleanToggleControlRendererEntry',
  'dateControlRendererEntry',
  'dateTimeControlRendererEntry',
  'enumControlRendererEntry',
  'integerControlRendererEntry',
  'multiStringControlRendererEntry',
  'numberControlRendererEntry',
  'oneOfEnumControlRendererEntry',
  'oneOfRadioGroupControlRendererEntry',
  'passwordControlRendererEntry',
  'radioGroupControlRendererEntry',
  'sliderControlRendererEntry',
  'stringControlRendererEntry',
  'stringMaskControlRendererEntry',
  'timeControlRendererEntry',
);

export const complexRegistry = registryOrder(
  'recursiveTreeRendererEntry',
  'arrayChoicesRendererEntry',
  'choiceCardsRendererEntry',
  'tupleControlRendererEntry',
  'allOfRendererEntry',
  'anyOfRendererEntry',
  'arrayControlRendererEntry',
  'enumArrayRendererEntry',
  'objectRendererEntry',
  'oneOfRendererEntry',
  'mixedRendererEntry',
);

export const layoutRegistry = registryOrder(
  'categorizationAccordionEntry',
  'arrayLayoutRendererEntry',
  'layoutRendererEntry',
  'groupRendererEntry',
  'categorizationEntry',
  'categorizationStepperEntry',
);

export const additionalRegistry = registryOrder(
  'separatorRendererEntry',
  'spacerRendererEntry',
  'imageViewRendererEntry',
  'labelRendererEntry',
  'listWithDetailRendererEntry',
);
