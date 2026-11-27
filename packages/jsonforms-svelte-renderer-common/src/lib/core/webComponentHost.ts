import type { JsonSchema } from '@jsonforms/core';
import type { JsonFormsChangeEvent } from '@chobantonov/jsonforms-svelte';
import type { UIDiagnostic } from '../validation/authorDiagnostic.svelte';
import type { JsonFormsValidityEvent } from '../validation/ownedErrors';

export type JsonInput = unknown;

export const dispatchHostEvent = <T>(
  host: EventTarget | null | undefined,
  type: string,
  detail: T,
): boolean => {
  if (!(host instanceof EventTarget)) {
    return false;
  }

  return host.dispatchEvent(
    new CustomEvent<T>(type, {
      detail,
      bubbles: true,
      composed: true,
    }),
  );
};

export const parseJson = <T>(value: JsonInput, fallback: T): T => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const parseBoolean = (value: boolean | string, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return fallback;
};

export const parseMode = (value: boolean | string): 'dark' | 'light' | 'system' => {
  if (typeof value === 'boolean') {
    return value ? 'dark' : 'light';
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === 'dark') return 'dark';
  if (normalized === 'false' || normalized === 'light') return 'light';
  if (normalized === 'system' || normalized === 'auto') return 'system';
  return 'system';
};

export function parseHostData(value: JsonInput) {
  return typeof value === 'string' ? parseJson(value, value) : value;
}

export function parseHostSchemas(value: JsonInput): (JsonSchema | boolean)[] {
  const schemas = parseJson<unknown>(value, []);
  return Array.isArray(schemas)
    ? schemas.filter(
        (schema): schema is JsonSchema | boolean =>
          typeof schema === 'boolean' ||
          (schema !== null && typeof schema === 'object' && !Array.isArray(schema)),
      )
    : [];
}

export function createHostEventHandlers(
  element: HTMLElement,
  eventTarget: () => Element | null = () => element,
) {
  let firstChangeDispatched = false;
  function dispatch(type: string, detail: unknown) {
    const host = eventTarget();
    dispatchHostEvent(host instanceof HTMLElement ? host : null, type, detail);
  }
  return {
    handleChange(event: JsonFormsChangeEvent) {
      if (firstChangeDispatched) dispatch('change', event);
      else {
        // Initial upgrade can precede the host attaching its listeners.
        firstChangeDispatched = true;
        setTimeout(() => dispatch('change', event), 0);
      }
    },
    handleValidityChange(event: JsonFormsValidityEvent) {
      dispatch('validity-change', event);
    },
    handleDiagnostic(diagnostic: UIDiagnostic) {
      dispatchHostEvent(element instanceof HTMLElement ? element : null, 'diagnostic', diagnostic);
    },
    async handleAction(event: object) {
      dispatch('handle-action', event);
      if ('hostActionCompletion' in event) await event.hostActionCompletion;
    },
  };
}

export function syncShadowStyles(
  root: Node | undefined,
  baseId: string,
  baseCss: string,
  customId: string,
  customCss: string,
) {
  if (!(root instanceof ShadowRoot)) return;
  let base = root.getElementById(baseId);
  if (!base) {
    base = document.createElement('style');
    base.id = baseId;
    root.prepend(base);
  }
  if (base.textContent !== baseCss) base.textContent = baseCss;
  let custom = root.getElementById(customId);
  if (!customCss) {
    custom?.remove();
    return;
  }
  if (!custom) {
    custom = document.createElement('style');
    custom.id = customId;
    root.append(custom);
  }
  if (custom.textContent !== customCss) custom.textContent = customCss;
}

/** Portals may be mounted outside the themed wrapper in the same shadow root. */
export function hostThemeSelectors(css: string) {
  return css.replace(/(^|,)\s*(\[data-theme=[^\]]+\])/gm, '$1 :host($2), $2');
}
export function hostThemeName(theme: unknown, fallback: string) {
  return typeof theme === 'string' && theme.trim() ? theme.trim() : fallback;
}
