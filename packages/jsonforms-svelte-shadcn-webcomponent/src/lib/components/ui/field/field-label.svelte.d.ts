declare const FieldLabel: import("svelte").Component<Omit<{}, "children" | "child"> & {
    child?: import("svelte").Snippet<[{
        props: Record<string, unknown>;
    }]> | undefined;
    children?: import("svelte").Snippet<[]> | undefined;
    style?: import("bits-ui").StyleProperties | string | null | undefined;
    ref?: HTMLElement | null | undefined;
} & import("bits-ui").Without<import("bits-ui").BitsPrimitiveLabelAttributes, import("bits-ui").LabelRootPropsWithoutHTML>, {}, "ref">;
type FieldLabel = ReturnType<typeof FieldLabel>;
export default FieldLabel;
