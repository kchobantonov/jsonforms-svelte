import * as ResizablePrimitive from 'paneforge';
type $$ComponentProps = ResizablePrimitive.PaneGroupProps & {
    this?: ResizablePrimitive.PaneGroup;
};
declare const ResizablePaneGroup: import("svelte").Component<$$ComponentProps, {
    getLayout: () => number[] | undefined;
    setLayout: (sizes: number[]) => void | undefined;
}, "ref" | "this">;
type ResizablePaneGroup = ReturnType<typeof ResizablePaneGroup>;
export default ResizablePaneGroup;
