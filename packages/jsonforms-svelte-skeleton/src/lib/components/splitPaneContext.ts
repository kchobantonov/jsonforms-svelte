export type SplitPaneDirection = 'horizontal' | 'vertical';

export interface SplitPaneContextValue {
  registerPane: (id: string) => () => void;
  getIndex: (id: string) => number;
  getPaneStyle: (index: number) => string;
  getMinSize: (index: number) => number;
  getMaxSize: (index: number) => number;
  getPaneSize: (index: number) => number;
  shouldRenderDivider: (index: number) => boolean;
  getDirection: () => SplitPaneDirection;
  getIsDragging: () => boolean;
  isResizable: () => boolean;
  getResizeLabel: () => string;
  onPointerDown: (event: PointerEvent, index: number) => void;
  onKeyDown: (event: KeyboardEvent, index: number) => void;
}

export const SplitPaneContextSymbol = Symbol('SplitPaneContext');
