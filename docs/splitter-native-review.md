# Splitter component review

The portable contract is spec §7.3. Adapters use Flowbite Pane/Divider with the shared bounded controller,
shadcn-svelte Resizable (PaneForge), and the project's Skeleton-styled splitter.
The installed Skeleton Svelte export barrel has no splitter/resizable component;
the existing adapter remains necessary. No new UI component was introduced here.

## Narrow containers

Shadcn already caps its native minimum percentage to the available per-pane share.
Skeleton's initial layout falls back to equal shares when the minimums cannot fit,
but its resize handler previously still used the unbounded minimum. This could
produce negative percentages after keyboard or pointer input. The handler now caps
the active pair's minimum at half the pair's available share, preserving its total.

Four mounted Chromium cases cover both axes and LTR/RTL. They verify bounded sizes,
pointer/keyboard interaction, resumed resizing after growth, and input identity.

## Flowbite version and RTL

The workspace now uses Flowbite Svelte 1.33.1, the latest stable npm release checked
on October 16. Its [published SplitPane source](https://unpkg.com/flowbite-svelte@1.33.1/dist/split-pane/SplitPane.svelte)
still calculates horizontal pointer and keyboard deltas without checking direction.
Upgrading alone does not resolve RTL resizing.

The existing compatibility action now reverses horizontal RTL keyboard and pointer
input before passing it to the native component. Direct native-group usage retains Flowbite pane rendering,
size state and constraints; the portable adapter is described below. Touch input follows the same native drag path. The
action handles nested splitters, disabled boundaries and cleanup on removal, blur,
touch cancellation or a direction change. Mixed-property trees and the demo now
use it alongside SplitLayout and row-detail panels.

Eleven mounted browser cases cover labels in EN/BG, both directions and axes, real
mouse dragging, touch identity/cancellation, nesting and cleanup. All four Flowbite
EN/BG × native/Web Component production scenarios also pass keyboard, real mouse
and browser-dispatched touch resizing in RTL against the rebuilt hosts.

## Scoped shadcn direction

PaneForge 1.0.2 reads `document.dir` for horizontal resize deltas. A form can
inherit a different direction from a nearer ancestor, including a Web Component
host. The native layout follows that direction but its resize deltas previously
followed the document instead.

The shadcn adapter now translates horizontal input only when the computed group
direction differs from the document. PaneForge retains rendering, constraints,
layout state and keyboard handling. Vertical input and matching directions use
native behavior unchanged. The action is scoped to immediate group handles so
nested groups do not process the same input twice.

Seven mounted cases cover all four document/group direction combinations with
keyboard and real mouse input, both vertical directions, and a live direction
change without remounting the input. The shared production scenario now checks
horizontal RTL keyboard, mouse and touch resizing across all three families in
EN/BG and native/Web Component hosts.

## Vertical pointer and touch acceptance

The canonical production scenario now also resizes vertical panes with keyboard,
mouse and touch while inheriting RTL. It exposed Skeleton's expanded resize hit
area being covered by the following pane's label. The handle now sits above pane
content and declares `touch-action: none`, so vertical touch resizing is not
intercepted by browser scrolling. A mounted hit-target regression covers this.

The shadcn direction adapter also now consumes additional touch starts and ends
while the original touch owns the drag. Previously another finger could reset the
native drag origin and produce a large jump. The mounted regression verifies
continued resizing, ignored secondary touch end and cancellation cleanup.

All twelve family × EN/BG × native/Web Component production scenarios pass both
horizontal and vertical keyboard/mouse/touch interactions. The additional sizing coverage below closes the previously independent dimension
and constraint gaps.

## Portable sizing and native APIs

Spec §§6.2, 6.4 and 7.3 require Fixed before Span/Weight/Auto, per-pane
constraints, and natural content sizing for vertical Auto. The React references'
weighted-share initializer alone does not cover these requirements.

The shared extended adapter measures CSS dimensions in the actual host, including
percentages, calc expressions, font units and Shadow DOM. It allocates fixed and
natural sizes before weighted space, applies min/max, and passes percentages to
the family adapter. Separator width and the portable gap are excluded from usable
pane space. Parent minItemWidth is a fallback; explicit child minima take priority.
Cross-axis dimensions, align and justify are applied to the actual pane group.
Infeasible authored minima overflow locally instead of making panes negative.

User resizing survives ordinary data updates and container changes. Authored sizing
changes recompute the allocation without remounting controls; membership and axis
changes recreate the group. Responsive stacking preserves input identity and restores
previous shares when horizontal layout returns.

### Flowbite

Flowbite 1.33.1 has no controlled layout or per-pane min/max API. Its native group
cannot enforce the portable bounds through CSS alone. The adapter therefore retains
public Flowbite **Pane**, **Divider**, theme and styling APIs, with the shared bounded
controller managing sizes and interaction. It does not access private Flowbite
context or patch the dependency. The same adapter is used by SplitLayout, mixed
property trees, row details and the demo shell. RTL is handled by this controller;
the compatibility action supplies labels, disabled state and accurate ARIA ranges.
Its legacy RTL translation remains available for direct native-group usage.

### Shadcn

Shadcn continues to use native Resizable/PaneForge for state, constraints and input.
The styled PaneGroup wrapper forwards native getLayout/setLayout, letting the
extended adapter apply measured sizes. The sync tool preserves this small forwarding
adaptation. The scoped-direction action remains necessary because PaneForge reads
document direction rather than the nearest form or Shadow DOM host.

### Skeleton

The installed Skeleton exports contain no splitter component. Its existing styled
Pane and Divider use the same bounded controller as the Flowbite adapter. Pointer
ownership, cancellation, blur, disabling, membership changes and unmounting clean up
listeners and restore body cursor/selection state.

### Acceptance coverage

Focused mounted tests cover fixed sizing, precedence, both axes, min/max keyboard
bounds, CSS dimensions, gap/alignment, minItemWidth, stable controls, responsive
restoration, nested direction handling, touch ownership and drag cleanup. Pure
allocation tests cover weighted redistribution and infeasible constraints.

The preserved canonical spec fixture covers weighted, hidden and disabled panes.
The supplemental **Split layout sizing** example adds EN/BG fixed, natural vertical,
nested and narrow constrained panes. Production suites exercise both examples in
all three libraries, locales and native/Web Component hosts.
