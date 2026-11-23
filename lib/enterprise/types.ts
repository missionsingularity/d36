export type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "employee" | "it_manager" | "hr_manager" | "admin";
  leaveBalance: number;
};
export type RecordItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  department: string;
  owner: string;
  project?: string;
  status: string;
  updated: string;
  data: Record<string, unknown>;
};
export type Version = {
  id: string;
  documentId: string;
  number: number;
  title: string;
  content: string;
  reason: string;
  author: string;
  created: string;
  hash: string;
};
export type DocumentItem = {
  id: string;
  owner: string;
  department: string;
  title: string;
  versions: Version[];
  kind: string;
  target: string;
  status: string;
};
export type Approval = {
  id: string;
  documentId: string;
  versionId: string;
  requester: string;
  reviewerRole: string;
  reviewerId?: string;
  projectId?: string;
  idempotencyKey?: string;
  status: string;
  comment: string;
  created: string;
};
export type ToolEvent = {
  tool: string;
  status: "completed" | "failed";
  detail: string;
  at: string;
};
export type Workflow = {
  id: string;
  owner: string;
  objective: string;
  mode: string;
  status: string;
  events: ToolEvent[];
  sources: RecordItem[];
  documentId?: string;
  created: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  runId?: string;
  created: string;
};
export type Chat = {
  id: string;
  owner: string;
  title: string;
  messages: Message[];
};
export type Receipt = {
  id: string;
  approvalId: string;
  detail: string;
  created: string;
};
export type Snapshot = {
  user: Employee;
  users: Employee[];
  records: RecordItem[];
  documents: DocumentItem[];
  approvals: Approval[];
  workflows: Workflow[];
  chats: Chat[];
  receipts: Receipt[];
  notifications: { id: string; text: string; read: number; created: string }[];
  audit: {
    id: string;
    actor: string;
    action: string;
    detail: string;
    created: string;
  }[];
  settings: Record<string, unknown>;
  mode: string;
  model: string;
  searchHistory: string[];
  relationships?: {
    id: string;
    fromId: string;
    relation: string;
    toId: string;
  }[];
};
