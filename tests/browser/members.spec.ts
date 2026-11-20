import {test,expect} from '@playwright/test';
test('project members are added, persisted and removed with owner protection',async({page})=>{
  await page.goto('/projects');
  const card=page.locator('.project-card').first();
  for(const id of ['reviewer','coordinator','viewer']){
    await card.getByRole('button',{name:'Add member',exact:true}).click();
    await page.getByLabel('Member',{exact:true}).selectOption(id);
    await page.getByRole('button',{name:'Confirm and save'}).click();
    await expect(page.locator('dialog')).toHaveCount(0);
  }
  await page.reload();
  await expect(card.locator('.avatar')).toHaveCount(4);
  await card.getByRole('button',{name:'Members',exact:true}).click();
  await page.getByRole('button',{name:'Remove Demo Viewer'}).click();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(card.locator('.avatar')).toHaveCount(3);
  const state=await (await page.request.get('/api/demo')).json();
  const denied=await page.request.post('/api/demo',{data:{type:'member',projectId:state.projects[0].id,memberId:'officer',access:'Editor',remove:true}});
  expect(denied.status()).toBe(409);
});
