import {readFile} from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {test,expect} from '@playwright/test';
import {sources,workflows} from '../legacy-support/catalog';
import type {Run} from '../legacy-support/types';

const formats = ['PDF','DOCX','XLSX','PPTX','TXT'] as const;
const normalize = (s:string) => s.replace(/\s+/g,' ').trim();

for (const workflow of workflows) {
  test(`workflow ${workflow.id}: ${workflow.title} — result, every citation and five exports`, async ({page}, info) => {
    await page.goto('/customize');
    await page.getByTestId('workflow-'+workflow.id).click();
    const launch = page.waitForResponse(r => r.request().method()==='POST' && r.url().endsWith('/api/demo') && r.request().postDataJSON().type==='launch');
    if (workflow.id===1) {
      const observed:unknown[] = [];
      page.on('request',r=>{
        if(r.method()==='POST'&&r.url().endsWith('/api/demo')&&r.postDataJSON().type==='launch') observed.push(r);
      });
      await page.getByRole('button',{name:'Start demonstration'}).evaluate((button:HTMLButtonElement)=>{
        button.form!.requestSubmit(button);
        button.form!.requestSubmit(button);
      });
      await expect(page).toHaveURL(/\/chat\//);
      expect(observed).toHaveLength(1);
    } else {
      await page.getByRole('button',{name:'Start demonstration'}).click();
    }
    const response = await launch;
    expect(response.ok()).toBeTruthy();
    const run:Run = await response.json();
    expect(run.workflowId).toBe(workflow.id);
    expect(run.title).toBe(workflow.output);
    await expect(page).toHaveURL(new RegExp('/chat/'+run.id));
    await expect(page.locator('.user-message')).toHaveText(workflow.question,{timeout:20000});

    if (workflow.id===7) {
      await expect(page.locator('.findings')).toContainText('Prior requirement');
      await expect(page.locator('.findings')).toContainText('10-working-day verification target');
      expect(run.findings.find(f=>f.heading==='What changed')?.citations).toContain('PEN-A:1');
    }

    for (const [index,finding] of run.findings.entries()) {
      const section = page.locator('.findings section').nth(index);
      await expect(section.getByRole('heading')).toHaveText(finding.heading);
      await expect(section.locator('p.preserve')).toHaveText(normalize(finding.text));
      for (const citation of finding.citations) {
        const [id,n] = citation.split(':');
        const paragraph = sources.find(s=>s.id===id)?.paragraphs[Number(n)-1];
        expect(paragraph).toBeTruthy();
        await section.getByRole('button',{name:`${id} §${n}`,exact:true}).click();
        await expect(page.locator('dialog .passage.highlight p')).toHaveText(normalize(paragraph!));
        await page.keyboard.press('Escape');
        await expect(page.locator('dialog')).toHaveCount(0);
      }
    }
    await page.getByRole('button',{name:'Open in Work'}).click();
    const workUrl = new RegExp('/work/'+run.id);
    await expect(page).toHaveURL(workUrl);
    await page.reload();
    await expect(page.locator('.stepper')).toBeVisible();
    await page.screenshot({path:info.outputPath('work.png')});
    for (const format of formats) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('link',{name:format,exact:true}).click(),
      ]);
      expect(await download.failure()).toBeNull();
      const file = info.outputPath(download.suggestedFilename());
      await download.saveAs(file);
      const bytes = await readFile(file);
      expect(bytes.length).toBeGreaterThan(100);
      if (format==='PDF') {
        expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(0);
      } else if (format==='DOCX') {
        const doc = await JSZip.loadAsync(bytes);
        const xml = await doc.file('word/document.xml')!.async('string');
        expect(xml).toContain('Status: '+run.status);
        for (const id of run.sourceIds) expect(xml).toContain(id);
        if (workflow.id===10) expect(xml).toMatch(/[\u0980-\u09ff].*[\u0900-\u097f]|[\u0900-\u097f].*[\u0980-\u09ff]/s);
      } else if (format==='XLSX') {
        const book = new ExcelJS.Workbook();
        await book.xlsx.load(bytes as never);
        expect(book.worksheets[0].getCell('D2').text).toBe(run.status);
        for (const [index,finding] of run.findings.entries()) {
          expect(book.worksheets[0].getCell(index+3,3).text).toBe(finding.citations.join(', '));
        }
      } else if (format==='PPTX') {
        const deck = await JSZip.loadAsync(bytes);
        for (const [index,finding] of run.findings.entries()) {
          const slide = await deck.file(`ppt/slides/slide${index+1}.xml`)!.async('string');
          expect(slide).toContain(run.status);
          for (const id of finding.citations) expect(slide).toContain(id);
        }
      } else {
        const txt = bytes.toString('utf8');
        expect(txt).toContain('Record '+run.id);
        expect(txt).toContain('Status: '+run.status);
        for (const finding of run.findings) for (const c of finding.citations) expect(txt).toContain(c);
        if (workflow.id===10) {
          expect(txt).toMatch(/[\u0980-\u09ff]/);
          expect(txt).toMatch(/[\u0900-\u097f]/);
        }
      }
    }
    await page.goBack();
    await expect(page).toHaveURL(new RegExp('/chat/'+run.id));
    await expect(page.locator('.user-message')).toHaveText(workflow.question);
  });
}
