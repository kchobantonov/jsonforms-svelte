# Demo keyword controls

The settings field edits `filterErrorKeywordsBeforeTouch`. The spec accepts an array
of strings, including repeated values. Imported duplicates must render safely and
removal must affect the selected entry. New additions avoid exact duplicates;
keyword spelling and case are preserved.

## Native components

| Family   | Components                            | Reason                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flowbite | Input, Badge, CloseButton             | Flowbite Svelte 1.33.1 Tags hardcodes validation text and the embedded CloseButton name. Its `TagsProps` exposes no translation hooks or item snippet. Native primitives allow translated labels without patching the dependency or changing rendered DOM after mount. |
| shadcn   | Existing InputGroup, Badge and Button | Retains the existing chip editor, with positional keys/removal so imported duplicates are safe.                                                                                                                                                                        |
| Skeleton | TagsInput                             | Skeleton 4.12.1 forwards Zag TagsInput 1.34.1's `translations` API, including additions, deletion, editing, selection and paste announcements.                                                                                                                         |

Zag Svelte 1.34.1's `useRefs` stores the log in a plain object, while TagsInput's
`announceLog` watcher tracks that log through a Svelte effect. Changes are not
reactive, so native value-change announcements do not run. Skeleton settings
therefore provides a polite live region from the public `onValueChange` callback
for addition, removal, edits and pasted batches. Native editing, focus and
validation remain intact. Recheck and remove this adapter when upgrading to a
version with working native announcements.

Messages live in demo-common's `components/demo-messages.json`. Skeleton receives
callbacks that use the current demo translator, so announcements follow locale
changes while settings remains open.

Flowbite CloseButton calls the enclosing dismiss context unless its click event is
prevented. Keyword removal prevents that default action; the settings close button
retains native dismissal. Flowbite Input uses its public `elementRef` binding to
restore focus without scrolling after removal.

The production shell-localization scenario covers imported duplicates, addition,
duplicate rejection, individual removal and settings containment in every family.
It also inspects Skeleton's live-region messages after a locale change.
