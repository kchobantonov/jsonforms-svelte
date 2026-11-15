import type { CDPSession, Locator } from 'playwright';

/** Scroll a popup through real Chromium touch gestures, including on short viewports. */
export async function touchScrollToEnd(cdp: CDPSession, list: Locator): Promise<void> {
  const swipeInside = async () => {
    const bounds = (await list.boundingBox())!;
    const x = bounds.x + bounds.width / 2;
    const start = bounds.y + bounds.height * 0.8;
    const end = bounds.y + bounds.height * 0.2;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ id: 0, x, y: start }],
    });
    for (let step = 1; step <= 8; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ id: 0, x, y: start + ((end - start) * step) / 8 }],
      });
      await new Promise((resolve) => setTimeout(resolve, 8));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
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
  let previousTop = -1;
  for (let attempt = 0; attempt < 60; attempt++) {
    await list.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const { top, max } = await list.evaluate((element) => ({
      top: element.scrollTop,
      max: element.scrollHeight - element.clientHeight,
    }));
    if (top >= max - 0.5) return;
    if (attempt >= 1 && top <= previousTop + 1) {
      // Some headless Linux compositors drop synthesized scroll gestures.
      // Dispatch a real touch sequence inside the scroll surface in that case.
      await swipeInside();
      previousTop = top;
      continue;
    }
    previousTop = top;
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
  const { top, max } = await list.evaluate((element) => ({
    top: element.scrollTop,
    max: element.scrollHeight - element.clientHeight,
  }));
  throw new Error(`Touch scrolling stopped at ${top} of ${max} pixels`);
}
