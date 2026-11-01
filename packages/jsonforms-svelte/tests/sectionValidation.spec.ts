import type { ErrorObject } from 'ajv';
import type { UISchemaElement } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import { sectionValidation } from '../src/lib/sectionValidation';

const section = { type: 'Group' } as UISchemaElement;
const config = { jsonformsExtended: { showValidationIndicator: true } };
const error = (instancePath: string): ErrorObject => ({
  instancePath,
  schemaPath: '#/test',
  keyword: 'test',
  params: {},
  message: 'Invalid',
});

it('indexes normalized ancestor paths and refreshes when error results or display mode change', () => {
  const core = { errors: [error('/employees/10/name')], additionalErrors: [] as ErrorObject[] };
  expect(sectionValidation(core, [], section, config, [['employees', '1']]).show).toBe(false);
  expect(sectionValidation(core, [], section, config, [['employees', '10']]).show).toBe(true);

  core.errors = [
    {
      ...error('/employees/10'),
      keyword: 'required',
      params: { missingProperty: 'name' },
    },
  ];
  expect(sectionValidation(core, [], section, config, [['employees', '10', 'name']]).show).toBe(
    true,
  );
  const visible = { ...core, validationMode: 'ValidateAndHide' };
  expect(sectionValidation(visible, [], section, config, [['employees', '10']]).show).toBe(false);
  visible.additionalErrors = [error('/employees/10/name')];
  expect(sectionValidation(visible, [], section, config, [['employees', '10']]).show).toBe(true);
  expect(
    sectionValidation(
      visible,
      [],
      section,
      {
        jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
      },
      [
        ['employees', '10'],
        ['employees', '10', 'name'],
      ],
    ),
  ).toEqual({ show: true, count: 1 });
});

it('builds error presence once for many containers sharing a validation result', () => {
  let pathReads = 0;
  const errors = Array.from({ length: 200 }, (_, index) => ({
    ...error(''),
    get instancePath() {
      pathReads++;
      return `/fields/${index}/name`;
    },
  })) as ErrorObject[];
  const core = { errors };
  for (let index = 0; index < 242; index++) {
    expect(sectionValidation(core, [], section, config, [['fields', String(index)]]).show).toBe(
      index < 200,
    );
  }
  expect(pathReads).toBeLessThan(600);
});
