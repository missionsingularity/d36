import {NextRequest,NextResponse} from 'next/server';
import {readStore,transaction,id,StoreBusyError} from '@/lib/store';
import {ensureGrievances,text} from '@/lib/grievances/service';
import {grievanceActor} from '@/lib/grievances/session';
import {GrievanceError,canReadCase} from '@/lib/grievances/permissions';
import {adapters,columns,previewLegacy,commitLegacy,linkOrReconcile,ensureLegacy,sampleFile,sourceVisible,type Adapter} from '@/lib/grievances/legacy';
export const runtime='nodejs';export const dynamic='force-dynamic';
function error(e:unknown){const status=e instanceof GrievanceError||e instanceof StoreBusyError?e.status:400,message=e instanceof Error?e.message:'Import failed';return NextResponse.json({error:message,message,code:status===409?'CONFLICT':status===403?'FORBIDDEN':'VALIDATION',correlationId:id()},{status})}
export async function GET(req:NextRequest){try{transaction(s=>ensureGrievances(s));const p=grievanceActor(req),g=readStore().grievances!,legacy=ensureLegacy(g),q=req.nextUrl.searchParams;
 if(q.get('kind')==='sample'){const adapter=q.get('adapter') as Adapter;if(!adapters.includes(adapter)||!p.member)throw new GrievanceError('Choose an accessible sample adapter.',403);return new NextResponse(sampleFile(adapter),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${adapter.replaceAll(' ','-')}.csv"`,'Cache-Control':'no-store'}})}
 const records=legacy.records.filter(r=>sourceVisible(g,r,p));if(q.get('id')){const record=records.find(r=>r.id===q.get('id'));if(!record)throw new GrievanceError('Source unavailable in your scope.',403);return NextResponse.json(record,{headers:{'Cache-Control':'no-store'}})}
 return NextResponse.json({actor:p,adapters:adapters.map(name=>({name,columns:columns[name],mode:'Local file import / Not connected'})),records,jobs:legacy.jobs.filter(j=>j.actor===p.id).slice(-20).reverse(),cases:g.cases.filter(c=>canReadCase(c,p)).map(c=>({id:c.id,title:c.title,revision:c.revision,reference:c.reference})),canImport:p.member&&['admin','supervisor'].includes(p.role)},{headers:{'Cache-Control':'no-store'}})
 }catch(e){return error(e)}}
export async function POST(req:NextRequest){try{const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==req.headers.get('host'))throw new GrievanceError('Cross-origin action denied.',403);const raw=await req.text();if(raw.length>150000)throw new GrievanceError('Request exceeds local import limit.',413);const b=JSON.parse(raw);transaction(s=>ensureGrievances(s));const p=grievanceActor(req);
 if(['link','reconcile'].includes(b.action))return NextResponse.json(linkOrReconcile(p,b));
 const adapter=b.adapter as Adapter,input=text(b.input,'CSV or JSON export',100000),mapping=b.mapping&&typeof b.mapping==='object'?b.mapping:{};
 if(b.action==='preview')return NextResponse.json(previewLegacy(readStore().grievances!,p,adapter,input,mapping));
 if(b.action==='commit'){if(b.confirmed!==true)throw new GrievanceError('Confirm this synthetic export is approved for local demonstration import.');return NextResponse.json(commitLegacy(p,adapter,input,mapping,text(b.requestKey,'Request key',100)))}
 throw new GrievanceError('Unknown import action.');
 }catch(e){return error(e)}}
