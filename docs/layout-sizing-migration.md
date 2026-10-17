# Portable layout sizing migration

Default renderer registries now use the spec's portable sizing model. Both axes default to a 16px gap; horizontal layouts default to no wrapping. Set `options.wrap: true` on the layout when wrapping is intended. Explicit `gap: 0` and `wrap: false` override configured defaults.

Move child `options.columns` to `options.layout.span`. Spans use a 16-column grid by default; set the parent's `options.gridColumns` when another grid is required. Fixed dimensions take priority over span, then weight. Hidden children are removed before sizing. Explicit width and height apply on either axis; nested layouts receive the height allocated by their parent. Group bodies use the same vertical layout rules.

```json
{
  "type": "HorizontalLayout",
  "options": { "gap": 16, "wrap": true, "gridColumns": 16 },
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/name",
      "options": { "layout": { "span": 8 } }
    }
  ]
}
```

## Explicit legacy adapter

For applications that need time to migrate, each native base package exports `LegacyLayoutRenderer`. It is intentionally absent from the default registry. Replace the layout entry in your application registry:

```ts
import {
  shadcnRenderers,
  layoutRendererEntry,
  LegacyLayoutRenderer,
} from '@chobantonov/jsonforms-svelte-shadcn';

const renderers = shadcnRenderers.map((entry) =>
  entry === layoutRendererEntry ? { ...entry, renderer: LegacyLayoutRenderer } : entry,
);
```

Flowbite and Skeleton expose the equivalent exports. The adapter applies legacy columns only when portable sizing options are absent. Authored portable options continue to use the shared implementation.

## Group disclosure and native components

Shadcn uses its local Collapsible wrapper over Bits UI; Skeleton uses its native Collapsible. Content stays mounted while collapsed, preserving editor state. The full header acts as the trigger and its accessible name comes from the group title. Data indicators have English/Bulgarian labels and titles, overridable through `group.dataIndicator`.

Flowbite uses its native Button inside Card. Its installed AccordionItem does not forward trigger attributes such as `aria-controls` or `aria-label`; using Button preserves the title-only accessible name and explicit association with mounted content. Reconsider this exception if upstream exposes those attributes.

Collapsed defaults resolve in this order: local `options.collapsed`, `config.jsonformsExtended.group.collapsed`, `config.jsonformsExtended.collapsed`, then false. A flat global `collapsed` value does not affect portable Group frames.

## Provenance and remaining verification

The sizing algorithm was adapted from the React reference shared helper at `150fd688ae09f0f3b28e989649f3daf1d9f6d91d`, with Svelte reactive state, effective child visibility and default Spacer sizing added here. The spec reference is `9d8a6915bd19972b7ce9fe3b584926fc23e66fb7` (§6).

Browser tests cover fixed/span/weight widths, zero gaps, wrapping, hidden children, natural vertical heights, spacers, Group bodies and explicit legacy selection. Nested definite-height redistribution is covered, including reactive height changes and weights of 1:3. Splitter integration and complete fixture visual acceptance remain tracked in TODO.md.
