import {test,expect,type Page} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';
import {Document,Packer,Paragraph} from 'docx';
async function start(page:Page,id:number){await page.goto('/customize');await page.getByTestId('workflow-'+id).click();await page.getByRole('button',{name:'Start demonstration'}).click();await expect(page).toHaveURL(/\/chat\//);await page.getByRole('button',{name:'Open in Work'}).click();await expect(page).toHaveURL(/\/work\//);return page.url()}
async function persona(page:Page,role:string){await page.goto('/profile');await page.getByLabel('Demo persona').selectOption(role);await expect(page.getByLabel('Demo persona')).toHaveValue(role);await expect(page.locator('.toast')).toBeVisible()}
test('scan correction, independent review and meeting chair confirmation',async({page})=>{
 const scan=await start(page,3);await page.getByRole('button',{name:'Correct uncertain figure'}).click();await page.getByLabel('Corrected service years').selectOption('18');await page.getByLabel('Reason for correction').fill('Inspected synthetic record; choose 18 for this demonstration.');await page.getByRole('button',{name:'Save'}).click();await expect(page.locator('dialog')).toHaveCount(0);
 await page.locator('.tabs').getByRole('button',{name:'Decisions'}).click();await page.getByRole('button',{name:'Request review',exact:true}).click();await expect(page.locator('.meta-line')).toContainText('Review requested');await persona(page,'reviewer');await page.goto(scan);await page.locator('.tabs').getByRole('button',{name:'Decisions'}).click();await page.getByRole('button',{name:'Approve version',exact:true}).click();await page.getByLabel('Review comments').fill('Independent review of corrected demo transcription.');await page.getByRole('button',{name:'Save'}).click();await expect(page.locator('.meta-line')).toContainText('Reviewed');
 await start(page,8);await page.getByRole('button',{name:'Confirm meeting assignment'}).click();await page.getByLabel('Confirmed officer name').fill('Arup (demo)');await page.getByRole('button',{name:'Save'}).click();await page.locator('.tabs').getByRole('button',{name:/Tasks/}).click();await expect(page.getByRole('button',{name:/Request signed annexure/})).toBeVisible();
});
test('task proof guard, private scenario, outreach approval and amendment pause',async({page})=>{
 const plan=await start(page,5);await page.getByRole('button',{name:'Explore a three-day review delay'}).click();await expect(page.getByRole('columnheader',{name:'Private scenario'})).toBeVisible();await page.locator('.tabs').getByRole('button',{name:/Tasks/}).click();await page.getByRole('button',{name:/^Verify annexure/}).click();await page.getByLabel('Proposed status').selectOption('Completed (unverified)');await page.getByRole('button',{name:'Save'}).click();await expect(page.getByRole('row').filter({hasText:'Completed (unverified)'})).toContainText('Verify annexure');
 await page.goto('/tasks');await expect(page.getByRole('region',{name:'Daily progress'})).toContainText('Awaiting proof');await page.getByRole('textbox',{name:'Search tasks'}).fill('Verify annexure');await page.getByLabel('Task priority').selectOption('High');await expect(page.getByRole('button',{name:/^Verify annexure/})).toBeVisible();await expect(page.getByRole('button',{name:/^Prepare draft/})).toHaveCount(0);await page.goto(plan);await page.locator('.tabs').getByRole('button',{name:/Tasks/}).click();
 await page.getByRole('button',{name:/Prepare draft Depends/}).click();await page.getByLabel('Proposed status').selectOption('In progress');await page.getByRole('button',{name:'Save'}).click();await expect(page.locator('dialog [role=alert]')).toContainText('Prerequisite');await page.getByRole('button',{name:'Close dialog'}).click();
 const campaign=await start(page,10);await page.locator('.tabs').getByRole('button',{name:'Decisions'}).click();await page.getByRole('button',{name:'Request review',exact:true}).click();await expect(page.locator('.meta-line')).toContainText('Review requested');await persona(page,'reviewer');await page.goto(campaign);await page.locator('.tabs').getByRole('button',{name:'Decisions'}).click();await page.getByRole('button',{name:'Approve version',exact:true}).click();await page.getByLabel('Review comments').fill('Reviewed all three translations and synthetic consent basis.');await page.getByRole('button',{name:'Save'}).click();await expect(page.locator('.meta-line')).toContainText('Reviewed');await page.locator('.tabs').getByRole('button',{name:'Overview'}).click();await page.getByRole('button',{name:'Simulate approved outreach'}).click();await page.getByRole('button',{name:'Save'}).click();await expect(page.getByText('Opt-out · excluded',{exact:true})).toBeVisible();await page.screenshot({path:'test-results/outreach-light.png'});
 await start(page,7);await page.getByRole('button',{name:'Create impact review queue'}).click();await page.getByRole('button',{name:'Save'}).click();await expect(page.locator('.page-heading')).toContainText('Impact queue prepared');await page.goto(campaign);await expect(page.locator('.page-heading')).toContainText('Source review required');await page.goto(plan);await expect(page.getByRole('columnheader',{name:'Private scenario'})).toBeVisible();
});
test('API permissions, hostile origin, real uploaded originals and downloadable Office outputs',async({request})=>{
 const denied=await request.post('/api/demo',{headers:{origin:'https://untrusted.invalid'},data:{type:'launch',workflowId:1}});expect(denied.status()).toBe(403);
 await request.post('/api/demo',{data:{type:'role',role:'guest'}});expect((await request.get('/api/demo?kind=source&id=RESTRICTED')).status()).toBe(403);expect((await request.post('/api/demo',{data:{type:'launch',workflowId:6}})).status()).toBe(403);
 await request.post('/api/demo',{data:{type:'role',role:'officer'}});const r=await (await request.post('/api/demo',{data:{type:'launch',workflowId:6}})).json();
 for(const format of ['docx','xlsx','pptx','txt']){const res=await request.get(`/api/demo?kind=export&id=${r.id}&format=${format}`);expect(res.ok()).toBeTruthy();expect((await res.body()).length).toBeGreaterThan(100)}
 const pdf=await PDFDocument.create();pdf.addPage();const pdfBytes=Buffer.from(await pdf.save());const docx=await Packer.toBuffer(new Document({sections:[{children:[new Paragraph('Synthetic uploaded verification note')]}]}));
 for(const [name,buffer,mimeType] of [['demo.pdf',pdfBytes,'application/pdf'],['demo.docx',docx,'application/vnd.openxmlformats-officedocument.wordprocessingml.document']] as const){const response=await request.post('/api/demo',{multipart:{file:{name,mimeType,buffer}}});expect(response.ok()).toBeTruthy();const u=await response.json();expect(await (await request.get('/api/demo?kind=upload&id='+u.id)).body()).toEqual(buffer)}
 await request.post('/api/demo',{data:{type:'role',role:'reviewer'}});await request.post('/api/demo',{data:{type:'revoke',role:'guest',sourceId:'CASE-142'}});expect((await request.post('/api/demo',{data:{type:'share',id:r.id,recipient:'guest'}})).status()).toBe(403);await request.post('/api/demo',{data:{type:'role',role:'guest'}});expect((await request.get(`/api/demo?kind=export&id=${r.id}&format=pdf`)).status()).toBe(403);expect((await (await request.get('/api/demo')).json()).runs.some((x:{id:string})=>x.id===r.id)).toBeFalsy();await request.post('/api/demo',{data:{type:'role',role:'reviewer'}});await request.post('/api/demo',{data:{type:'restore',role:'guest',sourceId:'CASE-142'}});
});



test('RTI review return and reopened office-note review block handoff',async({page})=>{
  const rti=await start(page,9);
  const decisions=()=>page.locator('.tabs').getByRole('button',{name:'Decisions'}).click();
  const requestReview=async()=>{
    await page.getByRole('button',{name:'Request review',exact:true}).click();
    await expect(page.locator('.meta-line')).toContainText('Review requested');
  };
  const handoff=()=>page.getByRole('button',{name:'Prepare handoff'}).click();
  await decisions();
  await handoff();
  await expect(page.locator('.error-banner')).toContainText('Review the current version');
  await requestReview();
  await persona(page,'reviewer');
  await page.goto(rti);
  await decisions();
  await page.getByRole('button',{name:'Return'}).click();
  await page.getByLabel('Required changes').fill('Resolve the missing RTI evidence first.');
  await page.getByRole('button',{name:'Save'}).click();
  await expect(page.locator('.meta-line')).toContainText('Returned');
  await handoff();
  await expect(page.locator('.error-banner')).toContainText('Review the current version');

  const note=await start(page,6);
  await decisions();
  await requestReview();
  await page.getByRole('button',{name:'Approve version',exact:true}).click();
  await page.getByLabel('Review comments').fill('Reviewed for local simulation.');
  await page.getByRole('button',{name:'Save'}).click();
  await expect(page.locator('.meta-line')).toContainText('Reviewed');
  await handoff();
  await expect(page.getByText(/manual package prepared/)).toBeVisible();
  await requestReview();
  await page.goto(note);
  await decisions();
  await expect(page.locator('.meta-line')).toContainText('Approved version: None');
  await expect(page.getByText(/manual package prepared/)).toHaveCount(0);
  await handoff();
  await expect(page.locator('.error-banner')).toContainText('Review the current version');
});

test('selected historical date and reviewer-applied task dates persist through the interface',async({page})=>{
  await page.goto('/customize');
  await page.getByTestId('workflow-2').click();
  await page.getByLabel('Event date').fill('2020-01-01');
  await page.getByRole('button',{name:'Start demonstration'}).click();
  await expect(page.locator('.findings')).toContainText('No dated source available',{timeout:20000});
  await expect(page.locator('.findings .citation')).toHaveCount(0);
  const plan=await start(page,5);
  await page.getByRole('button',{name:'Explore a three-day review delay'}).click();
  const row=page.getByRole('row').filter({hasText:'Review packet'});
  await expect(row).toContainText('2026-11-21');
  await expect(row).toContainText('2026-11-24');
  await page.getByRole('button',{name:'Confirm scenario dates'}).click();
  await page.getByRole('button',{name:'Save'}).click();
  await expect(page.locator('dialog [role=alert]')).toContainText('Reviewer and scenario required');
  await page.keyboard.press('Escape');
  await persona(page,'reviewer');
  await page.goto(plan);
  await page.getByRole('button',{name:'Confirm scenario dates'}).click();
  await page.getByRole('button',{name:'Save'}).click();
  await expect(page.getByRole('columnheader',{name:'Private scenario'})).toHaveCount(0);
  await page.reload();
  await page.locator('.tabs').getByRole('button',{name:/Tasks/}).click();
  await expect(page.getByRole('row',{name:/^Review packet /})).toContainText('24 Nov 2026');
});

test('failed draft save preserves unsaved text after switching views',async({page})=>{
  const work=await start(page,6);
  await page.locator('.tabs').getByRole('button',{name:'Documents',exact:true}).click();
  const editor=page.getByRole('textbox',{name:'Working draft'});
  await editor.fill('Local unsaved draft preserved after access changes.');
  await persona(page,'guest');
  await page.goto(work);
  await page.locator('.tabs').getByRole('button',{name:'Documents',exact:true}).click();
  await expect(editor).toHaveValue('Local unsaved draft preserved after access changes.');
  await page.getByRole('button',{name:'Save new version'}).click();
  await expect(page.locator('.error-banner')).toContainText('read-only');
  await page.locator('.tabs').getByRole('button',{name:'Overview'}).click();
  await page.locator('.tabs').getByRole('button',{name:'Documents',exact:true}).click();
  await expect(editor).toHaveValue('Local unsaved draft preserved after access changes.');
});
