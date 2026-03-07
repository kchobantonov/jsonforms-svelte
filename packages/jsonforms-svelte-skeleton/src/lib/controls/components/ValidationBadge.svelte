<script lang="ts">
  import { useTranslator } from '@chobantonov/jsonforms-svelte';
  import {
    createControlElement,
    createLabelDescriptionFrom,
    type JsonSchema,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';
  import { getPortalRootNodeGetter, getPortalTargetResolver } from '../../util';

  interface Props {
    errors: ErrorObject[];
    border?: boolean;
    color?: 'error' | 'warning' | 'surface';
    children?: Snippet;
    [key: string]: any;
  }

  let { errors, border = false, color = 'error', children, ...rest }: Props = $props();

  const t = useTranslator(true);
  const getRootNode = getPortalRootNodeGetter();
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
  <Tooltip positioning={{ placement: 'top', strategy: 'fixed' }} {getRootNode}>
    <Tooltip.Trigger class="relative inline-flex" {...rest}>
      <span
        class={`absolute -top-1.5 -end-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ${color === 'warning' ? 'preset-filled-warning-500' : color === 'surface' ? 'preset-filled-surface-500' : 'preset-filled-error-500'} ${border ? 'ring-surface-50-950 ring-2' : ''}`}
      >
        {errors.length}
      </span>
      {@render children?.()}
    </Tooltip.Trigger>
    <Portal target={portalTarget}>
      <Tooltip.Context>
        {#snippet children(tooltip)}
          <div {...tooltip().getPositionerProps()}>
            <Tooltip.Content
              class="card preset-filled-surface-950-50 max-w-sm space-y-2 p-3 text-sm shadow-xl"
            >
              <p class="font-semibold">
                {t.value ? t.value('Validation Errors', 'Validation Errors') : 'Validation Errors'}
              </p>
              {#each tooltipMessages as message, index (index)}
                <p>{message}</p>
              {/each}
            </Tooltip.Content>
          </div>
        {/snippet}
      </Tooltip.Context>
    </Portal>
  </Tooltip>
{:else}
  {@render children?.()}
{/if}
