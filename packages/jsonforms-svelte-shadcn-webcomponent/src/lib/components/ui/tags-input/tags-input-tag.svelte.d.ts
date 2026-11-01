type Props = {
    value: string;
    disabled: boolean | null;
    active: boolean;
    onDelete: (value: string) => void;
    removeLabel?: (value: string) => string;
};
declare const TagsInputTag: import("svelte").Component<Props, {}, "">;
type TagsInputTag = ReturnType<typeof TagsInputTag>;
export default TagsInputTag;
