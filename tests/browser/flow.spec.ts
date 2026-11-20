import {test,expect} from '@playwright/test';

test('work context survives navigation and refresh',async({page})=>{
  await page.goto('/customize');
  await page.getByTestId('workflow-6').click();
  await page.getByRole('button',{name:'Start demonstration'}).click();
  await page.getByRole('button',{name:'Open in Work'}).click();
  await expect(page).toHaveURL(/\/work\//);
  const work=page.url();
  await page.locator('.tabs').getByRole('button',{name:'Evidence'}).click();
  await expect(page.getByRole('heading',{name:'Original sources'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Original sources'})).toBeVisible();
  await page.getByRole('button',{name:'Projects',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Projects',exact:true})).toBeVisible();
  await page.locator('.view-switch').getByRole('button',{name:'Work',exact:true}).click();
  await expect(page).toHaveURL(work);
  await expect(page.getByRole('heading',{name:'Original sources'})).toBeVisible();
  await page.locator('.tabs').getByRole('button',{name:'Decisions',exact:true}).click();
  await page.getByRole('button',{name:'Approve version',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.locator('.meta-line')).toContainText('Draft');
});

test('confirmation stays locked during saving and submits once',async({page})=>{
  await page.goto('/customize');
  await page.getByTestId('workflow-6').click();
  await page.getByRole('button',{name:'Start demonstration'}).click();
  await page.getByRole('button',{name:'Open in Work'}).click();
  await page.locator('.tabs').getByRole('button',{name:'Decisions'}).click();
  await page.getByRole('button',{name:'Request review',exact:true}).click();
  await expect(page.locator('.meta-line')).toContainText('Review requested');
  await page.goto('/profile');
  await page.getByLabel('Demo persona').selectOption('reviewer');
  await expect(page.getByLabel('Display name')).toHaveValue('Demo Reviewer');
  await page.locator('.view-switch').getByRole('button',{name:'Work',exact:true}).click();
  await page.getByRole('button',{name:'Approve version',exact:true}).click();
  await page.getByLabel('Review comments').fill('Reviewed in flow-control test.');
  let count=0;
  await page.route('**/api/demo',async route=>{
    if(route.request().method()==='POST'&&route.request().postDataJSON().type==='approve'){
      count++;
      await new Promise(resolve=>setTimeout(resolve,800));
    }
    await route.continue();
  });
  await page.getByRole('button',{name:'Save'}).click();
  await expect(page.getByRole('button',{name:'Save'})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Close dialog'})).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog')).toBeVisible();
  await expect(page.locator('.meta-line')).toContainText('Reviewed');
  await expect(page.locator('dialog')).toHaveCount(0);
  expect(count).toBe(1);
});
