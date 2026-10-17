# Svelte template profiles

Reference: spec `f0183923295c495c60024fddca58dbe99e82e816`, §§13.4–13.5; React `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`.

## Named Template and Slot

Named templates use the first exact, case-sensitive `entry.uischema.name` match. Registry testers are not called. Missing and duplicate names produce author diagnostics; missing names render no substituted content. A same-path ancestry guard stops recursive expansion without blocking independent sibling reuse. Supplied slot names override inherited names; later supplied children win. Only the first fallback child is rendered. Slot names are literal own properties, including names such as `__proto__`.

The canonical `spec-template-slots` fixture has unchanged JSON, a trusted TypeScript registry adapter and EN/BG catalog annotations. All six native and 12 production family/locale/host cases pass for fallback, inherited content, local overrides and shared caller data.

## String TemplateLayout

The default registry implements Ractive. Language selection uses explicit `lang`, then `config.jsonformsExtended.defaultTemplateLang`, the legacy flat setting, and finally `ractive`. Unsupported languages receive a translated diagnostic at rank 1, so a separately registered engine with a higher rank can handle them. JSX is currently unsupported by the default Svelte registry; importing the canonical fixture does not imply JSX parity.

Runtime source evaluation requires host script permission. Ractive loads when an allowed template first becomes visible. A late engine result cannot render after teardown or permission revocation. Loading and template execution failures have separate headings. Data, schema errors, host context and translations stay live. Changes to ordinary data preserve mounted template DOM; changes to source or slot names rebuild it.

Explicit child names are reserved before decimal names are assigned to unnamed children. Duplicate explicit names are diagnosed and retain the first child. A placeholder delegates the actual UI element at the caller's schema and path. Literal names are encoded through DOM attributes when generating placeholders.

The `errors` binding contains core schema errors. It is not combined form validity. Host additional errors remain available through `context.additionalErrors`.

## Compiled Svelte components

Trusted host code supplies `defineNativeTemplate(Component)` as `TemplateLayout.template`. The mounting adapter keeps the component in its compiling runtime and delegated slots in the renderer runtime. It uses public Svelte mount/unmount APIs and supports independently bundled Web Components. Direct components are also accepted when they share the renderer’s Svelte runtime. This profile uses no runtime source compiler and does not require script evaluation permission. The shared registry supplies it at rank 3.

```svelte
<script lang="ts">
  import type { NativeTemplateProps } from '@chobantonov/jsonforms-svelte-extended';
  const { data, Slot, translate }: NativeTemplateProps<{ name: string }> = $props();
</script>

<p>{data.name}</p>
<Slot name="note" />
<Slot name="optional"><p>{translate('template.optionalFallback')}</p></Slot>
```

Register the component in trusted host code:

```ts
import { defineNativeTemplate } from '@chobantonov/jsonforms-svelte-extended';
import RegistrationTemplate from './RegistrationTemplate.svelte';

const layout = {
  type: 'TemplateLayout',
  template: defineNativeTemplate(RegistrationTemplate),
  elements: [{ type: 'Control', scope: '#/properties/note', name: 'note' }],
};
```

The props are `data`, `errors`, `context`, `elements`, `schema`, `path`, `enabled`, `readonly`, `translate`, `urlPolicy` and `Slot`. Readonly and disabled state remain distinct. Unknown slots diagnose `template.unknownSlot` and render their supplied fallback. This is a Svelte component contract; React template callbacks are not interchangeable with it.

A compiled component and its mounting adapter have no JSON representation. The demo appends its native example in trusted TypeScript; JSON editors omit the compiled component. Restore it through host registration, not evaluated JSON source. All 12 EN/BG production cases pass across three families and native/Web Component hosts. Direct cross-runtime component invocation is not supported.

## Verification scope

The shared template checkpoint passes 26 cases for language selection, native bindings, slot composition, diagnostics and engine lifecycle. The two canonical fixtures pass 12 EN/BG native family cases. The final engine-loading type refinement and production profile build are tracked in the verification baseline. The Svelte profile intentionally supports compiled Svelte components in place of React JSX callbacks, as permitted by §13.5. Broader keyboard and visual acceptance remain open.

## Template bindings and URL ownership

Ractive receives cloned data and schema-error snapshots with automatic two-way binding disabled. Template-local bindings cannot silently mutate form data. Delegated renderers retain the normal JSONForms change, readonly and validation behavior. Runtime expressions, events and raw HTML belong to the trusted script-enabled profile; this is not an HTML sandbox.

Owned template URL attributes are checked after rendering and local template updates. Refused attributes produce `template.urlRefused` without exposing their values. Image data URLs require the image-specific opt-in; mixed `srcset` and `ping` lists are refused if any candidate is disallowed. New-window links receive `noopener noreferrer`. Like React Ractive, post-render checks cannot prevent a resource request already started by the browser.

Delegated renderer roots are excluded from template URL rewriting and slot discovery. Repeated placeholders keep their renderer identity when another placeholder is removed. Compiled Svelte components receive the live resolved `urlPolicy`; trusted component code must apply it to URLs it creates, matching the React compiled-template contract.

## Data inside isolated editors

Templates and labels read the current JSON Forms context (`core.data`), matching
React. A literal-property editor is rooted at the selected value, with `scope: "#"`
and an empty data path. Its templates see that value as their form data. Ordinary
nested controls continue to see the containing form's data.

Detail dialogs clone the current context's data when opened. Edits and validation
stay in that draft; Cancel restores the live context, and Apply writes only the
selected value while preserving current siblings. There is no separate data
projection context or public FormDocument/FormDataIsolation API.

Svelte's adapter retains reactive context getters and dispatch interception. It
also preserves existing required presentation and maps parent and renderer-owned
errors across the literal-key boundary. These avoid regressions in the declared
literal-property support; they do not introduce another form data model.

Browser regressions cover labels/search and delegated slot inputs in all three
template profiles, including external parent replacement, Cancel and Apply.
Broader rule/error-context acceptance remains tracked under P1.3.
