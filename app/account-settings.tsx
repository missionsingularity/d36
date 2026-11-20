'use client';
import {useState} from 'react';
import type {Role,Source} from '@/lib/catalog';
import type {WorkspaceSettings} from '@/lib/types';

type Props={
  section:string; pending:boolean; role:Role; settings:WorkspaceSettings; sources:Source[];
  permissions:{revoked:string[];canManage:boolean};
  save:(body:object)=>Promise<unknown>;
};
export default function AccountSettings({section,pending,role,settings,sources,permissions,save}:Props){
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');
  const [target,setTarget]=useState('guest');
  async function submit(body:object){
    setSaving(true);setMessage('');
    try{await save(body);setMessage('Changes saved')}catch{setMessage('Changes could not be saved. Review the error above.')}
    finally{setSaving(false)}
  }
  if(section==='Permissions')return <section className="settings-card">
    <h2>Permissions</h2><p>Your current role is <strong>{role}</strong>. Source restrictions also apply to search, citations and downloads.</p>
    <div className="table-wrap"><table><thead><tr><th>Action</th><th>Officer</th><th>Reviewer</th><th>Guest</th></tr></thead><tbody>
      {[['Read permitted records','Yes','Yes','Yes'],['Create and edit work','Yes','Yes','—'],['Approve and verify','—','Yes','—'],['Manage source restrictions','—','Yes','—']].map(row=><tr key={row[0]}>{row.map((cell,i)=><td key={i}>{cell}</td>)}</tr>)}
    </tbody></table></div>
    <h3 style={{marginTop:24}}>Source access</h3>
    {permissions.canManage&&<label className="field">Choose role<select value={target} onChange={e=>setTarget(e.target.value)}><option value="guest">Guest</option><option value="officer">Officer</option></select></label>}
    <p className="muted small">{permissions.canManage?'Choose which sources this role can open. Restoring access applies the usual role permissions.':'These are the sources you can open. A reviewer can change access.'}</p>
    {sources.map(source=>{
      const restricted=permissions.revoked.includes(target+':'+source.id);
      return <div className="list-row" key={source.id}><span>{source.title}<small style={{display:'block'}}>{source.id}</small></span>
        {permissions.canManage&&!source.restricted?<button disabled={saving} onClick={()=>submit({type:restricted?'restore':'revoke',sourceId:source.id,role:target})}>{restricted?'Restore access':'Restrict access'}</button>:<span className="badge">{source.restricted?'Reviewer only':'Accessible'}</span>}
      </div>;
    })}
    <p role="status">{message}</p>
  </section>;
  const account=section==='Account';
  return <section className="settings-card">
    <h3>{account?'Account details':'Workspace preferences'}</h3>
    {account&&<p className="muted">These details are saved for your current demo role. Contact details are optional.</p>}
    <form key={role+section+JSON.stringify(settings)} onSubmit={e=>{
      e.preventDefault();
      const values=Object.fromEntries(new FormData(e.currentTarget));
      submit({type:'settings',...values,...(!account?{notifications:values.notifications==='on'}:{})});
    }}>
      <fieldset disabled={saving||pending} style={{border:0,padding:0,margin:0}}><div className="form-grid">
      {account?<><label className="field">Display name<input name="name" defaultValue={settings.name} maxLength={80} required/></label>
        <label className="field">Designation<input name="designation" defaultValue={settings.designation} maxLength={100}/></label>
        <label className="field">Contact email<input name="email" type="email" defaultValue={settings.email} maxLength={160}/></label>
        <label className="field">Phone number<input name="phone" type="tel" defaultValue={settings.phone} maxLength={40}/></label></>:
        <><label className="field">Language<select aria-label="Language" name="language" defaultValue={settings.language}><option>English</option><option>Assamese</option><option>Hindi</option></select></label>
        <label className="field">Time zone<select aria-label="Time zone" name="timeZone" defaultValue={settings.timeZone}><option value="Asia/Kolkata">Kolkata (UTC+05:30)</option><option value="UTC">UTC</option></select></label>
        <label className="field">Date format<select aria-label="Date format" name="dateFormat" defaultValue={settings.dateFormat}><option>DD MMM YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></label></>}
      </div>
      {!account&&<><label className="checkbox"><input name="notifications" type="checkbox" defaultChecked={settings.notifications}/>Show workspace notifications</label><p className="muted small">Technical workflow detail falls back to English. Source text retains its original language.</p></>}
      <button className="primary" disabled={saving}>{saving?'Saving…':'Save changes'}</button><span className="muted small" role="status" style={{marginLeft:12}}>{message}</span></fieldset>
    </form>
  </section>;
}
