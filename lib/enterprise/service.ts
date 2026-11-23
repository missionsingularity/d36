import { z } from "zod";
import { DEFAULT_GEMINI_MODEL } from "./gemini";
import {
  db,
  atomic,
  uid,
  timestamp,
  digest,
  record,
  insertRecord,
  log,
  notify,
} from "./db";
import type {
  Employee,
  RecordItem,
  DocumentItem,
  Version,
  Approval,
  Snapshot,
  Workflow,
  Chat,
  Receipt,
} from "./types";

export class WorkspaceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function employee(id: string) {
  const u = db().prepare("SELECT * FROM employees WHERE id=?").get(id) as
    Employee | undefined;
  if (!u) throw new WorkspaceError("Employee not found", 404);
  return u;
}
export function canRead(
  u: Employee,
  r: { type?: string; department: string; owner: string },
) {
  return (
    r.department !== "HR" ||
    r.owner === u.id ||
    ["hr_manager", "admin"].includes(u.role)
  );
}
export function records(u: Employee) {
  return (
    db().prepare("SELECT * FROM records ORDER BY updated DESC").all() as Record<
      string,
      unknown
    >[]
  )
    .map(record)
    .filter((r) => canRead(u, r));
}
export function getRecord(u: Employee, id: string) {
  const r = db().prepare("SELECT * FROM records WHERE id=?").get(id);
  if (!r || !canRead(u, r as unknown as RecordItem))
    throw new WorkspaceError("Record unavailable", 404);
  return record(r as Record<string, unknown>);
}
export function search(u: Employee, query: string, type = "All", save = false) {
  const words = query.match(/[\p{L}\p{N}]+/gu)?.slice(0, 20) || [];
  let result: RecordItem[];
  if (words.length) {
    const expression = words.map((w) => '"' + w + '"*').join(" OR ");
    result = (
      db()
        .prepare(
          "SELECT records.* FROM record_search JOIN records ON records.id=record_search.id WHERE record_search MATCH ? ORDER BY rank LIMIT 500",
        )
        .all(expression) as Record<string, unknown>[]
    )
      .map(record)
      .filter((r) => canRead(u, r));
  } else result = records(u);
  result = result.filter((r) => type === "All" || r.type === type).slice(0, 60);
  if (save && query.trim()) {
    db()
      .prepare("INSERT INTO search_history VALUES(?,?,?,?)")
      .run(uid(), u.id, query.trim().slice(0, 200), timestamp());
  }
  return result;
}
export function documents(u: Employee): DocumentItem[] {
  return (
    db()
      .prepare("SELECT * FROM documents ORDER BY rowid DESC")
      .all() as unknown as Omit<DocumentItem, "versions">[]
  )
    .filter((d) => canRead(u, d))
    .map((d) => ({
      ...d,
      versions: db()
        .prepare("SELECT * FROM versions WHERE documentId=? ORDER BY number")
        .all(d.id) as unknown as Version[],
    }));
}
export function document(u: Employee, id: string) {
  const d = documents(u).find((d) => d.id === id);
  if (!d) throw new WorkspaceError("Document unavailable", 404);
  return d;
}
const text = z.string().trim().min(1).max(50000);
export function draft(u: Employee, input: unknown) {
  const v = z
    .object({
      title: text.max(200),
      content: text,
      kind: z.enum(["note", "replacement", "leave", "task"]).default("note"),
      target: z.string().max(100).default(""),
      department: z.string().max(100).default("Engineering"),
    })
    .parse(input);
  return atomic(() => {
    const id = uid();
    db()
      .prepare("INSERT INTO documents VALUES(?,?,?,?,?,?,?)")
      .run(
        id,
        u.id,
        v.kind === "leave" ? "HR" : v.department,
        v.title,
        v.kind,
        v.target,
        "DRAFT",
      );
    addVersion(u, id, v.title, v.content, "Initial draft");
    log(u.id, "Draft created", id);
    return document(u, id);
  });
}
function addVersion(
  u: Employee,
  id: string,
  title: string,
  content: string,
  reason: string,
) {
  const number = Number(
    (
      db()
        .prepare(
          "SELECT COALESCE(MAX(number),0)+1 AS n FROM versions WHERE documentId=?",
        )
        .get(id) as { n: number }
    ).n,
  );
  const versionId = uid();
  db()
    .prepare("INSERT INTO versions VALUES(?,?,?,?,?,?,?,?,?)")
    .run(
      versionId,
      id,
      number,
      title,
      content,
      reason,
      u.id,
      timestamp(),
      digest(content),
    );
  const d = db()
    .prepare("SELECT * FROM documents WHERE id=?")
    .get(id) as unknown as DocumentItem;
  const rid = "doc-" + id;
  const old = db().prepare("SELECT id FROM records WHERE id=?").get(rid);
  if (old)
    db()
      .prepare("UPDATE records SET title=?,body=?,updated=?,data=? WHERE id=?")
      .run(
        title,
        content,
        timestamp(),
        JSON.stringify({ documentId: id, version: number }),
        rid,
      );
  else
    insertRecord({
      id: rid,
      type: "Documents",
      title,
      body: content,
      department: d.department,
      owner: d.owner,
      status: "Draft",
      updated: timestamp(),
      data: { documentId: id, version: number },
    });
  return versionId;
}
export function revise(u: Employee, input: unknown) {
  const v = z
    .object({
      id: text,
      baseVersion: text,
      title: text.max(200),
      content: text,
      reason: text.max(1000),
    })
    .parse(input);
  return atomic(() => {
    const d = document(u, v.id);
    if (d.owner !== u.id)
      throw new WorkspaceError("Only the document owner can revise it", 403);
    if (d.versions.at(-1)?.id !== v.baseVersion)
      throw new WorkspaceError(
        "A newer version exists. Reload before saving.",
        409,
      );
    if (["PENDING_APPROVAL", "EXECUTING", "COMPLETED"].includes(d.status))
      throw new WorkspaceError("This version is locked by its workflow", 409);
    addVersion(u, d.id, v.title, v.content, v.reason);
    db()
      .prepare("UPDATE documents SET title=?,status=? WHERE id=?")
      .run(v.title, "DRAFT", d.id);
    log(u.id, "Document revised", `${d.id}: ${v.reason}`);
    return document(u, d.id);
  });
}
export function submit(
  u: Employee,
  id: string,
  options: {
    reviewer?: "manager" | "configured";
    idempotencyKey?: string;
  } = {},
) {
  return atomic(() => {
    const d = document(u, id);
    if (d.owner !== u.id)
      throw new WorkspaceError("Only the owner can submit", 403);
    const version = d.versions.at(-1)!;
    const idempotencyKey =
      options.idempotencyKey || `document:${d.id}:version:${version.id}`;
    const previous = db()
      .prepare(
        "SELECT id,documentId,versionId,requester FROM approvals WHERE versionId=? OR idempotencyKey=? ORDER BY created DESC LIMIT 1",
      )
      .get(version.id, idempotencyKey) as
      | {
          id: string;
          documentId: string;
          versionId: string;
          requester: string;
        }
      | undefined;
    if (previous) {
      if (
        previous.documentId !== d.id ||
        previous.versionId !== version.id ||
        previous.requester !== u.id
      )
        throw new WorkspaceError(
          "This approval key is already linked to another request",
          409,
        );
      return previous.id;
    }
    if (d.status !== "DRAFT")
      throw new WorkspaceError(
        "Save a new draft version before submitting",
        409,
      );
    const settings = JSON.parse(
      (
        db().prepare("SELECT payload FROM settings WHERE id=1").get() as {
          payload: string;
        }
      ).payload,
    );
    const configuredRole = settings.approvalRules?.[d.kind] || "admin";
    let reviewer: Employee | undefined;
    let reviewerRole = configuredRole;
    if (options.reviewer === "manager") {
      const reportingLine = db()
        .prepare(
          "SELECT toId FROM relationships WHERE fromId=? AND relation='REPORTS_TO' ORDER BY rowid LIMIT 1",
        )
        .get(u.id) as { toId: string } | undefined;
      if (!reportingLine)
        throw new WorkspaceError(
          "Your manager is not set in the organization directory",
          409,
        );
      reviewer = employee(reportingLine.toId);
      if (reviewer.id === u.id)
        throw new WorkspaceError(
          "A separate manager must review this draft",
          409,
        );
      reviewerRole = reviewer.role;
    } else {
      const assigned = db()
        .prepare(
          "SELECT id FROM employees WHERE role=? AND id<>? ORDER BY id LIMIT 1",
        )
        .get(configuredRole, u.id) as { id: string } | undefined;
      const fallback =
        assigned ||
        (configuredRole !== "admin"
          ? (db()
              .prepare(
                "SELECT id FROM employees WHERE role='admin' AND id<>? ORDER BY id LIMIT 1",
              )
              .get(u.id) as { id: string } | undefined)
          : undefined);
      if (!fallback)
        throw new WorkspaceError(
          `No authorized ${configuredRole} reviewer is available`,
          409,
        );
      reviewer = employee(fallback.id);
    }
    const project = d.target
      ? (db()
          .prepare("SELECT id FROM records WHERE type='Projects' AND id=?")
          .get(d.target) as { id: string } | undefined)
      : undefined;
    const projectId = project?.id || null;
    const approvalId = uid();
    db()
      .prepare(
        "INSERT INTO approvals(id,documentId,versionId,requester,reviewerRole,status,comment,created,reviewerId,projectId,idempotencyKey) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        approvalId,
        d.id,
        version.id,
        u.id,
        reviewerRole,
        "PENDING_APPROVAL",
        "",
        timestamp(),
        reviewer.id,
        projectId,
        idempotencyKey,
      );
    db()
      .prepare("UPDATE documents SET status=? WHERE id=?")
      .run("PENDING_APPROVAL", d.id);
    notify(reviewer.id, `Review requested: ${d.title}`);
    const relate = db().prepare(
      "INSERT OR IGNORE INTO relationships(id,fromId,relation,toId) VALUES(?,?,?,?)",
    );
    relate.run(uid(), approvalId, "REVIEWS_DOCUMENT", d.id);
    relate.run(uid(), approvalId, "REQUESTED_BY", u.id);
    relate.run(uid(), approvalId, "ASSIGNED_TO", reviewer.id);
    if (projectId) relate.run(uid(), approvalId, "FOR_PROJECT", projectId);
    log(
      u.id,
      "Approval requested",
      `${approvalId}: ${version.id}; reviewer ${reviewer.id}; project ${projectId || "none"}`,
    );
    return approvalId;
  });
}
export function decide(u: Employee, input: unknown) {
  const v = z
    .object({
      id: text,
      decision: z.enum(["approve", "return", "reject"]),
      comment: z.string().max(2000).default(""),
    })
    .parse(input);
  return atomic(() => {
    const a = db()
      .prepare("SELECT * FROM approvals WHERE id=?")
      .get(v.id) as unknown as Approval;
    if (!a) throw new WorkspaceError("Approval not found", 404);
    if (
      (a.reviewerId
        ? a.reviewerId !== u.id && u.role !== "admin"
        : ![a.reviewerRole, "admin"].includes(u.role)) ||
      u.id === a.requester
    )
      throw new WorkspaceError(
        "An independent authorized reviewer is required",
        403,
      );
    if (a.status !== "PENDING_APPROVAL")
      throw new WorkspaceError("Approval already decided", 409);
    const d = document(u, a.documentId);
    if (d.versions.at(-1)?.id !== a.versionId)
      throw new WorkspaceError("Approval version mismatch", 409);
    if (!v.comment.trim())
      throw new WorkspaceError("Add a reason before saving your decision");
    const status =
      v.decision === "approve"
        ? "APPROVED"
        : v.decision === "reject"
          ? "REJECTED"
          : "RETURNED";
    db()
      .prepare("INSERT INTO approval_decisions VALUES(?,?,?,?,?,?,?)")
      .run(
        uid(),
        a.id,
        a.versionId,
        u.id,
        v.decision,
        v.comment || "Approved exact document version",
        timestamp(),
      );
    db()
      .prepare("UPDATE approvals SET status=?,comment=? WHERE id=?")
      .run(status, v.comment, a.id);
    db().prepare("UPDATE documents SET status=? WHERE id=?").run(status, d.id);
    for (const linked of db()
      .prepare("SELECT id,data FROM records WHERE type='Documents'")
      .all() as { id: string; data: string }[]) {
      if (
        (JSON.parse(linked.data) as { documentId?: string }).documentId === d.id
      )
        db()
          .prepare("UPDATE records SET status=?,updated=? WHERE id=?")
          .run(status, timestamp(), linked.id);
    }
    if (status === "RETURNED") {
      const version = d.versions.at(-1)!;
      addVersion(
        employee(d.owner),
        d.id,
        version.title,
        version.content,
        "Returned by reviewer: " + v.comment,
      );
    }
    notify(d.owner, `${d.title}: ${status.toLowerCase()}`);
    log(u.id, status, `${a.id}: ${a.versionId}; ${v.comment}`);
    return status;
  });
}
export function execute(u: Employee, approvalId: string) {
  return atomic(() => {
    const a = db()
      .prepare("SELECT * FROM approvals WHERE id=?")
      .get(approvalId) as unknown as Approval;
    if (!a) throw new WorkspaceError("Approval not found", 404);
    if (
      (a.reviewerId
        ? a.reviewerId !== u.id && u.role !== "admin"
        : ![a.reviewerRole, "admin"].includes(u.role)) ||
      u.id === a.requester
    )
      throw new WorkspaceError("Authorized independent reviewer required", 403);
    const existing = db()
      .prepare("SELECT * FROM receipts WHERE approvalId=?")
      .get(a.id) as unknown as Receipt | undefined;
    if (existing) return existing;
    if (a.status !== "APPROVED")
      throw new WorkspaceError("An approved exact version is required", 409);
    const d = document(u, a.documentId);
    const v = d.versions.at(-1)!;
    if (v.id !== a.versionId || digest(v.content) !== v.hash)
      throw new WorkspaceError("Approved version mismatch", 409);
    let detail = "";
    if (d.kind === "replacement") {
      const asset = getRecord(u, d.target);
      if (
        asset.type !== "IT" ||
        asset.data.category !== "Asset" ||
        Number(asset.data.ageYears) < 3 ||
        Number(asset.data.failures) < 2 ||
        asset.status === "Replacement ordered"
      )
        throw new WorkspaceError(
          "Asset no longer satisfies replacement preconditions",
          409,
        );
      db()
        .prepare("UPDATE records SET status=?,updated=? WHERE id=?")
        .run("Replacement ordered", timestamp(), asset.id);
      const requestId = uid();
      insertRecord({
        id: requestId,
        type: "IT",
        title: `Procurement request · ${asset.title}`,
        body: v.content,
        department: "IT",
        owner: d.owner,
        project: asset.project,
        status: "Approved for procurement",
        updated: timestamp(),
        data: { category: "Procurement", assetId: asset.id, approvalId: a.id },
      });
      detail = `Local procurement request ${requestId} created; ${asset.id} marked Replacement ordered. No external order sent.`;
    } else if (d.kind === "leave") {
      const args = JSON.parse(d.target) as {
        start: string;
        end: string;
        days: number;
      };
      const days = workingDays(args.start, args.end);
      if (days !== args.days)
        throw new WorkspaceError("Leave date mismatch", 409);
      const owner = employee(d.owner);
      if (owner.leaveBalance < days)
        throw new WorkspaceError("Insufficient leave balance", 409);
      const overlaps = records(u)
        .filter(
          (r) =>
            r.type === "HR" &&
            r.owner === d.owner &&
            r.data.category === "Leave request" &&
            r.status === "Approved",
        )
        .some(
          (r) =>
            String(r.data.start) <= args.end &&
            String(r.data.end) >= args.start,
        );
      if (overlaps)
        throw new WorkspaceError("Dates overlap existing approved leave", 409);
      db()
        .prepare("UPDATE employees SET leaveBalance=leaveBalance-? WHERE id=?")
        .run(days, d.owner);
      insertRecord({
        id: uid(),
        type: "HR",
        title: `${owner.name} · ${days} days leave`,
        body: v.content,
        department: "HR",
        owner: d.owner,
        status: "Approved",
        updated: timestamp(),
        data: { category: "Leave request", ...args },
      });
      db()
        .prepare("UPDATE records SET body=?,updated=? WHERE id=?")
        .run(
          `Private employee leave record. Annual leave balance: ${owner.leaveBalance - days} working days.`,
          timestamp(),
          "hr-" + owner.id,
        );
      detail = `Approved ${days} working days of leave; balance ${owner.leaveBalance - days}.`;
    } else if (d.kind === "task") {
      const project = getRecord(u, d.target);
      if (project.type !== "Projects")
        throw new WorkspaceError("Project unavailable", 409);
      insertRecord({
        id: uid(),
        type: "Tasks",
        title: d.title,
        body: v.content,
        department: project.department,
        owner: d.owner,
        project: project.id,
        status: "Open",
        updated: timestamp(),
        data: { approvalId: a.id },
      });
      detail = "Approved task created in project " + project.title;
    } else
      detail =
        "Exact document version approved and released in the local workspace.";
    const receipt = {
      id: uid(),
      approvalId: a.id,
      detail,
      created: timestamp(),
    };
    db()
      .prepare("INSERT INTO receipts VALUES(?,?,?,?)")
      .run(receipt.id, receipt.approvalId, receipt.detail, receipt.created);
    db()
      .prepare("UPDATE documents SET status=? WHERE id=?")
      .run("COMPLETED", d.id);
    db()
      .prepare("UPDATE approvals SET status=? WHERE id=?")
      .run("COMPLETED", a.id);
    notify(d.owner, detail);
    log(u.id, "Action completed", JSON.stringify(receipt));
    return receipt;
  });
}
export function workingDays(start: string, end: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end))
    throw new WorkspaceError("Use valid dates");
  const a = new Date(start + "T00:00:00Z"),
    b = new Date(end + "T00:00:00Z");
  if (
    !Number.isFinite(+a) ||
    !Number.isFinite(+b) ||
    a.toISOString().slice(0, 10) !== start ||
    b.toISOString().slice(0, 10) !== end ||
    a > b ||
    +b - +a > 366 * 86400000
  )
    throw new WorkspaceError("Choose a valid date range within one year");
  let n = 0;
  for (let d = +a; d <= +b; d += 86400000) {
    const day = new Date(d).getUTCDay();
    if (day !== 0 && day !== 6) n++;
  }
  if (!n) throw new WorkspaceError("Select at least one working day");
  return n;
}
export function requestLeave(u: Employee, input: unknown) {
  const v = z
    .object({ start: z.string(), end: z.string(), reason: text.max(1000) })
    .parse(input);
  const days = workingDays(v.start, v.end);
  if (days > u.leaveBalance)
    throw new WorkspaceError("Insufficient leave balance");
  return draft(u, {
    title: `Leave request · ${u.name}`,
    content: `${u.name} requests ${days} working days of leave, ${v.start} to ${v.end}.\n\nReason: ${v.reason}\n\nCurrent balance: ${u.leaveBalance}. Requires HR approval before deduction.`,
    kind: "leave",
    department: "HR",
    target: JSON.stringify({ start: v.start, end: v.end, days }),
  });
}
export function progress(u: Employee, id: string) {
  const p = getRecord(u, id);
  if (p.type !== "Projects") throw new WorkspaceError("Project not found");
  const tasks = records(u).filter(
    (r) => r.type === "Tasks" && r.project === id,
  );
  const done = tasks.filter((t) => t.status === "Done").length;
  return {
    project: p,
    tasks,
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
  };
}
export function replacement(u: Employee, id: string) {
  const asset = getRecord(u, id);
  if (asset.type !== "IT" || asset.data.category !== "Asset")
    throw new WorkspaceError("Asset not found");
  const incidents = records(u).filter(
    (r) =>
      r.data.assetId === id &&
      r.data.category === "Incident" &&
      !["Resolved", "Closed"].includes(r.status),
  );
  const eligible =
    Number(asset.data.ageYears) >= 3 &&
    Number(asset.data.failures) >= 2 &&
    asset.status !== "Replacement ordered";
  return { asset, incidents, eligible, policy: getRecord(u, "policy-it") };
}
export function snapshot(u: Employee): Snapshot {
  const docs = documents(u);
  const visibleRecords = records(u);
  const visibleIds = new Set([
    ...visibleRecords.map((r) => r.id),
    ...(db().prepare("SELECT id FROM employees").all() as { id: string }[]).map(
      (r) => r.id,
    ),
    "management",
    "engineering",
    "product",
    "design",
    "quality",
    "operations",
    "people",
    "finance",
  ]);
  const approvals = (
    db()
      .prepare("SELECT * FROM approvals ORDER BY created DESC")
      .all() as unknown as Approval[]
  )
    .filter(
      (a) =>
        a.requester === u.id ||
        (a.reviewerId
          ? a.reviewerId === u.id || u.role === "admin"
          : [a.reviewerRole, "admin"].includes(u.role)),
    )
    .filter((a) => docs.some((d) => d.id === a.documentId));
  for (const approval of approvals) visibleIds.add(approval.id);
  const chats = (
    db()
      .prepare("SELECT * FROM chats WHERE owner=? ORDER BY rowid DESC")
      .all(u.id) as unknown as Chat[]
  ).map((c) => ({
    ...c,
    messages: db()
      .prepare("SELECT * FROM messages WHERE chatId=? ORDER BY rowid")
      .all(c.id) as unknown as Chat["messages"],
  }));
  return {
    user: u,
    users: (
      db().prepare("SELECT * FROM employees").all() as unknown as Employee[]
    ).map((r) => ({
      ...r,
      leaveBalance:
        r.id === u.id || ["admin", "hr_manager"].includes(u.role)
          ? r.leaveBalance
          : 0,
    })) as unknown as Employee[],
    records: visibleRecords,
    relationships: (
      db()
        .prepare("SELECT id,fromId,relation,toId FROM relationships")
        .all() as Snapshot["relationships"]
    )?.filter((r) => visibleIds.has(r.fromId) && visibleIds.has(r.toId)),
    documents: docs,
    approvals,
    workflows: (
      db()
        .prepare("SELECT * FROM workflows WHERE owner=? ORDER BY rowid DESC")
        .all(u.id) as Record<string, unknown>[]
    ).map((r) => ({
      ...r,
      events: JSON.parse(r.events as string),
      sources: JSON.parse(r.sources as string).filter((s: RecordItem) =>
        canRead(u, s),
      ),
    })) as Workflow[],
    chats,
    receipts: (
      db()
        .prepare("SELECT * FROM receipts ORDER BY rowid DESC")
        .all() as unknown as Receipt[]
    ).filter((r) => approvals.some((a) => a.id === r.approvalId)),
    notifications: db()
      .prepare(
        "SELECT id,text,read,created FROM notifications WHERE userId=? ORDER BY rowid DESC",
      )
      .all(u.id) as unknown as Snapshot["notifications"],
    audit: db()
      .prepare(
        u.role === "admin"
          ? "SELECT * FROM audit ORDER BY rowid DESC LIMIT 200"
          : "SELECT * FROM audit WHERE actor=? ORDER BY rowid DESC LIMIT 100",
      )
      .all(
        ...(u.role === "admin" ? [] : [u.id]),
      ) as unknown as Snapshot["audit"],
    settings: JSON.parse(
      (
        db().prepare("SELECT payload FROM settings WHERE id=1").get() as {
          payload: string;
        }
      ).payload,
    ),
    mode: process.env.GEMINI_API_KEY ? "LIVE GEMINI" : "OFFLINE LOCAL MODE",
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    searchHistory: (
      db()
        .prepare(
          "SELECT query FROM search_history WHERE userId=? GROUP BY query ORDER BY MAX(created) DESC LIMIT 6",
        )
        .all(u.id) as { query: string }[]
    ).map((r) => r.query),
  };
}
export function createProject(u: Employee, input: unknown) {
  const v = z
    .object({
      title: text.max(200),
      body: text.max(5000),
      members: z.array(z.string()).min(1).max(30),
    })
    .parse(input);
  v.members.forEach(employee);
  return atomic(() => {
    const id = uid();
    insertRecord({
      id,
      type: "Projects",
      title: v.title,
      body: v.body,
      department: u.department,
      owner: u.id,
      status: "Active",
      updated: timestamp(),
      data: { members: [...new Set([u.id, ...v.members])] },
    });
    for (const member of new Set([u.id, ...v.members]))
      db()
        .prepare("INSERT INTO relationships VALUES(?,?,?,?)")
        .run(uid(), member, "ASSIGNED_TO", id);
    log(u.id, "Project created", id);
    return id;
  });
}
export function updateTask(u: Employee, input: unknown) {
  const v = z
    .object({
      id: text,
      status: z.enum([
        "Open",
        "In progress",
        "Done",
        "To Do",
        "In Progress",
        "Review",
        "Blocked",
        "Cancelled",
      ]),
    })
    .parse(input);
  return atomic(() => {
    const t = getRecord(u, v.id);
    if (t.type !== "Tasks" || (t.owner !== u.id && u.role !== "admin"))
      throw new WorkspaceError("Only the owner can update this task", 403);
    const current =
      t.status.toLowerCase() === "open"
        ? "To Do"
        : t.status.toLowerCase() === "in progress"
          ? "In Progress"
          : t.status;
    if (["Done", "Cancelled"].includes(current) && current !== v.status)
      throw new WorkspaceError(
        "A completed or cancelled task cannot be reopened. Create a follow-up task instead.",
        409,
      );
    if (
      v.status === "Done" &&
      ((t.data.dependsOn as string[]) || []).some(
        (id) => getRecord(u, id).status !== "Done",
      )
    )
      throw new WorkspaceError("Complete task dependencies first", 409);
    db()
      .prepare("UPDATE records SET status=?,updated=? WHERE id=?")
      .run(v.status, timestamp(), t.id);
    log(u.id, "Task status updated", t.id + ": " + v.status);
    const reporter = t.data.reporter;
    if (typeof reporter === "string" && reporter !== u.id)
      notify(reporter, `${t.title}: status changed to ${v.status}`);
  });
}
export function updateITRecord(u: Employee, input: unknown) {
  const v = z
    .object({
      id: text,
      status: z
        .enum([
          "Open",
          "In progress",
          "Investigating",
          "Pending review",
          "Resolved",
          "Closed",
        ])
        .optional(),
      owner: z.string().optional(),
    })
    .refine((value) => value.status || value.owner, "Choose a status or owner")
    .parse(input);
  return atomic(() => {
    const incident = getRecord(u, v.id);
    if (incident.type !== "IT" || incident.data.category !== "Incident")
      throw new WorkspaceError("Incident not found", 404);
    const manager = ["admin", "it_manager"].includes(u.role);
    if (!manager && incident.owner !== u.id)
      throw new WorkspaceError(
        "Only the assigned employee or an IT manager can update this incident",
        403,
      );
    if (!manager && v.owner)
      throw new WorkspaceError(
        "Only an IT manager can reassign an incident",
        403,
      );
    if (
      v.status &&
      ((incident.status === "Closed" && v.status !== "Closed") ||
        (incident.status === "Resolved" &&
          !["Resolved", "Closed"].includes(v.status)))
    )
      throw new WorkspaceError(
        "Resolved incidents can only be closed; closed incidents cannot be reopened here",
        409,
      );
    if (v.status === "Closed" && !manager)
      throw new WorkspaceError("Only an IT manager can close an incident", 403);
    const owner = v.owner ? employee(v.owner) : employee(incident.owner);
    if (
      owner.department !== "IT" &&
      owner.department !== "Engineering" &&
      !["admin", "it_manager"].includes(owner.role)
    )
      throw new WorkspaceError(
        "Assign incidents to IT or Engineering staff",
        400,
      );
    const status = v.status || incident.status;
    db()
      .prepare("UPDATE records SET owner=?,status=?,updated=? WHERE id=?")
      .run(owner.id, status, timestamp(), incident.id);
    log(
      u.id,
      "IT incident updated",
      `${incident.id}: ${status}; owner ${owner.id}`,
    );
    if (owner.id !== incident.owner)
      notify(owner.id, `Incident assigned to you: ${incident.title}`);
    return { id: incident.id, status, owner: owner.id };
  });
}
export function createITIncident(u: Employee, input: unknown) {
  const v = z
    .object({
      title: text.max(200),
      body: text.max(5000),
      severity: z.enum(["Low", "Medium", "High", "Critical"]),
      assetId: z.string().max(100).default(""),
    })
    .parse(input);
  return atomic(() => {
    let asset: RecordItem | undefined;
    if (v.assetId) {
      asset = getRecord(u, v.assetId);
      if (asset.type !== "IT" || asset.data.category !== "Asset")
        throw new WorkspaceError("Select a saved IT asset", 400);
    }
    const existing = db()
      .prepare("SELECT data FROM records WHERE type='IT'")
      .all() as { data: string }[];
    const incidentNumbers = existing
      .map((row) =>
        String(
          (JSON.parse(row.data) as Record<string, unknown>).incidentId || "",
        ),
      )
      .map((id) => Number(id.match(/^INC-(\d+)$/i)?.[1] || 0));
    const incidentId = `INC-${String(Math.max(0, ...incidentNumbers) + 1).padStart(3, "0")}`;
    const incident: RecordItem = {
      id: uid(),
      type: "IT",
      title: `${incidentId} · ${v.title}`,
      body: v.body,
      department: "IT",
      owner: u.id,
      project: asset?.project,
      status: "Open",
      updated: timestamp(),
      data: {
        category: "Incident",
        incidentId,
        severity: v.severity,
        ...(asset ? { assetId: asset.id } : {}),
        source: "Singularity IT incident report",
      },
    };
    insertRecord(incident);
    const managers = db()
      .prepare("SELECT id FROM employees WHERE role IN ('admin','it_manager')")
      .all() as { id: string }[];
    for (const manager of managers)
      notify(manager.id, `New IT incident ${incidentId}: ${v.title}`);
    log(
      u.id,
      "IT incident reported",
      `${incidentId}: ${v.title}; severity ${v.severity}`,
    );
    return incident;
  });
}
