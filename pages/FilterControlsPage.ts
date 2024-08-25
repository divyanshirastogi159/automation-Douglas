import { Page, Locator, expect } from "@playwright/test";

export class FilterControlsPage {
  readonly page: Page;
  readonly brandFilter: Locator; //Preis
  readonly productFilter: Locator; //Produktart
  readonly highlights: Locator; //Highlights
  readonly forWhom: Locator; //Für Wen
  readonly giftFor: Locator; //Geschenk für

  constructor(page: Page) {
    this.page = page;
    this.brandFilter = page.locator("div[data-testid='brand']");
    this.productFilter = page.locator(
      "div[data-testid='classificationClassName']"
    );
    this.forWhom = page.locator("div[data-testid='gender']");
    this.giftFor = page.locator("div[data-testid='Geschenk für']");
    this.highlights = page.locator("div[data-testid='flags']");
  }

  async filterByProduct(product: string) {
    const count = await this.productFilter.count();
    await expect(this.productFilter).toBeVisible();
    // if (count > 0) {
    if (await this.productFilter.isVisible()) {
      await this.applyFilter(this.productFilter, product);
      await this.page.waitForLoadState("domcontentloaded");
    }
  }

  async filterByBrand(brandName: string) {
    const count = await this.brandFilter.count();
    await expect(this.brandFilter).toBeVisible();

    // if (count > 0) {
    if (await this.brandFilter.isVisible()) {
      await this.applyFilter(this.brandFilter, brandName);
    }
  }

  async filterByHighlights(highlights: string) {
    const count = await this.highlights.count();
    await expect(this.highlights).toBeVisible({ timeout: 10000 });

    // if (count > 0) {
    if (await this.highlights.isVisible()) {
      await this.applyFilter(this.highlights, highlights);
      await this.page.waitForLoadState("domcontentloaded");
    }
  }

  async filterByForWhom(forWhomString: string) {
    await expect(this.forWhom).toBeVisible();

    if (await this.forWhom.isVisible()) {
      await this.applyFilter(this.forWhom, forWhomString);
    }
  }
  async filterByGiftFor(giftForString: string) {
    await expect(this.giftFor).toBeVisible();

    if (await this.giftFor.isVisible()) {
      await this.applyFilter(this.giftFor, giftForString);
    }
  }

  private async applyFilter(filterLocator: Locator, searchText: string) {
    await filterLocator.click();
    const searchPlaceholder = await filterLocator.textContent();
    console.log("Locator for " + searchPlaceholder + " is found!");
    const searchInputField = this.page.locator(
      `//input[@placeholder='${searchPlaceholder?.trim()} suchen']`
    );

    if (await searchInputField.isVisible()) {
      await searchInputField.fill(searchText);
    }
    await this.page.waitForTimeout(1000);

    // Locate all child elements matching the 'searchText'
    const items = this.page.locator("//a[@role='checkbox']");
    const count = await items.count();
    console.log(`Number of items found in the dropdown : ${count}`);

    // await this.page.pause();

    for (let i = 0; i < count; i++) {
      const label = items.nth(i);
      const text = await label.textContent();
      console.log(`text content is : ${text}`);

      if (text?.trim().includes(searchText)) {
        await label.click();
        await this.page.waitForTimeout(2000);
        console.log(`Clicked on item ${i + 1}: ${text?.trim()}`);
        await this.page.waitForLoadState("domcontentloaded");
        const showAllProducts = this.page.locator("button.facet__close-button");
        const count = await showAllProducts.count();
        if (await showAllProducts.isVisible()) {
          await showAllProducts.click();
        }
        break;
      }
    }
    await this.page.waitForTimeout(1000);
  }
}
