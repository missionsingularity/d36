import {NextRequest,NextResponse} from 'next/server';
import {ensureSystems,systemAction,systemVisible} from '@/lib/legacy-systems';
import {grievanceActor} from '@/lib/grievances/session';
import {GrievanceError} from '@/lib/grievances/permissions';
import {readStore,transaction} from '@/lib/store';
export const runtime='nodejs';export const dynamic='force-dynamic';
function fail(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'System action failed'},{status:e instanceof GrievanceError?e.status:400})}
export async function GET(req:NextRequest){try{transaction(s=>ensureSystems(s));const p=grievanceActor(req);return NextResponse.json({systems:readStore().systems!.filter(system=>systemVisible(system,p)),canManage:p.member&&p.role==='admin'},{headers:{'Cache-Control':'no-store'}})}catch(e){return fail(e)}}
export async function POST(req:NextRequest){try{const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==req.headers.get('host'))throw new GrievanceError('Cross-origin action denied.',403);const raw=await req.text();if(raw.length>15000)throw new GrievanceError('Configuration too large.',413);transaction(s=>ensureSystems(s));return NextResponse.json({system:systemAction(grievanceActor(req),JSON.parse(raw))})}catch(e){return fail(e)}}
