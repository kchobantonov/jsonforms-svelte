# Demo configuration precedence

Every family uses the same order:

1. Demo defaults, including `restrict: true`.
2. The example's configuration, or its replacement applied from the Config editor.
3. Explicit choices made in the settings panel during the session.

Opening the settings panel does not create overrides. Its controls show the effective value, including the example's keyword list and explicit false values. Changing a setting creates an override for that key; untouched defaults no longer overwrite authored configuration. Session overrides survive example navigation and are not persisted.

Arrays and compound bags are replaced at each tier. Applying Config changes replaces the authored tier; it does not clear an existing explicit settings override. This follows the React demo's distinction between authored values and settings choices.

The shared resolver has unit coverage for defaults, explicit false, empty lists, compound replacement and switching examples. End-to-end coverage applies pre-touch filtering through the real Config editor and checks the visible errors without changing data or the validation summary.

## Example sources

All three demos default to **Spec examples**. The sidebar source selector also offers **JSON Forms originals** and **All examples**, and search applies within that source. Original examples use the same `jsonforms-` URL prefix and `JsonForms: ` label prefix as the React demo. The Home action opens the spec kitchen-sink example.

Development fixtures remain in the full route registry for direct links and tests, but do not appear in any public source list. Add fixtures through the existing example factories; use `filterPublicDemoExamples` for navigation so development examples do not leak into the public catalog. Source filtering does not reset the active form. Labels come from the shared demo JSON catalog.
