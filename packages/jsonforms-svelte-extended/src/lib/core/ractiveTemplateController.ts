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

  constructor(onMountSlots: (slots: SlotPlaceholder[]) => void) {
    this.onMountSlots = onMountSlots;
  }

  async destroy() {
    if (this.ractive) {
      const instance = this.ractive;
      this.ractive = null;
      instance.off();
      await instance.teardown().catch(() => {});
    }
  }

  updateData(keyPath: string, value: unknown) {
    if (this.ractive) {
      this.ractive.set(keyPath, value);
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

    if (!visible) {
      await this.destroy();
      return;
    }

    await this.render();
  }

  async updateVisibility(visible: boolean) {
    if (visible && !this.ractive) {
      await this.render();
    } else if (!visible && this.ractive) {
      await this.destroy();
    }
  }

  private async render() {
    if (!this.container || !this.template) {
      return;
    }

    await this.destroy();
    this.container.innerHTML = "";

    const partials: Registry<Partial> = {};

    this.data.elements?.forEach((element) => {
      partials[element.name] = `<div data-slot="${element.name}"></div>`;
    });

    const instance = new Ractive({
      el: this.container,
      template: this.template,
      partials,
      data: this.data,
      twoway: true,
      lazy: false,
    });
    this.ractive = instance;

    const runMount = () => {
      const elements = this.container!.querySelectorAll("[data-slot]");
      const slots = Array.from(elements).map((element) => ({
        name: element.getAttribute("data-slot") ?? "",
        el: element as HTMLElement,
      }));
      this.onMountSlots(slots);
    };

    instance.on("render", runMount);
    instance.on("update", runMount);
    runMount();
  }
}
