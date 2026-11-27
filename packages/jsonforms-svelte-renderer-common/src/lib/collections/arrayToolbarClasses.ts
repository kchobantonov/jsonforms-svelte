import type { VendorProps } from '../controls/inputOptions';

export function arrayToolbarClasses(
  styles: { toolbar?: string; title?: string; label?: string },
  merge: (...classes: (string | undefined)[]) => string,
) {
  return {
    toolbarClass: merge('flex items-center justify-between px-4 py-2', styles.toolbar),
    titleClass: merge('flex items-center gap-2', styles.title),
    labelClass: merge('text-lg font-semibold', styles.label),
  };
}

export function arrayCardProps<P extends VendorProps>(
  vendor: P,
  root: string | undefined,
  base: string,
  merge: (...classes: VendorProps['class'][]) => string,
) {
  return { ...vendor, class: merge(base, root, vendor.class) };
}
