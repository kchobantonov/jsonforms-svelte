import cloneDeep from 'lodash/cloneDeep';
import {
  defaultUrlPolicy,
  type UrlPolicy,
  type UIDiagnosticReporter,
} from '@chobantonov/jsonforms-svelte';
import { sanitizeTemplateUrls } from './templateUrls';
import type { SlotPlaceholder } from './ractiveTemplateController';

type TemplateValues = {
  data?: unknown;
  errors?: unknown;
  context?: unknown;
  elements?: { name: string }[];
  translate?: (key: string, fallback?: string) => string;
};
type JsxNode = { tag: string | symbol; props: Record<string, unknown>; children: unknown[] };
type Slot = { readonly slotName: string; readonly kind: 'slot' };
type Render = (h: typeof createElement, ...values: unknown[]) => unknown;

const Fragment = Symbol('jsx-fragment');
const createElement = (
  tag: string | symbol,
  props: Record<string, unknown> | null,
  ...children: unknown[]
): JsxNode => ({
  tag,
  props: props ?? {},
  children,
});

let compilerPromise: Promise<typeof import('sucrase')> | undefined;
const loadCompiler = () =>
  (compilerPromise ??= import('sucrase').catch((error) => {
    compilerPromise = undefined;
    throw error;
  }));

export class JsxTemplateEngineLoadError extends Error {
  constructor(cause: unknown) {
    super('Unable to load the JSX template compiler.', { cause });
  }
}

function appendValue(
  parent: Node,
  value: unknown,
  slots: SlotPlaceholder[],
  reusable: Map<string, HTMLElement[]>,
) {
  if (value == null || typeof value === 'boolean') return;
  if (Array.isArray(value)) {
    for (const child of value) appendValue(parent, child, slots, reusable);
    return;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    parent.appendChild(document.createTextNode(String(value)));
    return;
  }
  if (typeof value !== 'object') throw new Error(`Unsupported JSX child: ${typeof value}`);
  if ((value as Slot).kind === 'slot') {
    const name = (value as Slot).slotName;
    const placeholder = reusable.get(name)?.shift() ?? document.createElement('span');
    placeholder.setAttribute('data-jsonforms-template-slot', name);
    placeholder.style.display = 'contents';
    parent.appendChild(placeholder);
    slots.push({ name, el: placeholder });
    return;
  }
  const node = value as JsxNode;
  if (node.tag === Fragment) {
    for (const child of node.children) appendValue(parent, child, slots, reusable);
    return;
  }
  if (typeof node.tag !== 'string')
    throw new Error('JSX templates can render HTML tags and JSON Forms elements.');
  const element = document.createElement(node.tag);
  for (const [key, raw] of Object.entries(node.props)) {
    if (
      key === 'key' ||
      key === 'ref' ||
      key === '__self' ||
      key === '__source' ||
      raw == null ||
      raw === false
    )
      continue;
    if (key === 'dangerouslySetInnerHTML' || key === 'innerHTML')
      throw new Error('Raw HTML is not supported in JSX templates.');
    if (/^on[A-Z]/.test(key) && typeof raw === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), raw as EventListener);
      continue;
    }
    if (key === 'style' && typeof raw === 'object') {
      for (const [property, value] of Object.entries(raw))
        element.style.setProperty(
          property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
          String(value),
        );
      continue;
    }
    const attribute = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
    if (raw === true) element.setAttribute(attribute, '');
    else element.setAttribute(attribute, String(raw));
  }
  for (const child of node.children) appendValue(element, child, slots, reusable);
  parent.appendChild(element);
}

/** A small JSX DOM runtime. The compiler is fetched only for a visible, permitted JSX template. */
export class JsxTemplateController {
  private container: HTMLElement | null = null;
  private source = '';
  private renderTemplate: Render | null = null;
  private values: TemplateValues = {};
  private visible = false;
  private revision = 0;
  private slots: SlotPlaceholder[] = [];
  private slotRoots = new WeakSet<Element>();

  constructor(
    private onMountSlots: (slots: SlotPlaceholder[]) => void,
    private allowed: () => boolean,
    private urlPolicy: () => UrlPolicy = () => defaultUrlPolicy,
    private reportDiagnostic?: UIDiagnosticReporter,
  ) {}

  registerSlotRoot(element: Element): () => void {
    this.slotRoots.add(element);
    return () => this.slotRoots.delete(element);
  }

  private owns(element: Element): boolean {
    let current: Element | null = element;
    while (current && current !== this.container) {
      if (this.slotRoots.has(current)) return false;
      current = current.parentElement;
    }
    return true;
  }

  async setup(container: HTMLElement, source: string, values: TemplateValues, visible: boolean) {
    this.container = container;
    this.values = values;
    this.visible = visible;
    if (this.source !== source) this.renderTemplate = null;
    this.source = source;
    const revision = ++this.revision;
    if (!visible || !this.allowed()) return this.clear();
    if (!this.renderTemplate) {
      let compiler: typeof import('sucrase');
      try {
        compiler = await loadCompiler();
      } catch (error) {
        if (revision !== this.revision) return;
        throw new JsxTemplateEngineLoadError(error);
      }
      if (revision !== this.revision || !this.allowed()) return;
      const code = compiler.transform(`function render(){return (${source});}`, {
        transforms: ['jsx'],
        jsxPragma: 'h',
        jsxFragmentPragma: 'Fragment',
      }).code;
      this.renderTemplate = new Function(
        'h',
        'data',
        'errors',
        'context',
        'elements',
        'translate',
        'Fragment',
        `${code}\nreturn render();`,
      ) as Render;
    }
    if (revision === this.revision) this.render();
  }

  async updateData(key: string, value: unknown) {
    this.values = { ...this.values, [key]: value };
    if (this.visible && this.allowed()) this.render();
  }

  async refreshPolicy() {
    if (this.visible && this.allowed()) this.render();
  }

  async updateVisibility(visible: boolean) {
    this.visible = visible;
    if (!visible || !this.allowed()) this.clear();
    else this.render();
  }

  async destroy() {
    this.revision++;
    this.visible = false;
    this.clear();
  }

  private clear() {
    this.slots = [];
    this.onMountSlots([]);
    this.container?.replaceChildren();
  }

  private render() {
    if (!this.visible || !this.allowed() || !this.container || !this.renderTemplate) return;
    const reusable = new Map<string, HTMLElement[]>();
    for (const slot of this.slots)
      reusable.set(slot.name, [...(reusable.get(slot.name) ?? []), slot.el]);
    const ordered = (this.values.elements ?? []).map(
      ({ name }) => ({ kind: 'slot', slotName: name }) as Slot,
    );
    const named = Object.create(null) as Record<string, Slot>;
    for (const element of ordered) named[element.slotName] = element;
    const elements = new Proxy(ordered, {
      get(target, key, receiver) {
        if (key === Symbol.iterator) return target[Symbol.iterator].bind(target);
        if (typeof key === 'string' && Object.hasOwn(named, key)) return named[key];
        return Reflect.get(target, key, receiver);
      },
    });
    const output = this.renderTemplate(
      createElement,
      cloneDeep(this.values.data),
      cloneDeep(this.values.errors) ?? [],
      this.values.context,
      elements,
      this.values.translate,
      Fragment,
    );
    const stage = document.createElement('div');
    const slots: SlotPlaceholder[] = [];
    appendValue(stage, output, slots, reusable);
    sanitizeTemplateUrls(
      stage,
      this.urlPolicy(),
      (element) => this.owns(element),
      undefined,
      this.reportDiagnostic,
    );
    this.container.replaceChildren(...Array.from(stage.childNodes));
    this.slots = slots;
    this.onMountSlots(slots);
  }
}
