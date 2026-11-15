type Control = {
  data: unknown;
  schema: unknown;
  path: string;
  enabled: boolean;
  readonly?: boolean;
};

/** Zag Svelte queues selection callbacks; retain the target of the originating native event. */
export function nativeChoiceEvents(control: () => Control, select: (id: string) => void) {
  let interaction: Pick<Control, 'data' | 'schema' | 'path'> | undefined;
  return {
    capture(event?: Event, callback?: unknown) {
      const { data, schema, path, enabled, readonly } = control();
      interaction = enabled && !readonly ? { data, schema, path } : undefined;
      if (typeof callback === 'function') callback(event);
    },
    change(details: { value: string[] }) {
      const original = interaction;
      interaction = undefined;
      const current = control();
      if (
        !original ||
        !current.enabled ||
        current.readonly ||
        original.path !== current.path ||
        original.schema !== current.schema ||
        !Object.is(original.data, current.data)
      )
        return;
      select(details.value[0] ?? '');
    },
  };
}
