import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {seedDemoWorld} from '../lib/demo-world';
import {dataDir,readStore} from '../lib/store';
test('shared seed is idempotent and retains real two-page PDF and Word originals with typed source links',async()=>{const previous=process.env.BRAHMA_DATA_DIR,dir=fs.mkdtempSync(path.join(os.tmpdir(),'brahma-world-'));process.env.BRAHMA_DATA_DIR=dir;try{const first=await seedDemoWorld(),second=await seedDemoWorld();assert.equal(first.createdAt,second.createdAt);assert.equal(first.caseIds.length,4);assert.equal(first.documents.length,16);const g=readStore().grievances!;assert.equal(g.legacy!.records.filter(r=>r.adapter==='Kritagyata sample').length,12);assert.equal(g.legacy!.records.filter(r=>r.adapter==='eOffice sample').length,8);for(const d of first.documents){const c=g.cases.find(c=>c.id===d.caseId)!,a=c.attachments.find(a=>a.id===d.attachmentId)!,bytes=fs.readFileSync(path.join(dataDir(),'grievance-evidence',a.hash));if(a.mime==='application/pdf')assert.equal((await PDFDocument.load(bytes)).getPageCount(),2);else assert.equal(bytes.subarray(0,2).toString(),'PK');assert.ok(c.ontology!.links.some(l=>l.to.id===a.id));assert.equal(a.verifiedBy,undefined)}}finally{if(previous===undefined)delete process.env.BRAHMA_DATA_DIR;else process.env.BRAHMA_DATA_DIR=previous;fs.rmSync(dir,{recursive:true,force:true})}});
