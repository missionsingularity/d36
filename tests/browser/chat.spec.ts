import {test,expect} from '@playwright/test';

test('typed local chat returns real source excerpts and retains the conversation',async({page})=>{
  await page.goto('/');
  await page.getByLabel('Ask anything').fill('find documents about pension');
  await page.getByRole('button',{name:'Send question'}).click();
  await expect(page).toHaveURL(/\/conversations\//);
  await expect(page.locator('.conversation')).toContainText('Matching passages from your accessible synthetic records',{timeout:20000});
  await page.locator('.conversation .citation').first().click();
  await expect(page.locator('dialog .passage.highlight')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByLabel('Continue conversation').fill('show pending approvals');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.locator('.conversation')).toContainText('There are no pending review requests');
  await page.reload();
  await expect(page.locator('.conversation')).toContainText('show pending approvals');
  await page.getByLabel('Continue conversation').fill('Tell me a joke');
  await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.locator('.conversation')).toContainText('A general language model is not configured');
});
