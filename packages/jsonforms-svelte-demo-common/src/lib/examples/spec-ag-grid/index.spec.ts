import { expect, it } from 'vitest';
import { createSpecAgGridExample } from './index';
import sourceUi from './uischema.json';
import data from './data.json';

it('preserves canonical pagination and native overrides while translating native headers live', () => {
  let locale = 'en';
  const example = createSpecAgGridExample(() => locale);
  const ui = example.uischema as unknown as typeof sourceUi;
  expect(example.data).toEqual(data);
  type NativeOptions = {
    agGridOptions: {
      paginationPageSize: number;
      columnDefs: { headerName: string; headerValueGetter: () => string }[];
    };
  };
  const options = ui.elements[5].elements[1].options as unknown as NativeOptions;
  expect(options.agGridOptions?.paginationPageSize).toBe(2);
  const group = options.agGridOptions!.columnDefs![0] as unknown as {
    headerName: string;
    headerValueGetter: () => string;
  };
  expect(group.headerName).toBe('Applicant');
  expect(group.headerValueGetter()).toBe('Applicant');
  locale = 'bg';
  expect(group.headerValueGetter()).toBe('Кандидат');
  expect(example.i18n?.translate?.('applicants.contact.city.label', '')).toBe('Град');
  expect(example.i18n?.translate?.('applicants.contact.phone.label', '')).toBe('Телефон');
  expect(
    (sourceUi.elements[5].elements[1].options as unknown as NativeOptions).agGridOptions
      .columnDefs[0],
  ).not.toHaveProperty('headerValueGetter');
});
