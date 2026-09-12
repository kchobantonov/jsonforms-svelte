export default {
  compilerOptions: { customElement: true },
  // Only EditorElement is compiled as a custom element by Vite. svelte-check
  // applies this setting globally; ignore its warning for ordinary child components.
  warningFilter: (warning) =>
    warning.code !== "custom_element_props_identifier",
};
