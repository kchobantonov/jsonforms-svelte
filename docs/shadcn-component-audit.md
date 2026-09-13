# Shadcn component audit

Audited against official generated registry revision
[`7f5289a709281fb6ac893b8c5ca8a543404dcf0d`](https://github.com/huntabyte/shadcn-svelte/tree/7f5289a709281fb6ac893b8c5ca8a543404dcf0d/docs/static/registry/styles/nova),
using the Nova style. npm's latest CLI at the time of the audit was **1.6.1**;
our consuming manifests specify `^1.4.2`. CLI and component-source versions are
separate concerns.

The audit identified differences between generated upstream sources and the
checked-in component sources. Source ordering and local adaptations also count
as differences; a difference does not necessarily indicate a functional defect.
Run the audit script for the current component inventory and per-file results.

Groups: accordion, avatar, badge, breadcrumb, button, calendar, card, checkbox,
collapsible, dialog, field, input, input-group, item, label, native-select,
popover, progress, radio-group, resizable, scroll-area, select, separator, sheet,
slider, switch, table, tabs, textarea, toggle, toggle-group, tooltip.

Examples of meaningful changes:

- Resizable now uses a slim styled handle instead of the local GripVertical icon.
- Select has a new value component/export.
- Current registry entries request dependencies including `bits-ui@^2.18.0`,
  `@internationalized/date@^3.12.0`, and `tailwind-variants@^3.3.0`. Updating copied
  source without checking those requirements is insufficient.

This audit **does not replace live components**. It adds reproducible check,
staging and synchronized-write commands; follow the root README update procedure
before adopting the new source. Repository integration utilities and custom
renderer wrappers are explicitly outside the upstream component-file comparison.

The website's registry endpoint returned HTTP 403 in this environment, so the
audit uses the official repository's checked-in generated registry JSON at a
pinned commit. It is a comparison with current official repository registry
source, not a claim that the deployed website and repository always update at
the same instant.
