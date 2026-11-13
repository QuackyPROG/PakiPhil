import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
test("sample record survives reload, learns missing answers, and exports two forms", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", error => failures.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Gawin ang record ko" }).click();
  await page.getByRole("button", { name: "Try a sample ID", exact: true }).click();
  await page.getByRole("button", { name: "Extract record with Lumen AI" }).click();
  await page.getByRole("button", { name: "Confirm and save 10 values" }).click();
  await expect(page.getByRole("button", { name: "My record (10)" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Paki-fill", exact: true }).click();
  await page.getByRole("button", { name: "Try sample employment form" }).click();
  await expect(page.getByRole("heading", { name: "2 to check." })).toBeVisible();
  await page.getByRole("textbox", { name: "Answer for Birth place", exact: true }).fill("Pasig City");
  await page.locator(".review-field").filter({ has: page.getByRole("textbox", { name: "Answer for Birth place", exact: true }) }).getByRole("button", { name: "Confirm answer" }).click();
  await page.getByRole("textbox", { name: "Answer for Occupation", exact: true }).fill("Teacher");
  await page.locator(".review-field").filter({ has: page.getByRole("textbox", { name: "Answer for Occupation", exact: true }) }).getByRole("button", { name: "Confirm answer" }).click();
  await expect(page.getByRole("heading", { name: "All checked. Pirma na lang!" })).toBeVisible();
  const firstDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download filled PDF" }).click();
  const downloaded = await firstDownload;
  const pdf = await PDFDocument.load(await readFile((await downloaded.path())!));
  expect(pdf.getPageCount()).toBe(1);
  await page.getByRole("button", { name: "Fill another form" }).click();
  await page.getByRole("button", { name: "Try sample membership form" }).click();
  await expect(page.getByRole("heading", { name: "All checked. Pirma na lang!" })).toBeVisible();
  const secondDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download filled PDF" }).click();
  expect((await secondDownload).suggestedFilename()).toBe("paphil-filled.pdf");
  expect(failures).toEqual([]);
});
test("mobile home fits viewport and file type errors are actionable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/");
  await expect(page.getByRole("heading", { name: /Ikaw ang bida/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Gawin ang record ko" }).click();
  await page.locator('input[type="file"]').first().setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("bad") });
  await expect(page.locator(".error[role=alert]")).toContainText("Use a PDF");
});
test("edited extracted sample values are saved and empty edits are rejected", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Gawin ang record ko" }).click();
  await page.getByRole("button", { name: "Try a sample ID", exact: true }).click();
  await page.getByRole("button", { name: "Extract record with Lumen AI" }).click();
  const name = page.locator("label").filter({ has: page.getByText("First name", { exact: true }) }).getByRole("textbox");
  await name.fill(""); await name.press("Tab");
  await expect(page.locator(".error[role=alert]")).toContainText("Enter a value");
  await expect(name).toHaveValue("Juan");
  await name.fill("John"); await name.press("Tab");
  await expect(page.getByRole("status").first()).toContainText("Sample correction saved locally");
  await page.getByRole("button", { name: "Confirm and save 10 values" }).click();
  await expect(page.locator("input").filter({ visible: true }).first()).toHaveValue("John");
});
test("voice answers stay editable and require confirmation before learning", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "SpeechRecognition", { value: class {
      onresult?: (event: { results: { transcript: string }[][] }) => void;
      onend?: () => void;
      start() { this.onresult?.({ results: [[{ transcript: "Pasig City" }]] }); this.onend?.(); }
      abort() { this.onend?.(); }
    } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Gawin ang record ko" }).click();
  await page.getByRole("button", { name: "Try a sample ID", exact: true }).click();
  await page.getByRole("button", { name: "Extract record with Lumen AI" }).click();
  await page.getByRole("button", { name: "Confirm and save 10 values" }).click();
  await page.getByRole("button", { name: "Paki-fill", exact: true }).click();
  await page.getByRole("button", { name: "Try sample employment form" }).click();
  await page.getByRole("button", { name: "Answer by voice" }).first().click();
  await expect(page.getByRole("textbox", { name: "Answer for Birth place", exact: true })).toHaveValue("Pasig City");
  await expect(page.getByRole("button", { name: "My record (10)" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm answer", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "My record (11)" })).toBeVisible();
});
