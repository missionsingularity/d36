"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  List,
  Network,
  Users,
} from "lucide-react";
import type { RecordItem, Snapshot } from "@/lib/enterprise/types";

const taskStatuses = [
  "To Do",
  "In Progress",
  "Review",
  "Blocked",
  "Done",
  "Cancelled",
];
const normalized = (status: string) =>
  status.toLowerCase() === "open"
    ? "To Do"
    : status.toLowerCase() === "in progress"
      ? "In Progress"
      : status;

export default function ProjectWorkspace({
  project,
  data,
  busy,
  onTask,
  onEditTask,
  onOpenRecord,
  onBack,
}: {
  project: RecordItem;
  data: Snapshot;
  busy: boolean;
  onTask: (id: string, status: string) => void;
  onEditTask: (id: string, fields: Record<string, string>) => void;
  onOpenRecord: (record: RecordItem) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [view, setView] = useState<"Board" | "List">("Board");
  const [editingTask, setEditingTask] = useState<RecordItem>();
  const records = data.records;
  const tasks = records.filter(
    (record) => record.type === "Tasks" && record.project === project.id,
  );
  const done = tasks.filter((task) => task.status === "Done").length;
  const people = data.users.filter((person) =>
    ((project.data.members as string[]) || []).includes(person.id),
  );
  const documents = records.filter(
    (record) => record.type === "Documents" && record.project === project.id,
  );
  const projectApprovals = data.approvals.filter((approval) => {
    const document = data.documents.find(
      (item) => item.id === approval.documentId,
    );
    const linkedRecord = records.find(
      (record) => record.data.documentId === approval.documentId,
    );
    return (
      document?.target === project.id ||
      document?.target === project.title ||
      linkedRecord?.project === project.id
    );
  });
  const incidents = records.filter(
    (record) =>
      record.type === "IT" &&
      record.project === project.id &&
      record.data.category === "Incident",
  );
  const memberships = (data.relationships || []).filter(
    (relation) =>
      relation.fromId === project.id || relation.toId === project.id,
  );
  const audit = data.audit.filter(
    (event) =>
      event.detail.includes(project.id) ||
      tasks.some((task) => event.detail.includes(task.id)),
  );
  const taskByStatus = useMemo(
    () =>
      new Map(
        taskStatuses.map((status) => [
          status,
          tasks.filter((task) => normalized(task.status) === status),
        ]),
      ),
    [tasks],
  );
  const canUpdate = (task: RecordItem) =>
    task.owner === data.user.id || canEditTask(task);
  const canEditTask = (task: RecordItem) =>
    data.user.role === "admin" || project.owner === data.user.id || (data.relationships || []).some((r) => r.fromId === project.owner && r.toId === data.user.id && r.relation === "REPORTS_TO");
  const taskRow = (task: RecordItem) => (
    <article className="project-task-card" key={task.id}>
      <div className="project-task-top">
        <strong>{task.title}</strong>
        <span
          className={`project-priority priority-${String(task.data.priority || "medium").toLowerCase()}`}
        >
          {String(task.data.priority || "Normal")}
        </span>
      </div>
      <p>{task.body}</p>
      <div className="project-task-meta">
        <span>{task.id}</span>
        <span>
          {data.users.find((person) => person.id === task.owner)?.name ||
            task.owner}
        </span>
        {typeof task.data.due === "string" && <span>Due {task.data.due}</span>}
      </div>
      {Array.isArray(task.data.dependsOn) && task.data.dependsOn.length > 0 && (
        <small className="project-task-dependency">
          Blocked by{" "}
          {task.data.dependsOn
            .map(
              (id) => records.find((record) => record.id === id)?.title || id,
            )
            .join(", ")}
        </small>
      )}
      {canUpdate(task) ? (
        <div className="project-task-actions">
          <select
            aria-label={`Status for ${task.id}`}
            value={normalized(task.status)}
            disabled={busy}
            onChange={(event) => onTask(task.id, event.target.value)}
          >
            {taskStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          {canEditTask(task) && <button className="text-button" onClick={() => setEditingTask(task)}>Edit task</button>}
        </div>
      ) : (
        <span className="project-task-status">{normalized(task.status)}</span>
      )}
      {typeof task.data.documentId === "string" &&
        records.find((record) => record.id === task.data.documentId) && (
          <button
            className="text-button"
            onClick={() =>
              onOpenRecord(
                records.find((record) => record.id === task.data.documentId)!,
              )
            }
          >
            <FileText size={14} />
            Open linked document
          </button>
        )}
    </article>
  );

  return (
    <div className="standard-page project-page">
      <button className="text-button" onClick={onBack}>
        ← All projects
      </button>
      <div className="section-heading">
        <div>
          <h1>{project.title}</h1>
          <p className="muted">{project.body}</p>
        </div>
        <span className="status success">{project.status}</span>
      </div>
      <nav
        className="project-tabs"
        aria-label={`${project.title} project pages`}
      >
        {[
          "Overview",
          "Tasks",
          "Documents",
          "People",
          "Reviews",
          "Activity",
          "Ontology",
        ].map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      {tab === "Overview" && (
        <>
          <div className="project-overview-stats">
            <div>
              <CheckCircle2 size={18} />
              <strong>
                {done}/{tasks.length}
              </strong>
              <small>tasks done</small>
            </div>
            <div>
              <Users size={18} />
              <strong>{people.length}</strong>
              <small>team members</small>
            </div>
            <div>
              <AlertCircle size={18} />
              <strong>
                {
                  incidents.filter(
                    (incident) =>
                      !["Resolved", "Closed"].includes(incident.status),
                  ).length
                }
              </strong>
              <small>open incidents</small>
            </div>
            <div>
              <Clock3 size={18} />
              <strong>
                {
                  projectApprovals.filter(
                    (approval) => approval.status === "PENDING_APPROVAL",
                  ).length
                }
              </strong>
              <small>pending reviews</small>
            </div>
          </div>
          <div className="project-progress">
            <span>
              {done} of {tasks.length} tasks complete
            </span>
            <strong>
              {tasks.length ? Math.round((done / tasks.length) * 100) : 0}%
            </strong>
            <progress value={done} max={tasks.length || 1} />
          </div>
          <section className="project-overview-columns">
            <div>
              <h2>Project team</h2>
              {people.slice(0, 6).map((person) => (
                <button className="project-person-row" key={person.id}>
                  <span className="avatar">
                    {person.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>
                    <strong>{person.name}</strong>
                    <small>{person.department}</small>
                  </span>
                </button>
              ))}
              <button className="text-button" onClick={() => setTab("People")}>
                See all {people.length} members
              </button>
            </div>
            <div>
              <h2>Milestone</h2>
              <p>{String(project.data.milestone || "Project delivery")}</p>
              <p className="muted">
                Due {String(project.data.due || "Date not set")}
              </p>
              <h2>Open work</h2>
              {tasks
                .filter((task) => !["Done", "Cancelled"].includes(task.status))
                .slice(0, 4)
                .map((task) => (
                  <button
                    className="project-brief-row"
                    key={task.id}
                    onClick={() => setTab("Tasks")}
                  >
                    <span>{task.id}</span>
                    <strong>{task.title}</strong>
                  </button>
                ))}
            </div>
          </section>
          <section className="project-incidents">
            <h2>Open incidents</h2>
            {incidents
              .filter(
                (incident) => !["Resolved", "Closed"].includes(incident.status),
              )
              .map((incident) => (
                <button
                  className="project-brief-row"
                  key={incident.id}
                  onClick={() => onOpenRecord(incident)}
                >
                  <AlertCircle size={16} />
                  <strong>{incident.title}</strong>
                  <span>{String(incident.data.severity || "Open")}</span>
                </button>
              ))}
            {!incidents.length && (
              <p className="muted">No project incidents recorded.</p>
            )}
          </section>
        </>
      )}
      {tab === "Tasks" && (
        <section className="project-tasks">
          <div className="section-heading">
            <div>
              <h2>Project tasks</h2>
              <p className="muted">
                Status changes save to the workspace record.
              </p>
            </div>
            <button
              className="text-button"
              onClick={() => setView(view === "Board" ? "List" : "Board")}
            >
              <List size={16} />
              {view} view
            </button>
          </div>
          {view === "Board" ? (
            <div className="project-task-board">
              {taskStatuses.map((status) => (
                <section className="project-task-column" key={status}>
                  <h3>
                    {status}
                    <small>{taskByStatus.get(status)?.length || 0}</small>
                  </h3>
                  {(taskByStatus.get(status) || []).map(taskRow)}
                </section>
              ))}
            </div>
          ) : (
            <div className="project-task-list">{tasks.map(taskRow)}</div>
          )}
          {editingTask && (
            <form className="task-edit-panel" onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              onEditTask(editingTask.id, {
                title: String(form.get("title") || ""),
                body: String(form.get("body") || ""),
                owner: String(form.get("owner") || ""),
                priority: String(form.get("priority") || "Normal"),
                due: String(form.get("due") || ""),
                expectedUpdated: editingTask.updated,
              });
              setEditingTask(undefined);
            }}>
              <h3>Edit task</h3>
              <label>Task name<input name="title" defaultValue={editingTask.title} required maxLength={180} /></label>
              <label>Details<textarea name="body" defaultValue={editingTask.body} maxLength={12000} /></label>
              <label>Assigned to<select name="owner" defaultValue={editingTask.owner}>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
              <label>Priority<select name="priority" defaultValue={String(editingTask.data.priority || "Normal")}>{["Low", "Normal", "Medium", "High", "Urgent"].map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              <label>Due date<input name="due" type="date" defaultValue={String(editingTask.data.due || "")} /></label>
              <div><button type="button" className="secondary-button" onClick={() => setEditingTask(undefined)}>Cancel</button><button className="primary" disabled={busy}>Save task</button></div>
            </form>
          )}
        </section>
      )}
      {tab === "Documents" && (
        <section className="project-linked-list">
          <h2>Project documents</h2>
          {documents.map((record) => (
            <button
              className="project-brief-row"
              key={record.id}
              onClick={() => onOpenRecord(record)}
            >
              <FileText size={16} />
              <strong>{record.title}</strong>
              <span>{record.status}</span>
            </button>
          ))}
          {!documents.length && (
            <p className="muted">
              No documents are linked to this project yet.
            </p>
          )}
        </section>
      )}
      {tab === "People" && (
        <section className="project-linked-list">
          <h2>People on {project.title}</h2>
          {people.map((person) => (
            <div className="project-person-row" key={person.id}>
              <span className="avatar">
                {person.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span>
                <strong>{person.name}</strong>
                <small>
                  {person.department} ·{" "}
                  {tasks.filter((task) => task.owner === person.id).length}{" "}
                  tasks
                </small>
              </span>
              <span>{person.role.replaceAll("_", " ")}</span>
            </div>
          ))}
        </section>
      )}
      {tab === "Reviews" && (
        <section className="project-linked-list">
          <h2>Project approvals</h2>
          {projectApprovals.map((approval) => {
            const doc = data.documents.find(
              (item) => item.id === approval.documentId,
            );
            return (
              <div className="project-brief-row" key={approval.id}>
                <CheckCircle2 size={16} />
                <strong>{doc?.title || "Document review"}</strong>
                <span>
                  {approval.status.replaceAll("_", " ").toLowerCase()}
                </span>
              </div>
            );
          })}
          {!projectApprovals.length && (
            <p className="muted">
              No approvals are linked to this project yet.
            </p>
          )}
        </section>
      )}
      {tab === "Activity" && (
        <section className="project-linked-list">
          <h2>Recent project activity</h2>
          {audit.slice(0, 30).map((event) => (
            <div className="project-brief-row" key={event.id}>
              <Clock3 size={16} />
              <strong>{event.action}</strong>
              <span>
                {event.detail} · {new Date(event.created).toLocaleDateString()}
              </span>
            </div>
          ))}
          {!audit.length && (
            <p className="muted">No project activity is recorded yet.</p>
          )}
        </section>
      )}
      {tab === "Ontology" && (
        <section className="project-linked-list">
          <div className="section-heading">
            <h2>Linked records</h2>
            <Network size={18} />
          </div>
          {memberships.map((relation) => (
            <div className="project-brief-row" key={relation.id}>
              <span>
                {relation.fromId === project.id
                  ? relation.toId
                  : relation.fromId}
              </span>
              <strong>
                {relation.relation.replaceAll("_", " ").toLowerCase()}
              </strong>
              <span>
                {relation.fromId === project.id ? project.title : project.title}
              </span>
            </div>
          ))}
          {!memberships.length && (
            <p className="muted">No project relationships are saved yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
