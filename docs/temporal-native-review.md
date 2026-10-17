# Temporal controls: native components and reference behavior

Reference revisions: spec `f0183923295c495c60024fddca58dbe99e82e816`; React `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`.

## Component decisions

| Family   | Date                                            | Time                                         | Coarse date views                                          |
| -------- | ----------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Flowbite | Installed Flowbite Datepicker, with host locale | Flowbite Input/Button composition            | Flowbite Select for month/year, with native action buttons |
| shadcn   | Shipped shadcn-svelte Calendar and Popover      | Shipped Input/Button/ToggleGroup composition | Shipped NativeSelect for month/year                        |
| Skeleton | Installed Skeleton DatePicker and Popover       | Skeleton styled HTML inputs/buttons          | Skeleton styled HTML select elements                       |

Flowbite's installed Datepicker supports a month selector for calendar navigation but exposes no month-only/year-only selection mode. Its native Select components therefore implement those modes. The installed Flowbite Timepicker delegates to the browser's time input; it does not expose the spec's independent time columns and staged action slot. The installed Skeleton exports and shipped shadcn-svelte components do not include a complete equivalent time picker. Their existing native input/button compositions are retained. These are explicit component exceptions, not reasons to replace native calendars or popovers.

The React Antd adapters have the newer shared temporal bounds/format behavior. React shadcn's base time adapter is simpler and does not consume all those helpers. The Svelte implementation follows the spec and Antd semantics while retaining Svelte-native presentation.

## Implemented in this checkpoint

- Literal inclusive/exclusive bounds retain picker-precision behavior. Relative `$data` bounds now update as sibling data changes. Escaped and empty pointer members are supported; inherited properties are not traversed.
- Temporal `restrict` resolves from the element, then `config.jsonformsExtended.restrict`, then true. The core-seeded flat `config.restrict: false` does not disable the specified default. Existing out-of-range data is preserved. Restricted picker selections are guarded; complete typed range violations remain committed and participate in schema validation.
- `views` selects time columns independently of the save format. Date views choose the finest requested date unit; storage supplies the legacy fallback when date views are absent. Date-time applies time views while retaining its full calendar.
- Month/year selections are staged. Cancel preserves committed data; Apply uses the configured save format.
- Picker actions, column labels and step buttons use EN/BG JSON catalogs and host translations. Month names use the host locale.
- `temporal.saveFormatInvalid` warns once per incompatible schema/save-format combination, using a fixed single-digit probe. UI-selected formats without a schema format remain unrestricted.
- Canonical temporal-controls JSON is imported unchanged, with EN/BG host supplements.

## Verification and remaining acceptance

An 81-case browser batch passed across all families. The subsequent focused suite passes 18 cases, including EN/BG canonical time views and month Apply/Cancel, relative bounds and exclusive time bounds. Shared temporal/catalog tests pass seven cases. Type checks pass for core, demo-common and all base families; demo-common retains its existing no-Svelte-input warning. All 12 production native/Web Component cases passed with no page errors. Flowbite uses adjacent native popover triggers so the vendor lookup remains inside its shadow root.

Full temporal parity remains open: complete cell/format/invalid-value coverage, cross-timezone behavior, all date-view/bound combinations, absolute `$data` pointers and literal dotted data paths, native calendar translations and keyboard/RTL/visual acceptance still need evidence. This review does not claim that every scenario described in the imported fixture is accepted.

The typed-range follow-up passes 54 focused native cases. Another 21 Apply/Cancel cases verify catalog-based draft feedback, live host locale changes and unchanged committed data. DateTime range feedback is associated with the input through `aria-describedby`. Unresolved partial-input pending ownership and complete date/time-only local feedback remain open.
