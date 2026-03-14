import { describe, expect, it } from 'vitest';
import {
  useOverrideControl,
  withReactiveProps,
  withReactivePropsFrom,
} from '../src/lib/jsonFormsCompositions.svelte.ts';

describe('withReactiveProps', () => {
  it('reflects latest values from source object', () => {
    const source = {
      count: 1,
      label: 'initial',
    };

    const result = withReactiveProps(source);

    expect(result.count).toBe(1);
    expect(result.label).toBe('initial');

    source.count = 2;
    source.label = 'updated';

    expect(result.count).toBe(2);
    expect(result.label).toBe('updated');
  });

  it('applies overrides and removes requested keys', () => {
    const source = {
      keep: 'kept',
      drop: 'removed',
      value: 10,
    };

    const result = withReactiveProps(
      source,
      {
        get doubled() {
          return source.value * 2;
        },
        label: 'override',
      },
      ['drop'],
    );

    expect(result.keep).toBe('kept');
    expect('drop' in result).toBe(false);
    expect(result.label).toBe('override');
    expect(result.doubled).toBe(20);

    source.value = 21;
    expect(result.doubled).toBe(42);
  });
});

describe('withReactivePropsFrom', () => {
  it('keeps the prototype of the current source object', () => {
    const source = {
      value: 5,
    };

    const result = withReactivePropsFrom(() => source);

    expect(Object.getPrototypeOf(result)).toBe(Object.getPrototypeOf(source));
  });
});

describe('useOverrideControl', () => {
  it('returns control with overrides while preserving top-level properties', () => {
    const input = {
      other: 'unchanged',
      control: {
        title: 'Original',
        hidden: true,
      },
    };

    const result = useOverrideControl(
      input,
      {
        title: 'Overridden',
        extra: 'new',
      },
      ['hidden'],
    );

    expect(result.other).toBe('unchanged');
    expect(result.control.title).toBe('Overridden');
    expect(result.control.extra).toBe('new');
    expect('hidden' in result.control).toBe(false);
  });
});
