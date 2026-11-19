import {test,expect} from '@playwright/test';
import {Document,Paragraph,Packer} from 'docx';

test('uploaded Word text persists and can be found by its content',async({page})=>{
  const bytes=await Packer.toBuffer(new Document({sections:[{children:[new Paragraph('Illustrative pension evidence: reference ZETA472 requires signed annexure. Register is synthetic.')]}]}));
  await page.goto('/documents');
  await page.locator('input[type=file]').setInputFiles({name:'Sample.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:bytes});
  await expect(page.getByRole('button',{name:/Sample.docx/})).toBeVisible({timeout:20000});
  await page.reload();
  await page.getByLabel('Search documents').fill('ZETA472');
  await page.getByRole('button',{name:/Sample.docx/}).click();
  await expect(page.locator('dialog')).toContainText('ZETA472 requires signed annexure');
  await page.keyboard.press('Escape');
  await page.getByLabel('Search workspace').fill('ZETA472');
  await page.getByRole('button',{name:'Sample.docx · Uploaded record'}).click();
  await expect(page.locator('dialog')).toContainText('Register is synthetic');
});
