import { describe, expect, it, vi } from "vitest";
import { RactiveTemplateController } from "../../src/lib/core/ractiveTemplateController.js";

describe("RactiveTemplateController lifecycle", () => {
  it("reports a slot created by an incremental data update", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    let reportedSlotNames: string[] = [];
    const controller = new RactiveTemplateController((slots) => {
      reportedSlotNames = slots.map((slot) => slot.name);
    });
    await controller.setup(
      container,
      "{{#if data.show}}{{>field}}{{/if}}",
      {
        data: { show: false },
        elements: [{ name: "field" }],
      },
      true,
    );
    expect(reportedSlotNames).toEqual([]);

    await controller.updateData("data", { show: true });
    await vi.waitFor(() => {
      expect(container.querySelector('[data-slot="field"]')).not.toBeNull();
    });

    const slotNamesAfterUpdate = reportedSlotNames;
    await controller.destroy();
    container.remove();

    expect(slotNamesAfterUpdate).toEqual(["field"]);
  });

  it("stays hidden when visibility changes while a replacement template is being prepared", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    const controller = new RactiveTemplateController(() => {});
    await controller.setup(container, "<div>Initial template</div>", {}, true);

    const currentInstance = (
      controller as unknown as {
        ractive: {
          teardown(): Promise<void>;
        } | null;
      }
    ).ractive;
    expect(currentInstance).not.toBeNull();

    const originalTeardown = currentInstance!.teardown.bind(currentInstance);
    let releaseTeardown!: () => void;
    let notifyTeardownStarted!: () => void;
    const teardownRelease = new Promise<void>((resolve) => {
      releaseTeardown = resolve;
    });
    const teardownStarted = new Promise<void>((resolve) => {
      notifyTeardownStarted = resolve;
    });

    vi.spyOn(currentInstance!, "teardown").mockImplementation(async () => {
      notifyTeardownStarted();
      await teardownRelease;
      await originalTeardown();
    });

    const pendingSetup = controller.setup(
      container,
      "<div>Replacement template</div>",
      {},
      true,
    );
    await teardownStarted;

    await controller.updateVisibility(false);
    releaseTeardown();
    await pendingSetup;

    const renderedContent = container.textContent;
    await controller.destroy();
    container.remove();

    expect(renderedContent).toBe("");
  });
});
