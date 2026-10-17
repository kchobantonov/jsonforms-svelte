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
Clear affordances, expanded readonly interaction and the full fixture/visual
acceptance remain open; this checkpoint does not close the entire boolean row.
