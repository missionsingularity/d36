import {caseWorkAllowed} from '@/lib/grievances/access';
import {sendMessage} from '@/lib/chat';
import {extractOriginal} from '@/lib/extraction';
import {settingsFor,updateSettings} from '@/lib/settings';
import {NextRequest,NextResponse} from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import {sources,workflows,type Role} from '@/lib/catalog';
import {readStore,transaction,dataDir,id,hash,now,StoreBusyError} from '@/lib/store';
import {act,launch,sourceAllowed,assertRun,DomainError,audit} from '@/lib/engine';
import {exportRun,seedFiles} from '@/lib/exports';
export const runtime='nodejs';export const dynamic='force-dynamic';
function role(req:NextRequest):Role {
 const token=req.cookies.get('brahma-session')?.value;
 const session=token?readStore().sessions?.[token]:undefined;
 if(!session||session.expiresAt<Date.now())throw new DomainError('Session expired. Reload the workspace or select a demo persona.',401);
 return session.role;
}
function permittedCaseWork(req:NextRequest,s:ReturnType<typeof readStore>,caseId:string,user:Role){const token=req.cookies.get('brahma-session')?.value;return caseWorkAllowed(s,caseId,user,token?s.sessions?.[token]?.grievancePersona:undefined)}
function checkRun(req:NextRequest,run:ReturnType<typeof readStore>['runs'][number],user:Role,s:ReturnType<typeof readStore>){if(run.grievanceCaseId){if(!permittedCaseWork(req,s,run.grievanceCaseId,user))throw new DomainError('Case work unavailable in your scope.',403)}else assertRun(run,user,s)}
function createSession(user:Role){
 const token=id();
 transaction(s=>{
   s.sessions??={};
   for(const [key,session] of Object.entries(s.sessions))if(session.expiresAt<Date.now())delete s.sessions[key];
   s.sessions[token]={role:user,expiresAt:Date.now()+86400000};
 });
 return token;
}
function setSession(response:NextResponse,token:string){
 response.cookies.set('brahma-session',token,{httpOnly:true,sameSite:'strict',path:'/',maxAge:86400,secure:process.env.NODE_ENV==='production'&&process.env.SECURE_COOKIES==='true'});
 return response;
}
function err(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Request failed'},{status:e instanceof DomainError||e instanceof StoreBusyError?e.status:400})}
function enabled(){if(process.env.DEMO_MODE==='false')throw new DomainError('Local demo disabled. Production authentication is not configured.',503)}
export async function GET(req:NextRequest){try{enabled();let bootstrap:string|undefined;let user:Role;try{user=role(req)}catch{if(req.nextUrl.searchParams.get('kind')&&req.nextUrl.searchParams.get('kind')!=='health')throw new DomainError('Session required. Open the workspace first.',401);user='officer';bootstrap=createSession(user)}const s=readStore(),q=req.nextUrl.searchParams;const kind=q.get('kind');if(kind==='health')return NextResponse.json({status:'ok',mode:'local-demo',storage:'atomic-json',ai:'offline'});
 if(kind==='scan'){if(!sourceAllowed('SCAN',user,s))throw new DomainError('Source unavailable',403);await seedFiles();return new NextResponse(fs.readFileSync(path.join(dataDir(),'sources','SCAN.svg')),{headers:{'Content-Type':'image/svg+xml','Cache-Control':'no-store'}})}
 if(kind==='source'){const source=sources.find(x=>x.id===q.get('id'));if(!source||!sourceAllowed(source.id,user,s))throw new DomainError('Source unavailable',403);await seedFiles();const format=q.get('format')==='pdf'?'pdf':'txt';return new NextResponse(fs.readFileSync(path.join(dataDir(),'sources',source.id+'.'+format)),{headers:{'Content-Type':format==='pdf'?'application/pdf':'text/plain; charset=utf-8','Content-Disposition':`${q.get('download')?'attachment':'inline'}; filename="${source.id}.${format}"`,'Cache-Control':'no-store'}})}
 if(kind==='export'){const run=s.runs.find(x=>x.id===q.get('id'));if(!run)throw new DomainError('Work not found',404);checkRun(req,run,user,s);const format=q.get('format')||'pdf';const out=await exportRun(run,format);transaction(state=>audit(state,user,'Export generated',`${format} / ${out.key}`,run.id));return new NextResponse(new Uint8Array(out.buffer),{headers:{'Content-Type':out.mime,'Content-Disposition':`attachment; filename="BrahmaGPT-${run.workflowId}-v${run.versions.at(-1)!.number}.${format}"`,'Cache-Control':'no-store'}})}
 if(kind==='upload'){const u=s.uploads.find(x=>x.id===q.get('id')&&(x.owner===user||user==='reviewer'));if(!u)throw new DomainError('File unavailable',403);return new NextResponse(fs.readFileSync(path.join(dataDir(),'uploads',u.hash)),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="${u.title.replace(/[^a-zA-Z0-9._-]/g,'_')}"`}})}
 const runs=s.runs.filter(r=>r.sourceIds.every(x=>sourceAllowed(x,user,s))&&(!r.grievanceCaseId||permittedCaseWork(req,s,r.grievanceCaseId,user))).map(r=>({...r,relatedCaseIds:r.relatedCaseIds?.filter(caseId=>permittedCaseWork(req,s,caseId,user))}));const response=NextResponse.json({role:user,conversations:(s.conversations||[]).filter(c=>c.owner===user).map(c=>({...c,messages:c.messages.map(m=>m.citations.every(id=>sourceAllowed(id.split(':')[0],user,s))?m:{...m,text:'Source access changed. This answer is unavailable.',citations:[]})})),sources:sources.filter(x=>sourceAllowed(x.id,user,s)),workflows,runs,projects:s.projects,settings:settingsFor(s,user),permissions:{revoked:user==='reviewer'?s.revoked:[],canManage:user==='reviewer'},uploads:s.uploads.filter(x=>x.owner===user||user==='reviewer'),audit:s.audit.filter(a=>!a.runId||runs.some(r=>r.id===a.runId)).slice(-100).reverse()},{headers:{'Cache-Control':'no-store'}});return bootstrap?setSession(response,bootstrap):response;
 }catch(e){return err(e)}}
export async function POST(req:NextRequest){try{enabled();const origin=req.headers.get('origin');if(origin&&(new URL(origin).host!==req.headers.get('host')||!['http:','https:'].includes(new URL(origin).protocol)))throw new DomainError('Cross-origin action denied',403);const switching=req.headers.get('content-type')?.includes('application/json')?await req.clone().json().catch(()=>null):null;if(switching?.type==='role'){if(!['officer','reviewer','guest'].includes(switching.role))throw new DomainError('Unknown demo role');return setSession(NextResponse.json({ok:true}),createSession(switching.role))}const user=role(req);
 if(req.headers.get('content-type')?.includes('multipart/form-data')){if(user==='guest')throw new DomainError('Guest is read-only',403);const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||!file.size||file.size>10*1024*1024)throw new DomainError('Choose a file between 1 byte and 10 MB');const bytes=Buffer.from(await file.arrayBuffer());const ext=file.name.split('.').pop()?.toLowerCase();if(!['txt','csv','pdf','docx'].includes(ext||''))throw new DomainError('Supported originals: TXT, CSV, PDF, DOCX');if(ext==='pdf'&&!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))throw new DomainError('Invalid PDF signature');if(ext==='docx'&&bytes.subarray(0,2).toString()!=='PK')throw new DomainError('Invalid DOCX signature');const checksum=hash(bytes);fs.mkdirSync(path.join(dataDir(),'uploads'),{recursive:true});const filePath=path.join(dataDir(),'uploads',checksum);if(!fs.existsSync(filePath))fs.writeFileSync(filePath,bytes);let extracted='';try{extracted=await extractOriginal(bytes,ext!)}catch{extracted='Extraction unavailable. Original preserved; a reviewed text derivative is required.'}const upload={id:id(),title:file.name.slice(0,160),hash:checksum,size:file.size,mime:file.type,createdAt:now(),owner:user,extraction:extracted.trim()||'No readable text found. Original preserved; OCR or manual transcription is required.'};transaction(s=>{s.uploads.push(upload);audit(s,user,'Original uploaded','Unverified private working material')});return NextResponse.json(upload)}
 const body=await req.json();
 if(body.type==='conversation-work'){
  const conversation=readStore().conversations?.find(c=>c.id===body.conversationId&&c.owner===user);
  if(!conversation)throw new DomainError('Conversation unavailable',403);
  if(conversation.workId){const run=readStore().runs.find(r=>r.id===conversation.workId);if(!run)throw new DomainError('Work unavailable',404);checkRun(req,run,user,readStore());return NextResponse.json(run)}
  const run=launch(6,user);
  transaction(s=>{
    const thread=s.conversations!.find(c=>c.id===conversation.id)!;
    thread.workId=run.id;
    s.runs.find(r=>r.id===run.id)!.conversationId=thread.id;
    audit(s,user,'Conversation linked to work','Office-note draft prepared for review',run.id);
  });
  return NextResponse.json(run);
 }
 if(body.type==='message')return NextResponse.json(sendMessage(user,body.text,body.conversationId));
 if(body.type==='launch')return NextResponse.json(launch(Number(body.workflowId),user,body.date));
 if(body.runId){const state=readStore(),run=state.runs.find(r=>r.id===body.runId);if(run?.grievanceCaseId)throw new DomainError('Edit and review case proposals in the linked case dossier.',409);return NextResponse.json(act(body.runId,body,user))}
 if(body.type==='settings'){transaction(s=>{updateSettings(s,user,body);audit(s,user,'Preferences saved','Local workspace preferences')});return NextResponse.json({ok:true})}
 if(user==='guest')throw new DomainError('Guest is read-only',403);
 if(body.type==='member'){
   if(user!=='officer'&&user!=='reviewer')throw new DomainError('Project editor required',403);
   const people=[{id:'officer',name:'Demo Officer'},{id:'reviewer',name:'Demo Reviewer'},{id:'coordinator',name:'Demo Coordinator'},{id:'viewer',name:'Demo Viewer'}];
   const person=people.find(p=>p.id===body.memberId);
   if(!person||!['Editor','Reviewer','Viewer'].includes(body.access))throw new DomainError('Choose an eligible member and role');
   return NextResponse.json(transaction(s=>{
     const project=s.projects.find(p=>p.id===body.projectId);
     if(!project)throw new DomainError('Project unavailable',404);
     project.members??=[{id:'officer',name:'Demo Officer',access:'Owner'}];
     if(body.remove){
       const member=project.members.find(m=>m.id===person.id);
       if(member?.access==='Owner')throw new DomainError('The project owner must remain assigned',409);
       project.members=project.members.filter(m=>m.id!==person.id);
     }else{
       if(project.members.some(m=>m.id===person.id))throw new DomainError('Member already belongs to this project',409);
       project.members.push({...person,access:body.access});
     }
     audit(s,user,body.remove?'Project member removed':'Project member added',project.name+' / '+person.name);
     return project;
   }));
 }
 if(body.type==='project'){if(!body.name?.trim()||!body.purpose?.trim())throw new DomainError('Name and purpose required');return NextResponse.json(transaction(s=>{const p={id:id(),name:String(body.name).slice(0,100),purpose:String(body.purpose).slice(0,1000)};s.projects.push(p);audit(s,user,'Project created','Authority pending; illustrative project');return p}))}
 if(body.type==='share'){const s=readStore(),r=s.runs.find(x=>x.id===body.id);if(!r)throw new DomainError('Select a work record',404);checkRun(req,r,user,s);if(r.grievanceCaseId)throw new DomainError('Share the case link with a permitted local persona. Case scope is checked on every request.',409);const recipient:Role=body.recipient==='reviewer'?'reviewer':'guest';const visible=r.sourceIds.filter(x=>sourceAllowed(x,recipient,s));if(visible.length!==r.sourceIds.length)throw new DomainError('Sharing blocked: recipient cannot access the underlying sources.',403);transaction(st=>audit(st,user,'Internal share prepared',`Recipient role ${recipient}; no email sent`,r.id));return NextResponse.json({url:`/chat/${r.id}`,scope:`Internal demo ${recipient}; permissions checked on every request. No email sent.`})}
 if(body.type==='restore'){if(user!=='reviewer')throw new DomainError('Reviewer required',403);if(!sources.some(s=>s.id===body.sourceId)||!['guest','officer'].includes(body.role))throw new DomainError('Invalid restoration');transaction(s=>{s.revoked=s.revoked.filter(key=>key!==body.role+':'+body.sourceId);audit(s,user,'Source restriction removed','Base permissions remain enforced')});return NextResponse.json({ok:true})}
 if(body.type==='revoke'){if(user!=='reviewer')throw new DomainError('Reviewer required',403);if(!sources.some(s=>s.id===body.sourceId)||!['guest','officer'].includes(body.role))throw new DomainError('Invalid revocation');transaction(s=>{const key=`${body.role}:${body.sourceId}`;if(!s.revoked.includes(key))s.revoked.push(key);audit(s,user,'Source access revoked','Role-specific local demo restriction')});return NextResponse.json({ok:true})}
 throw new DomainError('Unknown request');}catch(e){return err(e)}}

