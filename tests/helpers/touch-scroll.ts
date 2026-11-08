import type { CDPSession, Locator } from 'playwright';

/** Scroll a popup through real Chromium touch gestures, including on short viewports. */
export async function touchScrollToEnd(cdp: CDPSession, list: Locator): Promise<void> {
  const initial = (await list.boundingBox())!;
  await cdp.send('Input.synthesizeScrollGesture', {
    x: initial.x + initial.width / 2,
    y: initial.y + initial.height / 2,
    yDistance: -(await list.evaluate((element) => element.scrollHeight)),
    speed: 2000,
    preventFling: true,
    gestureSourceType: 'touch',
  });
  // On short viewports the first gesture can stop at the popup edge. Continue
  // with swipes that stay inside it until Chromium reports the scroll end.
  for (let attempt = 0; attempt < 40; attempt++) {
    await list.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
    const { top, max } = await list.evaluate((element) => ({
      top: element.scrollTop,
      max: element.scrollHeight - element.clientHeight,
    }));
    if (top >= max - 2) return;
    const bounds = (await list.boundingBox())!;
    await cdp.send('Input.synthesizeScrollGesture', {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      yDistance: -Math.min(150, Math.max(40, bounds.height * 0.4)),
      speed: 1200,
      preventFling: true,
      gestureSourceType: 'touch',
    });
  }
}
