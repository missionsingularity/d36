import type {Store} from '../types';
import type {Role} from '../catalog';
import {canReadCase,defaultPersona} from './permissions';
export function caseWorkAllowed(s:Store,caseId:string,role:Role,personaId?:string){const g=s.grievances,c=g?.cases.find(c=>c.id===caseId),p=g?.personas.find(p=>p.id===(personaId||defaultPersona(role)));return !!c&&!!p&&canReadCase(c,p)}
