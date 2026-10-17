---
'@chobantonov/jsonforms-svelte-extended': minor
'@chobantonov/jsonforms-svelte-flowbite-extended': major
'@chobantonov/jsonforms-svelte-shadcn-extended': major
'@chobantonov/jsonforms-svelte-skeleton-extended': major
---

Cancel obsolete file reads on replacement, external data/schema/readonly changes and unmount. Ignore stale load/progress results without overwriting the current value or closing a newer progress dialog.

Follow the file specification's cancellation contract: cancelling the native chooser or an active attachment clears the scoped value using the normal Clear behavior. Internal cancellation and failed reads preserve existing stored data. Hosts that relied on chooser cancellation retaining an existing attachment must account for this change.

Honor explicit picker `accept` before schema media-type hints, including an empty filter. Localize progress, Cancel, Clear and conversion-failure messages in English and Bulgarian. Flowbite retains its native Fileupload and CloseButton components while providing a translated clear action and cancelling reads when its progress dialog is dismissed.

Display filenames retained in persisted binary values and localized fallback text for base64 attachments. Keep the last committed local filename when a replacement is rejected; external data replacements cannot retain another value's filename.
