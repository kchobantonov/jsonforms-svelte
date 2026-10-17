import { mount, unmount, type Component } from 'svelte';
import { writable } from 'svelte/store';
import type { NativeTemplateDescriptor, NativeTemplateProps } from './nativeTemplate';
import NativeTemplateHost from '../layouts/NativeTemplateHost.svelte';

/** Keep component creation and disposal in the host's Svelte runtime. Delegated
 * slots mount in the renderer's runtime, including separately bundled custom elements. */
export function defineNativeTemplate<TData = unknown>(
  component: Component<NativeTemplateProps<TData>>,
): NativeTemplateDescriptor<TData> {
  return {
    kind: 'svelte-component',
    mount(target, props, mountSlot) {
      const state = writable(props);
      const instance = mount(NativeTemplateHost<TData>, {
        target,
        props: { template: component, values: state, mountSlot },
      });
      return { update: (next) => state.set(next), destroy: () => unmount(instance) };
    },
  };
}
