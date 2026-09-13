# Presentation renderers

Presentation elements display content or spacing without binding an editable
value. They must not create or change form data. They participate in visibility
rules and, when directly inside HorizontalLayout, its column-allocation contract.

The contracts below define portable behavior; visual styling follows the
implementation's design system.

## Label

Discriminator: `"type": "Label"`.

Display the element's resolved `text` as plain text. The text should participate
in the host's translation mechanism. It must not be interpreted as executable
code or markup. A separate renderer is required for richer content semantics.

```json
{ "type": "Label", "text": "Please provide your contact details." }
```

Verify text display, translation updates, literal markup characters, and
visibility rules without data changes.

## Separator

Discriminator: `"type": "Separator"` (**extension**).

Display a horizontal visual divider using the available inline width. No
additional portable options are currently defined. A Separator has no input
behavior and must not enter the keyboard interaction order.

Use suitable platform separator semantics; a purely decorative divider may be
hidden from assistive technology.

```json
{ "type": "Separator" }
```

Verify appearance in supported themes, width allocation, and rule visibility.

## Spacer

Discriminator: `"type": "Spacer"` (**extension**).

Reserve empty vertical space. A Spacer has no focus target, accessible content,
label, or data effect.

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `height` | Finite number | 32 | Height in logical layout units |

Logical units correspond to CSS pixels on the web or equivalent
density-independent units on other platforms. Zero is valid. Negative finite
values render as zero; absent, nonnumeric, or non-finite values use the default.
The supplied option must not be rewritten when applying these fallbacks.

The spacer's requested height must not shrink simply because adjacent content
requires space.

```json
{ "type": "Spacer", "options": { "height": 48 } }
```

Verify default, zero, positive, negative, and invalid heights, alongside
visibility rules and surrounding layout constraints.

## ImageView

Discriminator: `"type": "ImageView"` (**extension**).

Display an image without changing form data.

| Option | Type | Default | Behavior |
| --- | --- | --- | --- |
| `src` | String | Empty | Image resource location |
| `alt` | String | Empty | Alternative text |

An empty or non-string source produces no image. A non-string alternative text
is treated as empty. The image must preserve its intrinsic aspect ratio and
must not exceed the available inline width. Unnecessary upscaling is not required.

Resource locations are interpreted through the host platform's resource-loading
and security policies. The renderer must not evaluate the source as code or
invent a separate transport protocol. Loading failures should not destabilize
the form.

Alternative text must be exposed through the platform's image accessibility
mechanism. An empty alternative text identifies an image as decorative where
the platform supports that convention.

```json
{
  "type": "ImageView",
  "options": {
    "src": "https://example.org/assets/help.png",
    "alt": "An example of a completed address label"
  }
}
```

Verify a valid source, no source, alternative text, aspect ratio, bounded width,
resource failure, and visibility rules. The shared `presentation-renderers`
example combines all four presentation elements.
