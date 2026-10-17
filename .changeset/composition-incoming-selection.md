---
'@chobantonov/jsonforms-svelte': patch
'@chobantonov/jsonforms-svelte-flowbite': patch
'@chobantonov/jsonforms-svelte-skeleton': patch
'@chobantonov/jsonforms-svelte-shadcn': patch
---

Follow incoming oneOf data until a user chooses a branch, discard stale detail when its node disappears, and recognize distinct required discriminators even when other branch fields are invalid. Bound selected indexes after branch replacement and preserve editable object-only array slots when clearing a branch.

Route missing required discriminator errors to localized selector feedback and honor validation visibility. Cache discriminator reference analysis by schema/root identity.

Keep an explicitly selected branch open when its generated defaults are an empty object.
