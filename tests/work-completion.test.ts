import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {seedDemoWorld} from './legacy-support/demo-world';
import {executeScenario} from './legacy-support/realistic-scenarios';
import {governedRunAction} from './legacy-support/run-policy';
import {readStore,dataDir} from './legacy-support/store';
import {mutateCase} from './legacy-support/grievances/service';

test('source-backed work requires an independent local receipt, proof and authority for closure',async()=>{
 const previous=process.env.BRAHMA_DATA_DIR,dir=fs.mkdtempSync(path.join(os.tmpdir(),'brahma-completion-'));
 process.env.BRAHMA_DATA_DIR=dir;
 try{
  await seedDemoWorld();
  const person=(id:string)=>readStore().grievances!.personas.find(p=>p.id===id)!;
  let run=executeScenario(person('DEMO-U-DA'),'officer',6);
  const proof=run.evidenceReferences![0].sourceId;
  for(const ref of run.evidenceReferences!){
   const sourceCase=readStore().grievances!.cases.find(c=>c.id===ref.caseId)!;
   mutateCase(person('DEMO-U-RV'),sourceCase.id,{action:'verify',revision:sourceCase.revision,attachmentId:ref.attachmentId});
  }
  const action=(actor:string,type:string,extra:Record<string,unknown>={})=>run=governedRunAction(person(actor),'officer',run.id,{type,version:run.versions.at(-1)!.number,reason:'Synthetic test action',...extra});
  action('DEMO-U-DA','request-review');
  action('DEMO-U-RV','verify-review');
  action('DEMO-U-AP','approve');
  assert.throws(()=>action('DEMO-U-DA','dispatch-demo'),/dispatch clerk/);
  action('DEMO-U-DA','schedule-followup',{text:'Confirm the reviewed sample notice was received',date:'2026-12-01'});
  assert.throws(()=>action('DEMO-U-AP','close-work'),/Resolve outstanding follow-ups/);
  const completeTask=(taskId:string,seen=new Set<string>())=>{
   const task=run.tasks.find(item=>item.id===taskId)!;
   if(seen.has(taskId)||task.status==='Verified complete')return;
   seen.add(taskId);
   if(task.dependsOn)completeTask(task.dependsOn,seen);
   if(task.status!=='Verified complete')action('DEMO-U-RV','task',{taskId,status:'Verified complete',proof});
  };
  for(const task of [...run.tasks])completeTask(task.id);
  action('DEMO-U-DS','dispatch-demo');
  assert.match(run.localDispatch!.receipt,/LOCAL DEMONSTRATION DISPATCH ONLY/);
  assert.ok(fs.existsSync(path.join(dataDir(),'exports',run.localDispatch!.outputHash+'.txt')));
  assert.throws(()=>action('DEMO-U-AP','close-work'),/independent.*acknowledgement/i);
  action('DEMO-U-AP','acknowledge-demo',{reason:'Checked the local receipt and matching version hash'});
  action('DEMO-U-DA','resolve-followup',{taskId:run.followUps![0].id,proof});
  action('DEMO-U-AP','close-work',{reason:'All required work and local follow-up evidence recorded'});
  assert.equal(run.status,'Closed');
  action('DEMO-U-AP','reopen-work',{reason:'A new source record requires a fresh review'});
  assert.equal(run.status,'Reopened');
  assert.equal(run.approvedVersion,undefined);
  assert.ok(run.closure);
 }finally{
  if(previous===undefined)delete process.env.BRAHMA_DATA_DIR;else process.env.BRAHMA_DATA_DIR=previous;
  fs.rmSync(dir,{recursive:true,force:true});
 }
});
