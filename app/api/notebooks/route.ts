import {NextRequest,NextResponse} from 'next/server';
import {notebookAction,notebookSnapshot} from '@/lib/notebooks';
import {readStore,transaction} from '@/lib/store';
import {ensureGuided} from '@/lib/guided-demo';
import {grievanceActor} from '@/lib/grievances/session';
import {GrievanceError} from '@/lib/grievances/permissions';
export const runtime='nodejs';export const dynamic='force-dynamic';
const fail=(e:unknown)=>NextResponse.json({error:e instanceof Error?e.message:'Notebook failed'},{status:e instanceof GrievanceError?e.status:400});
export async function GET(req:NextRequest){try{transaction(s=>ensureGuided(s));return NextResponse.json({notebooks:notebookSnapshot(readStore(),grievanceActor(req))},{headers:{'Cache-Control':'no-store'}})}catch(e){return fail(e)}}
export async function POST(req:NextRequest){try{const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==req.headers.get('host'))throw new GrievanceError('Cross-origin action denied.',403);const raw=await req.text();if(raw.length>12000)throw new GrievanceError('Note too large.',413);transaction(s=>ensureGuided(s));return NextResponse.json({notebook:notebookAction(grievanceActor(req),JSON.parse(raw))})}catch(e){return fail(e)}}
