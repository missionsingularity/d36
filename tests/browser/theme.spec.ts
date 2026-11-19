import {test,expect} from '@playwright/test';

test('theme stays selected across routes, reloads and both appearance controls',async({page})=>{
  await page.goto('/profile');
  await page.getByRole('button',{name:'Dark',exact:true}).click();
  for(const route of ['/','/projects','/customize','/documents','/tasks','/profile']){
    await page.goto(route);
    await expect(page.locator('.loading')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
    expect(await page.evaluate(()=>localStorage.getItem('brahma-theme'))).toBe('dark');
  }
  await page.getByRole('button',{name:'Dark',exact:true}).click();
  await page.getByRole('button',{name:'Projects',exact:true}).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.getByRole('button',{name:'More options'}).click();
  await page.getByRole('button',{name:'Use light appearance'}).click();
  await page.getByRole('button',{name:'Documents',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  expect(await page.evaluate(()=>localStorage.getItem('brahma-theme'))).toBe('light');
});
