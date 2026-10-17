import { dataPathToPointer } from '@chobantonov/jsonforms-svelte';
import { onDestroy } from 'svelte';
import { useOwnedErrors } from '@chobantonov/jsonforms-svelte';

/** Selection-time byte metadata only: imported encoded strings are not decoded. */
export function useFileSizeErrors(binding: {
  readonly data: unknown;
  readonly path: string;
  readonly pending: boolean;
  validate: (size: number) => string | null;
}) {
  const owner = useOwnedErrors()?.createOwner();
  onDestroy(() => owner?.dispose());
  let known = $state<{ value: string; size: number }[]>([]);
  let published = '';
  $effect(() => {
    const data = binding.data;
    const values = Array.isArray(data) ? data : [data];
    const errors = values.flatMap((value, index) => {
      const metadata = known.find((entry) => entry.value === value);
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
    const pointer = dataPathToPointer(binding.path);
    const signature = JSON.stringify([pointer, errors, binding.pending]);
    if (signature === published) return;
    published = signature;
    if (!errors.length && !binding.pending) owner?.clear();
    else if (owner) owner.publish(owner.begin(pointer, binding.pending), errors, binding.pending);
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
