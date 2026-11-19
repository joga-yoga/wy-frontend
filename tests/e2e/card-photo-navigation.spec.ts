import { expect, test } from "@playwright/test";

for (const [listing, detail] of [
  ["/", "/wydarzenia"],
  ["/wyjazdy", "/wyjazdy"],
]) {
  test(`photo buttons change only the slide on ${listing}`, async ({ page }) => {
    await page.goto(listing, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Tylko niezbędne" }).click();
    const card = page.locator(`a[href="${detail}/destination-event"]`).first();
    const slides = card.locator(".swiper-initialized .swiper-slide");
    await expect(slides.first()).toHaveClass(/swiper-slide-active/);
    const progressStarts = await page.evaluateHandle(() => {
      const starts: string[] = [];
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element && node.id === "nprogress") starts.push(node.id);
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
      return starts;
    });
    const initialUrl = page.url();
    await card.getByRole("button", { name: "Następne zdjęcie" }).click();
    await expect(slides.nth(1)).toHaveClass(/swiper-slide-active/);
    await card.getByRole("button", { name: "Poprzednie zdjęcie" }).click();
    await expect(slides.first()).toHaveClass(/swiper-slide-active/);
    expect(page.url()).toBe(initialUrl);
    expect(await progressStarts.jsonValue()).toEqual([]);
    await card.locator("h2").click();
    await expect(page).toHaveURL(new RegExp(`${detail}/destination-event$`));
    await expect(page.locator("#nprogress")).toHaveCount(0);
  });
}
