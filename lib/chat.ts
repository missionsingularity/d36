import {sources,type Role} from './catalog';
import {sourceAllowed,DomainError,audit} from './engine';
import {id,now,transaction} from './store';

export function sendMessage(role:Role,text:unknown,conversationId?:string) {
  if(typeof text!=='string'||!text.trim()||text.length>6000)throw new DomainError('Enter a message of 1–6,000 characters.');
  const question=text.trim();
  return transaction(state=>{
    state.conversations??=[];
    let thread=state.conversations.find(c=>c.id===conversationId);
    if(conversationId&&(!thread||thread.owner!==role))throw new DomainError('Conversation unavailable',403);
    if(!thread){thread={id:id(),owner:role,title:question.slice(0,70),createdAt:now(),messages:[]};state.conversations.unshift(thread)}
    const query=question.toLowerCase();
    const runs=state.runs.filter(r=>r.sourceIds.every(source=>sourceAllowed(source,role,state)));
    let answer='';
    let citations:string[]=[];
    if(/task|overdue/.test(query)) {
      const tasks=runs.flatMap(r=>r.tasks);
      const overdue=/overdue/.test(query);
      const today=now().slice(0,10);
      const matches=tasks.filter(t=>!overdue||(t.due<today&&!['Verified complete','Cancelled'].includes(t.status)));
      answer=matches.length?matches.map(t=>`${t.title} — ${t.status}; owner ${t.owner}; due ${t.due}; proof ${t.proof||'missing'}`).join('\n'):'No matching tasks in the accessible saved records. Create a work plan from Customize to add tasks.';
    } else if(/approval|review request/.test(query)) {
      const matches=runs.filter(r=>r.status==='Review requested');
      answer=matches.length?matches.map(r=>`${r.title} — version ${r.reviewVersion}; review requested`).join('\n'):'There are no pending review requests in your accessible records.';
    } else {
      const words=query.split(/\W+/).filter(word=>word.length>3&&!['show','find','about','which','please','summarise','documents','records'].includes(word));
      const passages=sources.filter(s=>sourceAllowed(s.id,role,state)).flatMap(s=>s.paragraphs.map((paragraph,index)=>({text:paragraph,citation:s.id+':'+(index+1),score:words.filter(word=>(s.title+' '+paragraph).toLowerCase().includes(word)).length}))).filter(p=>p.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
      if(passages.length){answer='Matching passages from your accessible synthetic records:\n\n'+passages.map(p=>p.text).join('\n\n');citations=passages.map(p=>p.citation)}
      else answer='A general language model is not configured. I can search saved records and list tasks or review requests. Try “find documents about pension”, “show overdue tasks”, or “show pending approvals”. Use Customize for guided drafting and case workflows.';
    }
    thread.messages.push({id:id(),role:'user',text:question,citations:[],at:now()},{id:id(),role:'assistant',text:answer,citations,at:now()});
    audit(state,role,'Chat message saved','Deterministic local record query');
    return thread;
  });
}
