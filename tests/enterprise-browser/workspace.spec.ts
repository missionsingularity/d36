import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
const screen = ".qa";
test("duplicate development compiler is refused without breaking the active server", async ({
  request,
}) => {
  const result = spawnSync(
    process.execPath,
    ["scripts/dev.mjs", "--port", "3101"],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_DIST_DIR: ".next-test" },
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
    },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("already running");
  expect((await request.get("/api/workspace")).status()).toBe(200);
});
fs.mkdirSync(screen, { recursive: true });
test("primary workflow, exact approval, exports, search, persistence and visual pages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Good .*Maya/ }),
  ).toBeVisible();
  await page.screenshot({ path: screen + "/home.png", fullPage: true });
  await page
    .getByRole("textbox", { name: "Ask, search, or create anything" })
    .fill(
      "Find unresolved laptop issues affecting Project Alpha, check the replacement policy, prepare requests and send to the IT Manager for approval.",
    );
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page).toHaveURL(/\/chat\//);
  await expect(page.locator(".message.assistant")).toContainText(
    "Submitted for independent approval",
  );
  await expect(page.locator(".citation-chips button").first()).toBeVisible();
  await page.screenshot({ path: screen + "/chat.png", fullPage: true });
  await page.locator(".citation-chips button").first().click();
  await expect(page.locator(".source-preview")).toBeVisible();
  await page.getByRole("button", { name: "Close source preview" }).click();
  await page.getByRole("button", { name: "Open in Work", exact: true }).click();
  await expect(page.locator(".timeline li")).toHaveCount(5);
  await page.screenshot({ path: screen + "/work.png", fullPage: true });
  await page.getByRole("button", { name: /Open saved draft/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Document content" }),
  ).toContainText("Laptop replacement request");
  const docUrl = page.url();
  await page.screenshot({
    path: screen + "/document-editor.png",
    fullPage: true,
  });
  for (const format of ["PDF", "DOCX"]) {
    const dl = page.waitForEvent("download");
    await page.getByRole("link", { name: format, exact: true }).click();
    const file = await dl;
    const path = await file.path();
    expect(path).toBeTruthy();
    const bytes = fs.readFileSync(path!);
    expect(bytes.length).toBeGreaterThan(500);
    expect(bytes.subarray(0, format === "PDF" ? 4 : 2).toString()).toBe(
      format === "PDF" ? "%PDF" : "PK",
    );
  }
  await page.goto("/approvals");
  await expect(page.locator(".approval-card")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /Approve version/ }),
  ).toHaveCount(0);
  await page.screenshot({ path: screen + "/approvals.png", fullPage: true });
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Active employee" })
    .selectOption("arjun");
  await expect(page.locator(".profile-button")).toContainText("Arjun");
  await page.goto("/approvals");
  await page.getByRole("button", { name: "Approve version 1" }).click();
  await expect(
    page.getByRole("button", { name: "Execute approved action" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Execute approved action" }).click();
  await expect(page.locator(".receipt")).toContainText(
    "No external order sent",
  );
  await page.reload();
  await expect(page.locator(".receipt")).toContainText("Replacement ordered");
  await page.goto("/search");
  await expect(page.getByRole("textbox", { name: "" }).first()).toBeVisible();
  await page.screenshot({ path: screen + "/search.png", fullPage: true });
  await page.locator("#enterprise-search").fill("Alpha");
  await expect(page.locator(".result-row").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Documents", exact: true })
    .last()
    .click();
  await expect(page.locator(".search-results")).toContainText("product brief");
  await expect
    .poll(async () => {
      const types = await page
        .locator(".search-results .row-top > .muted")
        .allTextContents();
      return types.length > 0 && types.every((type) => type === "Documents");
    })
    .toBe(true);
  await page.screenshot({
    path: screen + "/search-results.png",
    fullPage: true,
  });
  for (const route of ["it", "projects", "hr", "customize", "settings"]) {
    await page.goto("/" + route);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({
      path: screen + "/" + route + ".png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
  }
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/");
  await page.screenshot({ path: screen + "/dark.png", fullPage: true });
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Good/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({ path: screen + "/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("new document, revision, project team, leave and import via UI", async ({
  page,
}) => {
  await page.goto("/customize");
  await page.getByRole("button", { name: /Meeting notes/ }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(/\/documents\//);
  await page
    .getByRole("textbox", { name: "Document content" })
    .fill("# Meeting notes\n\nDecision: review the search beta.");
  await page
    .getByPlaceholder("What changed and why? Required to save.")
    .fill("Record the actual meeting decision");
  await page.getByRole("button", { name: "Save version" }).click();
  await expect(page.getByRole("button", { name: /Version 2/ })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Document content" }),
  ).toContainText("review the search beta");
  await page.goto("/projects");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Project name" })
    .fill("Browser launch");
  await page
    .getByRole("textbox", { name: "Objective" })
    .fill("Verify project creation and team persistence");
  await page.getByRole("checkbox", { name: /Noah/ }).check();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Browser launch" }),
  ).toBeVisible();
  await expect(page.locator(".team-list")).toContainText("Noah");
  await page.goto("/hr");
  await page
    .getByRole("button", { name: "Request leave", exact: true })
    .click();
  await page.getByLabel("First day").fill("2026-12-14");
  await page.getByLabel("Last day").fill("2026-12-15");
  await page
    .getByRole("textbox", { name: "Reason", exact: true })
    .fill("Family time");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Document content" }),
  ).toContainText("2 working days");
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.locator(".document-context")).toContainText(
    "pending approval",
  );
  await page.goto("/settings");
  await page
    .getByRole("combobox", { name: "Active employee" })
    .selectOption("sam");
  await expect(page.locator(".profile-button")).toContainText("Sam");
  await page.goto("/customize");
  await page
    .getByRole("button", { name: "Legacy import", exact: true })
    .click();
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await expect(page.locator(".import-preview")).toContainText(
    "1 records found",
  );
  await page.getByRole("button", { name: "Confirm import" }).click();
  await expect(page.locator(".import-preview")).toContainText("Import receipt");
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await expect(page.locator(".import-preview")).toContainText("duplicate ID");
});
test("API denies cross-origin mutation and restricted HR searches", async ({
  request,
}) => {
  await request.get("/api/workspace");
  const forbidden = await request.post("/api/workspace", {
    data: { action: "switchUser", id: "sam" },
    headers: { Origin: "https://other.invalid" },
  });
  expect(forbidden.status()).toBe(403);
  const result = await request.get("/api/workspace?q=onboarding&type=HR");
  const json = await result.json();
  expect(json.results).toEqual([]);
});
