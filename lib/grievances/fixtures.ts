import type {GrievanceState,Persona} from './types';
export const demoPeople:Persona[]=[
 {id:'intake',name:'Demo Intake',role:'intake',departments:['Pension'],districts:['Demo North','Demo South'],member:true},
 {id:'officer',name:'Demo Officer',role:'officer',departments:['Pension'],districts:['Demo North','Demo South'],member:true},
 {id:'supervisor',name:'Demo Supervisor',role:'supervisor',departments:['Pension','Records'],districts:['Demo North','Demo South'],member:true},
 {id:'approver',name:'Demo Approver',role:'approver',departments:['Pension','Records'],districts:['Demo North','Demo South'],member:true},
 {id:'admin',name:'Demo Admin',role:'admin',departments:['Pension','Records'],districts:['Demo North','Demo South'],member:true},
 {id:'viewer',name:'Demo Viewer',role:'viewer',departments:['Pension'],districts:['Demo North'],member:true},
 {id:'outside',name:'Demo Other Department',role:'officer',departments:['Unrelated unit'],districts:['Demo North'],member:false}
];
export function emptyGrievances():GrievanceState{return {cases:[],nextSequence:142,personas:structuredClone(demoPeople),categories:['Pension delay','Missing record','Service correction','Other'],policies:[{id:'demo-default',label:'Demo handling target',days:21,semantics:'calendar',reference:'https://pgportal.gov.in/',explanation:'Configurable demonstration target only. Central CPGRAMS timelines do not automatically apply to Assam cases. Confirm the applicable departmental rule before deployment.',effective:'2026-01-01',configuredBy:'demo-fixture'}],batches:[],settingsHistory:[]}}
