<script lang="ts">
  import { useTranslator } from '@chobantonov/jsonforms-svelte';
  import {
    createControlElement,
    createLabelDescriptionFrom,
    type JsonSchema,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { Indicator, P, Popover, Span, type BadgeProps } from 'flowbite-svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
    errors: ErrorObject[];
    border?: boolean;
    color?: BadgeProps['color'];
    children: Snippet;
  }

  let { errors, border = false, color = 'red', children, ...rest }: Props = $props();

  const t = useTranslator(true);

  const tooltipMessages = $derived.by(() => {
    const errorMap: {
      instancePath: string;
      schemaPath: string;
      labels: (string | undefined)[];
      message: string;
    }[] = [];

    for (const e of errors) {
      const errorObject = e as ErrorObject;
      const index = errorMap.findIndex((err) => err.schemaPath === errorObject.schemaPath);

      if (errorObject.message) {
        if (index === -1) {
          errorMap.push({
            schemaPath: errorObject.schemaPath,
            instancePath: errorObject.instancePath,
            labels: [
              createLabelDescriptionFrom(
                createControlElement(errorObject.instancePath),
                errorObject.schema as JsonSchema,
              ).text,
            ],
            message: errorObject.message,
          });
        } else {
          errorMap[index].labels.push(
            createLabelDescriptionFrom(
              createControlElement(errorObject.instancePath),
              errorObject.schema as JsonSchema,
            ).text,
          );
        }
      }
    }

    return errorMap.map((v) => v.labels.join(',') + ': ' + v.message);
  });
</script>

{#if errors.length > 0}
  <div class="relative" {...rest}>
    <Indicator {color} {border} placement="top-right" class="font-bold">
      <Span class="text-xs font-bold text-white">{errors.length}</Span>
    </Indicator>
    {@render children()}
    <Popover
      title={t.value ? t.value('Validation Errors', 'Validation Errors') : 'Validation Errors'}
    >
      {#each tooltipMessages as message, index (index)}
        <P class="mb-0">
          {message}
        </P>
      {/each}
    </Popover>
  </div>
{:else}
  {@render children()}
{/if}
