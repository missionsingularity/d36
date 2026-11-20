import {NextRequest,NextResponse} from 'next/server';
import {grievanceActor} from '@/lib/grievances/session';
import {GrievanceError} from '@/lib/grievances/permissions';
import {templateAction,templateSnapshot} from '@/lib/workflow-templates';
import {readStore,transaction} from '@/lib/store';
import {ensureGuided} from '@/lib/guided-demo';
export const runtime='nodejs';export const dynamic='force-dynamic';
function fail(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Workflow failed'},{status:e instanceof GrievanceError?e.status:400})}
function actor(req:NextRequest){transaction(s=>ensureGuided(s));return {person:grievanceActor(req),role:readStore().sessions![req.cookies.get('brahma-session')!.value].role}}
export async function GET(req:NextRequest){try{const p=actor(req);return NextResponse.json(templateSnapshot(p.person,p.role),{headers:{'Cache-Control':'no-store'}})}catch(e){return fail(e)}}
export async function POST(req:NextRequest){try{const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==req.headers.get('host'))throw new GrievanceError('Cross-origin action denied.',403);const raw=await req.text();if(raw.length>50000)throw new GrievanceError('Workflow exceeds local limit.',413);const p=actor(req);return NextResponse.json(templateAction(p.person,p.role,JSON.parse(raw)))}catch(e){return fail(e)}}
