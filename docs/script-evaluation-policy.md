# Script evaluation policy

The host grants string execution through
`config.jsonformsExtended.security.allowScriptEvaluation: true`. UI-schema options
cannot grant this permission. Native functions already compiled by the host remain
trusted callbacks and do not need string evaluation permission.

## Implemented boundaries

- Button string bodies are checked before construction and execution. Denied scripts
  show a translated diagnostic; named actions retain precedence over scripts.
- String UI-schema testers and rule predicates check permission on every invocation,
  before calling `Function`. Denied testers return `NOT_APPLICABLE`; denied rule
  predicates return false. A `script.evaluationDisabled` console diagnostic identifies
  the capability, once per denied period for that callback.
- Compiled strings are not cached across forms. Replacing host configuration recreates
  the registry adapters; mutation of the supplied permission object is also checked
  on invocation. Native testers and predicates retain their function identity.

Spec choice-card details and the existing tuple examples register native tester
functions in trusted host code. The original fixture JSON stays intact. Native
functions are not serializable; applying an edited JSON registry does not recreate
host callbacks from text. String registry edits require explicit host permission.
The legacy Button demo explicitly opts in and reads status text from its JSON catalog.

## Remaining work

Ractive templates now enforce permission before parsing, mounting and data updates,
with teardown on revocation. Additional executable template profiles, native template
registration, and the full template lifecycle contract remain under review (TODO P1.8).

## Computed defaults

`createAjv(i18n, () => config)` accepts a live host configuration getter. Custom
validators must supply this getter to enable string defaults; omission denies them.
The built-in form, all three Web Components and demos supply their current config.
Provider registries are local to each validator, avoiding the reference implementation's
module-global permission closure. Each missing-value evaluation rechecks permission
before compiling or executing a supplied string. Revocation also applies to cached
validators; a later grant permits evaluation. Denied providers leave the property absent
and emit `dynamicDefaults.evaluationDisabled` once per denied period.

Native date/time and other plugin providers remain available without string permission.
Existing values are preserved. Browser query providers report their absence in server
hosts. Date/time providers retain the existing compile-time snapshot behavior.
The validator-profile spec fixture is integrated with its original EN/BG JSON catalogs;
full UI error-routing and rule-isolation acceptance remains pending.

## Ractive templates

String Ractive layouts require the same host permission. Denial displays a renderer
catalog message (English/Bulgarian fallbacks with arbitrary host locale overrides).
Pending setup is cancelled when its inputs change; the controller checks permission
again after asynchronous teardown before mounting. Legacy template demos explicitly
opt in through their JSON config. `jsonformsExtended.defaultTemplateLang` takes
precedence over the legacy top-level setting; an element's explicit `lang` wins.
