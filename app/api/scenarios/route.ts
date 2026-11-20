import {NextRequest,NextResponse} from 'next/server';
import {seedDemoWorld} from '@/lib/demo-world';
import {executeScenario} from '@/lib/realistic-scenarios';
import {grievanceActor} from '@/lib/grievances/session';
import {GrievanceError} from '@/lib/grievances/permissions';
import {readStore,transaction} from '@/lib/store';
import {ensureGuided} from '@/lib/guided-demo';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){try{const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==req.headers.get('host'))throw new GrievanceError('Cross-origin action denied.',403);const raw=await req.text();if(raw.length>4000)throw new GrievanceError('Request too large.',413);transaction(s=>ensureGuided(s));const p=grievanceActor(req),session=readStore().sessions![req.cookies.get('brahma-session')!.value];if(!p.member||!p.departments.includes('Pension')||!p.districts.includes('Demo North')||!['officer','supervisor','admin'].includes(p.role))throw new GrievanceError('Pension operator access required.',403);const b=JSON.parse(raw);await seedDemoWorld();return NextResponse.json({run:executeScenario(p,session.role,Number(b.workflowId),b.date||'2026-06-20')},{status:201})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Scenario failed'},{status:e instanceof GrievanceError?e.status:400})}}
