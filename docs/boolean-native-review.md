# Boolean native component review

Contract: spec §18.19 at `f0183923295c495c60024fddca58dbe99e82e816`.
References: React shadcn BooleanControl/BooleanToggleControl and Antd AntdToggle
at `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`.

All families retain their native checkbox and switch components. Checked means
strict boolean true. Nonboolean checkbox values use indeterminate presentation;
switches expose a translated accessible description that distinguishes absent
values from invalid data. No mount-time coercion or default is written.

Required means presence, so false must remain a valid answer. Flowbite and
Skeleton omit the native required constraint and expose aria-required. Bits UI
owns aria-required through its required prop; shadcn uses that prop and keeps the
widget unnamed so Bits UI does not insert a required native checkbox input.
JSON Forms owns data serialization. Renderer-owned state wins over vendor props.

The shared state hook supplies English/Bulgarian fallbacks and host translation
support. Boolean cells delegate to the same controls. State descriptions remain
visually hidden to preserve compact cells, following the Antd reference.

Real-registry tests cover invalid string/number values, missing values, locale
changes, required false and invalid table-cell values. The unchanged Boolean
controls source fixture is imported with Bulgarian field/intro supplements.

## Clearing

Each family uses its native ghost/close button beside the checkbox or switch field.
The action appears on hover/focus and remains available on touch. A named group
prevents unrelated ancestor hover from revealing it. False is present and clearable.
Clearing an ordinary property removes it, including required properties; normal
validation then reports the missing answer. Dynamic additional-property keys and
array-item slots use the existing boolean empty value, false, so clearing never
removes a dynamic row or creates a sparse array. Their explicit Delete actions
retain responsibility for removal. Permission changes and `clearable: false`
remove the action and guard stale callbacks.

The action participates in the field's inline layout. Positioning it at the end of
the entire dynamic-property row overlaps that row's native Delete action. The
native test matrix covers field and cell clearing, required false, sibling/slot
preservation, dynamic keys, EN/BG labels, hover/focus and readonly transitions.
All 60 native cases and 12 production scenarios pass across the three families,
EN/BG and native/Web Component hosts. Narrow light/dark screenshots verify clear
actions and typed-state feedback. Flowbite uses its native gray CloseButton with a
dark text token; field clearing prevents the native enclosing-dismiss side effect.
The production tests distinguish switching off (stored false) from clearing an
ordinary property (absence), including table cells and sibling preservation.

## Readonly native presentation

With `separateReadonlyFromDisabled`, a guarded change callback alone is not enough:
a native widget can toggle its own visible state even when the form rejects the
write. Bits UI 2.19.5 Checkbox provides `readonly`, and Skeleton 4.12.1 Switch
(Zag 1.34.1) provides `readOnly`; both remain focusable and prevent pointer/keyboard
changes through their native APIs. Renderer permissions follow vendor props.

Flowbite 1.33.1 Checkbox/Toggle and Skeleton's styled checkbox use HTML checkbox
inputs, which have no readonly interaction mode. Bits Switch also has no readonly
API. These controls use disabled presentation, matching React shadcn's fallback.
No custom checkbox or switch is introduced. Callbacks independently reject readonly
writes. Real-registry tests cover unchanged native checked state, keyboard focus
where supported, and editing after readonly is removed.
