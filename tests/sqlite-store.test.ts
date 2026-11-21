import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readStore,transaction} from './legacy-support/store';
import {ensureTemplates} from './legacy-support/workflow-templates';
test('SQLite migration retains JSON and backup, indexes typed objects and rolls back failed mutations',()=>{const previous=process.env.BRAHMA_DATA_DIR,dir=fs.mkdtempSync(path.join(os.tmpdir(),'brahma-sqlite-'));process.env.BRAHMA_DATA_DIR=dir;try{const old=readStore();old.settings.name='Synthetic pre-migration officer';const original=JSON.stringify(old,null,2);fs.writeFileSync(path.join(dir,'state.json'),original);transaction(s=>{ensureTemplates(s);s.settings.language='Hindi'});assert.equal(readStore().settings.name,old.settings.name);assert.equal(readStore().settings.language,'Hindi');assert.equal(fs.readFileSync(path.join(dir,'state.json'),'utf8'),original);assert.equal(fs.readFileSync(path.join(dir,'backups','pre-sqlite-v1.json'),'utf8'),original);const db=new DatabaseSync(path.join(dir,'brahmagpt.sqlite'));try{const count=db.prepare("SELECT COUNT(*) AS count FROM ontology_objects WHERE type='WorkflowTemplate'").get() as {count:number};assert.equal(count.count,10);assert.ok(db.prepare('SELECT id FROM ontology_links LIMIT 1').get())}finally{db.close()}assert.throws(()=>transaction(s=>{s.settings.name='Must not persist';throw new Error('rollback')}),/rollback/);assert.equal(readStore().settings.name,old.settings.name)}finally{if(previous===undefined)delete process.env.BRAHMA_DATA_DIR;else process.env.BRAHMA_DATA_DIR=previous;fs.rmSync(dir,{recursive:true,force:true})}});
