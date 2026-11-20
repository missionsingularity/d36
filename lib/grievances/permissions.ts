import type {Role} from '../catalog';
import type {GrievanceCase,GrievanceRole,Persona} from './types';
export class GrievanceError extends Error {constructor(message:string,public status=400){super(message)}}
export const actionRoles:Record<string,GrievanceRole[]>={
 create:['intake','officer','supervisor','admin'],edit:['intake','officer','supervisor','admin'],register:['intake','officer','supervisor','admin'],
 assign:['supervisor','admin'],transfer:['supervisor','admin'],start:['officer','supervisor'],request:['officer','supervisor'],resume:['officer','supervisor'],
 note:['intake','officer','supervisor','approver','admin'],attachment:['intake','officer','supervisor'],verify:['supervisor','approver'],
 proposal:['officer','supervisor'],submit:['officer','supervisor'],approve:['approver'],return:['approver','supervisor'],close:['supervisor','approver'],
 reopen:['supervisor','admin'],appeal:['supervisor','admin'],task:['officer','supervisor'],complete:['officer','supervisor'],
 work:['officer','supervisor'],settings:['admin'],import:['admin'],reverse:['admin'],archive:['admin']
};
export function defaultPersona(role:Role){return role==='reviewer'?'approver':role==='guest'?'viewer':'officer'}
export function canReadCase(c:GrievanceCase,p:Persona){return p.member&&p.departments.includes(c.department)&&p.districts.includes(c.district)&&(c.sensitivity!=='Restricted'||['supervisor','approver','admin'].includes(p.role)||c.owner===p.id||c.createdBy===p.id)&&(p.role!=='viewer'||c.team.includes(p.id))}
export function authorize(c:GrievanceCase,p:Persona,action:string){
 if(!canReadCase(c,p))throw new GrievanceError('Case unavailable in your project or department scope.',403);
 if(!actionRoles[action]?.includes(p.role))throw new GrievanceError('Your demo role cannot perform this action.',403);
 if(c.status==='Voided')throw new GrievanceError('This imported case was voided. Its history is read-only.',409);
 if(['Closed','Appeal'].includes(c.status)&&!['reopen','appeal'].includes(action))throw new GrievanceError('Closed cases are read-only. Reopen with a reason first.',409);
 if(p.role==='intake'&&c.createdBy!==p.id)throw new GrievanceError('Intake can change only its own cases.',403);
 if(p.role==='officer'&&!['register','edit'].includes(action)&&c.owner!==p.id)throw new GrievanceError('Only the assigned officer can change this case.',403);
}
