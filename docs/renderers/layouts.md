# Layout renderers

Layouts arrange UI-schema elements without changing their data bindings.
Their ordered `elements` collection remains the source of child order.
Visual row formation and navigation state are runtime details.

## Supported layouts

| UI-schema type | Purpose | Visible title |
| --- | --- | --- |
| `VerticalLayout` | Stack children vertically in document order | No layout title |
| `HorizontalLayout` | Arrange children in rows with optional column allocation | No layout title |
| `Group` | Present related children together, optionally collapsible | Optional `label` |
| `Categorization` | Navigate between categories | Category labels name navigation items |
| `Category` | Contain the elements for one categorization view | `label` names the category |

A Group or Category may contain further layouts. Categorization expects
Category children. Implementations should diagnose invalid child structures.
Adding an unsupported `label` to a VerticalLayout or HorizontalLayout does not
require the renderer to invent a visible heading.

## VerticalLayout

Children stack vertically in document order and use the available inline width.
The renderer's design system determines spacing. A child's `options.columns`
does not restrict its width here; that placement option applies only when its
direct parent is HorizontalLayout.

## HorizontalLayout

### Placement option

`options.columns` is an **extension** on each direct child, not on the bound
JSON Schema property and not on the HorizontalLayout itself. It applies to any
child renderer, including controls, presentation elements, and nested layouts.

| Value | Meaning |
| --- | --- |
| Omitted, `null`, or `"auto"` | Auto: share the row's remaining width |
| Integer 2–16 | Reserve that fraction of a 16-column row |
| Any other value | Diagnose the invalid option and render it as Auto |

An invalid option must not prevent sibling elements from rendering or rewrite
the supplied option. The same field may appear more than once with different
column allocations because sizing belongs to each UI placement.

```json
{
  "type": "HorizontalLayout",
  "elements": [
    {
      "type": "Control",
      "scope": "#/properties/firstName",
      "options": { "columns": 4 }
    },
    {
      "type": "Control",
      "scope": "#/properties/notes",
      "options": { "multi": true }
    }
  ]
}
```

### Width and Auto behavior

A row has 16 conceptual columns. Fixed allocations are fractions of the full
row, not weights normalized against sibling elements. A lone width-4 child
occupies one quarter of the available row width and leaves the rest empty.
A width-16 child occupies a full row.

Auto children divide the remaining columns equally. With no Auto children,
unused columns remain empty. Fractional Auto allocations must not be rounded
to integers. A layout containing only Auto children preserves equal widths in
one row, including child counts that do not divide 16 evenly.

| Child options | Resulting allocation |
| --- | --- |
| 4 | 4, with 12 unused |
| Auto | 16 |
| 4, Auto | 4, 12 |
| 4, Auto, Auto | 4, 6, 6 |
| 4, 4 | 4, 4, with 8 unused |
| Auto, Auto, Auto | 16/3 each |

### Row formation

For mixed or fixed allocations:

1. Visit visible children in document order.
2. Reserve the fixed allocation, or a minimum of two columns for an Auto child.
3. If the next reservation would exceed 16, start a new row.
4. After a row is formed, distribute its remaining columns among its Auto children.

Do not reorder children to fill holes. For example, 12, 8, Auto produces a
12-column first row, followed by an 8 + 8 second row. All-Auto layouts use the
equal-width behavior above rather than this minimum-reservation rule.

### Spacing and measurement

The implementation may choose a row gap consistent with its design system.
Gap widths must be included in allocation so a full row does not overflow.

For row width `W`, `N` visible children, uniform inter-item gap `G`, and
allocation `C`, each child's allocated width is:

```text
(W - (N - 1) × G) × C / 16
```

A lone width-4 child therefore has width `W / 4`. Two width-4 children each
have width `(W - G) / 4`, with unused trailing space.

An input or nested layout's intrinsic minimum size must not enlarge its
allocated slot. Implementations should wrap or constrain content appropriately.
Spacing must use logical layout units, not assumptions about physical pixels.

The contract does not mandate a layout algorithm, intermediate containers, or
a rendering technology. Any approach producing the same observable allocation
and order is acceptable. No generated row structure is written into the UI schema.

### Visibility and state

A rule-hidden child is excluded before row formation, releasing its reserved
columns and associated gap. Visibility changes must recalculate the rows.
Disabled and read-only children continue to occupy their slots.

Widths are relative to the available parent container, not the entire screen.
Automatic breakpoint-based stacking is not part of this contract. A renderer
may offer a separately documented responsive extension, but it must not silently
reinterpret explicit column allocations.

### Conformance scenarios

Verify actual measured bounds, not only configuration or style names:

- A lone width-4 child remains quarter width.
- 4 + Auto and 4 + Auto + Auto distribute remaining space correctly.
- Fixed-only rows retain unused space.
- 16 occupies a complete row; 12 + 8 + Auto wraps in order.
- Three Auto children receive equal fractional widths.
- A nested layout and a presentation element follow the same allocation rules.
- Hiding and showing a child reallocates space without changing data or order.
- Disabled children retain space.
- Invalid, fractional, out-of-range, and string-number options fall back to Auto.
- Different container sizes and display densities preserve proportions.

The shared `horizontal-sizing` example illustrates these cases.

## Group

A Group presents its children vertically with an optional resolved `label`.
The exact border, background, and heading treatment follow the design system.

### Options

These are **extensions**:

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `collapsible` | Boolean | `false` | Enable an expand/collapse action |
| `collapsed` | Boolean | `false` | Initial collapsed state when collapsible |
| `showDataIndicator` | Boolean | `false` | Show an indicator when bound descendants contain meaningful data |

Only explicit `true` enables these Boolean options. A non-collapsible Group
must remain expanded even if `collapsed` is true.

The expand/collapse action uses an appropriate disclosure icon and an accessible
name. Its state must be exposed to assistive technology. Collapsed content is
not operable; expanding restores the same data. Toggling does not rewrite
`options.collapsed` or any other model property.

If the host changes the supplied initial-state option, the implementation
should apply the new state. Routine data updates must not reset a user's
expand/collapse choice.

### Data indicator

When enabled, the indicator is visible in the header in both expanded and
collapsed states if any descendant control has meaningful bound data. It is
independent of validation and required status. It should have an accessible
description in addition to its visual dot or equivalent mark.

Meaningful data is defined recursively:

- `undefined`, `null`, and blank/whitespace-only strings are empty.
- Empty arrays and objects are empty.
- An array or object is meaningful when any nested value is meaningful.
- `false` and numeric zero are meaningful values.
- Bound data counts even when its control is currently hidden by a rule.

Only data bound to descendant controls is considered. Unrelated sibling data
does not activate the indicator. Nested object and array contexts must resolve
the correct item data.

```json
{
  "type": "Group",
  "label": "Contact details",
  "options": {
    "collapsible": true,
    "collapsed": false,
    "showDataIndicator": true
  },
  "elements": [
    { "type": "Control", "scope": "#/properties/email" }
  ]
}
```

Verify initial state, repeated toggling, keyboard interaction, preserved data,
zero/false values, clearing values, nested contexts, and indicator visibility
in both collapsed and expanded states.

## Categorization and Category

Categorization presents navigation between its Category children. Category
labels identify their navigation items, and each Category arranges its
elements in document order, normally vertically. Alternative navigation styles
may be supported as separately documented extensions.

Navigation must not clear or recreate bound form data. Hidden categories must
not remain selectable. A suitable visible category should become active when
the current one becomes unavailable. If none are visible, no category content
should be operable.

The navigation must expose the active category and support keyboard or equivalent
platform navigation. Verify nested layouts, rule-hidden categories, changing
active categories, and preservation of data and validation state.
