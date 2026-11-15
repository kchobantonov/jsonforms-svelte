import rough from 'roughjs';
import type { Action } from 'svelte/action';

const outlinedSlots = [
  'button',
  'input',
  'input-group',
  'input-otp-group',
  'textarea',
  'select-trigger',
  'select-content',
  'native-select',
  'card',
  'dialog-content',
  'dialog-footer',
  'dialog-close',
  'popover-content',
  'alert',
  'avatar',
  'checkbox',
  'radio-group-item',
  'switch',
  'slider-track',
  'slider-range',
  'slider-thumb',
  'slider-value-tooltip',
  'toggle-group',
  'tabs-list',
  'table-container',
  'calendar',
  'stepper-indicator',
  'stepper-separator',
];
const tokenRemoveSelector = '.jsonforms-array-tags button[aria-label]';
const choiceCardSelector = '[data-slot="label"]:has(> [data-slot="radio-group-item"])';
const listNavigationSelector = '[data-list-navigation][role="listbox"]';
const listOptionSelector = '[data-list-navigation] [data-slot="item"][role="option"]';
const temporalInputSelector = 'input.input.ps-10';
const fileControlSelector = '[data-file-control]';
const fileBadgeSelector = '[data-file-control] [data-slot="badge"]';
const imageDiagnosticSelector = '[data-image-diagnostic][role="alert"]';
const calendarCaptionSelectSelector =
  'span:has(> select[data-calendar-month-select]), span:has(> select[data-calendar-year-select])';
const searchableChoiceSelector = 'button[data-slot="popover-trigger"][role="combobox"]';
const colorTriggerSelector = '[data-color-trigger]';
const colorSpectrumSelector = '[data-color-spectrum] .area';
const agSelectionCheckboxSelector =
  '.jsonforms-ag-grid--shadcn :is(.ag-selection-checkbox, .ag-header-select-all) .ag-checkbox-input-wrapper';
const selector = [
  ...outlinedSlots.map((slot) => `[data-slot="${slot}"]`),
  '.jsonforms-shadcn-monaco',
  tokenRemoveSelector,
  choiceCardSelector,
  listNavigationSelector,
  listOptionSelector,
  temporalInputSelector,
  fileControlSelector,
  fileBadgeSelector,
  imageDiagnosticSelector,
  calendarCaptionSelectSelector,
  searchableChoiceSelector,
  colorTriggerSelector,
  colorSpectrumSelector,
  agSelectionCheckboxSelector,
].join(',');
const generator = rough.generator();
const svgNamespace = 'http://www.w3.org/2000/svg';

type OutlineRecord = {
  parent: HTMLElement;
  observer: ResizeObserver;
  stateObserver?: MutationObserver;
  svg: SVGSVGElement;
};

function seedFor(element: Element): number {
  const label = [
    element.getAttribute('data-slot'),
    element.id,
    element.getAttribute('name') ??
      element.getAttribute('for') ??
      element.getAttribute('aria-label'),
    element.closest('[data-slot="stepper-item"]')?.getAttribute('data-step'),
  ].join(':');
  let hash = 2166136261;
  for (const character of label) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0 || 1;
}

function modeFor(element: HTMLElement): string | undefined {
  const scope = element.getRootNode();
  return (
    element.closest<HTMLElement>('[data-mode]')?.dataset.mode ??
    (scope instanceof ShadowRoot
      ? (scope.host.getAttribute('data-mode') ?? undefined)
      : document.documentElement.dataset.mode)
  );
}

function cardOutline(
  width: number,
  height: number,
  seed: number,
  strokeWidth: number,
  wobbleSize = 1.8,
  roughness = 0.8,
) {
  const inset = 4;
  const horizontal = Math.max(2, Math.ceil((width - inset * 2) / 110));
  const vertical = Math.max(2, Math.ceil((height - inset * 2) / 110));
  const wobble = (step: number) => Math.sin(seed * 0.013 + step * 2.4) * wobbleSize;
  const top: [number, number][] = [];
  for (let step = 0; step <= horizontal; step++) {
    top.push([
      inset + ((width - inset * 2) * step) / horizontal,
      inset + (step === 0 || step === horizontal ? 0 : wobble(step)),
    ]);
  }
  const right: [number, number][] = [top[horizontal]];
  for (let step = 1; step <= vertical; step++) {
    right.push([
      width - inset + (step === vertical ? 0 : wobble(horizontal + step)),
      inset + ((height - inset * 2) * step) / vertical,
    ]);
  }
  const bottom: [number, number][] = [right[vertical]];
  for (let step = 1; step <= horizontal; step++) {
    bottom.push([
      width - inset - ((width - inset * 2) * step) / horizontal,
      height - inset + (step === horizontal ? 0 : wobble(horizontal + vertical + step)),
    ]);
  }
  const left: [number, number][] = [bottom[horizontal]];
  for (let step = 1; step < vertical; step++) {
    left.push([
      inset + wobble(horizontal * 2 + vertical + step),
      height - inset - ((height - inset * 2) * step) / vertical,
    ]);
  }
  left.push(top[0]);
  return [top, right, bottom, left].map((points, index) =>
    generator.curve(points, {
      seed: seed + index,
      roughness,
      bowing: 0.7,
      strokeWidth,
    }),
  );
}

function sliderStroke(
  width: number,
  height: number,
  seed: number,
  strokeWidth: number,
  vertical: boolean,
) {
  const length = vertical ? height : width;
  const segments = Math.max(2, Math.ceil(length / 70));
  const points: [number, number][] = Array.from({ length: segments + 1 }, (_, step) => {
    const position = 2 + ((length - 4) * step) / segments;
    const wobble = step === 0 || step === segments ? 0 : Math.sin(seed * 0.017 + step * 1.9) * 1.3;
    return vertical ? [width / 2 + wobble, position] : [position, height / 2 + wobble];
  });
  return generator.curve(points, { seed, roughness: 0.85, bowing: 0.9, strokeWidth });
}

function outline(element: HTMLElement, { parent, svg }: OutlineRecord): void {
  const bounds = element.getBoundingClientRect();
  const parentBounds = parent.getBoundingClientRect();
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  const slot = element.dataset.slot;
  const verticalSlider =
    element.dataset.orientation === 'vertical' ||
    element.closest('[data-slot="slider"]')?.getAttribute('data-orientation') === 'vertical';
  if (
    (width < 8 || height < 8) &&
    !['stepper-separator', 'slider-track', 'slider-range'].includes(slot ?? '')
  ) {
    svg.replaceChildren();
    return;
  }
  if (slot === 'slider-range' && (verticalSlider ? height : width) < 3) {
    svg.replaceChildren();
    return;
  }
  const tokenRemove = element.matches(tokenRemoveSelector);
  const dialogClose = slot === 'dialog-close';
  const choiceCard = element.matches(choiceCardSelector);
  const listNavigation = element.matches(listNavigationSelector);
  const listOption = element.matches(listOptionSelector);
  const temporalInput = element.matches(temporalInputSelector);
  const fileControl = element.matches(fileControlSelector);
  const fileBadge = element.matches(fileBadgeSelector);
  const imageDiagnostic = element.matches(imageDiagnosticSelector);
  const agSelectionCheckbox = element.matches(agSelectionCheckboxSelector);
  const currentExample = slot === 'button' && element.matches('aside nav [aria-current="page"]');
  const toggleGroup = slot === 'toggle-group';
  const otpGroup = slot === 'input-otp-group';
  const mode = modeFor(element);
  const dark =
    mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  if (
    [
      'button',
      'input',
      'input-group',
      'textarea',
      'select-trigger',
      'native-select',
      'checkbox',
    ].includes(slot ?? '') ||
    temporalInput ||
    agSelectionCheckbox ||
    fileControl
  ) {
    element.style.setProperty(
      'background-color',
      currentExample ? (dark ? '#343d4d' : '#e8e0cf') : dark ? '#252a35' : '#faf8f0',
      'important',
    );
    element.style.setProperty('color', dark ? '#f3ead3' : '#242936', 'important');
  }
  const ink = dark ? '#f3ead3' : '#242936';
  const round =
    fileBadge ||
    slot === 'avatar' ||
    slot === 'radio-group-item' ||
    slot === 'slider-thumb' ||
    slot === 'switch';
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.left =
    parent === element
      ? '0px'
      : `${bounds.left - parentBounds.left - parent.clientLeft + parent.scrollLeft}px`;
  svg.style.top =
    parent === element
      ? '0px'
      : `${bounds.top - parentBounds.top - parent.clientTop + parent.scrollTop}px`;
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  const makePaths = (
    drawable: ReturnType<typeof generator.rectangle>,
    strokeWidth: number,
    color = ink,
  ) =>
    generator.toPaths(drawable).map(({ d }) => {
      const path = document.createElementNS(svgNamespace, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', String(strokeWidth));
      return path;
    });
  const state = element.closest<HTMLElement>('[data-slot="stepper-item"]')?.dataset.state;
  const styles = getComputedStyle(element);
  const primary = `hsl(${styles.getPropertyValue('--primary').trim()})`;
  const muted = `hsl(${styles.getPropertyValue('--muted').trim()})`;
  const selected =
    choiceCard &&
    element.querySelector('[data-slot="radio-group-item"]')?.getAttribute('aria-checked') ===
      'true';
  const invalid =
    choiceCard &&
    element.closest('[data-slot="radio-group"]')?.getAttribute('aria-invalid') === 'true';
  const cardInk = invalid
    ? `hsl(${styles.getPropertyValue('--destructive').trim()})`
    : selected
      ? primary
      : ink;
  const paths =
    listOption && element.getAttribute('aria-selected') !== 'true'
      ? []
      : listNavigation
        ? cardOutline(width, height, seedFor(element), 1.2, 3.6, 1.35).flatMap((drawable) =>
            makePaths(drawable, 1.2),
          )
        : choiceCard ||
            listOption ||
            toggleGroup ||
            otpGroup ||
            fileControl ||
            imageDiagnostic ||
            slot === 'card' ||
            slot === 'dialog-content'
          ? cardOutline(
              width,
              height,
              seedFor(element),
              listOption || selected ? 1.6 : 1.2,
              imageDiagnostic ? 2.8 : 1.8,
              imageDiagnostic ? 1.15 : 0.8,
            ).flatMap((drawable) =>
              makePaths(
                drawable,
                listOption ? 1.6 : selected ? 1.6 : 1.2,
                otpGroup &&
                  element.querySelector('[data-slot="input-otp-slot"][aria-invalid="true"]')
                  ? `hsl(${styles.getPropertyValue('--destructive').trim()})`
                  : fileControl && element.hasAttribute('data-invalid')
                    ? `hsl(${styles.getPropertyValue('--destructive').trim()})`
                    : listOption
                      ? primary
                      : choiceCard
                        ? cardInk
                        : ink,
              ),
            )
          : slot === 'dialog-footer'
            ? makePaths(
                generator.line(2, 2, width - 2, 2, {
                  seed: seedFor(element),
                  roughness: 1.2,
                  bowing: 1.1,
                  strokeWidth: 1.2,
                }),
                1.2,
              )
            : slot === 'stepper-indicator'
              ? generator
                  .toPaths(
                    generator.ellipse(width / 2, height / 2, width - 7, height - 7, {
                      seed: seedFor(element),
                      roughness: 0.8,
                      bowing: 0.6,
                      strokeWidth: 1.2,
                      fill: state === 'inactive' ? muted : primary,
                      fillStyle: 'solid',
                      stroke: ink,
                      disableMultiStroke: true,
                      disableMultiStrokeFill: true,
                    }),
                  )
                  .map(({ d, fill, stroke, strokeWidth }) => {
                    const path = document.createElementNS(svgNamespace, 'path');
                    path.setAttribute('d', d);
                    path.setAttribute('fill', fill ?? 'none');
                    path.setAttribute('stroke', stroke);
                    path.setAttribute('stroke-width', String(strokeWidth));
                    return path;
                  })
              : slot === 'stepper-separator'
                ? makePaths(
                    element.closest<HTMLElement>('[data-slot="stepper-nav"]')?.dataset
                      .orientation === 'vertical'
                      ? generator.line(width / 2, 1, width / 2, height - 1, {
                          seed: seedFor(element),
                          roughness: 1,
                          bowing: 1,
                          strokeWidth: 1.5,
                          disableMultiStroke: true,
                        })
                      : generator.line(2, height / 2, width - 2, height / 2, {
                          seed: seedFor(element),
                          roughness: 1,
                          bowing: 1,
                          strokeWidth: 1.5,
                          disableMultiStroke: true,
                        }),
                    1.5,
                    state === 'completed' ? primary : ink,
                  )
                : slot === 'slider-track' || slot === 'slider-range'
                  ? makePaths(
                      sliderStroke(
                        width,
                        height,
                        seedFor(element),
                        slot === 'slider-range' ? 3.2 : 2.6,
                        verticalSlider,
                      ),
                      slot === 'slider-range' ? 3.2 : 2.6,
                      slot === 'slider-range' ? primary : ink,
                    )
                  : slot === 'slider-thumb'
                    ? makePaths(
                        generator.ellipse(width / 2, height / 2, width - 2, height - 2, {
                          seed: seedFor(element),
                          roughness: 0.75,
                          bowing: 0.5,
                          strokeWidth: 1.2,
                        }),
                        1.2,
                      )
                    : tokenRemove || dialogClose
                      ? [
                          ...makePaths(
                            generator.linearPath(
                              [
                                [width * 0.22, height * 0.2],
                                [width * 0.47, height * 0.55],
                                [width * 0.79, height * 0.81],
                              ],
                              {
                                seed: seedFor(element),
                                roughness: 1.7,
                                bowing: 1.5,
                                strokeWidth: 1.15,
                              },
                            ),
                            1.15,
                          ),
                          ...makePaths(
                            generator.linearPath(
                              [
                                [width * 0.81, height * 0.18],
                                [width * 0.54, height * 0.46],
                                [width * 0.2, height * 0.8],
                              ],
                              {
                                seed: seedFor(element) + 1,
                                roughness: 1.7,
                                bowing: 1.5,
                                strokeWidth: 1.15,
                              },
                            ),
                            1.15,
                          ),
                        ]
                      : makePaths(
                          round
                            ? generator.ellipse(width / 2, height / 2, width - 5, height - 5, {
                                seed: seedFor(element),
                                roughness: 1.3,
                                strokeWidth: 1.2,
                              })
                            : generator.rectangle(
                                slot === 'checkbox' || agSelectionCheckbox ? 2 : 3,
                                slot === 'checkbox' || agSelectionCheckbox ? 2 : 3,
                                width - (slot === 'checkbox' || agSelectionCheckbox ? 4 : 6),
                                height - (slot === 'checkbox' || agSelectionCheckbox ? 4 : 6),
                                {
                                  seed: seedFor(element),
                                  roughness: 1.2,
                                  bowing: 1.1,
                                  strokeWidth: 1.2,
                                },
                              ),
                          1.2,
                        );
  if (slot === 'stepper-separator' && state !== 'completed') {
    for (const path of paths) path.setAttribute('stroke-opacity', '0.38');
  }
  if (slot === 'slider-track') {
    for (const path of paths) path.setAttribute('stroke-opacity', '0.45');
  }
  if (toggleGroup) {
    const items = [
      ...element.querySelectorAll<HTMLElement>(':scope > [data-slot="toggle-group-item"]'),
    ]
      .map((item) => ({ item, bounds: item.getBoundingClientRect() }))
      .sort((a, b) => a.bounds.left - b.bounds.left);
    for (const [index, { bounds: itemBounds }] of items.entries()) {
      if (index === 0) continue;
      const x = itemBounds.left - bounds.left;
      paths.push(
        ...makePaths(
          generator.line(x, 5, x, height - 5, {
            seed: seedFor(element) + index,
            roughness: 0.9,
            bowing: 0.7,
            strokeWidth: 1,
          }),
          1,
        ),
      );
    }
    const active = items.find(({ item }) => item.getAttribute('data-state') === 'on');
    if (active) {
      const start = active.bounds.left - bounds.left + 8;
      const end = active.bounds.right - bounds.left - 8;
      paths.push(
        ...makePaths(
          generator.line(start, height - 7, end, height - 7, {
            seed: seedFor(element) + items.length + 1,
            roughness: 1.1,
            bowing: 0.9,
            strokeWidth: 2.2,
          }),
          2.2,
          primary,
        ),
      );
    }
  }
  if (otpGroup) {
    const cells = [
      ...element.querySelectorAll<HTMLElement>(':scope > [data-slot="input-otp-slot"]'),
    ]
      .map((cell) => ({ cell, bounds: cell.getBoundingClientRect() }))
      .sort((a, b) => a.bounds.left - b.bounds.left);
    const color = element.querySelector('[data-slot="input-otp-slot"][aria-invalid="true"]')
      ? `hsl(${styles.getPropertyValue('--destructive').trim()})`
      : ink;
    for (const [index, { bounds: cellBounds }] of cells.entries()) {
      if (index === 0) continue;
      const x = cellBounds.left - bounds.left;
      paths.push(
        ...makePaths(
          generator.line(x, 4, x, height - 4, {
            seed: seedFor(element) + index,
            roughness: 1.1,
            bowing: 0.8,
            strokeWidth: 1,
          }),
          1,
          color,
        ),
      );
    }
    const active = cells.find(({ cell }) => cell.dataset.active === 'true');
    if (active) {
      paths.push(
        ...makePaths(
          generator.rectangle(
            active.bounds.left - bounds.left + 2,
            2,
            active.bounds.width - 4,
            height - 4,
            {
              seed: seedFor(element) + cells.length + 1,
              roughness: 1.2,
              bowing: 1,
              strokeWidth: 1.2,
            },
          ),
          1.2,
          color,
        ),
      );
    }
  }
  if (currentExample) {
    for (const path of paths) {
      path.setAttribute('stroke', primary);
      path.setAttribute('stroke-width', '1.8');
    }
    paths.push(
      ...makePaths(
        generator.linearPath(
          [
            [5, 8],
            [6, height / 2],
            [5, height - 8],
          ],
          { seed: seedFor(element) + 1, roughness: 1.1, bowing: 1.2, strokeWidth: 2.8 },
        ),
        2.8,
        primary,
      ),
    );
  }
  if (slot === 'checkbox' || agSelectionCheckbox) {
    const checked = agSelectionCheckbox
      ? element.classList.contains('ag-indeterminate')
        ? 'mixed'
        : element.classList.contains('ag-checked')
          ? 'true'
          : 'false'
      : element.getAttribute('aria-checked');
    if (checked === 'true') {
      paths.push(
        ...makePaths(
          generator.linearPath(
            [
              [width * 0.24, height * 0.51],
              [width * 0.43, height * 0.7],
              [width * 0.78, height * 0.28],
            ],
            { seed: seedFor(element) + 1, roughness: 0.7, strokeWidth: 1.8 },
          ),
          1.8,
        ),
      );
    } else if (checked === 'mixed') {
      paths.push(
        ...makePaths(
          generator.line(width * 0.26, height * 0.5, width * 0.74, height * 0.5, {
            seed: seedFor(element) + 1,
            roughness: 0.7,
            strokeWidth: 1.8,
          }),
          1.8,
        ),
      );
    }
  }
  svg.replaceChildren(...paths);
  if (!tokenRemove && !dialogClose) element.dataset.sketchOutline = '';
}

/** Draws stable Rough.js SVG overlays around the actual shadcn control boxes. */
export const sketchElements: Action<HTMLElement> = (root) => {
  const scanRoot = root.getRootNode() instanceof ShadowRoot ? root : document.body;
  const tracked = new Map<HTMLElement, OutlineRecord>();
  const positioned = new Map<HTMLElement, string>();
  let frame = 0;
  const redraw = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() =>
      tracked.forEach((record, element) => outline(element, record)),
    );
  };
  const scan = () => {
    for (const [element, record] of tracked) {
      if (scanRoot.contains(element)) continue;
      record.observer.disconnect();
      record.stateObserver?.disconnect();
      record.svg.remove();
      tracked.delete(element);
    }
    for (const element of scanRoot.querySelectorAll<HTMLElement>(selector)) {
      if (tracked.has(element)) continue;
      if (element.closest('[data-slot="input-group"]') && element.dataset.slot !== 'input-group')
        continue;
      // Button overlays live inside the button so hover/focus visibility also hides the drawing.
      const parent =
        element.dataset.slot === 'button' ||
        element.dataset.slot === 'stepper-indicator' ||
        element.dataset.slot === 'stepper-separator' ||
        element.dataset.slot === 'avatar' ||
        element.dataset.slot === 'toggle-group' ||
        element.dataset.slot === 'input-otp-group' ||
        element.dataset.slot === 'dialog-content' ||
        element.dataset.slot === 'dialog-footer' ||
        element.dataset.slot === 'dialog-close' ||
        element.dataset.slot === 'slider-value-tooltip' ||
        element.matches(fileBadgeSelector) ||
        element.matches(imageDiagnosticSelector) ||
        element.matches(calendarCaptionSelectSelector) ||
        element.matches(choiceCardSelector) ||
        element.matches(listOptionSelector) ||
        element.matches(searchableChoiceSelector) ||
        element.matches(colorTriggerSelector) ||
        element.matches(colorSpectrumSelector) ||
        element.matches(agSelectionCheckboxSelector) ||
        element.matches(tokenRemoveSelector)
          ? element
          : element.parentElement;
      if (!parent) continue;
      if (getComputedStyle(parent).position === 'static') {
        positioned.set(parent, parent.style.position);
        parent.style.position = 'relative';
      }
      const svg = document.createElementNS(svgNamespace, 'svg');
      svg.dataset.sketchOverlay = '';
      svg.setAttribute('class', 'sketch-outline-size');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.style.position = 'absolute';
      svg.style.pointerEvents = 'none';
      svg.style.overflow = 'visible';
      svg.style.zIndex =
        element.dataset.slot === 'stepper-indicator'
          ? '-1'
          : element.dataset.slot === 'stepper-separator' ||
              element.dataset.slot === 'slider-track' ||
              element.dataset.slot === 'slider-range'
            ? '0'
            : element.dataset.slot === 'slider-thumb'
              ? '3'
              : element.dataset.slot === 'toggle-group' ||
                  element.dataset.slot === 'input-otp-group'
                ? '20'
                : '1';
      parent.append(svg);
      const observer = new ResizeObserver(() => outline(element, record));
      const record: OutlineRecord = { parent, observer, svg };
      if (element.matches(agSelectionCheckboxSelector)) {
        const stateObserver = new MutationObserver(() => outline(element, record));
        stateObserver.observe(element, { attributes: true, attributeFilter: ['class'] });
        record.stateObserver = stateObserver;
      }
      tracked.set(element, record);
      observer.observe(element);
      outline(element, record);
    }
  };
  const changes = new MutationObserver(scan);
  changes.observe(scanRoot, { childList: true, subtree: true });
  const scope = root.getRootNode();
  const themeNode = scope instanceof ShadowRoot ? scope.host : document.documentElement;
  const themeChanges = new MutationObserver(redraw);
  themeChanges.observe(themeNode, {
    attributes: true,
    attributeFilter: ['data-mode', 'data-theme'],
  });
  const selectionChanges = new MutationObserver((changes) => {
    for (const change of changes) {
      const element = change.target as HTMLElement;
      const record = tracked.get(element);
      if (record && element.dataset.slot === 'checkbox') outline(element, record);
      if (record && change.attributeName === 'aria-current') outline(element, record);
      if (record && change.attributeName === 'aria-selected' && element.matches(listOptionSelector))
        outline(element, record);
      if (record && change.attributeName === 'data-invalid' && element.matches(fileControlSelector))
        outline(element, record);
      if (record && change.attributeName === 'style' && element.dataset.slot?.startsWith('slider-'))
        outline(element, record);
      if (element.dataset.slot === 'toggle-group-item') {
        const group = element.parentElement;
        const groupRecord = group && tracked.get(group);
        if (groupRecord && group?.dataset.slot === 'toggle-group') outline(group, groupRecord);
      }
      if (element.dataset.slot === 'input-otp-slot') {
        const group = element.parentElement;
        const groupRecord = group && tracked.get(group);
        if (groupRecord && group?.dataset.slot === 'input-otp-group') outline(group, groupRecord);
      }
      if (element.dataset.slot === 'radio-group-item') {
        const card = element.parentElement;
        const cardRecord = card && tracked.get(card);
        if (cardRecord && card?.matches(choiceCardSelector)) outline(card, cardRecord);
      }
      if (element.dataset.slot === 'radio-group' && change.attributeName === 'aria-invalid') {
        for (const card of element.querySelectorAll<HTMLElement>(choiceCardSelector)) {
          const cardRecord = tracked.get(card);
          if (cardRecord) outline(card, cardRecord);
        }
      }
      if (element.dataset.slot === 'stepper-item') {
        for (const child of element.querySelectorAll<HTMLElement>(
          '[data-slot="stepper-indicator"], [data-slot="stepper-separator"]',
        )) {
          const childRecord = tracked.get(child);
          if (childRecord) outline(child, childRecord);
        }
      }
    }
  });
  selectionChanges.observe(scanRoot, {
    attributes: true,
    subtree: true,
    attributeFilter: [
      'aria-checked',
      'aria-current',
      'aria-invalid',
      'aria-selected',
      'data-invalid',
      'data-state',
      'data-active',
      'style',
    ],
  });
  scan();
  return {
    destroy() {
      changes.disconnect();
      themeChanges.disconnect();
      selectionChanges.disconnect();
      cancelAnimationFrame(frame);
      tracked.forEach(({ observer, stateObserver, svg }, element) => {
        observer.disconnect();
        stateObserver?.disconnect();
        svg.remove();
        element.style.removeProperty('background-color');
        element.style.removeProperty('color');
        delete element.dataset.sketchOutline;
      });
      positioned.forEach((position, parent) => {
        parent.style.position = position;
      });
      tracked.clear();
      positioned.clear();
    },
  };
};
