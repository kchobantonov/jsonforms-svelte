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

The native Select and searchable Popover/Command compositions provide catalog
labels for renderer-owned clear actions and placeholders. Command's registry
provenance is recorded below.

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

## Searchable finite choices

`autocomplete: true` enables label search for enum and const-oneOf controls.
`false` selects a non-searchable control. Flowbite and shadcn retain their
non-searchable default; Skeleton retains its native Combobox default, with
`nativeSelect: true` still selecting its compatibility native-select profile.
Query text never writes form data. Choice IDs remain separate from labels and
JSON values, so duplicate labels, zero, false and composite constants stay distinct.
Empty results use the reference `enum.noMatches` catalog key.

- **shadcn:** use the official [Popover + Command composition](https://www.shadcn-svelte.com/docs/components/combobox).
  The twelve Command files are copied from Nova registry revision
  `7e463da6dbf4b9cf086ce3e7d845650bc2a1163b` into both UI roots. Local changes resolve
  aliases and substitute the registry's Lucide icon placeholders. Existing Bits UI
  2.19.5 supplies Command; no additional runtime dependency is needed.
- **Flowbite:** use native Dropdown, Search, DropdownGroup/Item, Button and
  CloseButton. Its native Input suggestions API accepts strings and cannot
  distinguish duplicate labels carrying different JSON values. The composition
  adds listbox keyboard navigation while native Popper owns positioning,
  outside dismissal. The trigger precedes Dropdown so native Popper finds it
  through its sibling fallback inside a ShadowRoot; a document selector cannot
  find the trigger there. Focus restoration accounts for
  Popper opening on focus as well as click.
- **Skeleton:** use the existing native Combobox and ListCollection. Filter only
  `input-change` callbacks; selection/script updates must not become search
  queries. This preserves selected labels after external JSON reloads. Explicit
  `autocomplete: false` uses the family's styled native select.

Free-string suggestions retain their existing native input/datalist behavior
and continue accepting values outside the suggestion list. Suggestions aggregate
all string enum branches in order, deduplicate values and resolve local schema
references. The tester rejects incompatible alternatives and requires a free
string branch. Finite selectors never accept arbitrary query strings as values.
