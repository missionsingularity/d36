import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import type {Store} from './types';
export const dataDir=()=>path.resolve(process.env.BRAHMA_DATA_DIR||'.data');
export const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export const id=()=>randomUUID();
export const now=()=>new Date().toISOString();
export function readStore():Store { const file=path.join(dataDir(),'state.json'); if(fs.existsSync(file))return JSON.parse(fs.readFileSync(file,'utf8')); return {schema:1,runs:[],audit:[],uploads:[],projects:[{id:'grievance',name:'Grievance Operations',purpose:'Review pension cases with traceable sources, accountable decisions and verified follow-up.'}],settings:{name:'Demo Officer',language:'English',notifications:true},revoked:[]}; }
// Synchronous read-modify-write transactions serialize within one Node process.
// Atomic rename prevents partially written state. This local demo is single-process only.
export function transaction<T>(fn:(state:Store)=>T):T {const state=readStore();const result=fn(state); fs.mkdirSync(dataDir(),{recursive:true}); const tmp=path.join(dataDir(),'state.tmp');fs.writeFileSync(tmp,JSON.stringify(state,null,2));fs.renameSync(tmp,path.join(dataDir(),'state.json'));return result;}
