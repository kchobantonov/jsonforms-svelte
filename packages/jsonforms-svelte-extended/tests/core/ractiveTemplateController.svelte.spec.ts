import { describe, expect, it, vi } from 'vitest';
import { RactiveTemplateController } from '../../src/lib/core/ractiveTemplateController.js';

describe('RactiveTemplateController lifecycle', () => {
  it('reports a slot created by an incremental data update', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let reportedSlotNames: string[] = [];
    const controller = new RactiveTemplateController(
      (slots) => {
        reportedSlotNames = slots.map((slot) => slot.name);
      },
      () => true,
    );
    await controller.setup(
      container,
      '{{#if data.show}}{{>field}}{{/if}}',
      {
        data: { show: false },
        elements: [{ name: 'field' }],
      },
      true,
    );
    expect(reportedSlotNames).toEqual([]);

    await controller.updateData('data', { show: true });
    await vi.waitFor(() => {
      expect(container.querySelector('[data-slot="field"]')).not.toBeNull();
    });

    const slotNamesAfterUpdate = reportedSlotNames;
    await controller.destroy();
    container.remove();

    expect(slotNamesAfterUpdate).toEqual(['field']);
  });

  it('stays hidden when visibility changes while a replacement template is being prepared', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const controller = new RactiveTemplateController(
      () => {},
      () => true,
    );
    await controller.setup(container, '<div>Initial template</div>', {}, true);

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

    vi.spyOn(currentInstance!, 'teardown').mockImplementation(async () => {
      notifyTeardownStarted();
      await teardownRelease;
      await originalTeardown();
    });

    const pendingSetup = controller.setup(container, '<div>Replacement template</div>', {}, true);
    await teardownStarted;

    await controller.updateVisibility(false);
    releaseTeardown();
    await pendingSetup;

    const renderedContent = container.textContent;
    await controller.destroy();
    container.remove();

    expect(renderedContent).toBe('');
  });
});

it('does not parse denied source and prevents updates after revocation', async () => {
  let allowed = false;
  const container = document.createElement('div');
  const controller = new RactiveTemplateController(
    () => {},
    () => allowed,
  );
  await controller.setup(container, '{{#if malformed}}', {}, true);
  expect(container.textContent).toBe('');
  allowed = true;
  await controller.setup(container, '<p>{{data.value}}</p>', { data: { value: 'initial' } }, true);
  expect(container.textContent).toBe('initial');
  allowed = false;
  await controller.updateData('data', { value: 'revoked' });
  expect(container.textContent).toBe('');
  await controller.destroy();
});

it('preserves literal slot names when creating DOM placeholders', async () => {
  const container = document.createElement('div');
  const name = 'slot"><span data-injected="yes';
  const controller = new RactiveTemplateController(
    () => {},
    () => true,
  );
  try {
    await controller.setup(
      container,
      '{{>slotName}}',
      { slotName: name, elements: [{ name }] },
      true,
    );
    expect(container.querySelector('[data-slot]')?.getAttribute('data-slot')).toBe(name);
    expect(container.querySelector('[data-injected]')).toBeNull();
  } finally {
    await controller.destroy();
  }
});

it('defers engine loading until visible and keeps updates received while the engine loads', async () => {
  const Engine = (await import('ractive')).default;
  let release!: (value: { Engine: typeof Engine }) => void;
  const ready = new Promise<{ Engine: typeof Engine }>((resolve) => {
    release = resolve;
  });
  const load = vi.fn(() => ready);
  const container = document.createElement('div');
  const controller = new RactiveTemplateController(
    () => {},
    () => true,
    load,
  );
  try {
    await controller.setup(
      container,
      '<p>{{data.value}}</p>',
      { data: { value: 'Before' } },
      false,
    );
    expect(load).not.toHaveBeenCalled();
    const show = controller.updateVisibility(true);
    await controller.updateData('data', { value: 'After' });
    release({ Engine });
    await show;
    expect(container.textContent).toBe('After');
  } finally {
    await controller.destroy();
  }
});
it('ignores a late engine after permission is revoked and distinguishes loading failure', async () => {
  const Engine = (await import('ractive')).default;
  let release!: (value: { Engine: typeof Engine }) => void;
  const ready = new Promise<{ Engine: typeof Engine }>((resolve) => {
    release = resolve;
  });
  let allowed = true;
  const container = document.createElement('div');
  const controller = new RactiveTemplateController(
    () => {},
    () => allowed,
    () => ready,
  );
  const setup = controller.setup(container, '<p>Late content</p>', {}, true);
  allowed = false;
  await controller.destroy();
  release({ Engine });
  await setup;
  expect(container.textContent).toBe('');
  const failed = new RactiveTemplateController(
    () => {},
    () => true,
    async () => {
      throw new Error('Chunk unavailable');
    },
  );
  await expect(failed.setup(container, '<p />', {}, true)).rejects.toThrow(
    'Unable to load the Ractive template engine.',
  );
  await failed.destroy();
});

it('keeps template input state out of form data and accepts external updates', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const data = { name: 'original' };
  const controller = new RactiveTemplateController(
    () => {},
    () => true,
  );
  try {
    await controller.setup(
      container,
      '<input value="{{data.name}}"><output>{{data.name}}</output>',
      { data },
      true,
    );
    const input = container.querySelector('input')!;
    input.value = 'local draft';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(data).toEqual({ name: 'original' });
    expect(container.querySelector('output')?.textContent).toBe('original');
    await controller.updateData('data', { name: 'external' });
    expect(input.value).toBe('external');
  } finally {
    await controller.destroy();
    container.remove();
  }
});

it('tracks local template toggles and excludes nested delegated slots and URLs', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let names: string[] = [];
  const controller = new RactiveTemplateController(
    (slots) => {
      names = slots.map((slot) => slot.name);
    },
    () => true,
  );
  try {
    await controller.setup(
      container,
      `<button on-click="@this.set('show', !show)">Toggle</button>{{#if show}}{{>field}}{{/if}}`,
      { show: false, elements: [{ name: 'field' }] },
      true,
    );
    container.querySelector('button')!.click();
    await vi.waitFor(() => expect(names).toEqual(['field']));
    const delegated = document.createElement('div');
    delegated.innerHTML = '<a href="blob:owned">download</a><div data-slot="nested"></div>';
    const release = controller.registerSlotRoot(delegated);
    container.querySelector('[data-slot="field"]')!.appendChild(delegated);
    await controller.updateData('data', {});
    expect(names).toEqual(['field']);
    expect(delegated.querySelector('a')?.getAttribute('href')).toBe('blob:owned');
    release();
    container.querySelector('button')!.click();
    await vi.waitFor(() => expect(names).toEqual([]));
  } finally {
    await controller.destroy();
    container.remove();
  }
});
