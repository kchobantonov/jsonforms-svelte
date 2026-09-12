# Group options

Shadcn, Skeleton, and Flowbite Group renderers support the same optional settings:

| UI schema option | Default | Behavior |
| --- | --- | --- |
| `collapsible` | `false` | Show an icon button in the heading to expand/collapse the content. |
| `collapsed` | `false` | Initial collapsed state; changing this option resets the state. Ignored when `collapsible` is false. |
| `showDataIndicator` | `false` | Show a dot beside the heading controls when a descendant control has data. |

```json
{
  "type": "Group",
  "label": "Contact details",
  "options": {
    "collapsible": true,
    "collapsed": false,
    "showDataIndicator": true
  },
  "elements": [{ "type": "Control", "scope": "#/properties/email" }]
}
```

The indicator stays in the heading in both expanded and collapsed states. It
checks controls recursively through child layouts at the current JSON Forms data
path, including array-item contexts. Unrelated form data does not activate it.
Zero and false count as data; null, undefined, blank strings, and recursively empty
objects/arrays do not. This is a data-presence indicator, not a validation or dirty
state indicator. Defaults only count if present in the current form data.

Collapsing hides content without unmounting controls or discarding data. The icon
button exposes `aria-expanded` and `aria-controls`, uses the group label as its
accessible name, and works with keyboard activation. Collapse is a viewing action,
so a read-only group's content may still be expanded. Existing groups without
these options retain their expanded presentation without controls or indicators.
