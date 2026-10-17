# Native choice selectors

The native libraries remain responsible for selection, keyboard behavior and
popup rendering. Messages come from the shared JSON catalog and host translator;
renderers do not choose languages themselves.

## Flowbite

The installed Flowbite 1.33.1 `Select.svelte` exposes `placeholder`, `onClear` and
`elementRef`. Its embedded CloseButton has a hardcoded accessible label and no
label hook. The private `LocalizedSelect` composition keeps the native Select
and adds a native CloseButton with a translated label, logical inline-end
positioning, disabled guard and focus restoration. Enum, constant-oneOf,
composition and mixed type selectors share this composition. It can be removed
when the native Select exposes a clear-label translation hook and passes the
same locale/focus tests.

An authored empty placeholder stays empty. Cron and duration already provide a
translated empty option, so they disable the library placeholder. Month/year and
page-size selectors have no empty choice. These use the documented
[custom-options and elementRef APIs](https://flowbite-svelte.com/docs/forms/select).

## Skeleton

The installed Combobox exposes `translations.triggerLabel` and
`translations.clearTriggerLabel`. Enum, constant-oneOf, composition and mixed
type selectors supply catalog defaults through that API; explicit native props
retain their normal precedence. The existing native Trigger, ClearTrigger,
Content and Item components remain in use. See the
[native Combobox API](https://www.skeleton.dev/docs/svelte/framework-components/combobox).

## shadcn

The shipped native Select/Combobox compositions already provide catalog labels
for their renderer-owned clear actions and placeholders. No generated UI
component changes are needed for this batch.

This review covers selector messages. Calendar navigation and announcement adapters are covered in the
[native calendar review](native-calendar-review.md). Other native component defaults
remain under P1.10.

## Skeleton deferred native selection callbacks

Zag Svelte 1.34.1's machine `flush` queues its callback with `queueMicrotask`.
Combobox clear/selection can therefore reach `onValueChange` after a host has
replaced form data or schema in the same turn. A callback that only reads the
current control at that point mistakes the old interaction for a new edit.

The private `nativeChoiceEvents` adapter captures the control's data, schema and
path during the native input/click/keyboard event, including portaled options.
It accepts the native callback only while that target is still current and
editable. Normal selection still uses the native Combobox; the existing binding
also checks the target again when its debounced write runs. This handles the
Svelte integration's deferred callback without replacing the widget or exposing
a new form API.
