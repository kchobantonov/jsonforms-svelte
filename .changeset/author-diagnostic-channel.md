---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-extended': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn-extended': patch
'@chobantonov/jsonforms-svelte-flowbite-extended': patch
'@chobantonov/jsonforms-svelte-skeleton-extended': patch
'@chobantonov/jsonforms-svelte-shadcn-webcomponent': patch
'@chobantonov/jsonforms-svelte-flowbite-webcomponent': patch
'@chobantonov/jsonforms-svelte-skeleton-webcomponent': patch
---

Expose a typed `ondiagnostic` author callback on Svelte forms and a `diagnostic`
CustomEvent on all three Web Components. Route shared author warnings, native
temporal and split-pane option warnings, extended template, markup, Monaco,
button, file, UI-schema script and dynamic-default warnings, and unhandled actions to this channel without
changing form validation, console warnings or accessible missing-content
fallbacks. Catalog translators can deliver missing-key and missing-parameter
warnings to an optional author sink.
Template child, named-template and native-slot warnings avoid repetition during
live form updates.
Correcting an invalid section `collapsed` option now resets its mounted warning
deduplication, so a later invalid value is reported again to the author.
It also reports a changed invalid value type at the same option source with
updated safe type details.
Portable layout sizing warnings likewise follow active authored conditions and
report again when a corrected invalid option is reintroduced.
ImageView and conditional-field author warnings use the same active-condition
deduplication during live UI-schema changes.
Missing renderer/cell and invalid tuple-position warnings also reset after the
condition is resolved, allowing a later occurrence to reach the host callback.
UI-schema registry-cycle warnings reset when the cycle is no longer active.
Cycle warnings also wait for a settled dispatch tree, avoiding a transient
false warning while a host replaces a recursive entry with a valid detail.
Extended split-layout warnings also track current authored options during live
changes, reporting a newly reintroduced unsupported wrap setting.
Focus-conflict warnings reset after a conflict stays resolved for a render
turn, while transient request teardown/re-registration stays deduplicated.
Template script-permission and unsupported-language warnings now report again
when a previously resolved author condition returns during a live host update.
Markup policy warnings likewise reappear when a corrected host option is
reintroduced.
Choice-card invalid/duplicate identifier warnings also reset after the
authored choices become valid, then report again if the issue returns.
Unhandled-action warnings reset after that action reaches a host handler,
then report again if the handler is removed.
Unsupported tuple warnings reset when their authored condition resolves,
then report again if it returns.
Monaco's missing form-owned error-store warning resets when publication is
disabled and identifies a new control path as a new author condition.
All three Web Component hosts deliver recurring missing-renderer and
unsupported-tuple diagnostics after their authored conditions resolve and
return, and forward extended script-policy warnings as composed events.
