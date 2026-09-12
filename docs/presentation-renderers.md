# Presentation renderers

All base renderer registries (Shadcn, Skeleton, Flowbite), and therefore their
extended registries, support these data-independent UI-schema elements:

| Type | Options | Default |
| --- | --- | --- |
| `Separator` | None; horizontal divider | Themed divider |
| `Spacer` | `height`: nonnegative number in CSS pixels | 32px |
| `ImageView` | `src`: image URL or relative path; `alt`: alternative text | Empty source renders no image; empty alt is decorative |

They respect JSON Forms visibility rules and do not create schema properties or
modify form data. The editor exposes them under Presentation. URLs are used as
image sources, never injected as HTML. Applications remain responsible for URL
resolution and supplying meaningful alternative text for informative images.

Shadcn uses its unchanged Separator component. Flowbite uses Hr and Img.
Skeleton uses its styled native horizontal rule. There is no dedicated Spacer
widget in these libraries, so it is a structural div; Shadcn and Skeleton use a
responsive native img because an avatar would change the image's semantics and
crop it. These are intentional exceptions to the component-first UI policy.
The new Shadcn Separator import is part of the documented app-owned UI contract;
no shared shadcn source was customized.

## Demo examples

Select **Presentation Renderers** (`presentation-renderers` in the editor demo)
to see Label, Separator, ImageView, the default 32px Spacer and a custom 64px
Spacer alongside editable controls. The image is embedded in the example, so it
requires no external image service or asset-path configuration.

**Selection Renderers** (`selection-renderers`) demonstrates enum and oneOf
selects, a radio group and an array-backed checkbox group with initial values.
Both examples are registered in the shared Skeleton, Flowbite and Shadcn catalog
and discovered automatically by the editor demo.
