import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import type {Employee,RecordItem} from './types';

export const uid=()=>randomUUID();
export const timestamp=()=>new Date().toISOString();
export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
let connection:Database.Database|undefined;
export function db(){
 if(connection)return connection;
 const dir=path.resolve(process.env.BRAHMA_DATA_DIR||'.data');fs.mkdirSync(dir,{recursive:true});
 const c=new Database(path.join(dir,'enterprise.sqlite'));c.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
 c.exec(`CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY,applied TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS employees(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,department TEXT NOT NULL,role TEXT NOT NULL,leaveBalance REAL NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT NOT NULL REFERENCES employees(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,type TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,department TEXT NOT NULL,owner TEXT NOT NULL,project TEXT,status TEXT NOT NULL,updated TEXT NOT NULL,data TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS record_scope ON records(type,department,owner);
 CREATE VIRTUAL TABLE IF NOT EXISTS record_search USING fts5(id UNINDEXED,title,body,tokenize='unicode61');
 CREATE TRIGGER IF NOT EXISTS record_insert AFTER INSERT ON records BEGIN INSERT INTO record_search(id,title,body) VALUES(new.id,new.title,new.body); END;
 CREATE TRIGGER IF NOT EXISTS record_update AFTER UPDATE ON records BEGIN DELETE FROM record_search WHERE id=old.id; INSERT INTO record_search(id,title,body) VALUES(new.id,new.title,new.body); END;
 CREATE TRIGGER IF NOT EXISTS record_delete AFTER DELETE ON records BEGIN DELETE FROM record_search WHERE id=old.id; END;
 CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES employees(id),department TEXT NOT NULL,title TEXT NOT NULL,kind TEXT NOT NULL,target TEXT NOT NULL,status TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS versions(id TEXT PRIMARY KEY,documentId TEXT NOT NULL REFERENCES documents(id),number INTEGER NOT NULL,title TEXT NOT NULL,content TEXT NOT NULL,reason TEXT NOT NULL,author TEXT NOT NULL,created TEXT NOT NULL,hash TEXT NOT NULL,UNIQUE(documentId,number));
 CREATE TRIGGER IF NOT EXISTS immutable_version BEFORE UPDATE ON versions BEGIN SELECT RAISE(ABORT,'Document versions are immutable'); END;
 CREATE TRIGGER IF NOT EXISTS retain_version BEFORE DELETE ON versions BEGIN SELECT RAISE(ABORT,'Document versions must be retained'); END;
 CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY,documentId TEXT NOT NULL REFERENCES documents(id),versionId TEXT NOT NULL REFERENCES versions(id),requester TEXT NOT NULL,reviewerRole TEXT NOT NULL,status TEXT NOT NULL,comment TEXT NOT NULL,created TEXT NOT NULL,UNIQUE(versionId));
 CREATE TABLE IF NOT EXISTS chats(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES employees(id),title TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,chatId TEXT NOT NULL REFERENCES chats(id),role TEXT NOT NULL,text TEXT NOT NULL,runId TEXT,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS workflows(id TEXT PRIMARY KEY,owner TEXT NOT NULL,objective TEXT NOT NULL,mode TEXT NOT NULL,status TEXT NOT NULL,events TEXT NOT NULL,sources TEXT NOT NULL,documentId TEXT,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS receipts(id TEXT PRIMARY KEY,approvalId TEXT NOT NULL UNIQUE REFERENCES approvals(id),detail TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,userId TEXT NOT NULL,text TEXT NOT NULL,read INTEGER NOT NULL DEFAULT 0,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS relationships(id TEXT PRIMARY KEY,fromId TEXT NOT NULL,relation TEXT NOT NULL,toId TEXT NOT NULL,UNIQUE(fromId,relation,toId));
 CREATE INDEX IF NOT EXISTS related_entity ON relationships(fromId,toId);
 CREATE TABLE IF NOT EXISTS imports(id TEXT PRIMARY KEY,actor TEXT NOT NULL,kind TEXT NOT NULL,receipt TEXT NOT NULL,created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS search_history(id TEXT PRIMARY KEY,userId TEXT NOT NULL,query TEXT NOT NULL,created TEXT NOT NULL);
 INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));`);
 connection=c;
 if(!c.prepare('SELECT id FROM employees LIMIT 1').get())seed(c);
 return c;
}
export function atomic<T>(fn:()=>T):T{const c=db();c.exec('BEGIN IMMEDIATE');try{const out=fn();c.exec('COMMIT');return out}catch(e){c.exec('ROLLBACK');throw e}}
export function log(actor:string,action:string,detail:string){db().prepare('INSERT INTO audit VALUES(?,?,?,?,?)').run(uid(),actor,action,detail,timestamp())}
export function notify(userId:string,text:string){db().prepare('INSERT INTO notifications(id,userId,text,created) VALUES(?,?,?,?)').run(uid(),userId,text,timestamp())}
export function record(row:Record<string,unknown>):RecordItem{return {...row,data:JSON.parse(row.data as string)} as RecordItem}
// Correct table order is explicit, making migrations independent of insert position.
export function insertRecord(r:RecordItem){db().prepare('INSERT INTO records(id,type,title,body,department,owner,project,status,updated,data) VALUES(?,?,?,?,?,?,?,?,?,?)').run(r.id,r.type,r.title,r.body,r.department,r.owner,r.project||null,r.status,r.updated,JSON.stringify(r.data))}
function seed(c:Database.Database){
 c.exec('BEGIN IMMEDIATE');try{
 const users:Employee[]=[{id:'maya',name:'Maya Rao',email:'maya@singularity.example',department:'Engineering',role:'employee',leaveBalance:18},{id:'arjun',name:'Arjun Mehta',email:'arjun@singularity.example',department:'IT',role:'it_manager',leaveBalance:20},{id:'leah',name:'Leah Chen',email:'leah@singularity.example',department:'HR',role:'hr_manager',leaveBalance:22},{id:'sam',name:'Sam Patel',email:'sam@singularity.example',department:'Operations',role:'admin',leaveBalance:16},{id:'noah',name:'Noah Williams',email:'noah@singularity.example',department:'Engineering',role:'employee',leaveBalance:15}];
 for(const u of users)c.prepare('INSERT INTO employees VALUES(?,?,?,?,?,?)').run(u.id,u.name,u.email,u.department,u.role,u.leaveBalance);
 const items:[string,string,string,string,string,string,string,string,Record<string,unknown>][]=[
 ['alpha','Projects','Project Alpha','Our next-generation knowledge workspace. Launch a unified search experience for the product team.','Engineering','maya','','Active',{members:['maya','noah'],milestone:'Search beta',due:'2026-12-18'}],
 ['atlas','Projects','Atlas onboarding','Make every new teammate productive in their first week.','Operations','sam','','Active',{members:['sam','leah'],milestone:'Welcome kit',due:'2026-12-04'}],
 ['task-1','Tasks','Ship search index','Build and verify the unified search index for Project Alpha.','Engineering','maya','alpha','Done',{}],
 ['task-2','Tasks','Review retrieval quality','Run relevance evaluation for Project Alpha beta.','Engineering','noah','alpha','In progress',{dependsOn:['task-1']}],
 ['task-3','Tasks','Publish rollout guide','Prepare launch documentation and team enablement.','Engineering','maya','alpha','Open',{dependsOn:['task-2']}],
 ['asset-1','IT','SG-LT-1042 · Maya’s laptop','ThinkPad X1 Carbon, assigned to Maya Rao. Purchased 2022. Repeated battery and thermal failures.','IT','maya','alpha','Assigned',{category:'Asset',ageYears:4,failures:3,serial:'SG1042'}],
 ['asset-2','IT','SG-LT-1058 · Noah’s laptop','MacBook Pro, assigned to Noah Williams. Purchased 2025.','IT','noah','alpha','Assigned',{category:'Asset',ageYears:1,failures:0,serial:'SG1058'}],
 ['incident-1','IT','Battery failure blocks Alpha testing','Maya’s laptop shuts down during retrieval benchmarks. Replacement review requested.','IT','maya','alpha','Open',{category:'Incident',assetId:'asset-1',severity:'High'}],
 ['incident-2','IT','Laptop thermal shutdown','Repeated overheating on Maya’s laptop affects Project Alpha.','IT','maya','alpha','In progress',{category:'Incident',assetId:'asset-1',severity:'Medium'}],
 ['policy-it','Documents','Laptop replacement policy','Fictional Singularity policy: a laptop qualifies for replacement when it is at least 3 years old and has 2 or more recorded hardware failures. An IT Manager must approve the exact request version before a local procurement request is created.','Company','arjun','','Published',{policy:true}],
 ['guide-alpha','Documents','Project Alpha · product brief','Project Alpha unifies company search, grounded answers, and governed work. Maya Rao owns delivery; Noah Williams leads retrieval quality. Current milestone: Search beta. See real task records for progress.','Engineering','maya','alpha','Published',{}],
 ['guide-weekly','Documents','Weekly report · writing guide','Include completed work, upcoming milestones, risks, owners, and the evidence behind each claim. Report task completion as completed tasks divided by all project tasks.','Company','sam','','Published',{}],
 ['policy-leave','Documents','Time away & leave policy','Fictional policy: leave requires a positive available balance, valid dates, and HR Manager approval. Approved leave deducts working days once. Weekends are excluded.','Company','leah','','Published',{policy:true}],
 ['hr-maya','HR','Maya Rao · leave balance','Private employee leave record. Annual leave balance: 18 working days.','HR','maya','','Active',{category:'Leave balance'}],
 ['hr-noah','HR','Noah Williams · onboarding','Private onboarding checklist: equipment issued, security training pending.','HR','noah','','In progress',{category:'Onboarding'}]
 ];
 for(const [id,type,title,body,department,owner,project,status,data] of items)insertRecord({id,type,title,body,department,owner,project,status,updated:timestamp(),data});
 for(const u of users)insertRecord({id:u.id,type:'People',title:u.name,body:`${u.department} · ${u.email}`,department:'Company',owner:u.id,status:'Active',updated:timestamp(),data:{}});
 for(const [a,relation,b]of [['maya','ASSIGNED_TO','alpha'],['noah','ASSIGNED_TO','alpha'],['asset-1','ASSIGNED_TO','maya'],['incident-1','AFFECTS','asset-1'],['incident-2','AFFECTS','asset-1'],['guide-alpha','RELATED_TO','alpha'],['task-2','DEPENDS_ON','task-1'],['task-3','DEPENDS_ON','task-2']])c.prepare('INSERT INTO relationships VALUES(?,?,?,?)').run(uid(),a,relation,b);
 c.prepare('INSERT INTO settings VALUES(1,?)').run(JSON.stringify({workspace:'Singularity',departments:['Engineering','IT','HR','Operations'],roles:['employee','it_manager','hr_manager','admin'],approvalRules:{replacement:'it_manager',leave:'hr_manager',note:'admin'},templates:[{name:'Weekly project report',content:'# Weekly project report\n\n## Completed\n\n## Next steps\n\n## Risks & decisions'},{name:'Meeting notes',content:'# Meeting notes\n\n## Attendees\n\n## Decisions\n\n## Action items'}],workflowTemplates:['Laptop replacement','Project progress report','Leave request'],customFields:[],modules:['IT','HR','Projects']}));
 notify('maya','Welcome to Singularity. Your local workspace is ready. All seeded people and records are fictional.');log('sam','Workspace seeded','Linked fictional employees, projects, IT incidents, policies and tasks');c.exec('COMMIT');
 }catch(e){c.exec('ROLLBACK');throw e}
}
