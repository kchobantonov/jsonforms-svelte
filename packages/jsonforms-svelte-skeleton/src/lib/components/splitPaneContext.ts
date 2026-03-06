export type SplitPaneDirection = 'horizontal' | 'vertical';

export interface SplitPaneContextValue {
  registerPane: () => number;
  getPaneStyle: (index: number) => string;
  getPaneSize: (index: number) => number;
  shouldRenderDivider: (index: number) => boolean;
  getDirection: () => SplitPaneDirection;
  getIsDragging: () => boolean;
  onPointerDown: (event: PointerEvent, index: number) => void;
  onKeyDown: (event: KeyboardEvent, index: number) => void;
}

export const SplitPaneContextSymbol = Symbol('SplitPaneContext');
