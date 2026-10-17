# Duration renderer review

References: spec §18.18.2 at `f0183923295c495c60024fddca58dbe99e82e816`; React Antd/shadcn at `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`.

## Why the React picker has this shape

React's shared `useDurationControl` explains the change from seven permanent inputs to active units. Showing seven zeros makes the meaningful units harder to find. Weeks is a separate mode because it cannot coexist with other units; disabling its field until every other unit is cleared leaves the reason unclear. The shadcn adapter adopted the shared state and native Input, Button, Select and Popover in commit `613ab8e` (September 29).

The shared helper distinguishes textual weeks mode from a nonzero weeks value, so `P0W` opens in weeks mode. Explicit mode state also keeps the row present while the user clears its value. Component values are quantities; a time-of-day maximum of 11 months, 23 hours or 59 minutes/seconds is invalid for duration editing.

## Current Svelte implementation

All three families share the duration parser and Svelte draft controller. The picker uses explicit weeks/components modes, active unit rows, native Add unit selectors and Remove actions. Flowbite uses Input, Select, Button and Popover; shadcn uses Input, Select, Button and Popover; Skeleton uses its styled native form controls and Popover. The compact text input remains the cell entry point.

Quantities accept exact non-negative integers through `Number.MAX_SAFE_INTEGER`. There are no clock-field caps and no flooring of fractional values. Weeks cannot coexist with other components. `P0W` opens in weeks mode; untouched confirmation preserves spelling, including leading zeros. Valid text edits preserve their spelling too.

Incomplete text and numeric drafts remain local. The form-owned pending state and detail-dialog guard block invalid drafts without publishing duplicate additional errors. Cancel discards picker edits. External replacement, schema/path changes, readonly transitions and teardown invalidate obsolete drafts. Committed values remain subject to the host schema's validation; a duration UI hint does not add a schema assertion.

The text input uses native datalist completions for valid suffixes. This replaces the previous mask, which could silently drop unsupported characters. Guidance preserves the full typed draft; the parser decides when it can commit. All visible feedback and accessible action names use JSON catalogs, with EN/BG defaults and dynamic host translations. Custom `okLabel` and `cancelLabel` retain translated-key/literal behavior.

The normative spec governs partial-draft handling even where the React reference currently commits raw text immediately.

## Verification and remaining acceptance

Shared parser and browser lifecycle tests cover incomplete/unsafe quantities, zero weeks, exact spelling, pending validity, immediate updates, replacement and readonly. Native tests cover direct edits, picker mode changes, nested draft preservation and table cells. Canonical unchanged-duration tests cover EN/BG and a custom French host catalog.

The preceding picker batch passed all 24 production cases across EN/BG, three families and native/Web Component hosts (canonical duration and literal-property scenarios). Keyboard Add unit, staged Apply/Cancel and live translated clear actions pass in native adapters. The subsequent selected-mode styling, compact shadcn rows, last-unit guard and catalog wording pass all 21 native duration cases; all 24 refreshed production duration/literal-property scenarios also pass. Full visual and compact draft-feedback acceptance remains under P6.1.
