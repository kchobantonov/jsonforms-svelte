import { describe, expect, it } from 'vitest';
import { createAgGridExample } from './index.js';

describe('AG Grid demo example', () => {
  it('owns its schema and example data', () => {
    const agGrid = createAgGridExample();
    const people = (agGrid.data as any).people;

    expect(agGrid.name).toBe('ag-grid');
    expect(people).toHaveLength(2);
    expect(people[0]).toMatchObject({
      firstName: 'Ada',
      role: 'Researcher',
      favoriteColor: '#7c3aed',
      active: true,
    });
    expect(people[1]).toMatchObject({
      firstName: 'Grace',
      role: 'Leader',
      favoriteColor: '#0ea5e9cc',
      active: false,
    });
  });

  it('includes date, time, date-time, enum, and composite cells', () => {
    const example = createAgGridExample();
    const itemProperties = (example.schema as any).properties.people.items.properties;
    const control = (example.uischema as any).elements[0];
    const fields = control.options.agGridOptions.columnDefs.map(
      (column: { field: string }) => column.field,
    );

    expect(itemProperties.date.format).toBe('date');
    expect(itemProperties.time.format).toBe('time');
    expect(itemProperties.dateTime.format).toBe('date-time');
    expect(itemProperties.role.enum).toEqual(['Engineer', 'Researcher', 'Leader']);
    expect(fields).toEqual(
      expect.arrayContaining(['date', 'time', 'dateTime', 'role', 'address', 'phoneNumbers']),
    );
  });
});
