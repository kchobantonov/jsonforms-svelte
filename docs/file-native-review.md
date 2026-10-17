# File control presentation

References: spec §18.18.4 at `f0183923295c495c60024fddca58dbe99e82e816` and React Antd/shadcn file adapters at `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`, including the shared `FileArrayInput`.

## Component choices

- The visible chooser is a native themed button. It activates a hidden platform file input. This keeps the picker and encoding behavior while allowing English/Bulgarian action labels and compact table cells; the browser's built-in chooser text follows browser locale rather than the form locale.
- Flowbite uses Button, Fileupload, Badge, CloseButton, Modal and Progressbar. Shadcn uses Button, Badge, Dialog and Progress, with an uncontrolled platform file input. Skeleton uses its button/badge utilities, platform input, Dialog and Progress.
- Multiple attachments use persisted filename pills with one remove action per occurrence. Normal controls wrap inside a bounded area; compact cells use a single scrolling row. The chooser, clear action and feedback stay outside the scrolling filename area.
- Single attachments use bounded filename text beside select/replace and clear actions. Encoded payloads are never used as display text. Default AG Grid filtering/sorting also uses persisted filenames; nameless files contribute no search text.
- Local operation feedback uses theme warning/error colors. Compact cells use native popovers with localized accessible names. Flowbite retains its native top-layer popover and explicitly opens it on focus, pointer entry and activation. Production tests wait for progress-dialog dismissal before moving focus.
- Existing cancellable progress dialogs remain. They use the library's progress component and translated controls. Cancellation and asynchronous ownership follow the shared contract, independently of presentation.

The hidden shadcn input is an intentional primitive-level exception: the generated Input's file branch also binds a string value. The real chooser fires both input and change events; clearing the picker after selection then caused that binding to write a nonempty fake filename path, which browsers reject. The hidden input has no themed presentation to preserve. Leaving it uncontrolled keeps the platform contract without patching generated UI components.

## Evidence and remaining review

The first production screenshot exposed overlapping native file inputs, clear buttons and filename pills in AG Grid. The compact button layout addresses that observed problem. The new layout also avoids the browser-localized “Choose File” text in Bulgarian forms. Skeleton's vertical wrapper now uses an explicit label next to compound content so secondary buttons and filenames do not become part of the field label.

Flowbite and shadcn pass English/Bulgarian production behavior checks in native and Web Component hosts. Shadcn desktop and narrow light-theme screenshots were reviewed; compact filenames and feedback remain bounded after bringing the focused grid cell into view. Narrow/light/dark visual acceptance and the complete file-size validation profile remain open in P6.2–P6.3. This document records the component rationale, not a completed visual approval.

## Selection-time size validity

With `restrict: false`, file conversion proceeds and known original byte sizes
produce renderer-owned `fileSize` errors. Host errors remain intact. Successful
replacement or removal clears only the corresponding file errors; array errors
follow the current encoded value and index after host reordering. Imported values
without selection metadata are not claimed to have passed size validation.
Rejected selections and read failures remain local operation feedback, following
the explicit rule in §18.18.4, and do not enter this error producer.

The existing compact chooser/pill/feedback layout is retained. Native components
remain the default, but the compact React Antd/shadcn File presentation governs
form and cell geometry instead of a large native upload/drop-zone widget.

Pending reads also publish pending status through the owned validity channel. External replacement and stale-read cancellation clear that status without replaying the old file.
