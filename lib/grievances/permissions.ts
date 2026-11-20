import type {Role} from '../catalog';
import type {GrievanceCase,GrievanceRole,Persona} from './types';
export class GrievanceError extends Error {constructor(message:string,public status=400,public blockers?:string[]){super(message)}}
export const actionRoles:Record<string,GrievanceRole[]>={
  'evidence-requirement':['officer','supervisor'],'evidence-link':['officer','supervisor','custodian'],'evidence-waive':['supervisor'],'evidence-conflict':['officer','supervisor','custodian'],'evidence-resolve':['supervisor','approver','reviewer','authority'], 'source-finalize':['supervisor','approver','appellate'],'packet-draft':['officer','supervisor'],'packet-review':['approver','authority'],'execution-prepare':['officer','supervisor'],'execute-action':['officer','supervisor'],'manual-submit':['officer','supervisor'],'source-confirm':['approver','authority','supervisor'],'record-disposal':['approver','authority','supervisor'],feedback:['intake','officer','supervisor'], 'appeal-open':['intake','supervisor','admin','appellate'],'appeal-review':['appellate','approver'],'appeal-decision':['appellate','approver'],'appeal-communicate':['officer','supervisor','appellate'],'appeal-finalize':['appellate','approver'],
 'source-reconcile':['supervisor','approver'],'followup-create':['officer','supervisor'],'followup-reply':['officer','supervisor'],member:['supervisor','admin'],duplicate:['officer','supervisor'],issue:['officer','supervisor'],create:['intake','officer','supervisor','admin'],edit:['intake','officer','supervisor','admin'],register:['intake','officer','supervisor','admin'],
 assign:['supervisor','admin'],transfer:['supervisor','admin'],start:['officer','supervisor'],request:['officer','supervisor'],resume:['officer','supervisor'],
 note:['intake','officer','supervisor','approver','admin'],attachment:['intake','officer','supervisor','custodian'],verify:['supervisor','approver','reviewer','custodian','authority'],
 proposal:['officer','supervisor'],submit:['officer','supervisor'],approve:['approver','authority'],return:['approver','supervisor','reviewer','authority'],close:['supervisor','approver','authority'],
 reopen:['supervisor','admin'],appeal:['supervisor','admin'],task:['officer','supervisor'],complete:['officer','supervisor'],
 link:['officer','supervisor'],work:['officer','supervisor'],settings:['admin'],import:['admin'],reverse:['admin'],archive:['admin']
};
export function defaultPersona(role:Role){return role==='reviewer'?'approver':role==='guest'?'viewer':'officer'}
export function canReadCase(c:GrievanceCase,p:Persona){return (!['custodian','reviewer','authority','appellate','auditor','integration'].includes(p.role)||c.team.includes(p.id)||c.createdBy===p.id)&&p.member&&p.departments.includes(c.department)&&p.districts.includes(c.district)&&(c.sensitivity!=='Restricted'||['supervisor','approver'].includes(p.role)||c.owner===p.id||c.createdBy===p.id||c.team.includes(p.id))&&(p.role!=='viewer'||c.team.includes(p.id))}
export function authorize(c:GrievanceCase,p:Persona,action:string){
 if(!canReadCase(c,p))throw new GrievanceError('Case unavailable in your project or department scope.',403);
 if(!actionRoles[action]?.includes(p.role))throw new GrievanceError('Your demo role cannot perform this action.',403);
 if(['approve','packet-review','source-confirm','record-disposal','close'].includes(action)&&['approver','authority'].includes(p.role)&&p.id!==(c.ontology?.authorityId||'approver'))throw new GrievanceError('You are not the delegated authority for this case.',403);
 if(['custodian','reviewer','authority','appellate'].includes(p.role)){const role=p.role==='custodian'?'Custodian':p.role==='reviewer'?'Reviewer':p.role==='authority'?'Authority':'Appellate';if(!c.ontology?.members.some(m=>m.userId===p.id&&m.role===role))throw new GrievanceError('Your case-specific role grant does not permit this action.',403);}
 if(c.status==='Voided')throw new GrievanceError('This imported case was voided. Its history is read-only.',409);
 if(['Closed','Appeal'].includes(c.status)&&!['reopen','appeal','appeal-open','appeal-review','appeal-decision','appeal-communicate','appeal-finalize','feedback'].includes(action))throw new GrievanceError('Closed cases are read-only. Reopen with a reason first.',409);
 if(p.role==='intake'&&c.createdBy!==p.id)throw new GrievanceError('Intake can change only its own cases.',403);
 if(p.role==='intake'&&action==='edit'&&c.status!=='Draft')throw new GrievanceError('Intake can edit only an unregistered draft.',403);
 if(p.role==='officer'&&!['register','edit'].includes(action)&&c.owner!==p.id&&!(action==='attachment'&&c.createdBy===p.id&&['Draft','Received'].includes(c.status)))throw new GrievanceError('Only the assigned officer can change this case.',403);
}
