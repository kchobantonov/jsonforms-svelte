export const componentSections = [
  { title: "Inputs", presets: ["text", "textarea", "number"] },
  { title: "Selection", presets: ["checkbox", "Checkbox group", "Radio group", "Select"]  },
  { title: "Presentation", presets: ["Label", "Separator", "Spacer", "Image View"] },
  { title: "Actions", presets: ["Button"] },
  {
    title: "Containers",
    presets: ["VerticalLayout", "HorizontalLayout", "Group", "Categorization"],
  },
];
export const presets = componentSections.flatMap((section) => section.presets);
