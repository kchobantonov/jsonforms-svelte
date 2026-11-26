type Props = {
    id: string;
    value: string;
    active: boolean;
    onSelect: (value: string) => void;
};
declare const TagsInputSuggestion: import("svelte").Component<Props, {}, "">;
type TagsInputSuggestion = ReturnType<typeof TagsInputSuggestion>;
export default TagsInputSuggestion;
