import {NextRequest,NextResponse} from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {readStore,transaction,dataDir,now} from '@/lib/store';
import {defaultPersona,canReadCase,GrievanceError} from '@/lib/grievances/permissions';
import {createCase,ensureGrievances,getCase,mutateCase,register,report,text,date} from '@/lib/grievances/service';
import {casePdf,historyText,registerCsv,csv,saveAttachment,previewImport,importCases,reverseImport} from '@/lib/grievances/io';
import type {Persona} from '@/lib/grievances/types';
export const runtime='nodejs';export const dynamic='force-dynamic';
export function grievanceActor(req:NextRequest):Persona{
 if(process.env.DEMO_MODE==='false')throw new GrievanceError('Local demo disabled.',503);
 const state=readStore(),session=state.sessions?.[req.cookies.get('brahma-session')?.value||''];
 if(!session||session.expiresAt<Date.now())throw new GrievanceError('Open the workspace to start a local demo session.',401);
 const persona=state.grievances?.personas.find(p=>p.id===(session.grievancePersona||defaultPersona(session.role)));
 if(!persona)throw new GrievanceError('Demo identity unavailable.',401);return persona;
}
function error(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Request failed'},{status:e instanceof GrievanceError?e.status:400})}
function origin(req:NextRequest){const value=req.headers.get('origin');if(value&&new URL(value).host!==req.headers.get('host'))throw new GrievanceError('Cross-origin action denied.',403)}
function download(value:string|Uint8Array,mime:string,filename:string){return new NextResponse(typeof value==='string'?value:new Uint8Array(value).buffer,{headers:{'Content-Type':mime,'Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'no-store'}})}
export async function GET(req:NextRequest){try{
 transaction(s=>ensureGrievances(s));const actor=grievanceActor(req),s=readStore(),g=s.grievances!,q=req.nextUrl.searchParams,caseId=q.get('id'),kind=q.get('kind');
 if(caseId){const c=getCase(g,caseId,actor);
  if(kind==='attachment'){const a=c.attachments.find(a=>a.id===q.get('attachment'));if(!a||! /^[a-f0-9]{64}$/.test(a.hash))throw new GrievanceError('Evidence not found.',404);const bytes=fs.readFileSync(path.join(dataDir(),'grievance-evidence',a.hash));return download(new Uint8Array(bytes),a.mime,a.name.replace(/[^a-zA-Z0-9._-]/g,'_'))}
  if(kind==='pdf'||kind==='ack')return download(await casePdf(c,kind==='ack'),'application/pdf',c.id+(kind==='ack'?'-acknowledgement':'-history')+'.pdf');
  if(kind==='history')return download(historyText(c),'text/plain; charset=utf-8',c.id+'-history.txt');
  return NextResponse.json({case:c,actor},{headers:{'Cache-Control':'no-store'}})
 }
 const visible=g.cases.filter(c=>canReadCase(c,actor)),filtered=register(g,actor,q);
 if(kind==='csv')return download(registerCsv(filtered),'text/csv; charset=utf-8','grievance-register.csv');
 if(kind==='report'){const counts=report(visible);return download(csv([['Group','Value','Count'],...Object.entries(counts).flatMap(([key,value])=>typeof value==='object'&&value!==null?Object.entries(value).map(([name,count])=>[key,name,count]):[[key,'',value??'Not available']])]),'text/csv; charset=utf-8','grievance-report.csv')}
 const page=Math.max(1,Math.min(10000,Number(q.get('page'))||1)),size=10;
 return NextResponse.json({actor,people:g.personas.filter(p=>actor.role==='admin'||(p.member&&p.departments.some(d=>actor.departments.includes(d)))).map(p=>({...p})),cases:filtered.slice((page-1)*size,page*size),total:filtered.length,page,size,summary:report(visible),myCases:visible.filter(c=>c.owner===actor.id&&!['Closed','Voided'].includes(c.status)),attention:visible.filter(c=>!c.owner&&!['Draft','Closed','Voided'].includes(c.status)),recent:visible.flatMap(c=>c.events.map(e=>({...e,caseId:c.id,title:c.title}))).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,12),policies:g.policies,categories:g.categories,batches:actor.role==='admin'?g.batches:[],settingsHistory:actor.role==='admin'?g.settingsHistory:[]},{headers:{'Cache-Control':'no-store'}})
 }catch(e){return error(e)}}
export async function POST(req:NextRequest){try{
 origin(req);transaction(s=>ensureGrievances(s));const actor=grievanceActor(req);
 if(req.headers.get('content-type')?.includes('multipart/form-data')){const f=await req.formData(),file=f.get('file');if(!(file instanceof File)||file.size>5*1024*1024)throw new GrievanceError('Choose an evidence file up to 5 MB.');return NextResponse.json({case:saveAttachment(actor,text(f.get('id'),'Case ID',80),Number(f.get('revision')),{name:file.name,mime:file.type,bytes:Buffer.from(await file.arrayBuffer())})})}
 const raw=await req.text();if(raw.length>150000)throw new GrievanceError('Request too large.',413);const b=JSON.parse(raw);
 if(b.action==='persona'){const person=readStore().grievances!.personas.find(p=>p.id===b.persona);if(!person)throw new GrievanceError('Choose a known demo persona.');transaction(s=>{s.sessions![req.cookies.get('brahma-session')!.value].grievancePersona=person.id});return NextResponse.json({ok:true})}
 if(b.action==='create')return NextResponse.json({case:createCase(actor,b,b.register===true)},{status:201});
 if(b.action==='preview-import'){
  const rows=previewImport(actor,text(b.csv,'CSV',100000));const {makeCase}=await import('@/lib/grievances/service');const sandbox=structuredClone(readStore().grievances!);for(const row of rows){if(!row.error)try{makeCase(sandbox,actor,{...row.values,source:'Legacy CSV',contact:'SYNTHETIC-IMPORT'},true)}catch(e){row.error=e instanceof Error?e.message:'Invalid row'}}return NextResponse.json({rows});
 }
 if(b.action==='import')return NextResponse.json(importCases(actor,text(b.csv,'CSV',100000)));
 if(b.action==='reverse')return NextResponse.json(reverseImport(actor,text(b.batchId,'Batch ID',80)));
 if(b.action==='settings'){
  if(actor.role!=='admin'||!actor.member)throw new GrievanceError('Demo admin required.',403);
  return NextResponse.json(transaction(s=>{const g=ensureGrievances(s);
   if(b.personId){const person=g.personas.find(p=>p.id===b.personId);if(!person)throw new GrievanceError('Demo person not found.');if(!Array.isArray(b.departments)||!b.departments.every((v:unknown)=>['Pension','Records','Unrelated unit'].includes(String(v)))||!Array.isArray(b.districts)||!b.districts.every((v:unknown)=>['Demo North','Demo South'].includes(String(v))))throw new GrievanceError('Choose valid scopes.');if(!['intake','officer','supervisor','approver','admin','viewer'].includes(b.role)||typeof b.member!=='boolean')throw new GrievanceError('Choose a valid role and membership.');if(person.id===actor.id)throw new GrievanceError('The demo admin cannot remove or change their own access.');const before=structuredClone(person);Object.assign(person,{departments:b.departments,districts:b.districts,role:b.role,member:b.member});g.settingsHistory.push({at:now(),actor:actor.id,detail:JSON.stringify({before,after:person})});
   }else if(b.category){const category=text(b.category,'Category',100);if(g.categories.includes(category))throw new GrievanceError('Category already exists.',409);g.categories.push(category);g.settingsHistory.push({at:now(),actor:actor.id,detail:'Category added: '+category});
   }else{const days=Number(b.days);if(!Number.isInteger(days)||days<1||days>365||!['calendar','business'].includes(b.semantics))throw new GrievanceError('Use 1–365 days and valid day semantics.');const policy={id:'policy-'+Date.now(),label:text(b.label,'Policy label',100),days,semantics:b.semantics,reference:text(b.reference,'Policy source',500),explanation:text(b.explanation,'Policy explanation',1000),effective:date(b.effective,'Effective date'),configuredBy:actor.id,...(b.appealDays?{appealDays:Number(b.appealDays)}:{})};if(policy.appealDays&&(!Number.isInteger(policy.appealDays)||policy.appealDays<1||policy.appealDays>365))throw new GrievanceError('Appeal window must be 1–365 days.');g.policies.push(policy);g.settingsHistory.push({at:now(),actor:actor.id,detail:JSON.stringify(policy)})}
   return {ok:true};
  }));
 }
 return NextResponse.json(mutateCase(actor,text(b.id,'Case ID',80),b));
 }catch(e){return error(e)}}

