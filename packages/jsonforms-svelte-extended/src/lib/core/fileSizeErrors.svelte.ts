import { dataPathToPointer } from '@chobantonov/jsonforms-svelte';
import { onDestroy, tick } from 'svelte';
import { useOwnedErrors } from '@chobantonov/jsonforms-svelte';

/** Selection-time byte metadata only: imported encoded strings are not decoded. */
export function useFileSizeErrors(binding: {
  readonly data: unknown;
  readonly path: string;
  readonly pathSegments?: readonly string[];
  readonly pending: boolean;
  validate: (size: number) => string | null;
}) {
  const owner = useOwnedErrors()?.createOwner();
  let active = true;
  let revision = 0;
  onDestroy(() => {
    active = false;
    owner?.dispose();
  });
  let known = $state<{ value: string; size: number }[]>([]);
  let published = '';
  $effect(() => {
    const data = binding.data;
    const values = Array.isArray(data) ? data : [data];
    // Once a value leaves this control, later imported data is a new subject.
    // Do not resurrect selection-time byte metadata merely by string equality.
    const retained = known.filter((entry) => values.includes(entry.value));
    const errors = values.flatMap((value, index) => {
      const metadata = retained.find((entry) => entry.value === value);
      const message = metadata ? binding.validate(metadata.size) : null;
      return message !== null
        ? [
            {
              keyword: 'fileSize',
              instancePath: Array.isArray(data) ? `/${index}` : '',
              schemaPath: '',
              params: { size: metadata!.size },
              message,
            },
          ]
        : [];
    });
    const pointer = dataPathToPointer(binding.pathSegments ?? binding.path);
    const pending = binding.pending;
    const signature = JSON.stringify([pointer, errors, pending]);
    const version = ++revision;
    // A keyed collection move can update core data before its delegated path.
    // Prune selection metadata only after both refer to the settled occurrence.
    void tick().then(() => {
      if (!active || version !== revision) return;
      if (retained.length !== known.length) known = retained;
      if (signature === published) return;
      published = signature;
      if (!errors.length && !pending) owner?.clear();
      else if (owner) owner.publish(owner.begin(pointer, pending), errors, pending);
    });
  });
  return {
    remember(values: readonly string[], files: readonly { size: number }[]) {
      const current = Array.isArray(binding.data) ? binding.data : [binding.data];
      known = [
        ...known.filter((entry) => current.includes(entry.value) && !values.includes(entry.value)),
        ...values.map((value, index) => ({ value, size: files[index].size })),
      ];
    },
  };
}
