export type SplitPaneDirection = 'horizontal' | 'vertical';

export interface SplitPaneContextValue {
  registerPane: (id: string) => () => void;
  getIndex: (id: string) => number;
  getDefaultSize: (id: string) => number | undefined;
  getMinSize: (id: string) => number;
  getMaxSize: (id: string) => number;
  getDirection: () => SplitPaneDirection;
  isStacked: () => boolean;
  isResizable: () => boolean;
  getResizeLabel: () => string;
}

export const SplitPaneContextSymbol = Symbol('SplitPaneContext');
