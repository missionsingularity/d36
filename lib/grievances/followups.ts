import type {Store} from '../types';
import {hash,id,now,transaction} from '../store';
import type {GrievanceCase,GrievanceState,Persona} from './types';
import {authorize,GrievanceError} from './permissions';
import {date,ensureGrievances,event,getCase,text} from './service';
import {syncOntology} from './ontology';
export type FollowUp={id:string;item:string;recipient:string;owner:string;due:string;escalate:string;reminderDays:number;taskId:string;blockingTaskId?:string;createdAt:string;status:'Open'|'Resolved';lastReminder?:string;response?:{attachmentId:string;reference:string;actor:string;at:string}};
export type FollowUpState={items:FollowUp[];reminders:{id:string;followUpId:string;at:string;recipient:string;kind:'Due'|'Escalated';externalSent:false}[];keys:Record<string,string>};
export const followUpActions=['followup-create','followup-reply'] as const;
export const ensureFollowUps=(c:GrievanceCase)=>c.followUps??={items:[],reminders:[],keys:{}};
export function followUpBlockers(c:GrievanceCase){return (c.followUps?.items||[]).filter(f=>f.status!=='Resolved').map(f=>`${f.item}: reply and verified evidence required (${f.id}).`)}
export function processReminders(g:GrievanceState,at=now()){
 const today=at.slice(0,10);let count=0;
 for(const c of g.cases){if(['Closed','Voided'].includes(c.status))continue;const queue=ensureFollowUps(c);for(const f of queue.items){if(f.status!=='Open'||f.due>today)continue;if(f.lastReminder&&Date.parse(today)-Date.parse(f.lastReminder)<f.reminderDays*86400000)continue;const kind=today>=f.escalate?'Escalated':'Due';queue.reminders.push({id:id(),followUpId:f.id,at,recipient:kind==='Escalated'?'supervisor':f.owner,kind,externalSent:false});f.lastReminder=today;c.revision++;event(c,{id:'system-reminder',name:'Local reminder check',role:'viewer',departments:[],districts:[],member:false},'Internal reminder',`${kind}: ${f.item}; recipient ${kind==='Escalated'?'supervisor':f.owner}. No external message sent.`);count++}}
 return count;
}
export function applyFollowUp(s:Store,p:Persona,caseId:string,b:Record<string,unknown>){
 const g=ensureGrievances(s),c=getCase(g,caseId,p),queue=ensureFollowUps(c),action=text(b.action,'Action',50);authorize(c,p,action);
 const key=b.requestKey?text(b.requestKey,'Request key',100):'',fingerprint=hash(JSON.stringify({...b,revision:undefined,requestKey:undefined}));if(key&&queue.keys[key]){if(queue.keys[key]!==fingerprint)throw new GrievanceError('Request key was already used for a different action.',409);return {case:c,replayed:true}}
 if(b.revision!==c.revision)throw new GrievanceError('Case changed. Refresh before saving.',409);let detail='';
 if(action==='followup-create'){
  if(!['Assigned','In progress','Awaiting information','Returned','Reopened'].includes(c.status))throw new GrievanceError('Start assigned casework before creating a follow-up.',409);
  const owner=g.personas.find(x=>x.id===b.owner);if(!owner||!owner.member||!owner.departments.includes(c.department)||!owner.districts.includes(c.district)||!['officer','supervisor'].includes(owner.role))throw new GrievanceError('Choose a permitted officer as follow-up owner.');
  const due=date(b.due,'Follow-up due date'),escalate=date(b.escalate,'Escalation date'),reminderDays=Number(b.reminderDays);if(escalate<due||!Number.isInteger(reminderDays)||reminderDays<1||reminderDays>30)throw new GrievanceError('Escalation must be on or after the due date. Reminder interval must be 1–30 days.');
  const blocking=b.blockingTaskId?c.tasks.find(t=>t.id===b.blockingTaskId):undefined;if(b.blockingTaskId&&!blocking)throw new GrievanceError('Blocking task not found.');if(blocking?.completedAt||blocking?.requiresFollowUp)throw new GrievanceError('Choose an open task without an existing follow-up gate.',409);
  const taskId=id(),followUpId=id(),item=text(b.item,'Requested evidence',1000);c.tasks.push({id:taskId,title:'Obtain '+item,owner:owner.id,due});if(blocking)blocking.requiresFollowUp=followUpId;
  queue.items.push({id:followUpId,item,recipient:text(b.recipient,'Recipient office',200),owner:owner.id,due,escalate,reminderDays,taskId,blockingTaskId:blocking?.id,createdAt:now(),status:'Open'});detail=`${item}; recipient ${b.recipient}; owner ${owner.id}; due ${due}; internal reminders every ${reminderDays} days. No message sent.`;
 }else if(action==='followup-reply'){
  const f=queue.items.find(f=>f.id===b.followUpId);if(!f)throw new GrievanceError('Follow-up not found.',404);if(f.status==='Resolved')throw new GrievanceError('Reply already recorded.',409);if(p.role==='officer'&&p.id!==f.owner&&p.id!==c.owner)throw new GrievanceError('Only the follow-up owner or case lead can record this reply.',403);
  const attachment=c.attachments.find(a=>a.id===b.attachmentId&&a.verifiedBy);if(!attachment)throw new GrievanceError('Choose independently verified reply evidence.');f.response={attachmentId:attachment.id,reference:text(b.reference,'Reply reference',200),actor:p.id,at:now()};f.status='Resolved';const task=c.tasks.find(t=>t.id===f.taskId);if(task){task.proof=attachment.id;task.completedAt=now()}detail=`Reply to ${f.item}; ${f.response.reference}; verified original ${attachment.id}. Only this follow-up dependency was released.`;
 }else throw new GrievanceError('Unknown follow-up action.');
 if(key)queue.keys[key]=fingerprint;c.revision++;event(c,p,action,detail);syncOntology(c,p);return {case:c};
}
export function operateFollowUp(p:Persona,caseId:string,b:Record<string,unknown>){return transaction(s=>applyFollowUp(s,p,caseId,b))}
