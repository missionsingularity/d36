'use client';
import {useState} from 'react';
import type {ReactNode} from 'react';
import type {Conversation} from '@/lib/types';

export default function ConversationView({conversation,send,citations,openWork}:{conversation:Conversation;send:(text:string)=>Promise<void>;citations:(ids:string[])=>ReactNode;openWork:()=>void}) {
  const [text,setText]=useState('');
  const [pending,setPending]=useState(false);
  async function submit(){
    if(pending||!text.trim())return;
    setPending(true);
    try{await send(text);setText('')}finally{setPending(false)}
  }
  return <div className="conversation"><div className="row-between"><h1>{conversation.title}</h1><button onClick={openWork}>{conversation.workId?'Open in Work':'Prepare office note'}</button></div><p className="muted small">Local record queries · General model not configured</p><p className="muted small">The office-note action prepares the illustrative GRV-DEMO-0142 case packet with its saved evidence and review route.</p>{conversation.messages.map(message=><section key={message.id} className={message.role==='user'?'user-message':'findings'}><h3>{message.role==='user'?'You':'BrahmaGPT'}</h3><p className="preserve">{message.text}</p>{citations(message.citations)}</section>)}<form className="inline-form" onSubmit={e=>{e.preventDefault();submit().catch(()=>{})}}><textarea aria-label="Continue conversation" value={text} disabled={pending} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit().catch(()=>{})}}} placeholder="Ask about your saved records…"/><button disabled={pending||!text.trim()}>{pending?'Searching…':'Send'}</button></form><div role="status">{pending?'Reading accessible records…':''}</div></div>;
}
