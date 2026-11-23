import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import type { Employee, RecordItem } from "./types";

export const uid = () => randomUUID();
export const timestamp = () => new Date().toISOString();
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
let connection: Database.Database | undefined;
export function dataDirectory() {
  const isVercel = process.env.VERCEL === "1";
  const configured = process.env.BRAHMA_DATA_DIR?.trim();
  // Vercel's deployment directory is read-only. Ignore relative configured
  // paths there so SQLite and generated files always use writable /tmp space.
  if (isVercel) {
    const temporaryRoot = process.env.TMPDIR || os.tmpdir();
    const configuredPath = configured ? path.resolve(configured) : "";
    const temporaryPath = path.resolve(temporaryRoot);
    return configuredPath &&
      (configuredPath === temporaryPath ||
        configuredPath.startsWith(temporaryPath + path.sep))
      ? configuredPath
      : path.join(temporaryPath, "brahmagpt");
  }
  return path.resolve(configured || ".data");
}
export function db() {
  if (connection) return connection;
  const dir = dataDirectory();
  fs.mkdirSync(dir, { recursive: true });
  const c = new Database(path.join(dir, "enterprise.sqlite"));
  c.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
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
 CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY,documentId TEXT NOT NULL REFERENCES documents(id),versionId TEXT NOT NULL REFERENCES versions(id),requester TEXT NOT NULL,reviewerRole TEXT NOT NULL,status TEXT NOT NULL,comment TEXT NOT NULL,created TEXT NOT NULL,reviewerId TEXT,projectId TEXT,idempotencyKey TEXT,UNIQUE(versionId));
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
 CREATE TABLE IF NOT EXISTS approval_decisions(id TEXT PRIMARY KEY,approvalId TEXT NOT NULL REFERENCES approvals(id),versionId TEXT NOT NULL REFERENCES versions(id),actor TEXT NOT NULL,decision TEXT NOT NULL,reason TEXT NOT NULL,created TEXT NOT NULL);
 INSERT OR IGNORE INTO migrations VALUES(1,datetime('now'));`);
  ensureApprovalSchema(c);
  connection = c;
  if (!c.prepare("SELECT id FROM employees LIMIT 1").get()) seed(c);
  const configuredDataDir = process.env.BRAHMA_DATA_DIR;
  const usesDefaultWorkspace =
    process.env.VERCEL === "1" ||
    process.env.DEMO_MODE === "true" ||
    !configuredDataDir ||
    path.resolve(configuredDataDir) === path.resolve(".data");
  if (usesDefaultWorkspace) ensureOrganizationDirectory(c);
  if (usesDefaultWorkspace) {
    ensureOperationalExamples(c);
    ensureSourcePack(c);
    ensureWorkExamples(c);
    ensureApprovalExamples(c);
  }
  return c;
}

function ensureApprovalSchema(c: Database.Database) {
  const columns = c.prepare("PRAGMA table_info(approvals)").all() as {
    name: string;
  }[];
  const existing = new Set(columns.map((column) => column.name));
  if (!existing.has("reviewerId"))
    c.exec("ALTER TABLE approvals ADD COLUMN reviewerId TEXT");
  if (!existing.has("projectId"))
    c.exec("ALTER TABLE approvals ADD COLUMN projectId TEXT");
  if (!existing.has("idempotencyKey"))
    c.exec("ALTER TABLE approvals ADD COLUMN idempotencyKey TEXT");
  c.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS approval_idempotency_key ON approvals(idempotencyKey) WHERE idempotencyKey IS NOT NULL;",
  );
  c.prepare(
    "INSERT OR IGNORE INTO migrations(version,applied) VALUES(8,?)",
  ).run(timestamp());
}

function ensureWorkExamples(c: Database.Database) {
  if (c.prepare("SELECT 1 FROM migrations WHERE version=6").get()) return;
  c.exec("BEGIN IMMEDIATE");
  try {
    const approvalColumns = c.prepare("PRAGMA table_info(approvals)").all() as {
      name: string;
    }[];
    if (!approvalColumns.some((column) => column.name === "reviewerId"))
      c.exec("ALTER TABLE approvals ADD COLUMN reviewerId TEXT");
    const now = timestamp();
    const projects = [
      [
        "gamma",
        "Project Gamma · Knowledge cleanup",
        "Review and tag the shared team library.",
        "Engineering",
        "maya",
        {
          members: ["maya", "noah", "eli-turner"],
          milestone: "Library review",
          due: "2027-01-15",
        },
      ],
      [
        "delta",
        "Project Delta · Onboarding refresh",
        "Make the first week clear for every new teammate.",
        "People",
        "leah",
        {
          members: ["leah", "mia-ross", "sam"],
          milestone: "Checklist review",
          due: "2027-01-22",
        },
      ],
      [
        "epsilon",
        "Project Epsilon · IT service health",
        "Track service checks, incidents and handoffs.",
        "IT",
        "arjun",
        {
          members: ["arjun", "sam-cole", "lily-moore"],
          milestone: "Quarterly review",
          due: "2027-02-01",
        },
      ],
    ] as const;
    for (const [id, title, body, department, owner, data] of projects)
      if (!c.prepare("SELECT 1 FROM records WHERE id=?").get(id))
        insertRecord({
          id,
          type: "Projects",
          title,
          body,
          department,
          owner,
          status: "Active",
          updated: now,
          data: { ...data, source: "Synthetic Singularity example" },
        });
    const tasks = [
      [
        "task-maya-search-audit",
        "Check search result source links",
        "Open each result and confirm it points to the right saved source.",
        "Engineering",
        "maya",
        "alpha",
        "Open",
      ],
      [
        "task-maya-gamma-tags",
        "Review library tags",
        "Check the draft tags for the shared team library.",
        "Engineering",
        "maya",
        "gamma",
        "In progress",
      ],
      [
        "task-noah-search-latency",
        "Record search response times",
        "Measure response times for the agreed sample queries.",
        "Engineering",
        "noah",
        "alpha",
        "Open",
      ],
      [
        "task-leah-onboarding-checklist",
        "Review the welcome checklist",
        "Confirm the first week steps with People Operations.",
        "People",
        "leah",
        "delta",
        "Open",
      ],
      [
        "task-arjun-service-review",
        "Check open service incidents",
        "Review the open incidents and add an owner for each next step.",
        "IT",
        "arjun",
        "epsilon",
        "In progress",
      ],
      [
        "task-mia-policy-links",
        "Check policy links in onboarding",
        "Confirm that the new starter checklist links to current policies.",
        "People",
        "mia-ross",
        "delta",
        "Open",
      ],
      [
        "task-eli-library-review",
        "Flag duplicate library pages",
        "Find duplicate pages and note which one should stay current.",
        "Engineering",
        "eli-turner",
        "gamma",
        "Open",
      ],
      [
        "task-sam-approval-audit",
        "Check pending approval records",
        "Confirm each open review has an owner, a due date and a saved reason when decided.",
        "Operations",
        "sam",
        "alpha",
        "Open",
      ],
    ] as const;
    for (const [id, title, body, department, owner, project, status] of tasks)
      if (!c.prepare("SELECT 1 FROM records WHERE id=?").get(id))
        insertRecord({
          id,
          type: "Tasks",
          title,
          body,
          department,
          owner,
          project,
          status,
          updated: now,
          data: { source: "Synthetic assigned work example" },
        });
    const requests = [
      {
        id: "approval-maya-policy-links",
        doc: "doc-review-search-sources",
        ver: "ver-review-search-sources-1",
        requester: "noah",
        reviewer: "maya",
        role: "employee",
        title: "Search source link review",
        content:
          "Synthetic review request. Confirm that search answers link to the correct source passages and show the latest saved document version.",
      },
      {
        id: "approval-leah-onboarding-checklist",
        doc: "doc-review-onboarding-checklist",
        ver: "ver-review-onboarding-checklist-1",
        requester: "mia-ross",
        reviewer: "leah",
        role: "hr_manager",
        title: "New starter checklist review",
        content:
          "Synthetic review request. Check the welcome checklist steps, policy links and equipment handoff before publishing the update.",
      },
    ];
    for (const request of requests) {
      if (c.prepare("SELECT 1 FROM approvals WHERE id=?").get(request.id))
        continue;
      c.prepare(
        "INSERT OR IGNORE INTO documents(id,owner,department,title,kind,target,status) VALUES(?,?,?,?,?,?,?)",
      ).run(
        request.doc,
        request.requester,
        request.role === "hr_manager" ? "People" : "Engineering",
        request.title,
        "note",
        request.role === "hr_manager" ? "delta" : "alpha",
        "PENDING_APPROVAL",
      );
      c.prepare(
        "INSERT OR IGNORE INTO versions(id,documentId,number,title,content,reason,author,created,hash) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        request.ver,
        request.doc,
        1,
        request.title,
        request.content,
        "Initial synthetic review example",
        request.requester,
        now,
        digest(request.content),
      );
      c.prepare(
        "INSERT INTO approvals(id,documentId,versionId,requester,reviewerRole,status,comment,created,reviewerId,projectId,idempotencyKey) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        request.id,
        request.doc,
        request.ver,
        request.requester,
        request.role,
        "PENDING_APPROVAL",
        "",
        now,
        request.reviewer,
        request.role === "hr_manager" ? "delta" : "alpha",
        `seed:${request.id}`,
      );
      c.prepare(
        "INSERT OR IGNORE INTO notifications(id,userId,text,read,created) VALUES(?,?,?,?,?)",
      ).run(
        `notice-${request.id}`,
        request.reviewer,
        `Review requested: ${request.title}`,
        0,
        now,
      );
      c.prepare(
        "INSERT OR IGNORE INTO audit(id,actor,action,detail,created) VALUES(?,?,?,?,?)",
      ).run(
        `audit-${request.id}`,
        request.requester,
        "Approval requested",
        `${request.id}: assigned to ${request.reviewer}`,
        now,
      );
    }
    c.prepare(
      "INSERT INTO migrations(version,applied) VALUES(6,datetime('now'))",
    ).run();
    c.exec("COMMIT");
  } catch (error) {
    c.exec("ROLLBACK");
    throw error;
  }
}

function ensureApprovalExamples(c: Database.Database) {
  if (c.prepare("SELECT 1 FROM migrations WHERE version=7").get()) return;
  c.exec("BEGIN IMMEDIATE");
  try {
    const now = timestamp();
    const examples = [
      {
        id: "approval-purchase-laptops",
        doc: "doc-approval-purchase-laptops",
        ver: "ver-approval-purchase-laptops-1",
        record: "record-approval-purchase-laptops",
        requester: "noah",
        reviewer: "maya",
        title: "Purchase request · 2 test laptops",
        kind: "pending",
        decision: "",
        reason:
          "Two shared test laptops are needed for browser and accessibility checks. Estimated cost: $2,400. The team checked the equipment register and found no spare devices.",
      },
      {
        id: "approval-renewal-approved",
        doc: "doc-approval-renewal-approved",
        ver: "ver-approval-renewal-approved-1",
        record: "record-approval-renewal-approved",
        requester: "eli-turner",
        reviewer: "maya",
        title: "Renewal request · usability testing tools",
        kind: "approved",
        decision: "approve",
        reason:
          "Approved: the renewal is within the team budget and supports the scheduled accessibility review.",
      },
      {
        id: "approval-vendor-rejected",
        doc: "doc-approval-vendor-rejected",
        ver: "ver-approval-vendor-rejected-1",
        record: "record-approval-vendor-rejected",
        requester: "noah",
        reviewer: "maya",
        title: "New vendor request · analytics tool",
        kind: "rejected",
        decision: "reject",
        reason:
          "Rejected: the request does not include a privacy review or a data retention plan. Please submit those details before choosing a vendor.",
      },
      {
        id: "approval-report-returned",
        doc: "doc-approval-report-returned",
        ver: "ver-approval-report-returned-1",
        record: "record-approval-report-returned",
        requester: "eli-turner",
        reviewer: "maya",
        title: "Quarterly accessibility report",
        kind: "returned",
        decision: "return",
        reason:
          "Returned: please add the keyboard navigation results and link the test evidence before resubmitting.",
      },
    ];
    for (const item of examples) {
      const status =
        item.kind === "pending"
          ? "PENDING_APPROVAL"
          : item.kind === "approved"
            ? "APPROVED"
            : item.kind === "rejected"
              ? "REJECTED"
              : "RETURNED";
      if (c.prepare("SELECT 1 FROM approvals WHERE id=?").get(item.id))
        continue;
      const content = `Synthetic example request. ${item.reason}`;
      c.prepare(
        "INSERT INTO documents(id,owner,department,title,kind,target,status) VALUES(?,?,?,?,?,?,?)",
      ).run(
        item.doc,
        item.requester,
        "Engineering",
        item.title,
        "note",
        "alpha",
        status,
      );
      c.prepare(
        "INSERT INTO versions(id,documentId,number,title,content,reason,author,created,hash) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        item.ver,
        item.doc,
        1,
        item.title,
        content,
        "Synthetic example request for approval workflow",
        item.requester,
        now,
        digest(content),
      );
      c.prepare(
        "INSERT INTO approvals(id,documentId,versionId,requester,reviewerRole,status,comment,created,reviewerId,projectId,idempotencyKey) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        item.id,
        item.doc,
        item.ver,
        item.requester,
        "employee",
        status,
        item.decision ? item.reason : "",
        now,
        item.reviewer,
        "alpha",
        `seed:${item.id}`,
      );
      if (item.decision)
        c.prepare(
          "INSERT INTO approval_decisions(id,approvalId,versionId,actor,decision,reason,created) VALUES(?,?,?,?,?,?,?)",
        ).run(
          uid(),
          item.id,
          item.ver,
          item.reviewer,
          item.decision,
          item.reason,
          now,
        );
      c.prepare(
        "INSERT OR IGNORE INTO notifications(id,userId,text,read,created) VALUES(?,?,?,?,?)",
      ).run(
        `notice-${item.id}`,
        item.reviewer,
        `Approval ${item.kind}: ${item.title}`,
        0,
        now,
      );
      if (!c.prepare("SELECT 1 FROM records WHERE id=?").get(item.record))
        insertRecord({
          id: item.record,
          type: "Documents",
          title: item.title,
          body: content,
          department: "Engineering",
          owner: item.requester,
          project: "alpha",
          status,
          updated: now,
          data: {
            documentId: item.doc,
            version: 1,
            source: "Synthetic Singularity approval example",
          },
        });
    }
    c.prepare(
      "INSERT INTO migrations(version,applied) VALUES(7,datetime('now'))",
    ).run();
    c.exec("COMMIT");
  } catch (error) {
    c.exec("ROLLBACK");
    throw error;
  }
}
export function atomic<T>(fn: () => T): T {
  const c = db();
  if (c.inTransaction) return c.transaction(fn)();
  c.exec("BEGIN IMMEDIATE");
  try {
    const out = fn();
    c.exec("COMMIT");
    return out;
  } catch (e) {
    c.exec("ROLLBACK");
    throw e;
  }
}
export function log(actor: string, action: string, detail: string) {
  db()
    .prepare("INSERT INTO audit VALUES(?,?,?,?,?)")
    .run(uid(), actor, action, detail, timestamp());
}
export function notify(userId: string, text: string) {
  db()
    .prepare(
      "INSERT INTO notifications(id,userId,text,created) VALUES(?,?,?,?)",
    )
    .run(uid(), userId, text, timestamp());
}
export function record(row: Record<string, unknown>): RecordItem {
  return { ...row, data: JSON.parse(row.data as string) } as RecordItem;
}
// Correct table order is explicit, making migrations independent of insert position.
export function insertRecord(r: RecordItem) {
  db()
    .prepare(
      "INSERT INTO records(id,type,title,body,department,owner,project,status,updated,data) VALUES(?,?,?,?,?,?,?,?,?,?)",
    )
    .run(
      r.id,
      r.type,
      r.title,
      r.body,
      r.department,
      r.owner,
      r.project || null,
      r.status,
      r.updated,
      JSON.stringify(r.data),
    );
}
function seed(c: Database.Database) {
  c.exec("BEGIN IMMEDIATE");
  try {
    const users: Employee[] = [
      {
        id: "maya",
        name: "Maya Rao",
        email: "maya@singularity.example",
        department: "Engineering",
        role: "employee",
        leaveBalance: 18,
      },
      {
        id: "arjun",
        name: "Arjun Mehta",
        email: "arjun@singularity.example",
        department: "IT",
        role: "it_manager",
        leaveBalance: 20,
      },
      {
        id: "leah",
        name: "Leah Chen",
        email: "leah@singularity.example",
        department: "HR",
        role: "hr_manager",
        leaveBalance: 22,
      },
      {
        id: "sam",
        name: "Sam Patel",
        email: "sam@singularity.example",
        department: "Operations",
        role: "admin",
        leaveBalance: 16,
      },
      {
        id: "noah",
        name: "Noah Williams",
        email: "noah@singularity.example",
        department: "Engineering",
        role: "employee",
        leaveBalance: 15,
      },
    ];
    for (const u of users)
      c.prepare("INSERT INTO employees VALUES(?,?,?,?,?,?)").run(
        u.id,
        u.name,
        u.email,
        u.department,
        u.role,
        u.leaveBalance,
      );
    const items: [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      Record<string, unknown>,
    ][] = [
      [
        "alpha",
        "Projects",
        "Project Alpha",
        "Our next-generation knowledge workspace. Launch a unified search experience for the product team.",
        "Engineering",
        "maya",
        "",
        "Active",
        {
          members: ["maya", "noah"],
          milestone: "Search beta",
          due: "2026-12-18",
        },
      ],
      [
        "atlas",
        "Projects",
        "Atlas onboarding",
        "Make every new teammate productive in their first week.",
        "Operations",
        "sam",
        "",
        "Active",
        {
          members: ["sam", "leah"],
          milestone: "Welcome kit",
          due: "2026-12-04",
        },
      ],
      [
        "task-1",
        "Tasks",
        "Ship search index",
        "Build and verify the unified search index for Project Alpha.",
        "Engineering",
        "maya",
        "alpha",
        "Done",
        {},
      ],
      [
        "task-2",
        "Tasks",
        "Review retrieval quality",
        "Run relevance evaluation for Project Alpha beta.",
        "Engineering",
        "noah",
        "alpha",
        "In progress",
        { dependsOn: ["task-1"] },
      ],
      [
        "task-3",
        "Tasks",
        "Publish rollout guide",
        "Prepare launch documentation and team enablement.",
        "Engineering",
        "maya",
        "alpha",
        "Open",
        { dependsOn: ["task-2"] },
      ],
      [
        "asset-1",
        "IT",
        "SG-LT-1042 · Maya’s laptop",
        "ThinkPad X1 Carbon, assigned to Maya Rao. Purchased 2022. Repeated battery and thermal failures.",
        "IT",
        "maya",
        "alpha",
        "Assigned",
        { category: "Asset", ageYears: 4, failures: 3, serial: "SG1042" },
      ],
      [
        "asset-2",
        "IT",
        "SG-LT-1058 · Noah’s laptop",
        "MacBook Pro, assigned to Noah Williams. Purchased 2025.",
        "IT",
        "noah",
        "alpha",
        "Assigned",
        { category: "Asset", ageYears: 1, failures: 0, serial: "SG1058" },
      ],
      [
        "incident-1",
        "IT",
        "Battery failure blocks Alpha testing",
        "Maya’s laptop shuts down during retrieval benchmarks. Replacement review requested.",
        "IT",
        "maya",
        "alpha",
        "Open",
        { category: "Incident", assetId: "asset-1", severity: "High" },
      ],
      [
        "incident-2",
        "IT",
        "Laptop thermal shutdown",
        "Repeated overheating on Maya’s laptop affects Project Alpha.",
        "IT",
        "maya",
        "alpha",
        "In progress",
        { category: "Incident", assetId: "asset-1", severity: "Medium" },
      ],
      [
        "policy-it",
        "Documents",
        "Laptop replacement policy",
        "Fictional Singularity policy: a laptop qualifies for replacement when it is at least 3 years old and has 2 or more recorded hardware failures. An IT Manager must approve the exact request version before a local procurement request is created.",
        "Company",
        "arjun",
        "",
        "Published",
        { policy: true },
      ],
      [
        "guide-alpha",
        "Documents",
        "Project Alpha · product brief",
        "Project Alpha unifies company search, grounded answers, and governed work. Maya Rao owns delivery; Noah Williams leads retrieval quality. Current milestone: Search beta. See real task records for progress.",
        "Engineering",
        "maya",
        "alpha",
        "Published",
        {},
      ],
      [
        "guide-weekly",
        "Documents",
        "Weekly report · writing guide",
        "Include completed work, upcoming milestones, risks, owners, and the evidence behind each claim. Report task completion as completed tasks divided by all project tasks.",
        "Company",
        "sam",
        "",
        "Published",
        {},
      ],
      [
        "policy-leave",
        "Documents",
        "Time away & leave policy",
        "Fictional policy: leave requires a positive available balance, valid dates, and HR Manager approval. Approved leave deducts working days once. Weekends are excluded.",
        "Company",
        "leah",
        "",
        "Published",
        { policy: true },
      ],
      [
        "hr-maya",
        "HR",
        "Maya Rao · leave balance",
        "Private employee leave record. Annual leave balance: 18 working days.",
        "HR",
        "maya",
        "",
        "Active",
        { category: "Leave balance" },
      ],
      [
        "hr-noah",
        "HR",
        "Noah Williams · onboarding",
        "Private onboarding checklist: equipment issued, security training pending.",
        "HR",
        "noah",
        "",
        "In progress",
        { category: "Onboarding" },
      ],
    ];
    for (const [
      id,
      type,
      title,
      body,
      department,
      owner,
      project,
      status,
      data,
    ] of items)
      insertRecord({
        id,
        type,
        title,
        body,
        department,
        owner,
        project,
        status,
        updated: timestamp(),
        data,
      });
    for (const u of users)
      insertRecord({
        id: u.id,
        type: "People",
        title: u.name,
        body: `${u.department} · ${u.email}`,
        department: "Company",
        owner: u.id,
        status: "Active",
        updated: timestamp(),
        data: {},
      });
    for (const [a, relation, b] of [
      ["maya", "ASSIGNED_TO", "alpha"],
      ["noah", "ASSIGNED_TO", "alpha"],
      ["asset-1", "ASSIGNED_TO", "maya"],
      ["incident-1", "AFFECTS", "asset-1"],
      ["incident-2", "AFFECTS", "asset-1"],
      ["guide-alpha", "RELATED_TO", "alpha"],
      ["task-2", "DEPENDS_ON", "task-1"],
      ["task-3", "DEPENDS_ON", "task-2"],
    ])
      c.prepare("INSERT INTO relationships VALUES(?,?,?,?)").run(
        uid(),
        a,
        relation,
        b,
      );
    c.prepare("INSERT INTO settings VALUES(1,?)").run(
      JSON.stringify({
        workspace: "Singularity",
        departments: ["Engineering", "IT", "HR", "Operations"],
        roles: ["employee", "it_manager", "hr_manager", "admin"],
        approvalRules: {
          replacement: "it_manager",
          leave: "hr_manager",
          note: "admin",
        },
        templates: [
          {
            name: "Weekly project report",
            content:
              "# Weekly project report\n\n## Completed\n\n## Next steps\n\n## Risks & decisions",
          },
          {
            name: "Meeting notes",
            content:
              "# Meeting notes\n\n## Attendees\n\n## Decisions\n\n## Action items",
          },
        ],
        workflowTemplates: [
          "Laptop replacement",
          "Project progress report",
          "Leave request",
        ],
        customFields: [],
        modules: ["IT", "HR", "Projects"],
      }),
    );
    notify(
      "maya",
      "Welcome to Singularity. Your local workspace is ready. All seeded people and records are fictional.",
    );
    log(
      "sam",
      "Workspace seeded",
      "Linked fictional employees, projects, IT incidents, policies and tasks",
    );
    c.exec("COMMIT");
  } catch (e) {
    c.exec("ROLLBACK");
    throw e;
  }
}

function ensureOrganizationDirectory(c: Database.Database) {
  const migrate = !c.prepare("SELECT 1 FROM migrations WHERE version=2").get();
  const staff: [string, string, string, string, string][] = [
    ["sam", "Sam Patel", "Management", "Chief Operations Officer", ""],
    [
      "helen-brooks",
      "Helen Brooks",
      "Management",
      "Chief Executive Officer",
      "sam",
    ],
    [
      "marcus-reed",
      "Marcus Reed",
      "Management",
      "Chief Technology Officer",
      "sam",
    ],
    ["nina-patel", "Nina Patel", "Management", "Chief People Officer", "sam"],
    ["maya", "Maya Rao", "Engineering", "Engineering Lead", "marcus-reed"],
    ["noah", "Noah Williams", "Engineering", "Search Engineer", "maya"],
    ["eli-turner", "Eli Turner", "Engineering", "Backend Engineer", "maya"],
    ["zoe-martin", "Zoe Martin", "Engineering", "Frontend Engineer", "maya"],
    ["owen-clark", "Owen Clark", "Engineering", "Backend Engineer", "maya"],
    ["ivy-chen", "Ivy Chen", "Engineering", "Frontend Engineer", "maya"],
    ["liam-jones", "Liam Jones", "Engineering", "Platform Engineer", "maya"],
    ["ava-kim", "Ava Kim", "Engineering", "Security Engineer", "maya"],
    ["fiona-cole", "Fiona Cole", "Engineering", "Frontend Engineer", "maya"],
    ["ravi-shah", "Ravi Shah", "Product", "Product Lead", "helen-brooks"],
    ["ella-ward", "Ella Ward", "Product", "Product Manager", "ravi-shah"],
    ["leo-grant", "Leo Grant", "Product", "Business Analyst", "ravi-shah"],
    ["maya-fern", "Maya Fern", "Product", "Technical Writer", "ravi-shah"],
    ["isla-gray", "Isla Gray", "Design", "Design Lead", "helen-brooks"],
    ["jack-lee", "Jack Lee", "Design", "Product Designer", "isla-gray"],
    ["sana-ali", "Sana Ali", "Design", "UX Designer", "isla-gray"],
    ["kabir-ali", "Kabir Ali", "Quality", "QA Lead", "marcus-reed"],
    ["priya-das", "Priya Das", "Quality", "QA Engineer", "kabir-ali"],
    ["tom-bell", "Tom Bell", "Quality", "Test Engineer", "kabir-ali"],
    [
      "arjun",
      "Arjun Mehta",
      "Operations",
      "IT Operations Lead",
      "helen-brooks",
    ],
    ["sam-cole", "Sam Cole", "Operations", "Release Coordinator", "arjun"],
    ["lily-moore", "Lily Moore", "Operations", "Operations Analyst", "arjun"],
    ["ben-wright", "Ben Wright", "Operations", "Support Engineer", "arjun"],
    ["leah", "Leah Chen", "People", "People Lead", "nina-patel"],
    ["mia-ross", "Mia Ross", "People", "People Operations Partner", "leah"],
    ["noor-ahmed", "Noor Ahmed", "Finance", "Finance Lead", "helen-brooks"],
    ["aria-king", "Aria King", "Finance", "Finance Analyst", "noor-ahmed"],
  ];
  const insertEmployee = c.prepare(
    "INSERT OR IGNORE INTO employees VALUES(?,?,?,?,?,?)",
  );
  const writeProfile = c.prepare(
    migrate
      ? "INSERT INTO records(id,type,title,body,department,owner,project,status,updated,data) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,data=excluded.data"
      : "INSERT OR IGNORE INTO records(id,type,title,body,department,owner,project,status,updated,data) VALUES(?,?,?,?,?,?,?,?,?,?)",
  );
  const relate = c.prepare(
    "INSERT OR IGNORE INTO relationships VALUES(?,?,?,?)",
  );
  const projectMembers = [
    "maya",
    "noah",
    "eli-turner",
    "zoe-martin",
    "ravi-shah",
    "ella-ward",
    "isla-gray",
    "kabir-ali",
    "priya-das",
    "arjun",
    "helen-brooks",
    "maya-fern",
  ];
  for (const [id, name, department, jobTitle, managerId] of staff) {
    insertEmployee.run(
      id,
      name,
      id === "sam" ? "sam@singularity.example" : `${id}@singularity.example`,
      department,
      "employee",
      15,
    );
    const employeeId = `SG-${id.toUpperCase().replaceAll("-", "-")}`;
    const profile = {
      employeeId,
      jobTitle,
      managerId: managerId || "",
      phone: `+1 (202) 555-${String(100 + staff.findIndex((s) => s[0] === id)).padStart(4, "0")}`,
      teams: [department],
      employmentStatus: "Active",
      projectIds: projectMembers.includes(id) ? ["alpha"] : [],
      approvalResponsibilities:
        id === "kabir-ali"
          ? ["QA Sign-off"]
          : id === "arjun"
            ? ["IT equipment review"]
            : id === "maya"
              ? ["Technical Review"]
              : [],
      source: "Synthetic Singularity evaluation data",
    };
    writeProfile.run(
      id,
      "People",
      name,
      `${jobTitle} · ${department} · ${id}@singularity.example`,
      "Company",
      id,
      null,
      "Active",
      timestamp(),
      JSON.stringify(profile),
    );
    if (managerId) relate.run(uid(), id, "REPORTS_TO", managerId);
    relate.run(uid(), id, "BELONGS_TO", department.toLowerCase());
    relate.run(uid(), id, "MEMBER_OF", department.toLowerCase());
    if (projectMembers.includes(id))
      relate.run(uid(), id, "ASSIGNED_TO", "alpha");
  }
  for (const department of [
    "Management",
    "Engineering",
    "Product",
    "Design",
    "Quality",
    "Operations",
    "People",
    "Finance",
  ]) {
    writeProfile.run(
      department.toLowerCase(),
      "Teams",
      department,
      `${staff.filter((person) => person[2] === department).length} fictional employees in the ${department} team.`,
      department,
      "sam",
      null,
      "Active",
      timestamp(),
      JSON.stringify({
        teamLead:
          staff.find(
            (person) =>
              person[2] === department && /Lead|Officer|Chief/.test(person[3]),
          )?.[0] || "",
        members: staff
          .filter((person) => person[2] === department)
          .map((person) => person[0]),
        source: "Synthetic evaluation data",
      }),
    );
  }
  const taskRows: [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    Record<string, unknown>,
  ][] = [
    [
      "ALP-100",
      "Tasks",
      "Project setup",
      "Set up the Alpha project plan and shared workspace.",
      "Engineering",
      "maya",
      "Done",
      "2026-11-10",
      { priority: "Medium", reporter: "maya" },
    ],
    [
      "ALP-101",
      "Tasks",
      "Source citation viewer",
      "Show the exact source passage and version behind each answer.",
      "Engineering",
      "maya",
      "In Progress",
      "2026-11-27",
      { priority: "High", reporter: "ravi-shah" },
    ],
    [
      "ALP-102",
      "Tasks",
      "Document export",
      "Create and verify Word and PDF exports for project documents.",
      "Quality",
      "priya-das",
      "Review",
      "2026-11-25",
      { priority: "High", reporter: "maya", documentId: "guide-alpha" },
    ],
    [
      "ALP-103",
      "Tasks",
      "Role permissions",
      "Check that people only see records allowed by their role and project membership.",
      "Engineering",
      "ava-kim",
      "In Progress",
      "2026-11-28",
      { priority: "High", reporter: "maya" },
    ],
    [
      "ALP-104",
      "Tasks",
      "Approval workflow",
      "Verify submission, review, return and approval history.",
      "Quality",
      "kabir-ali",
      "Review",
      "2026-11-26",
      { priority: "High", reporter: "maya" },
    ],
    [
      "ALP-105",
      "Tasks",
      "Legacy import mapping",
      "Preview and validate imported records before saving them.",
      "Engineering",
      "eli-turner",
      "To Do",
      "2026-12-02",
      { priority: "Medium", reporter: "arjun" },
    ],
    [
      "ALP-106",
      "Tasks",
      "Ontology explorer",
      "Connect people, projects, tasks and documents from saved workspace records.",
      "Product",
      "ravi-shah",
      "In Progress",
      "2026-12-04",
      { priority: "Medium", reporter: "maya" },
    ],
    [
      "ALP-107",
      "Tasks",
      "Release verification",
      "Complete release checks after approval workflow review.",
      "Quality",
      "kabir-ali",
      "Blocked",
      "2026-12-08",
      { priority: "High", reporter: "helen-brooks", dependsOn: ["ALP-104"] },
    ],
  ];
  for (const [
    id,
    type,
    title,
    body,
    department,
    owner,
    status,
    due,
    data,
  ] of taskRows) {
    const exists = c.prepare("SELECT id FROM records WHERE id=?").get(id);
    if (exists) continue;
    insertRecord({
      id,
      type,
      title,
      body,
      department,
      owner,
      project: "alpha",
      status,
      updated: timestamp(),
      data: { ...data, due, synthetic: true },
    });
    relate.run(uid(), id, "ASSIGNED_TO", owner);
    relate.run(uid(), id, "BELONGS_TO", "alpha");
    if (Array.isArray(data.dependsOn))
      for (const dependency of data.dependsOn)
        relate.run(uid(), id, "DEPENDS_ON", dependency);
  }
  const projectDocuments: [
    string,
    string,
    string,
    string,
    string,
    Record<string, unknown>,
  ][] = [
    [
      "alpha-charter",
      "Alpha Project Charter",
      "Purpose: build a document-aware enterprise workspace for Singularity. Scope includes search, source citations, project records, access controls and approvals. Success is measured by saved work that can be traced back to its source and owner.",
      "maya",
      "Engineering",
      {
        filename: "alpha-project-charter.md",
        version: "1.0",
        classification: "Internal",
        linkedTask: "ALP-100",
      },
    ],
    [
      "alpha-requirements",
      "Software Requirements Specification",
      "Users can search workspace records, open source passages, manage project tasks and submit document versions for review. Search results must respect record access. State changes must be validated and saved with an audit event.",
      "ravi-shah",
      "Product",
      {
        filename: "alpha-requirements.md",
        version: "1.1",
        classification: "Internal",
      },
    ],
    [
      "alpha-architecture",
      "Architecture Decision Record",
      "Decision: keep application records in the existing SQLite store and expose them through server routes. Use stable record IDs and explicit relationship rows for people, projects, tasks and documents. Do not duplicate access rules in the browser.",
      "marcus-reed",
      "Engineering",
      {
        filename: "alpha-architecture.md",
        version: "1.0",
        classification: "Internal",
      },
    ],
    [
      "alpha-sprint",
      "Development Sprint Report",
      "Completed: project setup and initial record search. In progress: source citation viewer, role permissions and the ontology explorer. Risks: permission boundaries need checks across search, profile and relationship views before release.",
      "maya",
      "Engineering",
      {
        filename: "alpha-sprint-report.md",
        version: "1.0",
        classification: "Internal",
      },
    ],
    [
      "alpha-export-test",
      "Document Export Test Report",
      "Test scope: Word and PDF export from a saved document version. Verify the downloaded file opens, contains the selected version title and full content, and does not substitute a newer draft. The assigned QA owner is Priya Das. This sample report is evaluation data, not a record of a real release test.",
      "priya-das",
      "Quality",
      {
        filename: "alpha-export-test-report.md",
        version: "1.2",
        classification: "Internal",
        linkedTask: "ALP-102",
      },
    ],
    [
      "alpha-security",
      "Security Review Checklist",
      "Review access checks on every workspace read and write route. Check that restricted records do not appear in search snippets or relationship results. Confirm that approval decisions require a separate authorized reviewer and that secrets remain on the server.",
      "ava-kim",
      "Engineering",
      {
        filename: "alpha-security-review.md",
        version: "1.0",
        classification: "Internal",
        linkedTask: "ALP-103",
      },
    ],
    [
      "alpha-qa",
      "QA Verification Report",
      "Verify task status changes persist after refresh, blocked work cannot skip dependencies, and review decisions refer to the exact submitted document version. Record actual failures and evidence before marking a check complete.",
      "kabir-ali",
      "Quality",
      {
        filename: "alpha-qa-report.md",
        version: "1.0",
        classification: "Internal",
        linkedTask: "ALP-104",
      },
    ],
    [
      "alpha-release",
      "Alpha Release Checklist",
      "Before release, confirm the search view, People directory, task board, document sources and approval history work after a refresh. Confirm pending and blocked items have an owner. Release approval must wait for required review work.",
      "helen-brooks",
      "Management",
      {
        filename: "alpha-release-checklist.md",
        version: "0.3",
        classification: "Internal",
        linkedTask: "ALP-107",
      },
    ],
    [
      "alpha-technical-review",
      "Technical Approval Note",
      "Review request: inspect the document export module and confirm that the exported file matches the submitted source version. Reviewer comments and the final decision should be saved against the exact version.",
      "maya",
      "Engineering",
      {
        filename: "alpha-technical-review.md",
        version: "1.0",
        classification: "Internal",
        linkedTask: "ALP-102",
      },
    ],
    [
      "alpha-status",
      "Project Status Report",
      "Alpha is active. The initial project setup is complete. The source citation viewer, role permission checks and ontology explorer are in progress. Document export and approval workflow items are awaiting review. Release verification is blocked until its prerequisite is complete.",
      "maya",
      "Engineering",
      {
        filename: "alpha-status-report.md",
        version: "1.0",
        classification: "Internal",
      },
    ],
    [
      "alpha-legacy-map",
      "Legacy System Mapping Specification",
      "Map source identifier to stable record ID, source title to record title, source description to body and source department to department. Preview every row, report missing required fields, and do not save until an authorised user confirms the import.",
      "eli-turner",
      "Engineering",
      {
        filename: "alpha-legacy-mapping.md",
        version: "1.0",
        classification: "Internal",
        linkedTask: "ALP-105",
      },
    ],
    [
      "alpha-incident-resolution",
      "Incident Resolution Report",
      "Sample incident: document export validation found a mismatch between the selected version and the file metadata. Investigation should compare the saved version hash, export response and downloaded filename. Keep this incident open until repeatable evidence shows the versions match.",
      "arjun",
      "Operations",
      {
        filename: "alpha-incident-resolution.md",
        version: "1.0",
        classification: "Internal",
      },
    ],
  ];
  for (const [
    id,
    title,
    body,
    owner,
    department,
    metadata,
  ] of projectDocuments) {
    if (c.prepare("SELECT id FROM records WHERE id=?").get(id)) continue;
    insertRecord({
      id,
      type: "Documents",
      title,
      body,
      department,
      owner,
      project: "alpha",
      status: "Published",
      updated: timestamp(),
      data: {
        ...metadata,
        source: "Synthetic Singularity evaluation data",
        projectId: "alpha",
      },
    });
    relate.run(uid(), id, "REFERENCES", "alpha");
    if (typeof metadata.linkedTask === "string")
      relate.run(uid(), id, "ATTACHED_TO", metadata.linkedTask);
  }
  const alpha = c.prepare("SELECT data FROM records WHERE id='alpha'").get() as
    { data: string } | undefined;
  if (alpha && migrate) {
    const data = JSON.parse(alpha.data) as Record<string, unknown>;
    data.members = projectMembers;
    data.managerId = "maya";
    data.projectType = "Enterprise workflow platform";
    c.prepare(
      "UPDATE records SET title='Alpha',body=?,data=? WHERE id='alpha'",
    ).run(
      "Build a document-aware enterprise workspace for Singularity. Bring people, projects, records, source citations, permissions and approvals together in one place.",
      JSON.stringify(data),
    );
  }
  if (migrate) {
    c.prepare(
      "UPDATE records SET department='Management' WHERE id='sam'",
    ).run();
    c.prepare(
      "UPDATE employees SET department='Management' WHERE id='sam'",
    ).run();
    c.prepare("UPDATE records SET department='People' WHERE id='leah'").run();
    c.prepare("UPDATE employees SET department='People' WHERE id='leah'").run();
    c.prepare(
      "UPDATE records SET department='Operations' WHERE id='arjun'",
    ).run();
    c.prepare(
      "UPDATE employees SET department='Operations' WHERE id='arjun'",
    ).run();
    c.prepare(
      "INSERT INTO migrations(version,applied) VALUES(2,datetime('now'))",
    ).run();
  }
  const removeOldSeedDuplicates = !c
    .prepare("SELECT 1 FROM migrations WHERE version=3")
    .get();
  if (removeOldSeedDuplicates) {
    for (const id of ["sam-patel", "jude-foster", "erin-price"]) {
      c.prepare("DELETE FROM relationships WHERE fromId=? OR toId=?").run(
        id,
        id,
      );
      c.prepare("DELETE FROM records WHERE id=? AND type='People'").run(id);
      c.prepare("DELETE FROM employees WHERE id=?").run(id);
    }
    c.prepare(
      "INSERT INTO migrations(version,applied) VALUES(3,datetime('now'))",
    ).run();
  }
}

function ensureOperationalExamples(c: Database.Database) {
  if (c.prepare("SELECT 1 FROM migrations WHERE version=4").get()) return;
  const created = "2026-11-10T09:00:00.000Z";
  c.exec("BEGIN IMMEDIATE");
  try {
    const examples = [
      {
        id: "approval-alpha-release",
        documentId: "demo-doc-alpha-release",
        versionId: "demo-ver-alpha-release-1",
        recordId: "demo-record-alpha-release",
        owner: "maya",
        department: "Engineering",
        project: "alpha",
        title: "Alpha release readiness review",
        kind: "note",
        role: "admin",
        content:
          "Synthetic review request for Project Alpha.\n\nScope: confirm that indexed search, source previews, access checks and export validation have evidence recorded before release.\n\nOpen items: verify the latest export test and confirm the rollback notes.\n\nRequested decision: approve the release checklist after the linked checks are complete.",
      },
      {
        id: "approval-device-replacement",
        documentId: "demo-doc-device-replacement",
        versionId: "demo-ver-device-replacement-1",
        recordId: "demo-record-device-replacement",
        owner: "noah",
        department: "IT",
        project: "alpha",
        title: "Laptop replacement request · SG-LT-1042",
        kind: "replacement",
        role: "it_manager",
        content:
          "Synthetic asset request for SG-LT-1042, assigned to Maya Rao.\n\nThe asset register records three hardware failures and a 2022 purchase date. The device shuts down during retrieval benchmark runs.\n\nRequested action: approve replacement review under the sample equipment policy. No purchase is made by this request.",
      },
      {
        id: "approval-onboarding-update",
        documentId: "demo-doc-onboarding-update",
        versionId: "demo-ver-onboarding-update-1",
        recordId: "demo-record-onboarding-update",
        owner: "leah",
        department: "Company",
        project: "atlas",
        title: "Onboarding checklist update",
        kind: "note",
        role: "hr_manager",
        content:
          "Synthetic People Operations review request.\n\nProposed update: add security training confirmation and equipment receipt to the first-week onboarding checklist.\n\nRequested decision: review the checklist wording and return comments if the steps need changes.",
      },
    ];
    const insertDocument = c.prepare(
      "INSERT OR IGNORE INTO documents(id,owner,department,title,kind,target,status) VALUES(?,?,?,?,?,?,?)",
    );
    const insertVersion = c.prepare(
      "INSERT OR IGNORE INTO versions(id,documentId,number,title,content,reason,author,created,hash) VALUES(?,?,?,?,?,?,?,?,?)",
    );
    const insertApproval = c.prepare(
      "INSERT OR IGNORE INTO approvals(id,documentId,versionId,requester,reviewerRole,status,comment,created,reviewerId,projectId,idempotencyKey) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
    );
    for (const example of examples) {
      insertDocument.run(
        example.documentId,
        example.owner,
        example.department,
        example.title,
        example.kind,
        example.project,
        "PENDING_APPROVAL",
      );
      insertVersion.run(
        example.versionId,
        example.documentId,
        1,
        example.title,
        example.content,
        "Initial synthetic review example",
        example.owner,
        created,
        digest(example.content),
      );
      insertApproval.run(
        example.id,
        example.documentId,
        example.versionId,
        example.owner,
        example.role,
        "PENDING_APPROVAL",
        "",
        created,
        (
          c
            .prepare(
              "SELECT id FROM employees WHERE role=? AND id<>? ORDER BY id LIMIT 1",
            )
            .get(example.role, example.owner) as { id: string } | undefined
        )?.id || null,
        example.project,
        `seed:${example.id}`,
      );
      c.prepare(
        "INSERT OR IGNORE INTO audit(id,actor,action,detail,created) VALUES(?,?,?,?,?)",
      ).run(
        `demo-audit-${example.id}`,
        example.owner,
        "Approval requested",
        `${example.id}: ${example.versionId}`,
        created,
      );
      const reviewers = c
        .prepare("SELECT id FROM employees WHERE role=? OR role='admin'")
        .all(example.role) as { id: string }[];
      for (const reviewer of reviewers)
        c.prepare(
          "INSERT OR IGNORE INTO notifications(id,userId,text,read,created) VALUES(?,?,?,?,?)",
        ).run(
          `demo-notice-${example.id}-${reviewer.id}`,
          reviewer.id,
          `Review requested: ${example.title}`,
          0,
          created,
        );
      if (!c.prepare("SELECT 1 FROM records WHERE id=?").get(example.recordId))
        insertRecord({
          id: example.recordId,
          type: "Documents",
          title: example.title,
          body: example.content,
          department: example.department,
          owner: example.owner,
          project: example.project,
          status: "Pending approval",
          updated: created,
          data: {
            documentId: example.documentId,
            version: 1,
            source: "Synthetic Singularity review example",
            classification: "Internal",
          },
        });
    }
    const operationalRecords = [
      {
        id: "asset-3",
        title: "SG-APP-01 · Search application server",
        body: "Synthetic asset record. Internal search application host used by the Alpha evaluation workspace. Owner: Arjun Mehta. Nightly health checks are enabled.",
        owner: "arjun",
        status: "Active",
        data: {
          category: "Asset",
          serial: "SG-APP-01",
          service: "Search service",
        },
      },
      {
        id: "asset-4",
        title: "SG-DB-01 · Workspace database",
        body: "Synthetic asset record. SQLite workspace database for the local evaluation environment. Backup verification is reviewed by IT Operations.",
        owner: "arjun",
        status: "Active",
        data: {
          category: "Asset",
          serial: "SG-DB-01",
          service: "Workspace data",
        },
      },
      {
        id: "incident-3",
        title: "INC-003 · Search indexing delay",
        body: "Synthetic incident. Newly saved documents may take longer than expected to appear in search. Engineering is comparing the index update timestamp with the saved document version.",
        owner: "noah",
        status: "Investigating",
        data: {
          category: "Incident",
          incidentId: "INC-003",
          severity: "Medium",
          assetId: "asset-3",
        },
      },
      {
        id: "incident-4",
        title: "INC-004 · Backup verification needs review",
        body: "Synthetic incident. The latest workspace backup completed, but the restore check has not yet been signed off. IT Operations must record verification before closing the incident.",
        owner: "arjun",
        status: "Pending review",
        data: {
          category: "Incident",
          incidentId: "INC-004",
          severity: "High",
          assetId: "asset-4",
        },
      },
      {
        id: "service-search",
        title: "Search and retrieval service",
        body: "Synthetic service record. Provides permission-filtered search and source previews for the local Singularity workspace.",
        owner: "arjun",
        status: "Operational",
        data: { category: "Service", serviceId: "SVC-SEARCH" },
      },
      {
        id: "service-doc-export",
        title: "Document export service",
        body: "Synthetic service record. Generates downloadable PDF and DOCX files from saved document versions.",
        owner: "arjun",
        status: "Monitoring",
        data: { category: "Service", serviceId: "SVC-EXPORT" },
      },
    ];
    for (const r of operationalRecords) {
      if (c.prepare("SELECT 1 FROM records WHERE id=?").get(r.id)) continue;
      insertRecord({
        ...r,
        type: "IT",
        department: "IT",
        project: "alpha",
        updated: created,
        data: { ...r.data, source: "Synthetic Singularity operations example" },
      });
      if (typeof r.data.assetId === "string")
        c.prepare(
          "INSERT OR IGNORE INTO relationships(id,fromId,relation,toId) VALUES(?,?,?,?)",
        ).run(uid(), r.id, "AFFECTS", r.data.assetId);
    }
    for (const example of examples) {
      c.prepare(
        "INSERT OR IGNORE INTO relationships(id,fromId,relation,toId) VALUES(?,?,?,?)",
      ).run(uid(), example.recordId, "REFERENCES", example.project);
      c.prepare(
        "INSERT OR IGNORE INTO relationships(id,fromId,relation,toId) VALUES(?,?,?,?)",
      ).run(uid(), example.recordId, "REQUIRES_APPROVAL", example.id);
    }
    c.prepare(
      "INSERT INTO migrations(version,applied) VALUES(4,datetime('now'))",
    ).run();
    c.exec("COMMIT");
  } catch (error) {
    c.exec("ROLLBACK");
    throw error;
  }
}

function ensureSourcePack(c: Database.Database) {
  const indexPath = path.resolve(process.cwd(), "source_pack_index.json");
  if (!fs.existsSync(indexPath))
    throw new Error(
      "Verified source pack index is missing from the workspace.",
    );
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8")) as {
    documents: Array<{
      document_id: string;
      project_id: string;
      title: string;
      version: string;
      owner: string;
      classification: string;
      file_path: string;
      mime_type: string;
      section_anchors: string[];
      related_task_ids: string[];
      related_approval_ids: string[];
      citation_format: string;
      pdf_path?: string;
      content: string;
      source_sha256: string;
      pdf_sha256?: string;
    }>;
  };
  if (!Array.isArray(index.documents) || index.documents.length !== 20)
    throw new Error("The verified source pack must contain all 20 documents.");
  const root = path.resolve(process.cwd());
  c.exec("BEGIN IMMEDIATE");
  try {
    for (const doc of index.documents) {
      for (const relative of [
        doc.file_path,
        ...(doc.pdf_path ? [doc.pdf_path] : []),
      ]) {
        const absolute = path.resolve(root, relative);
        const withinWorkspace = path.relative(root, absolute);
        if (
          path.isAbsolute(withinWorkspace) ||
          withinWorkspace === ".." ||
          withinWorkspace.startsWith(".." + path.sep) ||
          !fs.existsSync(absolute)
        )
          throw new Error(
            `Source file is missing or outside the workspace: ${relative}`,
          );
      }
      const id = `source-${doc.document_id.toLowerCase()}`;
      const project = doc.project_id === "ALP" ? "alpha" : undefined;
      const updated = timestamp();
      const data = {
        source: "Synthetic source pack",
        isSynthetic: true,
        sourceDocumentId: doc.document_id,
        version: doc.version,
        classification: doc.classification,
        sourceFile: doc.file_path,
        sourceMimeType: doc.mime_type,
        sourceHash: doc.source_sha256,
        pdfFile: doc.pdf_path || "",
        pdfHash: doc.pdf_sha256 || "",
        projectCode: doc.project_id,
        sectionAnchors: doc.section_anchors,
        citationFormat: doc.citation_format,
        relatedTaskIds: doc.related_task_ids,
        sourcePackApprovalIds: doc.related_approval_ids,
      };
      if (c.prepare("SELECT 1 FROM records WHERE id=?").get(id))
        c.prepare(
          "UPDATE records SET type='Documents',title=?,body=?,department='Company',owner=?,project=?,status='Published',updated=?,data=? WHERE id=?",
        ).run(
          doc.title,
          doc.content,
          doc.owner,
          project || null,
          updated,
          JSON.stringify(data),
          id,
        );
      else
        insertRecord({
          id,
          type: "Documents",
          title: doc.title,
          body: doc.content,
          department: "Company",
          owner: doc.owner,
          project,
          status: "Published",
          updated,
          data,
        });
      if (project)
        c.prepare(
          "INSERT OR IGNORE INTO relationships(id,fromId,relation,toId) VALUES(?,?,?,?)",
        ).run(uid(), id, "REFERENCES", project);
    }
    c.prepare(
      "INSERT OR IGNORE INTO migrations(version,applied) VALUES(5,datetime('now'))",
    ).run();
    c.exec("COMMIT");
  } catch (error) {
    c.exec("ROLLBACK");
    throw error;
  }
}
