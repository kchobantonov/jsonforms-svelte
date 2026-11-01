declare const InputGroupInput: import("svelte").Component<(Omit<import("svelte/elements").HTMLInputAttributes, "type"> & ({
    type: "file";
    files?: FileList;
} | {
    type?: "number" | "month" | "date" | "week" | "search" | "password" | "hidden" | "color" | "submit" | "reset" | "button" | "checkbox" | "radio" | (string & {}) | "text" | "tel" | "url" | "email" | "time" | "image" | "datetime-local" | "range";
    files?: undefined;
})) & {
    ref?: HTMLElement | null | undefined;
}, {}, "value" | "ref">;
type InputGroupInput = ReturnType<typeof InputGroupInput>;
export default InputGroupInput;
