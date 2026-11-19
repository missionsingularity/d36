import type {Role} from './catalog';
import type {Store,WorkspaceSettings} from './types';
import {DomainError} from './engine';

export function settingsFor(state:Store,role:Role):WorkspaceSettings {
  const fallback = role==='officer' ? state.settings : {
    name:role==='reviewer'?'Demo Reviewer':'Guest Viewer',
    language:'English',notifications:true,
  };
  return {email:'',phone:'',designation:'Demonstration participant',timeZone:'Asia/Kolkata',dateFormat:'DD MMM YYYY',...fallback,...state.profiles?.[role]};
}

export function updateSettings(state:Store,role:Role,input:Record<string,unknown>) {
  const next={...settingsFor(state,role)};
  const limits={name:80,email:160,phone:40,designation:100};
  for(const key of Object.keys(limits) as (keyof typeof limits)[]) {
    if(input[key]===undefined)continue;
    if(typeof input[key]!=='string')throw new DomainError('Invalid '+key);
    const value=(input[key] as string).trim();
    if(value.length>limits[key]||(key==='name'&&!value))throw new DomainError('Check the '+key+' field');
    if(key==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new DomainError('Enter a valid email address');
    next[key]=value;
  }
  const choices={language:['English','Hindi','Assamese'],timeZone:['Asia/Kolkata','UTC'],dateFormat:['DD MMM YYYY','DD/MM/YYYY','YYYY-MM-DD']};
  for(const key of Object.keys(choices) as (keyof typeof choices)[]) {
    if(input[key]===undefined)continue;
    if(!choices[key].includes(String(input[key])))throw new DomainError('Invalid '+key);
    next[key]=String(input[key]);
  }
  if(input.notifications!==undefined) {
    if(typeof input.notifications!=='boolean')throw new DomainError('Invalid notification preference');
    next.notifications=input.notifications;
  }
  state.profiles={...state.profiles,[role]:next};
  if(role==='officer')state.settings=next;
}
