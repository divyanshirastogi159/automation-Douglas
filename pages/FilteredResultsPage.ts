import { Page, Locator, expect, ElementHandle } from "@playwright/test";
import { visitCommaListElements } from "typescript";

interface Filter {
  highlights?: string;
  brand?: string;
  forWhom?: string;
  product?: string;
  giftFor?: string;
}

export class FilterdResultsPage {
  readonly page: Page;
  readonly totalPages: Locator;
  readonly filterList: Locator;
  readonly productTiles: Locator;
  readonly nextPageLink: Locator;
  readonly productTilesFound: Promise<
    ElementHandle<HTMLElement | SVGElement>[]
  >;
  readonly clearAllFiltersLocator: Locator;
  readonly sortDropdown: Locator;
  readonly priceLowToHigh: Locator;
  readonly priceHighToLow: Locator;

  constructor(page: Page) {
    this.page = page;
    this.filterList = page.locator("button.selected-facets__value");
    this.clearAllFiltersLocator = page.locator("div.selected-facets__reset");
    this.totalPages = page.locator('[data-testid="pagination-title-dropdown"]');
    this.productTiles = page.locator("//div[@data-testid='product-tile']");
    this.nextPageLink = page.locator('[data-testid="pagination-arrow-right"]');
    this.productTilesFound = page.$$('div[data-testid="product-tile"]');
    this.sortDropdown = page.locator("div.dropdown__value");
    this.priceLowToHigh = page.locator(
      `//button[normalize-space(text())="Preis aufsteigend"]`
    ); //Price increasing
    this.priceHighToLow = page.locator(
      `//button[normalize-space(text())="Preis absteigend"]`
    ); //Price decreasing
  }
  async appliedFilters(): Promise<string[]> {
    const appliedFilters: string[] = [];
    try {
      if (await this.filterList.first().isVisible()) {
        //await this.filterList.first().waitFor({ state: "visible" });
        const count = await this.filterList.count();
        console.log("Filter count is " + count);
        for (let i = 0; i < count; i++) {
          const filterLabel = this.filterList.nth(i);
          const filterText = await filterLabel.textContent();
          if (filterText) {
            appliedFilters.push(filterText.trim());
          }
        }
      }
    } catch (error) {
      console.error("Error during filter verification:", error);
      throw error;
    }
    console.log("Applied filters are ", appliedFilters);

    return appliedFilters;
  }
  async verifyFilters(expectedFilters: Filter) {
    const appliedFilters = await this.appliedFilters();
    console.log("Expected filters are ", expectedFilters);

    for (const key of Object.keys(expectedFilters) as Array<keyof Filter>) {
      const filterValue = expectedFilters[key];
      if (filterValue && !appliedFilters.includes(filterValue)) {
        throw new Error(
          // console.log(
          `Expected filter "${filterValue}" not found in applied filters.`
          // );
        );
      }
    }
    console.log("All filters have been applied successfully.");
  }

  async countProductTiles(): Promise<number> {
    if (this.productTiles) {
      const tiles = await this.productTiles.count();
      return tiles;
    }
    return 0;
  }
  // Get total pages from pagination
  async getTotalPages(): Promise<number> {
    if (this.totalPages) {
      // Check if the pagination element is present
      const isPaginationVisible = await this.totalPages.isVisible();

      if (isPaginationVisible) {
        const totalPagesText = await this.totalPages.innerText();
        console.log("Extracted text " + totalPagesText);
        const match = totalPagesText.match(/Seite (\d+) von (\d+)/);

        if (match) {
          return parseInt(match[2], 10);
        } else {
          throw new Error("Unable to extract total pages from text.");
        }
      } else {
        console.log("Pagination element is not visible, assuming single page.");
        return 1;
      }
    } else {
      console.log("Pagination element not found, assuming single page.");
      return 1;
    }
  }
  async verifyHighlightInProdTile(highlight: string) {
    if (highlight === "NEU") {
      for (const tile of await this.productTilesFound) {
        const eyeCatcher = await tile.$("div.eyecatcher--new");
        await expect(eyeCatcher).not.toBeNull();
      }
      console.log(`${highlight} found in all tiles? YES `);
    } else if (highlight == "Sale") {
      for (const tile of await this.productTilesFound) {
        const eyeCatcher = await tile.$("div.eyecatcher--discount");
        await expect(eyeCatcher).not.toBeNull();
      }
      console.log(`${highlight} found in all tiles? YES `);
    }
  }
  async verifyBrandInProdTile(brand: string) {
    for (const tile of await this.productTilesFound) {
      const brandTag = await tile.$("div.top-brand");
      const brandText = await brandTag?.innerText();
      await expect(brandText?.toLowerCase()).toBe(brand.toLowerCase());
    }
    console.log(`${brand} found in tiles? YES `);
  }
  async verifyProductCategoryInProdTile(product: string) {
    for (const tile of await this.productTilesFound) {
      const categoryTag = await tile.$("div.category");
      const categoryText = await categoryTag?.innerText();
      await expect(categoryText?.toLowerCase()).toBe(product.toLowerCase());
    }
    console.log(`${product} found in tiles? YES `);
  }
  async removeFilter(filterToBeRemoved: string) {
    const count = await this.filterList.count();
    for (let i = 0; i < count; i++) {
      const filterText = await this.filterList.nth(i).textContent();
      if (filterText == filterToBeRemoved) {
        console.log(`Filter ${filterToBeRemoved} found`);
        const closeSvgIcon = this.filterList.nth(i).locator("svg");
        await closeSvgIcon.click();
        await this.page.waitForLoadState("domcontentloaded");
      }
    }
  }
  async clearAllFilters() {
    const clearBtn = this.page.locator(
      "//button[normalize-space(text())='Alle Filter löschen']"
    );
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await this.page.waitForLoadState("load");
      // await this.page.waitForLoadState("networkidle");
      await expect(clearBtn).not.toBeVisible();
      console.log("Cleared all filters");
    }
  }
}
