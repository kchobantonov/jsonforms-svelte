import Ractive, {
  type Data,
  type DataFn,
  type ParsedTemplate,
  type Partial,
  type Registry,
} from "ractive";

Ractive.DEBUG = false;

export interface SlotPlaceholder {
  name: string;
  el: HTMLElement;
}

export class RactiveTemplateController {
  private ractive: Ractive | null = null;
  private onMountSlots: (slots: SlotPlaceholder[]) => void;
  private container: HTMLElement | null = null;
  private template: ParsedTemplate | null = null;
  private data: (Data | DataFn<Ractive>) & { elements?: { name: string }[] } =
    {};
  private visible = false;
  private revision = 0;
  private pendingTeardown: Promise<void> = Promise.resolve();

  constructor(onMountSlots: (slots: SlotPlaceholder[]) => void) {
    this.onMountSlots = onMountSlots;
  }

  async destroy() {
    this.visible = false;
    this.revision += 1;
    this.onMountSlots([]);

    const teardown = this.teardownCurrentInstance();
    await (teardown ?? this.pendingTeardown);
  }

  async updateData(keyPath: string, value: unknown) {
    const instance = this.ractive;
    const revision = this.revision;

    if (instance) {
      await instance.set(keyPath, value);

      if (
        instance === this.ractive &&
        revision === this.revision &&
        this.visible
      ) {
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
    this.container = container;
    this.template = Ractive.parse(template);
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
    if (!this.container || !this.template) {
      return;
    }

    const teardown = this.teardownCurrentInstance();
    await (teardown ?? this.pendingTeardown);

    if (
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
    container.innerHTML = "";

    const partials: Registry<Partial> = {};

    data.elements?.forEach((element) => {
      partials[element.name] = `<div data-slot="${element.name}"></div>`;
    });

    const instance = new Ractive({
      template,
      partials,
      data,
      twoway: true,
      lazy: false,
    });
    this.ractive = instance;

    try {
      await instance.render(container);
    } catch (error) {
      const isCurrentInstance = this.ractive === instance;
      const isStale =
        revision !== this.revision || !this.visible || !isCurrentInstance;

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

    if (
      revision !== this.revision ||
      !this.visible ||
      instance !== this.ractive
    ) {
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

    const elements = this.container.querySelectorAll("[data-slot]");
    const slots = Array.from(elements).map((element) => ({
      name: element.getAttribute("data-slot") ?? "",
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
