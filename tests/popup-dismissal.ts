import { expect, type Locator } from "@playwright/test";

/** Observe the original popup across the close action, including frames hidden from the ARIA tree. */
export async function expectIntactDismissal(
  popup: Locator,
  dismiss: () => Promise<void>,
  motion?: "fade-in-place" | "slide-down",
) {
  await expect(popup).toBeVisible();
  await expect(popup).not.toHaveAttribute("data-starting-style", "");
  await expect
    .poll(() =>
      popup.evaluate((element) =>
        element
          .getAnimations()
          .some((animation) => animation.pending || animation.playState === "running"),
      ),
    )
    .toBe(false);
  const frames = await popup.evaluateHandle((element) => {
    function snapshot() {
      const { top, height } = element.getBoundingClientRect();
      return {
        text: element.textContent?.trim(),
        height: (element as HTMLElement).offsetHeight,
        top,
        center: top + height / 2,
        opacity: Number(getComputedStyle(element).opacity),
        inputs: [
          ...element.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"),
        ].map((input) => input.value),
      };
    }
    const report = {
      before: snapshot(),
      closing: [] as ReturnType<typeof snapshot>[],
      removed: false,
    };
    function sample() {
      if (!element.isConnected) {
        report.removed = true;
        return;
      }
      if (element.matches('[data-ending-style], [data-closed], [data-state="closed"]'))
        report.closing.push(snapshot());
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
    return report;
  });
  await dismiss();
  await expect.poll(() => frames.evaluate(({ removed }) => removed)).toBe(true);
  const report = await frames.jsonValue();
  await frames.dispose();
  expect(
    report.closing.length,
    "Popup should enter a closing state before removal",
  ).toBeGreaterThan(0);
  for (const { text, height, inputs } of report.closing) {
    expect({ text, height, inputs }).toEqual({
      text: report.before.text,
      height: report.before.height,
      inputs: report.before.inputs,
    });
  }
  if (motion === "fade-in-place") {
    expect(report.closing.some((frame) => frame.opacity < report.before.opacity)).toBe(true);
    for (const { center } of report.closing) {
      expect(Math.abs(center - report.before.center)).toBeLessThan(1);
    }
  }
  if (motion === "slide-down") {
    expect(report.closing.some((frame) => frame.top > report.before.top)).toBe(true);
  }
}
