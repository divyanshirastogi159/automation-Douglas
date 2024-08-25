import {
  test,
  expect,
  chromium,
  webkit,
  firefox,
  Browser,
} from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { FilterControlsPage } from "../pages/FilterControlsPage";
import { FilterdResultsPage } from "../pages/FilteredResultsPage";

import { handleCookieDialog, handleSurveyDialog } from "../utils/HandleDialog";

const dataFilePath = path.join(__dirname, "../data/testData.json");
const testData = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
const browsers = [chromium, firefox, webkit];

test.describe("Testing filters on Douglas", () => {
  let filtersPage: FilterControlsPage;
  let filteredResultsPage: FilterdResultsPage;

  test.beforeEach(async ({ page, browserName }) => {
    await page.goto("https://www.douglas.de/"); //Go to www.douglas.de
    await page.waitForLoadState("domcontentloaded");

    await handleCookieDialog(page); // Handle cookie dialog
    await page.waitForTimeout(4000);

    await handleSurveyDialog(page); // Handle survey dialog (if appears)
    const homepageLocator = page.locator(
      "//div[@data-testid='grid' and @class='grid homepage']"
    );
    await expect(homepageLocator).toBeVisible();
    console.log("Homepage is visible."); // Verify successful navigation to Homepage

    const parfum = testData.navigateToCategory[0].category; // Get category to navigate from testData.json file
    const perfumeLink = page.locator(`li:has-text('${parfum}')`);
    await handleSurveyDialog(page);
    await perfumeLink.click();
    await page.waitForTimeout(1000);
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain(parfum.toLowerCase()); //Verify if we are navigated to 'parfum' page successfully.
    console.log("Navigated successfully to Parfum page.");
    filtersPage = new FilterControlsPage(page);
    await filtersPage.page.waitForTimeout(4000);
    await handleSurveyDialog(filtersPage.page); // This survey prompt appears at random intervals during test execution
    // await handleSurveyDialog(filtersPage.page);
    await filtersPage.page.waitForLoadState("domcontentloaded");
    await filtersPage.page.waitForTimeout(4000);
  });

  for (let filter of testData.filters) {
    test(`Apply and verify filter : ${JSON.stringify(filter)}`, async ({
      browserName,
    }) => {
      // Adjust resolution or zoom settings in the WebKit browser to enhance test consistency.
      if (browserName == "webkit") {
        await filtersPage.page.evaluate(() => {
          const content = document.querySelector("#productlisting");
          if (content) {
            console.log("content found");
            document.body.style.zoom = "0.5";
            window.scrollBy(window.innerWidth / 2, 0);

            content.scrollIntoView({
              behavior: "smooth",
              block: "start",
              inline: "start",
            });
          }
        });
      }

      // Apply filters mentioned in the json file

      if (filter.product) await filtersPage.filterByProduct(filter.product);
      if (filter.highlights)
        await filtersPage.filterByHighlights(filter.highlights);
      if (filter.brand) await filtersPage.filterByBrand(filter.brand);
      if (filter.forWhom) await filtersPage.filterByForWhom(filter.forWhom);
      if (filter.giftFor) await filtersPage.filterByGiftFor(filter.giftFor); // Einweihung->Inauguration, Geburtstag->Birthday

      await filtersPage.page.waitForTimeout(2000);
      filteredResultsPage = new FilterdResultsPage(filtersPage.page);

      //Verify filters
      await filteredResultsPage.verifyFilters(filter);

      // Total number of products retrieved after applying filters
      let totalProductTiles = 0;
      const totalPages = await filteredResultsPage.getTotalPages();
      let eachPageProductTiles = 0;
      if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
          // Count product tiles on the current page
          const eachPageProductTiles =
            await filteredResultsPage.countProductTiles();
          totalProductTiles += eachPageProductTiles;
          // Navigate to the next page if it's not the last one
          if (i < totalPages) {
            await filteredResultsPage.nextPageLink.click();
            await filteredResultsPage.page.waitForLoadState("networkidle");
          }
        }
        console.log("Total Products on all pages: ", totalProductTiles);
      } else {
        eachPageProductTiles = await filteredResultsPage.countProductTiles();
        console.log("Total Products: ", eachPageProductTiles);
      }

      //Verify if the product tiles have been filtered correctly
      if (filter.highlights !== "Limitiert") {
        await filteredResultsPage.verifyHighlightInProdTile(filter.highlights);
      }
      if (filter.brand)
        await filteredResultsPage.verifyBrandInProdTile(filter.brand);
      if (filter.product)
        await filteredResultsPage.verifyProductCategoryInProdTile(
          filter.product
        );

      await filteredResultsPage.page.waitForTimeout(2000);
    });
  }
});
