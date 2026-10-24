import { expect, it, vi } from 'vite-plus/test';
import { flushSync } from 'svelte';
import type { Translator } from '@jsonforms/core';
import { serverErrorSubject, useDemoServerErrors } from './server-errors.svelte';
import type { DemoActionEvent } from './actions';

it('reads literal JSON Pointer keys without traversing inherited properties', () => {
  const data = JSON.parse('{"":{"a.b":{"x/y":{"~key":4}}},"__proto__":5}');
  expect(serverErrorSubject(data, '')).toBe(data);
  expect(serverErrorSubject(data, '/')).toEqual(data['']);
  expect(serverErrorSubject(data, '//a.b/x~1y/~0key')).toBe(4);
  expect(serverErrorSubject(data, '/__proto__')).toBe(5);
  expect(serverErrorSubject(data, '/toString')).toBeUndefined();
});

it('clears only changed field errors, translates live, and resets between examples', async () => {
  let data = $state({ contact: { email: 'same', phone: '123' } });
  let example = $state('spec-additional-errors');
  let translate = $state<Translator | undefined>();
  const setEmail = (value: string) => {
    data.contact.email = value;
  };
  let store!: ReturnType<typeof useDemoServerErrors>;
  const dispose = $effect.root(() => {
    store = useDemoServerErrors({
      get data() {
        return data;
      },
      get example() {
        return example;
      },
      get translate() {
        return translate;
      },
    });
  });
  flushSync();
  const errors = ['email', 'phone'].map((field) => ({
    keyword: 'server',
    schemaPath: '',
    instancePath: `/contact/${field}`,
    params: { i18n: `server.${field}` },
    message: field,
  }));
  const action = (action: string): DemoActionEvent => ({
    action,
    params: { errors },
    context: {},
    $el: document.createElement('button'),
  });
  try {
    store.handle(action('reportServer'));
    expect(store.errors).toHaveLength(2);
    data = { contact: { email: 'same', phone: '123' } };
    flushSync();
    expect(store.errors).toHaveLength(2);
    setEmail('changed');
    await vi.waitFor(() => expect(store.errors).toHaveLength(1));
    expect(store.errors[0].instancePath).toBe('/contact/phone');
    translate = ((key) => `translated:${key}`) as Translator;
    expect(store.errors[0].message).toBe('translated:server.phone');
    setEmail('same');
    flushSync();
    expect(store.errors).toHaveLength(1);
    store.handle(action('clearServer'));
    expect(store.errors).toEqual([]);
    store.handle(action('reportServer'));
    example = 'another-example';
    await vi.waitFor(() => expect(store.errors).toEqual([]));
    store.handle(action('reportServer'));
    expect(store.errors).toEqual([]);
  } finally {
    dispose();
  }
});
