import { test, expect } from "@playwright/test";
test("agent launch, durable artifacts, builder publishing and local schedule", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/work?agent=project");
  await expect(
    page.getByRole("button", { name: "Run agent", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run agent", exact: true }).click();
  await expect(page).toHaveURL(/work\?run=/);
  await expect(page.locator(".engine-run-header")).toContainText("COMPLETED", {
    timeout: 30000,
  });
  await expect(page.locator(".engine-timeline .engine-card")).toHaveCount(2);
  await page.reload();
  await expect(page.locator(".engine-run-header")).toContainText("COMPLETED");
  await page.getByRole("button", { name: "Artifacts", exact: true }).click();
  await expect(page.getByRole("link", { name: "Open document" })).toBeVisible();
  await page.screenshot({ path: ".qa/engine-artifacts.png", fullPage: true });
  await page.goto("/profile");
  await page
    .getByRole("combobox", { name: "Active employee" })
    .selectOption("sam");
  await expect(page.locator(".profile-button")).toContainText("Sam");
  await page.goto("/work");
  await page
    .getByRole("button", { name: "Agent Builder", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Browser Research Agent");
  await page.getByLabel("Goal / description").fill("Find project knowledge");
  await page
    .getByLabel("Instructions", { exact: true })
    .fill("Find Alpha records and return sources");
  await page
    .getByLabel("Workflow steps, dependencies and branch conditions (JSON)")
    .fill(
      '[{"id":"search","tool":"search_records","arguments":{"query":"Alpha"},"dependsOn":[],"approvalPolicy":"none"}]',
    );
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("version 1 saved");
  await page
    .getByRole("button", { name: "Agent Library", exact: true })
    .click();
  await page.getByRole("button", { name: /Browser Research Agent/ }).click();
  await page.getByRole("button", { name: "Run agent", exact: true }).click();
  await expect(page.locator(".engine-run-header")).toContainText("COMPLETED");
  await page
    .getByRole("button", { name: "Settings", exact: true })
    .last()
    .click();
  await page.getByLabel("First run").fill("2026-12-04T09:00");
  await page
    .getByRole("button", { name: "Save schedule", exact: true })
    .click();
  await expect(page.locator(".engine-page")).toContainText(
    "Prepare the weekly project report ·",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".qa/engine-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});
