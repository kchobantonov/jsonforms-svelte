# Author diagnostic inventory

This inventory tracks extended spec §21 and TODO P1.14. A form validation error
describes invalid data; an author diagnostic describes a UI-schema, option, host
capability, or runtime policy problem. Forms expose a typed `ondiagnostic`
callback, and Web Components dispatch a `diagnostic` CustomEvent.

§21's representative `dynamic.invalidBinding`, `dynamic.pathNotFound`,
`dynamic.forbiddenPath` and `dynamic.invalidTemplate` codes refer to the
generic `$dynamic` overlay design in §11. That section is marked **FUTURE** and
is excluded from current schemas, exports and conformance vectors; these four
codes therefore have no current runtime emitter. Existing Label interpolation
and its `dynamicValues.enabled` gate use their own current contract.

Explicit tuple presentation diagnostics now distinguish a non-array
`variant.inapplicable` from array-shape `variant.unsupported`; a mounted
scalar/array/scalar transition reports each active code once, and the complete
Shadcn/Flowbite/Skeleton tuple files pass 59/51/51 cases after the shared build.
The rebuilt Shadcn Web Component emits a bubbling/composed inapplicable event,
then reclassifies it when the host schema changes; its focused diagnostic file
passes 9/9 without changing form data.
Unresolved local schema references and unsupported dynamic schema references
now also reach `ondiagnostic` with stable codes, severity and reference details.
The accessible missing-content fallback and false validity remain. Four focused
Shadcn mounted EN/BG cases pass, including data-only silence and a second
warning after a valid schema interval; the base build/check/publint passes.
A focused Shadcn Web Component case verifies the composed, bubbling unresolved
reference event and recovery with unchanged host data.
An unresolved reference inside an authored UI-schema rule now reports
`rule.referenceFailed` with the parent path, owning UI element scope, rule
scope and reference. The rule
is unmet while unresolved, retains form data, stays quiet on data-only updates
and reports again after a valid rule interval. The shared pure and mounted rule
files pass 15/15 and 5/5; the complete Shadcn Web Component diagnostic file
passes 17/17, including the bubbling, composed rule event and recovery.
Control, literal-control, category and
layout-item rule paths use the same reporter.
Invalid explicit numeric steps now use `numeric.invalidStep` on the author
channel instead of an in-form status. Integer and number inputs keep their
safe stepping fallback. Complete affected numeric files pass 7/8/7 in
Flowbite/Shadcn/Skeleton, including integer warning/recovery in all three and
a Shadcn number case; the base build passes.
A focused Shadcn Web Component case verifies the composed numeric-step event,
data-only silence, corrected/reintroduced warning and absence of in-form
configuration status.
TemplateLayout URL-policy refusal now also has direct Web Component host
acceptance in Flowbite, Shadcn and Skeleton. Each focused case verifies a
composed, bubbling `template.urlRefused` event with safe tag/attribute details,
no repeat on a data-only update, restoration of the same link when `mailto`
becomes allowed, and a second warning when the policy denies it again without
changing host data. An indirect named-template cycle also reaches the
composed, bubbling `template.cycle` host event in each family. The focused
cases pass a data-only quiet interval, a resolved registry replacement and a
second warning when the cycle returns, with host data unchanged. Other
registry shapes and host profiles remain open.
Author diagnostics also retain coded console output; some retain an in-form
explanation when content cannot render. A DOM `data-*-diagnostic` attribute is
inspection evidence, not a notification channel. The delivery audit below
still needs live-update and deduplication acceptance for every emitter. The
named-template, native-slot, template-language and duplicate-child warning
identities now serialize path/name tuples, so a literal NUL in an authored
path or name cannot suppress a distinct warning. The focused native,
named-template and TemplateLayout browser files pass 23/23, and the extended
build/check/publint passes.
Both native-template adapter modes now deliver `template.unknownSlot` through
the form callback and report it again after an unknown/known/unknown child
transition; the focused browser file passes 3/3.
Buttons authored with both `action` and `script` now report `action.conflict`
through the form author callback and the bubbling, composed Web Component
`diagnostic` event. The action retains precedence. The warning includes the
action name and path, omits script source, stays quiet on data-only changes,
and recurs after a valid/invalid authoring transition. All three extended
mounted cases and all three focused Web Component host cases pass. The
conflict no longer adds an in-form status because the action remains usable.
ImageView's `image.missingAlt` warning now stays on the author channel when
the image itself renders. The image retains its source and empty `alt` while
the author corrects the UI schema; a data-only update is quiet, and removing
and reintroducing `alt` reports again. A focused native callback case and
three Web Component event cases pass. Missing or refused image sources still
show localized accessible explanations because the visual content cannot
render. The rebuilt image-context production matrix passes 12/12 across families,
EN/BG and native/Web Component hosts.
Named-template duplicate/missing warnings also reach the form callback, with
missing/valid/missing recovery and data-only silence in the focused 7/7
TemplateSlot file.
TemplateLayout duplicate-child warnings likewise report through the callback
after a duplicate/valid/duplicate child-list transition; its focused file
passes 13/13.
Unsupported TemplateLayout languages now also have direct Web Component host
event acceptance in Flowbite, Shadcn and Skeleton (1/1 focused case per family).
Each case checks the structured `template.unsupportedLanguage` payload,
bubbling/composed flags, data-only silence, a rendered Ractive interval and a
second warning when the invalid language returns, with host data unchanged.
Compiled and descriptor-mounted native templates and Ractive layouts now keep
caught exception text out of the form. They show a generic accessible failure
and emit `template.renderFailed` or `template.engineLoadFailed` through the
author channel. The native and Ractive focused files pass 6/6 and 13/13; the
extended package build/check/publint passes.
mounted Shadcn Group case now verifies `section.invalidCollapsed` callback
delivery on a live option change: a data-only rerender is quiet, valid local
configuration shadows an invalid global value, and a new invalid transition
reports again. The base package rebuild and focused case pass.
Portable layout sizing now tracks active diagnostic identities using structured
path/index/code/message tuples. A mounted Shadcn callback case verifies that
correcting and reintroducing an invalid span reports twice, while a data-only
rerender stays quiet and option changes do not write form data.
The `layout.multipleSizingModes` author event now also has direct Web Component
acceptance in Flowbite, Shadcn and Skeleton: a valid/invalid UI-schema
transition reports twice with the item index and path, while a data-only
update stays quiet. The three focused browser cases pass.
The vertical-layout `layout.spanUnsupported` warning now has the same direct
Web Component acceptance in all three families (1/1 focused case each): the
event is composed and bubbling, carries path/index details, stays quiet on a
data-only update, clears after a valid authored layout and reports again when
the span returns without changing host data.
The extended `splitLayout.wrapUnsupported` warning likewise reaches the
author through each Web Component, stays out of form alerts, and reports
again after an authored false/true correction cycle. The three focused
host cases pass with unchanged form data.
`categorization.initialNotFound` now follows live authored initial-name changes
instead of reporting only at mount. It clears its warning identity when the
name becomes valid and reports again if the invalid name returns, while the
currently selected category remains unchanged. A focused mounted Shadcn case
and three focused Web Component host-event cases pass; data-only changes stay
quiet and host data is preserved.
Base and Shadcn split panes now deduplicate invalid minimum-size and keyboard-step
warnings independently. Changing one option while the other stays invalid is
quiet for the unchanged option; correcting and reintroducing either invalid
value reports again. Focused Shadcn and Skeleton mounted files pass 4/4 each;
Skeleton exercises the shared hook also used by Flowbite.
ImageView and conditional-field warning sets now contain only active conditions.
Focused Shadcn mounted cases verify callback delivery again when a missing alt
or failed conditional projection is removed and reintroduced; data-only
rerenders remain quiet. The base build passes check and publint.
Missing renderer/cell warning caches now reset when a matching host registry
entry appears. The base mounted callback tests verify a second warning after
that entry is removed again (2/2). Invalid tuple-position warnings likewise
reset after the position becomes valid or hidden; its existing focused mounted
case passes after the base rebuild.
UI-schema registry-cycle warnings now clear their instance cache when the
cycle resolves and wait until dispatch settles before reporting. The complete
Shadcn registry-cycle suite passes 7/7 after the base rebuild, including a
recursive/valid/recursive registry transition without a false warning for
the valid detail.
Extended split-layout warning keys now reset when their authored condition
disappears. A focused Shadcn extended callback case verifies a second
`splitLayout.wrapUnsupported` warning after correction and reintroduction;
the extended package build passes check and publint.
Focus-conflict warning signatures now clear only after fewer than two active
requests survive a microtask. The focused shared suite passes 3/3, covering
initial conflict, transient remove/re-add and a later genuine conflict.
TemplateLayout now resets the script-denial and unsupported-language warning
identities after permission or language becomes valid. The focused mounted
callback cases pass 3/3 across grant/revoke and language-recovery cycles;
the extended build passes check and publint.
Ractive `template.renderFailed` now uses the authored template and path in its
internal warning identity. A mounted callback case passes malformed/different
malformed/valid/malformed transitions, while a data-only update remains quiet;
the extended Svelte check is clean.
MarkupLabel policy warnings now reset after a resolved host option. A focused
mounted case verifies disabled/enabled/disabled Markdown callback delivery
and data-only silence; the extended Svelte check is clean.
Choice-card invalid/duplicate identifier warning keys now follow active
authored choices and use structured path/index/code tuples. A mounted Shadcn
callback case passes invalid/valid/invalid transitions; the base build passes
check and publint.
Unhandled-action warning identities now reset when a host handler processes
that action. The extended mounted callback case passes absent/present/absent
handler transitions; the extended Svelte check is clean.
A focused Shadcn Web Component case now verifies an unsupported/valid/
unsupported UI-schema transition dispatches two `diagnostic` events while
the host form data remains unchanged. The same 3/3 focused Web Component
diagnostic suite now passes in Flowbite, Shadcn and Skeleton. Each family also
forwards an extended Button script-policy warning with bubbling and composed
event flags. A tuple variant warning also recurs after an unsupported/valid/
unsupported schema transition without changing the stored array. Group's
`section.invalidCollapsed` now also passes a live invalid/valid/invalid host
transition in all three Web Components. Each diagnostic file passes 5/5: the
warning event bubbles and is composed, data-only updates remain quiet, and
the stored value does not change. `focus.conflict` also passes a live
active/quiet/active Web Component transition in all three families: removing
the competing rendered control clears the warning, and remounting it emits
again with the two request paths and unchanged data. The complete diagnostic
files pass 6/6 per family. Other event classes still need live host acceptance.
The shared tuple renderer now clears its `variant.unsupported` warning after a
valid tuple schema interval. A mounted Shadcn callback case verifies a second
warning if the schema becomes unsupported again; the base package build and
focused browser case pass.
Monaco's missing form-owned error-store warning now follows the active
publication request and data path. A standalone mounted draft case verifies
it reports again after publication is disabled/re-enabled or the target path
changes, without repeated warnings for the same active request.
String-authored registry testers now report `script.evaluationFailed` for
nonfinite or lower negative ranks and return `NOT_APPLICABLE`. The sentinel
and finite non-negative ranks remain accepted; a later valid result resets
failure deduplication. The extended helper file passes 14/14.
Monaco diagnostic-reader warnings now deduplicate consecutive current failures
and recover after a successful read or disabled interval. The focused
generation file passes 5/5 and the extended build/check/publint passes.
Disabled/unsupported Markdown and refused link targets now preserve their
readable text without adding an author-policy alert to the form. Author
diagnostics still reach `ondiagnostic`; blocked links lose their targets. The
focused MarkupLabel file passes 10/10, three-family card/table summaries pass
4/4 each, and rebuilt markup production files pass 84/84 across EN/BG and
native/Web Component hosts.
Markdown lazy-load failures now leave plain source readable without a form
policy alert; interpolation load/evaluation failures retain accessible status
for missing resolved content. All three failure classes emit coded warnings
through the author channel; evaluation warnings recover after a resolved/failed transition. The
focused load/interpolation files pass 11/11, MarkupLabel passes 10/10 and the
extended build/check/publint passes.
Refused Markdown links also deliver bubbling, composed `markup.urlRefused`
events from all three Web Components. Each focused diagnostic file passes 7/7,
including unsafe/safe/unsafe recovery, readable text without a form alert and
unchanged host data.
The isolated detail-dialog focus registry now forwards `focus.conflict` to the
owning form author reporter. A mounted draft reports once, clears on close and
reports again on reopen without changing form data. The focused shared dialog
file passes 3/3 and the shared build/check/publint passes.
An invalid effective split-layout `resizable` now emits
`splitLayout.invalidResizable`; invalid container `height` and `minHeight`
emit `layout.invalidDimension`, all with local/config source and option
details. Valid local values shadow invalid global config; invalid local values
use the valid global setting or the default. The complete Shadcn mounted
split-layout file passes 17/17 with live warning recovery, and a focused Shadcn Web
Component case verifies the composed event without changing data. All three
extended native checks pass.
Portable container diagnostics now report invalid local `minItemWidth` and an
ignored `resizable` hint outside a split layout. The shared sizing files pass
18/18; focused mounted Shadcn cases verify warning delivery for both without
changing the Group layout or valid minimum fallback.
All three Web Component catalog translators now use the host diagnostic sink,
so `i18n.missingKey` and `i18n.missingParameter` reach the composed, bubbling
`diagnostic` event. Each focused diagnostic browser file passes 8/8, including
a missing-parameter data-only quiet interval and catalog repair/reintroduction
with unchanged host data. This closes translator delivery for the bundled Web
Component hosts. Native callers own the `Translator` they supply to JSON Forms;
`createCatalogTranslator` accepts their author sink explicitly. Its shared
test verifies coded callback delivery for both missing keys and parameters,
deduplication and safe interpolation. The Web Component owns its translator
and supplies its host diagnostic sink; all three families verify the composed,
bubbling missing-parameter event and valid/invalid catalog recovery. The
[source-wide localization audit](localization-source-audit.md) already
reconciles all 210 literal renderer message calls with both 429-key catalogs.
This closes the current localization delivery/ownership inventory.

Malformed splitter pane weight and dimension hints now have direct form
callback recovery evidence. The focused mounted Shadcn case passes 1/1:
`layout.invalidWeight` and `layout.invalidDimension` carry severity, path,
item index and option; a data-only update stays quiet; both report again after
a valid authored interval while the edited form value remains intact. The
shared splitter hook supplies these diagnostics to all three families; broader
splitter options and production host profiles remain in the audit.

The explicit variant inventory is bounded by the current source and spec.
`variant: "tuple"` is the only current variant whose unsupported shape calls
for a `variant.*` author warning. Password OTP explicitly falls back to a
normal password field when its bounds are absent (§18.24). Array-choice
`chips` and `multi-select` select their renderer only for the supported schema
shapes (§18.29), and `splitter` selects a Horizontal/Vertical layout renderer.
The latter two use ordinary renderer dispatch for inapplicable shapes. No
additional declared `variant.*` code lacks an emitter.

The categorization remainder was stale: mounted active-category focus tests
already cover stepper and accordion in Flowbite, Shadcn and Skeleton. Each
keeps a focus request in an inactive category out of `focus.conflict`. A source
scan finds `categorization.initialNotFound` as the only declared
categorization-specific diagnostic; its callback and all-family Web Component
recovery profiles are already accepted above. No additional categorization
diagnostic path remains in this inventory.

The collapse-source audit is also bounded by the shared hook. Group, mixed,
accordion and array panels all call `useCollapsedOptionDiagnostic`, whose
ordered candidates are local, component and shared namespaced defaults.
Shared resolver tests cover that precedence and exclude the old flat key;
the Flowbite Group callback case checks component and shared source details
across live recovery, while all four component paths have all-family callback
and production-host evidence above. No separate source branch remains.

The conditional projection source declares exactly two author codes:
`conditional.referenceFailed` for an unresolved branch reference and
`conditional.evaluationFailed` for a failed branch check. Both run through
the shared `useConditionalFields` reporter. The reference path has native
callback and direct/built Web Component recovery evidence in all three
families; the evaluation path has a mounted Shadcn callback recovery case.
Both keep the visible accessible fallback when projection cannot render.

The portable container-option audit now covers every key in
`containerOptionDiagnostics`: mounted callback recovery for local and
namespaced config `gap`, `wrap`, `align`, `justify` plus global `gridColumns`
and Svelte `minItemWidth` passes in a focused Shadcn case. Earlier mounted
cases cover local `gridColumns`, `minItemWidth` and unsupported `resizable`;
shared pure tests cover unsupported vertical `gridColumns` and splitter-only
`resizable`. The all-family Web Component `layout.invalidOption` event and
item-code host events exercise the shared reporter bridge. No container key
or declared `layout.*` event path remains without source-level and host-path
evidence.

The splitter source declares five warning families: invalid `resizable`, pane
weight/dimension, unsupported wrap and unsupported span. The first three
reach the mounted Shadcn callback with recovery; wrap and span also have
composed, bubbling all-family Web Component recovery cases. Minimum size and
keyboard step are emitted by the family split-pane adapters and already have
all-family native live-update deduplication cases. The same extended splitter
hook and author bridge are used in all three families, closing this option
inventory without another mirrored host matrix.

Focus contributes one author code, `focus.conflict`. Its form-scoped registry
counts only mounted, active requests and clears after a genuine no-conflict
interval. Native form callbacks pass in every family, direct Web Component
events pass with Group close/reopen recovery, and active category tests keep
inactive requests out. Other specialized focus and hint behavior belongs to
the P8.2 accessibility review, not this diagnostic emitter audit.

The current callable script surfaces are UI-schema testers, UI-schema rule
predicates, dynamic defaults, TemplateLayout and Button scripts. Each denied
or failed emitter supplies `severity`, a stable message and safe capability
details; tester/rule failures add a reason, Button compile/execute failures
add a phase, and Template/Button denial adds the owning path. Source text and
caught exceptions are omitted. Native helper/mounted tests cover denied,
failed and unavailable paths, including `action.unhandled` handler recovery;
all-family Web Component tests cover Button and dynamic-default denial events.
These paths use the same extended form author reporter and Web Component event
bridge. There is no remaining callable surface in the current runtime.

The current template registry has named exact-match entries, native slots and
Ractive layouts. Its declared author codes are missing/duplicate names,
cycles, duplicate children, unknown native slots, unsupported languages,
render/engine failures and refused URLs. Focused native callback tests cover
the first set and malformed-template recovery; all-family Web Component events
cover indirect cycle, unsupported language and URL-policy recovery. Shared
reporters deliver the remaining template codes to the same host bridge. The
cycle test also exercises sibling reuse, so a repeated name outside the
active resolution chain remains valid. No additional registry shape is
declared by the current spec/API.

ImageView declares `missingAlt`, `nonStringSource`, `urlRefused`, `noSource`
and `scopeNotString`; the rebuilt 12-case image-context production matrix
covers their applicable native/Web Component and EN/BG fallbacks across all
families. Missing alt stays on the author channel while the image renders;
missing or refused content keeps a readable in-form explanation. The common
MarkupLabel callback test covers disabled/unsupported Markdown and refused
links, retaining readable text; all-family Web Component tests cover refused
Markdown link events and recovery. Choice-card invalid/duplicate identifiers
have mounted callback and all-family Web Component event/recovery tests; only
valid choices render. These are all current image/markup/choice author codes,
and the shared host reporter preserves their stable severity and safe details.

| Area                                         | Current emitter and behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Acceptance evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portable layout sizing and container options | Shared sizing helpers assign stable `layout.*` codes when each item diagnostic is created; `layoutSizing.svelte.ts` reports them once per mounted layout/item. Three native layouts keep inspection messages without validation alerts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Accepted: all declared container keys now have local/config option and active callback evidence through the shared sizing hook; `gridColumns` has all-family native and Web Component delivery/recovery. Item sizing codes have direct all-family Web Component event cases. Shared pure tests cover options that are unsupported for vertical or non-split layouts.                                                                                                                                                                                                                                                                                                                                        |
| Splitter options                             | Shared extended `splitLayout.svelte.ts` reports `splitLayout.wrapUnsupported`, `splitLayout.spanUnsupported`, `layout.invalidWeight`, and `layout.invalidDimension` as author warnings. Pane-specific warnings carry `details.itemIndex` and `details.option`, so repeated invalid hints on different panes remain distinct. Shared base and native shadcn split panes also report `splitPane.invalidMinSize` and `splitPane.invalidKeyboardStep`, then use finite positive defaults. These warnings stay out of form validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Accepted: `splitLayout.invalidResizable`, `layout.invalidWeight` and `layout.invalidDimension` have mounted Shadcn callback/recovery coverage through the shared splitter hook. `splitLayout.wrapUnsupported` and `splitLayout.spanUnsupported` have direct all-family Web Component event/recovery cases. Minimum-size and keyboard-step diagnostics have all-family native live-update deduplication evidence.                                                                                                                                                                                                                                                                                            |
| Explicit unsupported tuple                   | Shared `TupleFields.svelte` reports `variant.unsupported`; its in-form explanation remains because the tuple fields cannot render.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Accepted: explicit tuple requests distinguish `variant.inapplicable` from `variant.unsupported`, with code-transition and data-only deduplication coverage. The remaining current variants follow their specified fallback or renderer-tester contracts and declare no additional `variant.*` emitter.                                                                                                                                                                                                                                                                                                                                                                                                      |
| Missing renderer or cell                     | Shared dispatch emits `renderer.unsupported` or `cell.unsupported` once per mounted element/path with type and scope, then shows a localized accessible fallback without changing data. Instance-local warning keys are serialized tuples, so literal delimiters in paths or scopes cannot collide. Literal controls that dispatch through their dedicated path do not emit a false missing-renderer warning.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Accepted: native form callback delivery and live registry-recovery deduplication pass for both codes (2/2 focused cases). The missing-renderer Web Component event also passes 1/1 per family with unchanged data/validity and a repeated unsupported/valid/unsupported transition. Missing-cell Web Component registry replacement is outside the current host API: all three Web Components use fixed bundled cell registries and expose no cell-registry property. The native form callback covers `cell.unsupported`; the fixed Web Component registries expose no replacement transition to test. This renderer/cell row is accepted; other host capability diagnostics are tracked in their own rows. |
| Section collapsed option                     | Shared `groupState.svelte.ts` emits `section.invalidCollapsed` once per mounted source when the effective local/component/shared setting is non-boolean; valid local values shadow lower invalid settings. Group, accordion, array-panel and mixed-frame paths each have 12/12 production cases across families, EN/BG and native/Web Component hosts; an invalid local value warns while valid component config changes control collapse. The accordion production fixture omits `options.initial` after the UI-schema edit so remounting demo tabs do not reopen an explicitly initial category. A mounted Shadcn Group test verifies `ondiagnostic` receives three warnings across invalid-null, invalid-string, valid-false and invalid-null transitions without a form-data write; a data-only update emits no duplicate. Focused native Flowbite and Skeleton Group tests also pass 1/1 each for callback delivery, deduplication on data changes and re-emission after valid/invalid option changes.                                                                                                           | Accepted: accordion, array-panel, mixed-frame and Group callback recovery pass in all three families. Shared resolver tests cover local/component/shared precedence, and a mounted Flowbite Group case verifies component/shared source details, data-only silence and valid/invalid intervals. The same shared hook supplies all four components.                                                                                                                                                                                                                                                                                                                                                          |
| Categorization initial selection             | Shared `categorySelection.svelte.ts` reports `categorization.initialNotFound` and retains the first-visible fallback. Focused mounted native tests pass 1/1 in each family: the form callback receives the coded warning with severity, message and invalid name while the first category remains active.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Accepted: active stepper/accordion focus requests are counted only in the active category by mounted tests in all three families. The current categorization source declares only `categorization.initialNotFound`, already covered by native callback and all-family Web Component recovery tests.                                                                                                                                                                                                                                                                                                                                                                                                         |
| Actions and script policy                    | Extended form host reports `action.unhandled`; UI-schema tester, rule-predicate and dynamic-default gates report `script.evaluationDisabled` before evaluation with capability details; permitted UI-schema script failures report `script.evaluationFailed` without source text; a visible supported `TemplateLayout` reports the same code once per mounted path when host script permission is denied. Dynamic defaults additionally report `dynamicDefaults.evaluationFailed` without expression text and `dynamicDefaults.searchParamsUnavailable` in server hosts. Button renderers show disabled-action feedback and emit `script.evaluationDisabled` once per visible string-script denial interval in all three families. Shared Button script execution reports `script.evaluationFailed` for permitted compile/execute errors while rethrowing the original error. CSP compilation refusal reports `script.evaluationUnavailable` and retains translated unavailable feedback.                                                                                                                             | Accepted: all five current callable script surfaces use safe capability details, with reason/phase/path where relevant, and share the extended form author reporter. Native helper/mounted tests cover denied, failed, unavailable and unhandled-action recovery; all-family Web Components cover Button and dynamic-default denial through the host event bridge.                                                                                                                                                                                                                                                                                                                                          |
| Templates and slots                          | Extended Template/Slot renderers report missing/duplicate names, cycles and unknown native slots as stable console codes with `{name, path}` details; missing and cyclic Template content has a localized accessible EN/BG status. Unsupported languages emit `template.unsupportedLanguage` with language/path details alongside an in-form fallback. Template URL refusals report `template.urlRefused` with tag and attribute details while omitting the URL value.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Accepted: native callbacks cover missing/duplicate names, indirect cycles, duplicate children, unknown slots and render/engine failures. All-family Web Component events cover unsupported language, URL-policy and indirect-cycle recovery. The current named-template/slot/Ractive registry shapes and sibling reuse are covered by source and mounted tests.                                                                                                                                                                                                                                                                                                                                             |
| Conditional fields                           | Shared projection returns `conditional.referenceFailed` and `conditional.evaluationFailed`; the mounted shared hook emits each active code once per path as an author warning, and object renderers retain an accessible localized explanation when a branch cannot project. A mounted Shadcn ObjectRenderer case verifies the form callback receives `conditional.evaluationFailed` again after projection is disabled and re-enabled, with unchanged data. A focused Shadcn case now receives `conditional.referenceFailed` through the form callback, keeps an accessible fallback and retained data, then clears and re-emits the warning when a host adds and removes the referenced conditional branch. Focused Flowbite, Shadcn and Skeleton Web Component cases also pass 1/1 each for composed diagnostic events through the same missing/valid/missing host-schema sequence, with unchanged data. Built-demo host events pass 3/3 across the three families for the unresolved-reference event payload, visible explanation, data-only silence and missing/valid/missing recovery with unchanged host data. | Accepted: the two current projection codes share one reporter. Reference-failure delivery/recovery is verified in all native and direct/built Web Component families; evaluation-failure callback/recovery is verified in Shadcn, and the shared hook supplies the remaining families. Accessible missing-content fallbacks and unchanged data are covered.                                                                                                                                                                                                                                                                                                                                                 |
| Images, markup, and choice identifiers       | Image policy and choice-card helpers produce coded results; refused markup URLs and interpolation have rendered feedback.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Accepted: the 12-case all-family image-context production matrix covers native/Web Component EN/BG fallbacks, with direct author events for missing alt and refused URLs. Common MarkupLabel callbacks and all-family refused-link Web Component events cover its current policy codes. Choice-card invalid/duplicate identifiers have mounted callbacks and all-family Web Component recovery events. Shared reporters preserve code, severity and safe details.                                                                                                                                                                                                                                           |
| Focus                                        | Controls capture `options.focus` at mount; mounted and production tests cover individual fields and hidden categories. React Antd and shadcn also pass the option through to native `autoFocus` without an arbitration store. The spec's general and detailed focus sections now agree that several requests have no portable winner. Mounted native tests confirm two active text controls both retain `autofocus` across all three families; `focus.conflict` reports their paths once per active request set, including formatted integer table cells. Inactive categories and collapsed Groups are excluded.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Accepted for P1.14: `focus.conflict` is the only declared focus author code. Native callbacks pass in all three families; direct Web Component events cover active conflicts and a close/reopen interval. Active category tests exclude inactive requests. Specialized focusability and visual feedback remain under P8.2.                                                                                                                                                                                                                                                                                                                                                                                  |
| Localization                                 | Form messages and translated diagnostics have locale coverage in several families. `i18n.missingParameter` is emitted once per catalog key/parameter/translator when values cannot fill a catalog placeholder, including an absent values object. Interpolated Label catalog text is deferred until `textParams` resolve, so valid Label parameters do not emit false missing-parameter warnings; the shared translator suite passes 12/12 and canonical BG row-detail mounts pass in all three extended families. `i18n.missingKey` is emitted once per translator/key only when an explicit catalog lookup has neither an entry nor fallback text; intentional fallback lookups stay silent.                                                                                                                                                                                                                                                                                                                                                                                                                        | Accepted: native callers explicitly supply the optional catalog author sink; Web Components supply their own host event sink. Shared callback and all-family Web Component tests cover missing catalog diagnostics, while P1.10 reconciles both complete renderer-message catalogs.                                                                                                                                                                                                                                                                                                                                                                                                                         |

The Flowbite Group mounted diagnostic now covers a non-boolean component
`config.jsonformsExtended.group.collapsed` source, a valid interval, and a
second warning when that invalid source returns. Removing the component source
then reports the invalid shared `config.jsonformsExtended.collapsed` source.
Data-only updates remain quiet, the lower valid fallback keeps the group
expanded, and the focused case passes 1/1. The shared diagnostic hook owns
these source and deduplication rules for all four collapse components; other
component and production-host combinations remain in the table above.
The Flowbite HorizontalLayout mounted diagnostic also covers
`layout.spanClamped` on an authored child: it emits once with the layout path
and child index, stays quiet on a data-only update, and re-emits after a valid
span interval. The focused case passes 1/1 without a UI-schema-triggered form
change. All three Web Components now pass the same focused child-span event
case (1/1 per family), including bubbling/composed flags, data-only silence,
valid/invalid authored recovery and unchanged host data. Other layout option
codes and production hosts remain in the audit.
Permitted string UI-schema registry tester exceptions now reach the extended
form author callback as `script.evaluationFailed` with a safe capability and
reason, without exception text. The transformed registry and tester closure
remain stable across data-only host updates, so the warning is emitted once
until a valid tester replaces it; restoring the failing tester emits again.
The complete affected extended-form file passes 9/9, and the extended package
build/check/publint passes. Other callable script surfaces remain in review.

The portable layout container option path now has mounted form-callback evidence
in all three families. `layout.invalidOption` for `gridColumns` reaches
`ondiagnostic` once, stays quiet on a data-only rerender, and re-emits after a
valid/invalid UI-schema sequence without a data write. The complete focused
`LayoutRenderer` files pass 5/7/5 in Flowbite/Shadcn/Skeleton. Each Web
Component also passes a focused 1/1 bubbling/composed event case with data-only
silence and valid/invalid recovery. The remaining layout audit covers other
option keys and built-demo host profiles.

All three Web Components now have focused choice-card identifier event cases:
duplicate and invalid identifiers emit coded, bubbling/composed diagnostics
with indices; a data-only update is quiet, and valid/invalid UI-schema
replacement re-emits both warnings without a data write. The filtered case
passes 1/1 per family. The remaining image/markup/choice audit covers other capability
fallbacks and host profiles.

The extended form now clears its `action.unhandled` warning identity when a
host installs an action handler, even if no action is invoked before the host
removes that handler. The next unhandled click reports again; repeated clicks
in one unhandled interval stay quiet. The complete focused extended form file
passes 7/7, with build/check/publint clean. Other callable surfaces remain
under the policy and capability audit.

The `categorization.initialNotFound` warning now supplies `severity`, a stable
message, and `details.initial` alongside its code. It still opens the first
visible category without adding a form error. The focused Shadcn category
selection file passes 4/4 against the rebuilt base package.
Extended JsonForms now also emits `action.unhandled` with severity, stable
message and action/element details. Its existing once-per-action behavior and
form validity remain; the focused mounted host suite passes 6/6.
Named template cycles, missing/duplicate names, duplicate children and unknown
native slots now include severity, stable messages and authored name details in
their warnings. The template dispatch guard includes a template's name in its
signature, allowing distinct named templates to nest at one data path while
stopping a return to the same name. The three focused template files pass 21/21;
the Shadcn registry-cycle file passes 6/6, including fresh equivalent Controls.
Shared missing-renderer/cell, UI-schema cycle and tuple author warnings now
include a severity and stable message while preserving their path, scope and
type details. The base JsonForms mounted file passes 18/18, and the Shadcn tuple
file passes 51/51 against the rebuilt base package.
The `focus.conflict` warning now carries severity, a stable message and the
active request paths under `details`. The focused shared suite passes 2/2 and
the native focus/layout and formatted-cell files pass 13/13 in each family
against the rebuilt base package. The conflict still chooses no winner.
Temporal save-format conflicts now emit `temporal.saveFormatInvalid` with
severity, stable message, path, schema format and authored save format. Each
mounted control owns its warning cache; identical conflicts in separate forms
both report, while data-only rerenders stay quiet. The shared helper suite
passes 11/11, the focused mounted Shadcn case passes, and all three family
checks report zero diagnostics.
Choice-card invalid/duplicate identifiers and conditional projection failures
now emit coded warnings with severity, stable messages and path/choice-index
details. The focused mounted cases pass 2/2 per native family. Portable layout
sizing, extended split layout, and shared or native shadcn split-pane option warnings now supply severity and stable message
details. The affected Shadcn layout and section files passed 32/32, and its
native split-pane file passed 3/3 after a focused correction; the Flowbite and
Skeleton section cases pass.

The focus conflict contract now agrees with the React references. Mounted
active-view coverage confirms that two focus-requesting text controls both
retain native `autofocus` in all three families, while a request in an
inactive Category stays unavailable. The form-scoped `focus.conflict` warning counts active rendered requests without
choosing a winner. Tabs, stepper, accordion and collapsed Group views suppress
inactive requests in all three families. The typed form callback carries
`focus.conflict` separately from form validity. Opening, closing and reopening
a Group reports the active conflict twice through the native callback and each
Web Component's bubbling, composed host event without a form-data write.
Data-only host updates stay quiet. The native focus files pass 5/5 per family,
and the Web Component diagnostic files pass 14/19/14 Flowbite/Shadcn/Skeleton;
specialized focusability still needs acceptance.
Array Choices now resolves its initial-focus request to the primary chip input,
Tags Input input or multi-select target in all three families. Flowbite uses the
visible listbox instead of its hidden backing select. The affected component
files pass 19/23/19 Flowbite/Shadcn/Skeleton. A disabled chip input no longer
contributes a false `focus.conflict`; a Shadcn max-items transition adds,
clears, and re-adds the active conflict while a data-only update stays quiet.
Other specialized controls remain to review. After rebuilding native packages,
focused Web Component cases pass 1/1 per family for the multi-select target
inside each ShadowRoot.

UI-schema registry self-dispatch now emits `uischema.registryCycle` with the
path, type and scope once per mounted cycle. Detection compares the dispatch
signature, so a registry getter returning fresh equivalent Control elements
also falls back to generated fields. The mounted ObjectRegistryCycle files pass
4/4 in each family, plus fresh-element and valid-detail cases in Shadcn. The callback carries registry-cycle warnings; other registry shapes remain to verify.

ImageView resolver diagnostics now also reach authors as stable code,
severity, message, path and scope warnings once per mounted instance. The
warning details omit the source URL. An accessible in-form warning remains when image content is unavailable;
missing alternative text stays on the author channel while the image renders. A focused mounted Shadcn case
verifies author delivery and deduplication across a data-only replacement.

Invalid or undeclared tuple-position layout scopes now emit
`tuple.invalidScope` once per mounted path/scope, with those values in the
warning details. The visible status remains because the authored position
cannot render. A focused Shadcn mounted test verifies this author warning;
the diagnostic and default-row fallback cases pass in all three families.

Markup Labels now emit `markup.markdownDisabled` and `markup.unsupported`
author warnings when their requests cannot be honored; refused Markdown link
targets emit `markup.urlRefused` without logging the URL. The existing readable
text and accessible in-form explanations remain. A focused mounted test covers
all three codes, deduplication and URL omission; the full mounted file passes.

Monaco now reports inactive named themes, diagnostic validation failures,
editor load failures and missing form-owned error stores with stable codes,
severity and safe context. These warnings no longer log caught errors, worker
details or arbitrary formatted strings. The three focused mounted warning
cases pass. The public host diagnostic stream remains open.

The shared UI-schema tester/rule, dynamic-default and Button script paths now
include severity on denied, failed and unavailable evaluation warnings or
errors. They continue to omit supplied source text and caught exceptions. The
three focused helper files pass 26/26.
Temporal save-format warnings now track path as well as schema and save format.
The shared helper re-reports when the same mounted control moves to a new path
and stays quiet when its active path is unchanged; the temporal-option file
passes 12/12. A focused mounted Shadcn callback case verifies first/third/first
path updates through `ondiagnostic` after the base rebuild.
Template language defaults, unsupported languages, script permission denial
and refused URL attributes now also include severity. The focused template
layout and URL sanitizer files pass 20/20.
The shared catalog's missing-key and missing-parameter warnings now carry
severity; its helper suite passes 10/10. Invalid Group/accordion collapsed
values now report a code, severity, stable message and option source/type
details. After rebuilding the base package, the two focused native cases pass
in each family (6/6 total).
All three native extended families now report Button script denial and
Monaco publication failures with structured, safe warnings. File conversion
failures report `file.readFailed` with severity, stable message and path while
omitting the caught exception. The three focused cases pass per family (9/9).
A source scan of all package `src/lib` warning and error emitters found no
remaining `console.warn`/`console.error` objects without severity and message.
This is a shape inventory; it does not establish every host delivery path.
The default AJV instances in all three Web Components now receive the host
author reporter. Previously a denied dynamic-default script logged to the
console but produced no `diagnostic` event because those hosts supplied an AJV
without a reporter, overriding the extended form's reported default. The
complete host diagnostic files pass 19/24/19 Flowbite/Shadcn/Skeleton,
including a composed, bubbling `script.evaluationDisabled` event with safe
`dynamicDefaults` capability details, a quiet data-only update and a second
warning after the schema condition resolves and returns. Caller-supplied AJV
instances retain their caller-owned reporting policy.
An authored schema replacement now gives default validators a fresh diagnostic
interval in the extended native form and all three Web Components. Reusing the
same schema object after a valid interval previously reused AJV's compiled
dynamic-default warning closure, leaving an active denied-script warning
unreported. A mounted native regression passes in the complete 8/8 extended
form file, and the three complete Web Component diagnostic files pass
19/24/19 with the same-object recovery. Rebuilt production Web Component hosts
pass 3/3 for composed warning events, data-only silence, valid/invalid schema
recovery and unchanged data. Data/config changes with the same authored schema
continue to reuse compiled validators; caller-supplied AJV remains caller-owned.

A form-level typed `ondiagnostic` callback now delivers the mounted shared-base
author warnings in the §21 `UIDiagnostic` shape, including renderer/cell,
category, tuple, focus, section/layout, image, choice, conditional and registry
cycle warnings. The extended host forwards the callback and emits its
`action.unhandled` warning. All three Web Components dispatch a composed
`diagnostic` CustomEvent with the same payload. The native temporal controls
route incompatible save-format warnings through the channel, combining the
path and format details; catalog translators accept an optional author sink.
The original console warnings and accessible missing-content fallbacks remain,
while form errors stay separate. Focused base/extended/Web Component cases,
Shadcn callback cases for category, focus and temporal warnings, native
warning regressions and the catalog suite pass. Mounted extended template,
markup, split-layout, Monaco, button and file controls now use the same
reporter. Extended UI-schema script evaluation and dynamic defaults pass their
form reporter into deferred helpers; direct helper calls retain console
fallbacks. Native Shadcn split-pane option warnings also use the form channel.
The remaining audit is to verify each host delivery path and diagnostic
deduplication under live updates.
