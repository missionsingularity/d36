import {extractOriginal} from '@/lib/extraction';
import {operateEvidence,evidenceActions,documentCompleteness} from '@/lib/grievances/evidence';
import {operateExecution,executionActions,closureBlockers} from '@/lib/grievances/execution';
import {grievanceActor} from '@/lib/grievances/session';
import {operateFollowUp,followUpActions,processReminders} from '@/lib/grievances/followups';
import {caseGraph,scopedCase} from '@/lib/grievances/ontology';
import {NextRequest,NextResponse} from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {readStore,transaction,dataDir,now,id,StoreBusyError} from '@/lib/store';
import {defaultPersona,canReadCase,GrievanceError} from '@/lib/grievances/permissions';
import {createCase,ensureGrievances,getCase,mutateCase,register,report,text,date} from '@/lib/grievances/service';
import {casePdf,historyText,registerCsv,csv,saveAttachment,previewImport,importCases,reverseImport} from '@/lib/grievances/io';
import type {Persona} from '@/lib/grievances/types';
export const runtime='nodejs';export const dynamic='force-dynamic';

function error(e:unknown){const status=e instanceof GrievanceError||e instanceof StoreBusyError?e.status:400,message=e instanceof Error?e.message:'Request failed';return NextResponse.json({error:message,message,code:status===503?'UNAVAILABLE':status===409?'CONFLICT':status===403?'FORBIDDEN':status===401?'SESSION_REQUIRED':status===404?'NOT_FOUND':'VALIDATION',blockers:e instanceof GrievanceError?e.blockers:undefined,correlationId:id(),retryable:e instanceof StoreBusyError},{status})}
function origin(req:NextRequest){const value=req.headers.get('origin');if(value&&new URL(value).host!==req.headers.get('host'))throw new GrievanceError('Cross-origin action denied.',403)}
function download(value:string|Uint8Array,mime:string,filename:string){return new NextResponse(typeof value==='string'?value:new Uint8Array(value).buffer,{headers:{'Content-Type':mime,'Content-Disposition':`attachment; filename="${filename}"`,'Cache-Control':'no-store'}})}
export async function GET(req:NextRequest){try{
 transaction(s=>processReminders(ensureGrievances(s)));const actor=grievanceActor(req),s=readStore(),g=s.grievances!,q=req.nextUrl.searchParams,caseId=q.get('id'),kind=q.get('kind');
 if(caseId){const c=getCase(g,caseId,actor);
  if(kind==='attachment'||kind==='preview'||kind==='inline'){const a=c.attachments.find(a=>a.id===q.get('attachment'));if(!a||! /^[a-f0-9]{64}$/.test(a.hash))throw new GrievanceError('Evidence not found.',404);const bytes=fs.readFileSync(path.join(dataDir(),'grievance-evidence',a.hash));if(kind==='preview'){const {extractOriginal}=await import('@/lib/extraction');let content='';try{content=await extractOriginal(bytes,a.name.split('.').pop()!.toLowerCase())}catch{content='Text preview unavailable. Download the original for inspection.'}return NextResponse.json({name:a.name,text:content||'No readable text found. Inspect the original.',hash:a.hash},{headers:{'Cache-Control':'no-store'}})}if(kind==='inline'){if(a.mime!=='application/pdf')throw new GrievanceError('Inline preview is available for PDF originals.');return new NextResponse(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':'inline','Cache-Control':'no-store'}})}return download(new Uint8Array(bytes),a.mime,a.name.replace(/[^a-zA-Z0-9._-]/g,'_'))}
  if(kind==='links')return NextResponse.json(caseGraph(g,c,actor),{headers:{'Cache-Control':'no-store'}});
  if(kind==='pdf'||kind==='ack')return download(await casePdf(c,kind==='ack'),'application/pdf',c.id+(kind==='ack'?'-acknowledgement':'-history')+'.pdf');
  if(kind==='history')return download(historyText(c),'text/plain; charset=utf-8',c.id+'-history.txt');
  return NextResponse.json({case:scopedCase(g,c,actor),actor,ontology:caseGraph(g,c,actor),closureBlockers:closureBlockers(c,g),completeness:documentCompleteness(c)},{headers:{'Cache-Control':'no-store'}})
 }
 const visible=g.cases.filter(c=>canReadCase(c,actor)),filtered=register(g,actor,q);
 if(kind==='csv')return download(registerCsv(filtered),'text/csv; charset=utf-8','grievance-register.csv');
 if(kind==='report'){const counts=report(visible);return download(csv([['Group','Value','Count'],...Object.entries(counts).flatMap(([key,value])=>typeof value==='object'&&value!==null?Object.entries(value).map(([name,count])=>[key,name,count]):[[key,'',value??'Not available']])]),'text/csv; charset=utf-8','grievance-report.csv')}
 if(kind==='documents'){const search=(q.get('search')||'').toLowerCase();const documents=visible.flatMap(c=>c.attachments.filter(a=>(a.name+' '+c.id+' '+(a.extractedText||'')).toLowerCase().includes(search)).map(a=>{const text=a.extractedText||'',index=search?Math.max(0,text.toLowerCase().indexOf(search)):0;return {id:a.id,name:a.name,caseId:c.id,version:a.version,hash:a.hash,extractionStatus:a.extractionStatus||'Not extracted',excerpt:text.slice(Math.max(0,index-80),index+250)}}));return NextResponse.json({documents:documents.slice(0,100),total:documents.length},{headers:{'Cache-Control':'no-store'}})}
 if(kind==='tasks')return NextResponse.json({actor:actor.id,tasks:visible.flatMap(c=>c.tasks.filter(t=>t.owner===actor.id||['supervisor','approver','authority'].includes(actor.role)).map(t=>({...t,caseId:c.id,caseTitle:c.title,status:t.completedAt?'Completed':t.requiresFollowUp&&c.followUps?.items.find(f=>f.id===t.requiresFollowUp)?.status!=='Resolved'?'Blocked':t.status||'Open'})))},{headers:{'Cache-Control':'no-store'}});
 const page=Math.max(1,Math.min(10000,Number(q.get('page'))||1)),size=10;
 return NextResponse.json({actor,people:g.personas.filter(p=>actor.role==='admin'||(p.member&&p.departments.some(d=>actor.departments.includes(d)))).map(p=>({...p})),cases:filtered.slice((page-1)*size,page*size).map(c=>scopedCase(g,c,actor)),total:filtered.length,page,size,summary:report(visible),myCases:visible.filter(c=>c.owner===actor.id&&!['Closed','Voided'].includes(c.status)).map(c=>scopedCase(g,c,actor)),attention:visible.filter(c=>!c.owner&&!['Draft','Closed','Voided'].includes(c.status)).map(c=>scopedCase(g,c,actor)),recent:visible.flatMap(c=>c.events.map(e=>({...e,caseId:c.id,title:c.title}))).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,12),policies:g.policies,categories:g.categories,batches:actor.role==='admin'?g.batches:[],settingsHistory:actor.role==='admin'?g.settingsHistory:[]},{headers:{'Cache-Control':'no-store'}})
 }catch(e){return error(e)}}
export async function POST(req:NextRequest){try{
 origin(req);if(Number(req.headers.get('content-length')||0)>6*1024*1024)throw new GrievanceError('Request too large.',413);transaction(s=>ensureGrievances(s));const actor=grievanceActor(req);
 if(req.headers.get('content-type')?.includes('multipart/form-data')){const f=await req.formData(),file=f.get('file');if(!(file instanceof File)||file.size>5*1024*1024)throw new GrievanceError('Choose an evidence file up to 5 MB.');const caseId=text(f.get('id'),'Case ID',80);getCase(readStore().grievances!,caseId,actor);const bytes=Buffer.from(await file.arrayBuffer());let extracted:string|undefined;try{extracted=await extractOriginal(bytes,file.name.split('.').pop()!.toLowerCase())}catch{}return NextResponse.json({case:saveAttachment(actor,caseId,Number(f.get('revision')),{name:file.name,mime:file.type,bytes,extracted,previousId:typeof f.get('previousAttachmentId')==='string'?String(f.get('previousAttachmentId')):undefined})})}
 const raw=await req.text();if(raw.length>150000)throw new GrievanceError('Request too large.',413);const b=JSON.parse(raw);
 if(b.action==='persona'){const person=readStore().grievances!.personas.find(p=>p.id===b.persona);if(!person)throw new GrievanceError('Choose a known demo persona.');transaction(s=>{s.sessions![req.cookies.get('brahma-session')!.value].grievancePersona=person.id});return NextResponse.json({ok:true})}
 if(b.action==='create')return NextResponse.json({case:createCase(actor,b,b.register===true)},{status:201});
 if(b.action==='ask'){
  const g=readStore().grievances!,c=getCase(g,text(b.id,'Case ID',80),actor),question=text(b.question,'Question',200);
  let answer='';
  if(question==='Summarise the chronology')answer=c.events.map(e=>`${e.at}: ${e.action} by ${e.actor}. ${e.prior} → ${e.next}.`).join('\n');
  else if(question==='Which attachments are missing?')answer=c.requests.filter(r=>!r.acknowledgedAt).map(r=>`${r.item}; requested from ${r.owner} on ${r.at}`).join('\n')||'No outstanding document requests are recorded. This does not establish that the file is complete.';
  else if(question==='List my overdue cases')answer=g.cases.filter(x=>canReadCase(x,actor)&&x.owner===actor.id&&x.due<now().slice(0,10)&&!['Closed','Draft','Voided'].includes(x.status)).map(x=>`${x.id}: ${x.title}; due ${x.due}`).join('\n')||'No overdue cases assigned to this persona.';
  else if(['Draft the next action','Prepare a response for review'].includes(question))answer=`LOCAL TEMPLATE — NOT APPROVED\n${c.id}: ${c.title}\nReference: ${c.source} ${c.reference}, received ${c.received}.\nCase description: ${c.narrative}\nCurrent state: ${c.status}. Responsible officer: ${c.owner||'Unassigned'}.\nEvidence: ${c.attachments.map(a=>a.name+' ('+(a.verifiedBy?'verified':'unverified')+')').join('; ')||'No evidence attached'}.\nOutstanding requests: ${c.requests.filter(r=>!r.acknowledgedAt).map(r=>r.item).join('; ')||'None recorded'}.\nRecommendation: inspect the original records, address missing evidence, and submit an exact proposed resolution for independent review. No decision or notification is issued by this template.`;
  else throw new GrievanceError('Choose one of the supported case questions.');
  return NextResponse.json({text:answer,draft:['Draft the next action','Prepare a response for review'].includes(question),citations:c.attachments.map(a=>({id:a.id,name:a.name}))});
 }
 if(b.action==='preview-import'){
  const rows=previewImport(actor,text(b.csv,'CSV',100000));const {makeCase}=await import('@/lib/grievances/service');const sandbox=structuredClone(readStore().grievances!);for(const row of rows){if(!row.error)try{makeCase(sandbox,actor,{...row.values,source:'Legacy CSV',contact:'SYNTHETIC-IMPORT'},true)}catch(e){row.error=e instanceof Error?e.message:'Invalid row'}}return NextResponse.json({rows});
 }
 if(b.action==='import')return NextResponse.json(importCases(actor,text(b.csv,'CSV',100000)));
 if(b.action==='reverse')return NextResponse.json(reverseImport(actor,text(b.batchId,'Batch ID',80)));
 if(b.action==='settings'){
  if(actor.role!=='admin'||!actor.member)throw new GrievanceError('Demo admin required.',403);
  return NextResponse.json(transaction(s=>{const g=ensureGrievances(s);
   if(b.personId){const person=g.personas.find(p=>p.id===b.personId);if(!person)throw new GrievanceError('Demo person not found.');if(!Array.isArray(b.departments)||!b.departments.every((v:unknown)=>['Pension','Records','Unrelated unit'].includes(String(v)))||!Array.isArray(b.districts)||!b.districts.every((v:unknown)=>['Demo North','Demo South'].includes(String(v))))throw new GrievanceError('Choose valid scopes.');if(!['intake','officer','supervisor','approver','admin','viewer','custodian','reviewer','authority','appellate','auditor','integration'].includes(b.role)||typeof b.member!=='boolean')throw new GrievanceError('Choose a valid role and membership.');if(person.id===actor.id)throw new GrievanceError('The demo admin cannot remove or change their own access.');const before=structuredClone(person);Object.assign(person,{departments:b.departments,districts:b.districts,role:b.role,member:b.member});g.settingsHistory.push({at:now(),actor:actor.id,detail:JSON.stringify({before,after:person})});
   }else if(b.category){const category=text(b.category,'Category',100);if(g.categories.includes(category))throw new GrievanceError('Category already exists.',409);g.categories.push(category);g.settingsHistory.push({at:now(),actor:actor.id,detail:'Category added: '+category});
   }else{const days=Number(b.days);if(!Number.isInteger(days)||days<1||days>365||!['calendar','business'].includes(b.semantics))throw new GrievanceError('Use 1–365 days and valid day semantics.');const policy={id:'policy-'+Date.now(),label:text(b.label,'Policy label',100),days,semantics:b.semantics,reference:text(b.reference,'Policy source',500),explanation:text(b.explanation,'Policy explanation',1000),effective:date(b.effective,'Effective date'),configuredBy:actor.id,...(b.appealDays?{appealDays:Number(b.appealDays)}:{})};if(policy.appealDays&&(!Number.isInteger(policy.appealDays)||policy.appealDays<1||policy.appealDays>365))throw new GrievanceError('Appeal window must be 1–365 days.');g.policies.push(policy);g.settingsHistory.push({at:now(),actor:actor.id,detail:JSON.stringify(policy)})}
   return {ok:true};
  }));
 }
 const result=(evidenceActions as readonly string[]).includes(b.action)?operateEvidence(actor,text(b.id,'Case ID',80),b):(executionActions as readonly string[]).includes(b.action)?operateExecution(actor,text(b.id,'Case ID',80),b):(followUpActions as readonly string[]).includes(b.action)?operateFollowUp(actor,text(b.id,'Case ID',80),b):mutateCase(actor,text(b.id,'Case ID',80),b);return NextResponse.json({...result,case:scopedCase(readStore().grievances!,result.case,actor)});
 }catch(e){return error(e)}}


