import { Tooltip as TooltipPrimitive } from 'bits-ui';
declare function $$render<T = never>(): {
    props: TooltipPrimitive.TriggerProps<T>;
    exports: {};
    bindings: "ref";
    slots: {};
    events: {};
};
declare class __sveltets_Render<T = never> {
    props(): ReturnType<typeof $$render<T>>['props'];
    events(): ReturnType<typeof $$render<T>>['events'];
    slots(): ReturnType<typeof $$render<T>>['slots'];
    bindings(): "ref";
    exports(): {};
}
interface $$IsomorphicComponent {
    new <T = never>(options: import('svelte').ComponentConstructorOptions<ReturnType<__sveltets_Render<T>['props']>>): import('svelte').SvelteComponent<ReturnType<__sveltets_Render<T>['props']>, ReturnType<__sveltets_Render<T>['events']>, ReturnType<__sveltets_Render<T>['slots']>> & {
        $$bindings?: ReturnType<__sveltets_Render<T>['bindings']>;
    } & ReturnType<__sveltets_Render<T>['exports']>;
    <T = never>(internal: unknown, props: ReturnType<__sveltets_Render<T>['props']> & {}): ReturnType<__sveltets_Render<T>['exports']>;
    z_$$bindings?: ReturnType<__sveltets_Render<any>['bindings']>;
}
declare const TooltipTrigger: $$IsomorphicComponent;
type TooltipTrigger<T = never> = InstanceType<typeof TooltipTrigger<T>>;
export default TooltipTrigger;
