import cloneDeep from 'lodash/cloneDeep';
import { defaultUrlPolicy, type UrlPolicy } from '@chobantonov/jsonforms-svelte';
import { sanitizeTemplateUrls } from './templateUrls';
import type Ractive from 'ractive';
import type { Data, DataFn, ParsedTemplate, Partial, Registry } from 'ractive';

export class TemplateEngineLoadError extends Error {
  constructor(cause: unknown) {
    super('Unable to load the Ractive template engine.', { cause });
  }
}
type LoadedEngine = { Engine: typeof Ractive };
let enginePromise: Promise<LoadedEngine> | undefined;
const loadRactive = (): Promise<LoadedEngine> =>
  (enginePromise ??= (import('ractive') as Promise<unknown>)
    .then((module): LoadedEngine => {
      // Limit inference at the loader boundary: Ractive's recursive generic constructor
      // otherwise exhausts TypeScript while comparing promise callbacks.
      const Engine = (module as { default: typeof Ractive }).default;
      Engine.DEBUG = false;
      return { Engine };
    })
    .catch((error) => {
      enginePromise = undefined;
      throw error;
    }));

export interface SlotPlaceholder {
  name: string;
  el: HTMLElement;
}

export class RactiveTemplateController {
  private slotRoots = new WeakSet<Element>();
  private ractive: Ractive | null = null;
  private engine: typeof Ractive | null = null;
  private onMountSlots: (slots: SlotPlaceholder[]) => void;
  private container: HTMLElement | null = null;
  private template: ParsedTemplate | null = null;
  private source = '';
  private data: (Data | DataFn<Ractive>) & { elements?: { name: string }[] } = {};
  private visible = false;
  private revision = 0;
  private pendingTeardown: Promise<void> = Promise.resolve();

  constructor(
    onMountSlots: (slots: SlotPlaceholder[]) => void,
    private allowed: () => boolean = () => false,
    private loadEngine: () => Promise<LoadedEngine> = loadRactive,
    private urlPolicy: () => UrlPolicy = () => defaultUrlPolicy,
  ) {
    this.onMountSlots = onMountSlots;
  }

  registerSlotRoot(element: Element): () => void {
    this.slotRoots.add(element);
    return () => {
      this.slotRoots.delete(element);
    };
  }

  private owns(element: Element): boolean {
    let current: Element | null = element;
    while (current && current !== this.container) {
      if (this.slotRoots.has(current)) return false;
      current = current.parentElement;
    }
    return true;
  }

  async destroy() {
    this.visible = false;
    this.revision += 1;
    this.onMountSlots([]);

    const teardown = this.teardownCurrentInstance();
    await (teardown ?? this.pendingTeardown);
  }

  async updateData(keyPath: string, value: unknown) {
    if (!this.allowed()) {
      await this.destroy();
      return;
    }
    this.data = { ...this.data, [keyPath]: value };
    const instance = this.ractive;
    const revision = this.revision;

    if (instance) {
      await instance.set(
        keyPath,
        keyPath === 'data' || keyPath === 'errors' ? cloneDeep(value) : value,
      );
      if (keyPath === 'context') await instance.update(keyPath);

      if (instance === this.ractive && revision === this.revision && this.visible) {
        this.reportSlots();
      }
    }
  }

  async setup(
    container: HTMLElement,
    template: string,
    data: (Data | DataFn<Ractive>) & { elements?: { name: string }[] },
    visible: boolean,
  ) {
    if (!this.allowed()) {
      await this.destroy();
      return;
    }
    this.container = container;
    this.template = null;
    this.source = template;
    this.data = data;
    this.visible = visible;
    const revision = ++this.revision;

    if (!visible) {
      this.onMountSlots([]);
      const teardown = this.teardownCurrentInstance();
      if (teardown) {
        await teardown;
      }
      return;
    }

    await this.render(revision);
  }

  async updateVisibility(visible: boolean) {
    if (!this.allowed()) {
      await this.destroy();
      return;
    }
    this.visible = visible;
    const revision = ++this.revision;

    if (!visible) {
      this.onMountSlots([]);
      const teardown = this.teardownCurrentInstance();
      if (teardown) {
        await teardown;
      }
    } else if (!this.ractive) {
      await this.render(revision);
    }
  }

  private async render(revision: number) {
    if (!this.allowed() || !this.container || !this.source || !this.visible) return;
    if (!this.template) {
      const source = this.source;
      let Engine: typeof Ractive;
      try {
        Engine = (await this.loadEngine()).Engine;
      } catch (error) {
        if (revision !== this.revision || !this.allowed()) return;
        throw new TemplateEngineLoadError(error);
      }
      if (revision !== this.revision || !this.allowed()) return;
      this.engine = Engine;
      this.template = Engine.parse(source);
    }

    const teardown = this.teardownCurrentInstance();
    await (teardown ?? this.pendingTeardown);

    if (
      !this.allowed() ||
      revision !== this.revision ||
      !this.visible ||
      !this.container ||
      !this.template
    ) {
      return;
    }

    const container = this.container;
    const template = this.template;
    const data = this.data;
    container.innerHTML = '';

    const partials: Registry<Partial> = Object.create(null);

    data.elements?.forEach((element) => {
      const placeholder = document.createElement('div');
      placeholder.setAttribute('data-slot', element.name);
      partials[element.name] = placeholder.outerHTML;
    });

    const Engine = this.engine;
    if (!Engine) return;
    const instance = new Engine({
      template,
      partials,
      data: {
        ...data,
        data: cloneDeep((data as Record<string, unknown>).data),
        errors: cloneDeep((data as Record<string, unknown>).errors),
      },
      twoway: false,
      lazy: false,
    });
    this.ractive = instance;
    // Deferred observation runs after local events update the engine's DOM.
    // Ractive's update hook only covers explicit update(), not ordinary set().
    instance.observe(
      '',
      () => {
        if (this.ractive === instance && this.visible && this.allowed()) this.reportSlots();
      },
      { defer: true, init: false },
    );

    try {
      await instance.render(container);
    } catch (error) {
      const isCurrentInstance = this.ractive === instance;
      const isStale = revision !== this.revision || !this.visible || !isCurrentInstance;

      if (isCurrentInstance) {
        this.ractive = null;
        instance.off();
        await instance.teardown().catch(() => {});
      }

      if (!isStale) {
        throw error;
      }

      return;
    }

    if (revision !== this.revision || !this.visible || instance !== this.ractive) {
      if (this.ractive === instance) {
        this.ractive = null;
        instance.off();
        await instance.teardown().catch(() => {});
      }
      return;
    }

    this.reportSlots();
  }

  private reportSlots() {
    if (!this.container) {
      this.onMountSlots([]);
      return;
    }

    sanitizeTemplateUrls(this.container, this.urlPolicy(), (element) => this.owns(element));
    const elements = this.container.querySelectorAll('[data-slot]');
    const slots = Array.from(elements)
      .filter((element) => this.owns(element))
      .map((element) => ({
        name: element.getAttribute('data-slot') ?? '',
        el: element as HTMLElement,
      }));
    this.onMountSlots(slots);
  }

  private teardownCurrentInstance(): Promise<void> | null {
    if (!this.ractive) {
      return null;
    }

    const instance = this.ractive;
    this.ractive = null;
    instance.off();

    const previousTeardown = this.pendingTeardown;
    const teardown = (async () => {
      await previousTeardown;
      await instance.teardown().catch(() => {});
    })();

    this.pendingTeardown = teardown;
    return teardown;
  }
}
