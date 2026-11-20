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
export class StoreBusyError extends Error {status=409;constructor(){super('Another local writer is saving. Retry after refreshing.')}}
export function transaction<T>(fn:(state:Store)=>T):T {
 const dir=dataDir();fs.mkdirSync(dir,{recursive:true});const lock=path.join(dir,'state.lock');let handle:number;
 try{handle=fs.openSync(lock,'wx');fs.writeFileSync(handle,JSON.stringify({pid:process.pid,at:now()}))}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new StoreBusyError();throw e}
 try{const state=readStore();if(state.grievances?.cases.some(c=>!c.ontology)&&fs.existsSync(path.join(dir,'state.json'))){const backup=path.join(dir,'backups','pre-ontology-v1.json');fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.copyFileSync(path.join(dir,'state.json'),backup,fs.constants.COPYFILE_EXCL)}const result=fn(state),tmp=path.join(dir,'state.tmp');fs.writeFileSync(tmp,JSON.stringify(state,null,2));fs.renameSync(tmp,path.join(dir,'state.json'));return result}
 finally{fs.closeSync(handle);fs.unlinkSync(lock)}
}
