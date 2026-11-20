import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readStore} from '../lib/store';
import {guidedAction,guidedSnapshot,launchFlagship,ensureGuided} from '../lib/guided-demo';
import {transaction} from '../lib/store';
import {exportRun} from '../lib/exports';
import {PDFDocument} from 'pdf-lib';
let dir:string,previous:string|undefined;
beforeEach(()=>{previous=process.env.BRAHMA_DATA_DIR;dir=fs.mkdtempSync(path.join(os.tmpdir(),'brahma-guided-'));process.env.BRAHMA_DATA_DIR=dir;transaction(s=>ensureGuided(s))});
afterEach(()=>{if(previous===undefined)delete process.env.BRAHMA_DATA_DIR;else process.env.BRAHMA_DATA_DIR=previous;fs.rmSync(dir,{recursive:true,force:true})});
const person=(id:string)=>readStore().grievances!.personas.find(p=>p.id===id)!;
test('five-scene pension case executes real governed actions, files and closure',async()=>{
 let run=launchFlagship(person('DEMO-U-DA'),'launch-1');assert.equal(launchFlagship(person('DEMO-U-DA'),'launch-1').id,run.id);
 const act=(role:string,action:string,extra={})=>{const result=guidedAction(person(role),run.id,{action,revision:run.revision,requestKey:action+'-'+run.revision,reason:'Inspected synthetic records independently',...extra});run=result.run;return result.case};
 assert.throws(()=>act('DEMO-U-OB','reconstruct'),/role/);act('DEMO-U-DA','reconstruct');assert.throws(()=>act('DEMO-U-DA','prepare-note'),/verified/);act('DEMO-U-DA','attach-service');act('DEMO-U-RV','verify');act('DEMO-U-DA','complete-verification');let c=act('DEMO-U-DA','prepare-note');const firstHash=c.decisions[0].hash;
 c=act('DEMO-U-DA','edit-note',{text:c.decisions[0].text+'\nDEMO verified clarification added.'});assert.equal(c.decisions.length,2);assert.equal(c.decisions[0].hash,firstHash);act('DEMO-U-DA','submit-review');act('DEMO-U-RV','verify-review');act('DEMO-U-DA','request-approval');assert.throws(()=>act('DEMO-U-DA','approve',{version:2}),/role/);assert.throws(()=>act('DEMO-U-AP','approve',{version:1}),/version/);act('DEMO-U-AP','approve',{version:2});act('DEMO-U-DA','prepare-response');act('DEMO-U-AP','approve-response');act('DEMO-U-DS','dispatch');assert.throws(()=>act('DEMO-U-AP','close'),/acknowledgement|reply/);act('DEMO-U-AP','acknowledge');assert.throws(()=>act('DEMO-U-AP','close'),/reply|tasks/);act('DEMO-U-DA','complete-followup');c=act('DEMO-U-AP','close');assert.equal(c.status,'Closed');assert.equal(c.decisions[0].hash,firstHash);const saved=guidedSnapshot(person('DEMO-U-OB'),run.id);assert.ok('case'in saved);assert.equal(readStore().grievances!.legacy!.records.length,2);
 const work=readStore().runs.find(r=>r.grievanceCaseId===c.id)!;for(const format of ['PDF','DOCX','XLSX','PPTX','TXT']){const file=await exportRun(work,format.toLowerCase());assert.ok(file.buffer.length>100);if(format==='PDF')assert.ok((await PDFDocument.load(file.buffer)).getPageCount()>0)}
 assert.throws(()=>guidedSnapshot(person('outside'),run.id),/scope/);
});
