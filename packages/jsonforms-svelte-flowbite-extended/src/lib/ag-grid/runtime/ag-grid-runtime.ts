import type {
  GridApi,
  GridOptions,
  ICellRendererComp,
  ICellRendererParams,
  Theme,
} from 'ag-grid-community';
import { mount, unmount, type ComponentInternals } from 'svelte';
import type { AgGridCellHostProps, AgGridWrappedRow } from '../types.js';
import DispatchCellHost from './DispatchCellHost.svelte';

type CellHostExports = { refresh: (props: AgGridCellHostProps) => void };
type RuntimeModule = typeof import('ag-grid-community');
let runtimePromise: Promise<RuntimeModule> | undefined;

const sameCellProps = (left: AgGridCellHostProps, right: AgGridCellHostProps): boolean =>
  left.schema === right.schema &&
  left.uischema === right.uischema &&
  left.path === right.path &&
  left.enabled === right.enabled &&
  left.renderers === right.renderers &&
  left.cells === right.cells &&
  left.config === right.config;

export const loadAgGridRuntime = async (): Promise<RuntimeModule> => {
  runtimePromise ??= import('ag-grid-community');
  return runtimePromise;
};

export const createAppearanceTheme = (runtime: RuntimeModule): Theme =>
  runtime.themeQuartz.withParams({
    browserColorScheme: 'inherit',
    accentColor: 'var(--jsonforms-ag-grid-accent)',
    backgroundColor: 'var(--jsonforms-ag-grid-background)',
    foregroundColor: 'var(--jsonforms-ag-grid-foreground)',
    borderColor: 'var(--jsonforms-ag-grid-border)',
    headerBackgroundColor: 'var(--jsonforms-ag-grid-header-background)',
    headerTextColor: 'var(--jsonforms-ag-grid-header-foreground)',
    oddRowBackgroundColor: 'var(--jsonforms-ag-grid-odd-row-background)',
    selectedRowBackgroundColor: 'var(--jsonforms-ag-grid-selected-row-background)',
    rowHoverColor: 'var(--jsonforms-ag-grid-row-hover)',
    fontFamily: 'var(--jsonforms-ag-grid-font-family)',
  });

export const createDispatchCellRenderer = (
  contexts: Map<unknown, unknown>,
  getCellProps: (params: ICellRendererParams<AgGridWrappedRow>) => AgGridCellHostProps,
): new () => ICellRendererComp<AgGridWrappedRow> =>
  class JsonFormsDispatchCellRenderer implements ICellRendererComp<AgGridWrappedRow> {
    private readonly element = document.createElement('div');
    private component: (ComponentInternals & CellHostExports) | undefined;
    private props: AgGridCellHostProps | undefined;

    init(params: ICellRendererParams<AgGridWrappedRow>) {
      this.element.className = 'jsonforms-ag-grid-cell-host';
      this.props = getCellProps(params);
      this.component = mount(DispatchCellHost, {
        target: this.element,
        context: contexts,
        props: { initialProps: this.props },
      }) as ComponentInternals & CellHostExports;
    }
    getGui() {
      return this.element;
    }
    refresh(params: ICellRendererParams<AgGridWrappedRow>) {
      const next = getCellProps(params);
      if (!this.props || !sameCellProps(this.props, next)) {
        this.props = next;
        this.component?.refresh(next);
      }
      return true;
    }
    destroy() {
      if (this.component) {
        void unmount(this.component);
        this.component = undefined;
      }
      this.props = undefined;
    }
  };

export const createGrid = async (
  element: HTMLElement,
  options: GridOptions<AgGridWrappedRow>,
  contexts: Map<unknown, unknown>,
  getCellProps: (params: ICellRendererParams<AgGridWrappedRow>) => AgGridCellHostProps,
): Promise<GridApi<AgGridWrappedRow>> => {
  const runtime = await loadAgGridRuntime();
  const root = element.getRootNode();
  const themeStyleContainer = root instanceof ShadowRoot ? element : options.themeStyleContainer;
  const CellRenderer = createDispatchCellRenderer(contexts, getCellProps);

  return runtime.createGrid(
    element,
    {
      ...options,
      theme: options.theme ?? createAppearanceTheme(runtime),
      themeStyleContainer,
      components: { ...(options.components ?? {}), JsonFormsDispatchCell: CellRenderer },
    },
    { modules: [runtime.AllCommunityModule] },
  );
};
