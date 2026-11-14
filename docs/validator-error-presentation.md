# Validator error presentation

The extended form supplies a default error translator that reads the current locale
when displaying errors. Existing errors therefore change language without editing
or revalidating the data. A host-provided `i18n.translateError` takes precedence.

Only errors produced by the extended validator carry the internal metadata needed
for this translation. Host additional errors retain their supplied messages. The
adapter localizes copies and does not mutate the stored errors during presentation.
Validator-time translation remains supported for consumers reading Ajv directly.

Authored `errorMessage` wrappers are recursively expanded to the underlying keyword,
instance path and parameters. The authored text is retained separately so a later
locale change can resolve `error.errorMessage.<authored text>` again. Control-specific
and generic keyword overrides keep the standard JSON Forms precedence. An enclosing
authored wrapper supplies the message for its wrapped descendants.

The existing AJV locale providers supply ordinary keyword wording. Renderer UI
messages continue to use the JSON catalogs described in `i18n-catalogs.md`.

The validator-profile demo uses the canonical spec schema and English/Bulgarian
catalogs. Full structured-summary, per-field pre-touch and additional-error acceptance
is still tracked separately in TODO.md.
