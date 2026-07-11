<script lang="ts">
  import { useTranslator } from '@chobantonov/jsonforms-svelte';
  import {
    createControlElement,
    createLabelDescriptionFrom,
    type JsonSchema,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import type { Snippet } from 'svelte';
  import { getPortalTargetResolver } from '../../util';

  interface Props {
    errors: ErrorObject[];
    border?: boolean;
    color?: 'error' | 'warning' | 'surface';
    children?: Snippet;
    [key: string]: any;
  }

  let { errors, border = false, color = 'error', children, ...rest }: Props = $props();

  const t = useTranslator(true);
  const resolvePortalTarget = getPortalTargetResolver();
  let portalTarget = $state<HTMLElement | undefined>(undefined);

  $effect(() => {
    portalTarget = resolvePortalTarget() ?? undefined;

    if (!portalTarget) {
      queueMicrotask(() => {
        portalTarget = resolvePortalTarget() ?? undefined;
      });
    }
  });

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
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger class="relative inline-flex" {...rest}>
        <span
          class={`absolute -end-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ${color === 'warning' ? 'bg-amber-500 text-white' : color === 'surface' ? 'bg-muted text-muted-foreground' : 'bg-destructive text-white'} ${border ? 'ring-background ring-2' : ''}`}
        >
          {errors.length}
        </span>
        {@render children?.()}
      </Tooltip.Trigger>
      <Tooltip.Content
        portalProps={{ to: portalTarget }}
        class="max-w-sm flex-col items-start space-y-2 p-3 text-sm shadow-xl"
      >
        <p class="font-semibold">
          {t.value ? t.value('Validation Errors', 'Validation Errors') : 'Validation Errors'}
        </p>
        {#each tooltipMessages as message, index (index)}
          <p>{message}</p>
        {/each}
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{:else}
  {@render children?.()}
{/if}
