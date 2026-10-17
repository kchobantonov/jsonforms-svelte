# Button implementation review

References: spec `48b96b5` §14 and React
`935122d` shared extended `ButtonRenderer.tsx`,
shadcn extended `ButtonRenderer.tsx`, and demo-common `i18nCatalogs.ts`.

## Portable behavior

Top-level label/action take precedence over legacy options. Params belong to the
portable top-level field. Missing or malformed params become an independent empty
record. With neither action nor script, dispatch the empty action; do not derive a
command name from a translated label. Actions go through `fireActionEvent`, and
pending covers its complete callback promise. A synchronous guard closes the
pre-render duplicate activation window. Rejections propagate after pending clears.

When both action and script are declared, §14 says the action wins. A translated
local diagnostic reports the conflict. The source example README contains
contradictory fallback prose; its older “neither runs” statement is not adopted.

String scripts require explicit host configuration before compilation. Denied
scripts show a translated diagnostic before activation. Trusted callbacks receive
the event both as an argument and as `this`, without string conversion or a runtime
evaluation permission. CSP construction failures do not trigger another evaluator.

## Native components and translations

Flowbite uses its Button loading prop and native spinner, plus explicit `aria-busy`
(the native component does not provide it). Shadcn uses its Button and Skeleton its
styled HTML button. Native disabled behavior is backed by an imperative guard.

The shared React implementation uses a translator and fallback messages; the demo
keeps serializable catalogs separate from translator functions. Svelte follows
those contracts, with wording in JSON as required by this project. The standalone
React shadcn Button still has older option precedence and string evaluation behavior;
those gaps are not copied. All locale-specific demo supplements are JSON assets.

## Fixture adapter and remaining acceptance

The source fixture's React context access `this.context.core.data` is adapted to
Svelte's documented `this.context.data`; source JSON remains unchanged. Native
function buttons are appended structurally in trusted host code. Serializing and
reloading the UI schema cannot retain those functions. Handlers cover locale,
reset, discard, submit, and a slow action. They demonstrate local operations only.

The fixture passes all twelve production family/locale/native-or-Web-Component
combinations, including language actions that preserve data. Demo wrappers forward
UI schemas as object properties so trusted functions survive. Rejected host-handler, registered-callback and trusted-script cases pass in all
three families, covering propagated errors, pending reset and retries. Semantic color screenshots identified the corrections below. All twelve final
Button production scenarios pass, including keyboard focus, light/dark surfaces
and the default Flowbite warning label contrast. The six palette screenshots were
reviewed.

## Portable full width

`options.fullWidth` defaults to false and uses a width utility on each native
button. It does not change the parent allocation; `options.layout.span` remains
the child sizing contract. The canonical language buttons occupy six columns each
in a twelve-column layout. The sibling spec and React Antd/shadcn changes are included in the reference
revisions above. Antd maps the
option to native `block`, while shadcn uses `w-full`. Tests cover live true/false/
omitted transitions. All twelve built-demo geometry/action scenarios pass across
three families, EN/BG and native/Web Component hosts.

## Native palette review

The shadcn extended Button now maps portable colors to native variants, as the
React shadcn reference does: primary/success use default, secondary/warning use
outline, alternative uses secondary, and error uses destructive. Warning retains
the reference's destructive text accent. Native variants supply focus and dark
styles; authored native variant/class overrides remain available.

Flowbite retains its native semantic color mapping. Its installed yellow Button
uses white text on yellow-400, which produced a warning label with poor contrast in the
production screenshots. The default portable warning adds a dark foreground;
explicit native color/outline and class overrides remain authoritative. This is
a foreground adjustment to the native Button, not a replacement component.

Skeleton retains native button presets. The Web Component surface used the
nonexistent `preset-surface-50-950` utility; it now uses the installed native
`preset-filled-surface-50-950`, so dark-mode foregrounds have the matching surface.
