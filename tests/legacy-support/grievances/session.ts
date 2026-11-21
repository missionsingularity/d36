import type {NextRequest} from 'next/server';
import {readStore} from '../store';
import {defaultPersona,GrievanceError} from './permissions';
import type {Persona} from './types';
export function grievanceActor(req:NextRequest):Persona{
 if(process.env.DEMO_MODE==='false')throw new GrievanceError('Local demo disabled.',503);
 const state=readStore(),session=state.sessions?.[req.cookies.get('brahma-session')?.value||''];
 if(!session||session.expiresAt<Date.now())throw new GrievanceError('Open the workspace to start a local demo session.',401);
 const persona=state.grievances?.personas.find(p=>p.id===(session.grievancePersona||defaultPersona(session.role)));
 if(!persona)throw new GrievanceError('Demo identity unavailable.',401);return persona;
}
