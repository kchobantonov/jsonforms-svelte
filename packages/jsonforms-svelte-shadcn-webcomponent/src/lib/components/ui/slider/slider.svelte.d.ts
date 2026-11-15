import { Slider as SliderPrimitive } from 'bits-ui';
import { type WithoutChildrenOrChild } from '@jsonforms-svelte-shadcn-ui/utils.js';
type Props = WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
    showValue?: boolean;
};
declare const Slider: import("svelte").Component<Props, {}, "value" | "ref">;
type Slider = ReturnType<typeof Slider>;
export default Slider;
