import {test,expect,type Page} from '@playwright/test';

async function start(page:Page,id:number){
 await page.goto('/customize');
 await page.getByRole('button',{name:'Examples',exact:true}).click();
 const created=page.waitForResponse(r=>r.url().endsWith('/api/scenarios')&&r.request().method()==='POST');
 await page.getByTestId('realistic-'+id).click();
 return (await (await created).json()).run;
}
async function verifySource(page:Page,ref:{sourceId:string;caseId:string}){
 await page.goto('/projects/grievance/cases/'+ref.caseId+'/evidence');
 const selector=page.getByLabel('Grievance demo persona');
 if(await selector.inputValue()!=='DEMO-U-RV')await selector.selectOption('DEMO-U-RV');
 const record=page.locator('.gr-evidence').filter({has:page.getByRole('link',{name:ref.sourceId+'.pdf',exact:true})});
 await record.getByRole('button',{name:'Verify',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function role(page:Page,id:string){
 const control=page.getByLabel('Workflow demo role');
 if(await control.inputValue()!==id)await control.selectOption(id);
 await expect(control).toHaveValue(id);
}

test('03 proposes only a date found in a verified source and obtains separate review',async({page})=>{
 test.setTimeout(180000);
 const run=await start(page,3);
 for(const ref of run.evidenceReferences)await verifySource(page,ref);
 await page.goto('/work/'+run.id);
 await page.getByRole('button',{name:'Decisions',exact:true}).click();
 await role(page,'DEMO-U-DA');
 await page.getByRole('button',{name:'Overview',exact:true}).click();
 await page.getByRole('button',{name:'Propose a service date',exact:true}).click();
 await page.getByLabel('Date shown in the original').fill('1998-04-01');
 await page.getByLabel('Source page and reason').fill('Page 1 of the verified synthetic service-book extract');
 await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 await expect(page.getByText(/Proposed service date: 1998-04-01/)).toBeVisible();
 await page.getByRole('button',{name:'Decisions',exact:true}).click();
 await page.getByRole('button',{name:'Request review',exact:true}).click();
 await role(page,'DEMO-U-RV');
 await page.getByRole('button',{name:'Verify section review',exact:true}).click();
 await page.getByLabel('Section review comments').fill('Matched the proposed date to the verified original.');
 await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 await role(page,'DEMO-U-AP');
 await page.getByRole('button',{name:'Approve version',exact:true}).click();
 await page.getByLabel('Review comments').fill('Reviewed the source-bound proposal.');
 await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 const saved=(await (await page.request.get('/api/demo')).json()).runs.find((item:{id:string})=>item.id===run.id);
 expect(saved.serviceDateProposal.date).toBe('1998-04-01');
 expect(saved.sectionReview.actor).toBe('DEMO-U-RV');
 expect(saved.approvalHistory[0].actor).toBe('DEMO-U-AP');
});

test('07 flags only saved work linked to the exact changed source',async({page})=>{
 test.setTimeout(180000);
 const office=await start(page,6);
 const amendment=await start(page,7);
 expect(office.evidenceReferences.some((ref:{sourceId:string})=>ref.sourceId==='DEMO-CIR-CHANGE-NEW')).toBe(true);
 await page.goto('/work/'+amendment.id);
 const queue=page.waitForResponse(r=>r.url().endsWith('/api/demo')&&r.request().method()==='POST'&&JSON.parse(r.request().postData()||'{}').type==='impact');
 await page.getByRole('button',{name:'Create impact review queue',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 expect((await queue).status()).toBe(200);
 const state=(await (await page.request.get('/api/demo')).json()).runs;
 const linked=state.find((item:{id:string})=>item.id===office.id);
 const result=state.find((item:{id:string})=>item.id===amendment.id);
 expect(linked.status).toBe('Source review required');
 expect(linked.tasks.some((task:{title:string})=>task.title.includes('Review linked amended source'))).toBe(true);
 expect(result.status).toBe('Impact queue prepared');
});

test('08 creates a task only for the confirmed source-backed meeting action',async({page})=>{
 test.setTimeout(180000);
 const run=await start(page,8);
 await verifySource(page,run.evidenceReferences[0]);
 await page.goto('/work/'+run.id);
 await page.getByRole('button',{name:'Decisions',exact:true}).click();
 await role(page,'DEMO-U-RV');
 await page.getByRole('button',{name:'Overview',exact:true}).click();
 await page.getByRole('button',{name:'Confirm meeting assignment',exact:true}).click();
 await expect(page.getByLabel('Assigned officer ID')).toHaveValue('DEMO-U-DA');
 await expect(page.getByLabel('Meeting date')).toHaveValue('2026-11-18');
 await page.getByRole('dialog').getByRole('button',{name:'Save',exact:true}).click();
 const saved=(await (await page.request.get('/api/demo')).json()).runs.find((item:{id:string})=>item.id===run.id);
 expect(saved.tasks).toHaveLength(1);
 expect(saved.tasks[0].title).toBe('Ask Record Section to verify the service-book extract');
 expect(saved.tasks[0].owner).toBe('DEMO-U-DA');
 expect(saved.tasks.map((task:{title:string})=>task.title).join(' ')).not.toMatch(/register redesign|older files|signed annexure/i);
});
