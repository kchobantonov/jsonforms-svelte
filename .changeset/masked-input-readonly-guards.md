---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
---

Reject stale masked-input edits and clear actions after readonly is enabled, including configurations that keep readonly controls enabled for inspection.

Share safe mask-token parsing across all three native inputs. Invalid regular expressions retain the default token and display a translated diagnostic instead of throwing during rendering. Preserve Unicode patterns, legacy regex escapes, token removals and host RegExp values.

Use the shared Svelte text-draft lifecycle with the reference mask engine for all three native inputs. Keep IME drafts provisional, cancel them on host replacement or clearing, preserve caret position during insertion, and enforce stored-value length without HTML maxlength. Compact table cells share the same pending/readonly behavior.
