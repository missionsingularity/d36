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
    page.getByRole("heading", { name: "Start your day with BrahmaGpt" }),
  ).toBeVisible();
  await page.screenshot({ path: screen + "/home.png", fullPage: true });
  await page
    .getByRole("textbox", { name: "Ask a question or describe a task" })
    .fill(
      "Find the latest Alpha project report, compare it with current tasks, identify delays, prepare an updated weekly report and send the draft to my manager for approval.",
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
  await page.getByRole("button", { name: /^Sources \(/ }).click();
  await expect(page.locator(".source-list-panel")).toBeVisible();
  await expect(page.locator(".source-list-item").first()).toBeVisible();
  expect(
    await page
      .locator(".main-shell")
      .evaluate((el) => el.getBoundingClientRect().right),
  ).toBeLessThanOrEqual(1061);
  await page.getByRole("button", { name: "Close sources panel" }).click();
  await page
    .getByRole("button", { name: "View Workflow Details", exact: true })
    .click();
  await expect(page.locator(".timeline li")).toHaveCount(5);
  await page.screenshot({ path: screen + "/work.png", fullPage: true });
  await page.getByRole("button", { name: /Open saved draft/ }).click();
  await expect(
    page.getByRole("textbox", { name: "Document content" }),
  ).toContainText("Alpha · progress report");
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
  const reportApproval = page
    .locator(".approval-card")
    .filter({ hasText: "Project report" });
  await expect(reportApproval).toHaveCount(1);
  await expect(
    reportApproval.getByRole("button", { name: /Approve version/ }),
  ).toHaveCount(0);
  await page.screenshot({ path: screen + "/approvals.png", fullPage: true });
  await page.goto("/profile");
  await page
    .getByRole("combobox", { name: "Active employee" })
    .selectOption("marcus-reed");
  await expect(page.locator(".profile-button")).toContainText("Marcus");
  await page.goto("/approvals");
  await reportApproval.getByRole("button", { name: /Approve version/ }).click();
  await page
    .getByRole("textbox", { name: "Reason for approval" })
    .fill("Reviewed the exact version and its linked evidence.");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("button", { name: /^Approved/ }).click();
  await expect(
    page.getByRole("button", { name: "Execute approved action" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Execute approved action" }).click();
  await expect(page.locator(".receipt")).toContainText(
    "Exact document version approved and released in the local workspace",
  );
  await page.reload();
  await page.getByRole("button", { name: /^Approved/ }).click();
  await expect(page.locator(".receipt")).toContainText(
    "Exact document version approved and released in the local workspace",
  );
  await page.goto("/search");
  await expect(
    page.getByRole("searchbox", { name: "Search across Singularity" }),
  ).toBeVisible();
  await page.screenshot({ path: screen + "/search.png", fullPage: true });
  await page
    .getByRole("searchbox", { name: "Search across Singularity" })
    .fill("Alpha");
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
  await page
    .getByRole("button", { name: "Appearance", exact: true })
    .click();
  await page.getByRole("button", { name: /^Dark/ }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/");
  await page.screenshot({ path: screen + "/dark.png", fullPage: true });
  await page.goto("/settings");
  await page
    .getByRole("button", { name: "Appearance", exact: true })
    .click();
  await page.getByRole("button", { name: /^Light/ }).click();
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
  await expect(page.locator(".project-overview-columns")).toContainText(
    "Noah",
  );
  await page.goto("/hr");
  await page
    .getByRole("button", { name: /Request leave/ })
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
  await page.goto("/profile");
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
    "3 records found",
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
test("unified Home search and keyboard source previews work", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("button").first()).toHaveText("Home");
  await expect(page.getByRole("button", { name: "New chat" })).toBeVisible();
  await expect(
    nav.getByRole("button", { name: "Search", exact: true }),
  ).toHaveCount(0);
  const composer = page.getByRole("textbox", {
    name: "Ask a question or describe a task",
  });
  await composer.fill("Alpha");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  const input = page.getByRole("searchbox", {
    name: "Search across Singularity",
  });
  await expect(input).toHaveValue("Alpha");
  await expect(page).toHaveURL(/\?q=Alpha/);
  await expect(page.locator(".result-row").first()).toBeVisible();
  await page.reload();
  await expect(input).toHaveValue("Alpha");
  await page
    .locator(".search-tabs")
    .getByRole("button", { name: "Documents", exact: true })
    .click();
  await expect(page.locator(".result-row").first()).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await input.fill("ThinkPad");
  await expect(page.locator(".result-row")).toHaveCount(1);
  await input.press("ArrowDown");
  await expect(page.locator(".result-row")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".source-preview")).toContainText("ThinkPad");
  await page.keyboard.press("Escape");
  await expect(page.locator(".source-preview")).toHaveCount(0);
  await input.fill("");
  await page
    .getByRole("button", { name: "New chat", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Ask a question or describe a task" }),
  ).toHaveValue("");
  await page.goto("/");
  await composer.fill("Alpha");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("button", { name: "Ask about these records", exact: true })
    .click();
  await expect(page).toHaveURL(/\/chat\//);
  await expect(page.locator(".message.assistant")).toContainText(
    "Project Alpha",
  );
});
