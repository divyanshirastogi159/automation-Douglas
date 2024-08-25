import { expect, Page } from "@playwright/test";

export async function handleCookieDialog(page: Page) {
  const cookiePopUp = page.locator("div#uc-center-container");
  await expect(cookiePopUp).toBeVisible({
    timeout: 20000,
  });
  if (await cookiePopUp.isVisible()) {
    console.log("Pop up visible");
    await page.waitForLoadState("domcontentloaded");
    const acceptbtn = page.locator(
      "button[data-testid='uc-accept-all-button']"
    );
    await acceptbtn.waitFor({ state: "visible", timeout: 5000 });

    if (await acceptbtn.isVisible()) {
      await acceptbtn.click();
      console.log("Clicked on accept button");
    }
  }
}

export async function handleSurveyDialog(page: Page) {
  const surveyModal = page.locator("div.survey-modal__inner-content");
  const text = "Deine Meinung ist gefragt";
  if (await surveyModal.isVisible()) {
    const modalText = await surveyModal.textContent();
    console.log("Text inside modal: " + modalText);
    const closeButton = page.locator("button.survey-modal__close-inner");

    if (modalText && modalText.includes(text)) {
      if (await closeButton.isVisible()) {
        await page.waitForLoadState("load");
        await closeButton.click();
        console.log("Clicked on survey modal close button");
        await page.waitForTimeout(2000);
        await page.waitForLoadState("domcontentloaded");
      }
    }
  }
}
