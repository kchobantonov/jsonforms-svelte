# Demo configuration precedence

Every family uses the same order:

1. Demo defaults, including `restrict: true`.
2. The example's configuration, or its replacement applied from the Config editor.
3. Explicit choices made in the settings panel during the session.

Opening the settings panel does not create overrides. Its controls show the effective value, including the example's keyword list and explicit false values. Changing a setting creates an override for that key; untouched defaults no longer overwrite authored configuration. Session overrides survive example navigation and are not persisted.

Arrays and compound bags are replaced at each tier. Applying Config changes replaces the authored tier; it does not clear an existing explicit settings override. This follows the React demo's distinction between authored values and settings choices.

The shared resolver has unit coverage for defaults, explicit false, empty lists, compound replacement and switching examples. End-to-end coverage applies pre-touch filtering through the real Config editor and checks the visible errors without changing data or the validation summary.
