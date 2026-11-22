"use client";
import { useState, type ReactNode } from "react";
import {
  Search,
  FileText,
  ShieldCheck,
  Monitor,
  CheckCircle2,
  ChevronRight,
  CalendarDays,
  Megaphone,
  X,
  BookOpen,
  ListTodo,
} from "lucide-react";
import type { Snapshot, RecordItem } from "@/lib/enterprise/types";
import WorkAgents, { type WorkAgent } from "./work-agents";

export default function WorkspaceHome({
  data,
  composer,
  go,
  startConversation,
  openRecord,
  onSearch,
  onAgent,
  onTaskToggle,
  heroMark,
  busy,
  compact = false,
}: {
  data: Snapshot;
  composer: ReactNode;
  go: (path: string) => void;
  startConversation: (prompt: string, work?: boolean) => void;
  openRecord: (record: RecordItem) => void;
  onSearch: (value: string) => void;
  onAgent: (agent: WorkAgent) => void;
  onTaskToggle: (record: RecordItem) => void;
  heroMark: ReactNode;
  busy: boolean;
  compact?: boolean;
}) {
  const [showPolicy, setShowPolicy] = useState(true);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
  const projects = new Set(
    data.records
      .filter(
        (r) =>
          r.type === "Projects" &&
          (r.data.members as string[] | undefined)?.includes(data.user.id),
      )
      .map((r) => r.id),
  );
  const score = (r: RecordItem) =>
    r.owner === data.user.id
      ? 3
      : r.project && projects.has(r.project)
        ? 2
        : r.department === "Company"
          ? 1
          : 0;
  const documents = data.records
    .filter((r) => r.type === "Documents")
    .sort((a, b) => score(b) - score(a) || b.updated.localeCompare(a.updated));
  const tasks = data.records
    .filter((r) => r.type === "Tasks" && r.owner === data.user.id)
    .sort((a, b) => Number(a.status === "Done") - Number(b.status === "Done"));
  const approvals = data.approvals.filter(
    (a) => a.status === "PENDING_APPROVAL",
  );
  const policy =
    data.records.find((r) => r.id === "policy-it") ||
    documents.find((r) => r.data.policy);
  return (
    <div className={"enterprise-home " + (compact ? "new-conversation" : "")}>
      <section className="assistant-hero" aria-labelledby="assistant-question">
        <div className="assistant-emblem">{heroMark}</div>
        <h2 className="assistant-greeting">
          Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"},{" "}
          {data.user.name.split(" ")[0]}.
        </h2>
        <p>
          Here’s what’s happening at{" "}
          {String(data.settings.workspace || "Singularity")}.
        </p>
        <h1 id="assistant-question">What can I help you accomplish?</h1>
      </section>
      <div className="hub-composer">{composer}</div>
      <div className="hub-suggestions" aria-label="Suggested actions">
        {[
          {
            label: "Find project documents",
            icon: Search,
            action: () => onSearch("Project Alpha"),
          },
          {
            label: "Check unresolved incidents",
            icon: Monitor,
            action: () =>
              startConversation(
                "Find unresolved IT incidents affecting Project Alpha.",
              ),
          },
          {
            label: "Prepare approval requests",
            icon: ShieldCheck,
            action: () => onAgent("it"),
          },
          {
            label: "Create a project update",
            icon: FileText,
            action: () => onAgent("project"),
          },
          {
            label: "Review leave requests",
            icon: CalendarDays,
            action: () => go("hr"),
          },
        ].map((s) => (
          <button key={s.label} disabled={busy} onClick={s.action}>
            <s.icon size={17} />
            {s.label}
          </button>
        ))}
      </div>
      {!compact && (
        <>
          {showPolicy && policy && (
            <div className="company-spotlight">
              <Megaphone size={21} />
              <strong>Policy spotlight</strong>
              <span>{policy.title}</span>
              <small>Available in your organization knowledge</small>
              <button onClick={() => openRecord(policy)}>View policy</button>
              <button
                className="dismiss-spotlight"
                aria-label="Dismiss policy spotlight"
                onClick={() => setShowPolicy(false)}
              >
                <X size={16} />
              </button>
            </div>
          )}
          <WorkAgents
            onSelect={onAgent}
            onExplore={() => go("work?view=agents")}
            busy={busy}
          />
          <div className="hub-personal-grid">
            <section className="personal-work">
              <div className="hub-section-heading">
                <h2>
                  <ListTodo size={20} />
                  My relevant tasks
                </h2>
                <button onClick={() => go("work")}>
                  View all tasks
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="hub-panel task-panel">
                {tasks.slice(0, 3).map((task) => {
                  const blocked =
                    task.status !== "Done" &&
                    ((task.data.dependsOn as string[]) || []).some(
                      (id) =>
                        data.records.find((r) => r.id === id)?.status !==
                        "Done",
                    );
                  return (
                    <div
                      className={
                        "hub-task-row " +
                        (task.status === "Done" ? "task-complete" : "")
                      }
                      key={task.id}
                    >
                      <input
                        type="checkbox"
                        aria-label={
                          "Mark " +
                          task.title +
                          (task.status === "Done" ? " open" : " complete")
                        }
                        checked={task.status === "Done"}
                        disabled={busy || blocked}
                        title={
                          blocked ? "Complete dependent tasks first" : undefined
                        }
                        onChange={() => onTaskToggle(task)}
                      />
                      <button onClick={() => openRecord(task)}>
                        <strong>{task.title}</strong>
                        <small>
                          {data.records.find((r) => r.id === task.project)
                            ?.title || task.department}
                          {blocked ? " · Waiting for a dependency" : ""}
                        </small>
                      </button>
                      <span className="task-department">
                        {task.department === "Engineering"
                          ? "Project"
                          : task.department}
                      </span>
                      <span className="task-state">{task.status}</span>
                    </div>
                  );
                })}
                {approvals.slice(0, Math.max(0, 3 - tasks.length)).map((a) => (
                  <div className="hub-task-row" key={a.id}>
                    <ShieldCheck size={17} />
                    <button onClick={() => go("approvals")}>
                      <strong>
                        {data.documents.find((d) => d.id === a.documentId)
                          ?.title || "Approval request"}
                      </strong>
                      <small>Exact version review requested</small>
                    </button>
                    <span className="task-department">Review</span>
                    <span className="task-state">Pending</span>
                  </div>
                ))}
                {tasks.length === 0 && approvals.length === 0 && (
                  <div className="hub-empty">
                    <CheckCircle2 size={22} />
                    <strong>You’re all caught up</strong>
                    <p>
                      Assigned tasks and approval requests will appear here.
                    </p>
                  </div>
                )}
                <div className="panel-footer">
                  <ShieldCheck size={13} />
                  Tasks and approvals from your connected workspace
                </div>
              </div>
            </section>
            <section className="organization-knowledge">
              <div className="hub-section-heading">
                <h2>
                  <BookOpen size={20} />
                  Organization knowledge
                </h2>
                <button onClick={() => go("documents")}>
                  View all
                  <ChevronRight size={15} />
                </button>
              </div>
              <div className="hub-panel knowledge-panel">
                {documents.slice(0, 3).map((r) => (
                  <button
                    className="hub-knowledge-row"
                    key={r.id}
                    onClick={() => openRecord(r)}
                  >
                    <span className="knowledge-icon">
                      <FileText size={20} />
                    </span>
                    <span>
                      <strong>{r.title}</strong>
                      <small>
                        {r.department} ·{" "}
                        {r.data.version
                          ? "Version " + r.data.version
                          : "Updated " +
                            new Date(r.updated).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "Asia/Kolkata",
                            })}
                      </small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
                {documents.length === 0 && (
                  <div className="hub-empty">
                    <BookOpen size={22} />
                    <strong>Your company knowledge, together</strong>
                    <p>Saved and imported documents will appear here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
