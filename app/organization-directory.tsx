"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderKanban,
  Network,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type {
  Approval,
  Employee,
  RecordItem,
  Snapshot,
} from "@/lib/enterprise/types";

type Profile = Record<string, unknown>;
type Person = Employee & { profile: Profile };

export default function OrganizationDirectory({
  data,
  onOpenRecord,
  onOpenApprovals,
  onRequestLeave,
  onNavigateRecord,
}: {
  data: Snapshot;
  onOpenRecord: (record: RecordItem) => void;
  onOpenApprovals: () => void;
  onRequestLeave: () => void;
  onNavigateRecord: (record: RecordItem) => void;
}) {
  const [tab, setTab] = useState("Directory");
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All teams");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [selectedId, setSelectedId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [ontologyType, setOntologyType] = useState("All types");
  const [collapsedPeople, setCollapsedPeople] = useState<Set<string>>(
    new Set(),
  );
  const [chartZoom, setChartZoom] = useState(1);
  const profiles = new Map(
    data.records
      .filter((record) => record.type === "People")
      .map((record) => [record.id, record.data as Profile]),
  );
  const people: Person[] = data.users.map((user) => ({
    ...user,
    profile: profiles.get(user.id) || {},
  }));
  const departments = [
    ...new Set(people.map((person) => person.department)),
  ].sort();
  const filtered = people.filter((person) => {
    const text =
      `${person.name} ${person.department} ${person.id} ${person.profile.jobTitle || ""} ${person.profile.employeeId || ""}`.toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (department === "All teams" || person.department === department)
    );
  });
  const selected = people.find((person) => person.id === selectedId);
  const teamRecords = data.records.filter((record) => record.type === "Teams");
  const teams = teamRecords.map((record) => ({
    record,
    members: people.filter((person) => person.department === record.title),
    lead: people.find((person) => person.id === record.data.teamLead),
  }));
  const recordsById = new Map(
    data.records.map((record) => [record.id, record]),
  );
  const titleFor = (id: string) =>
    recordsById.get(id)?.title ||
    people.find((person) => person.id === id)?.name ||
    id;
  const relations = (data.relationships || []).filter(
    (relation) =>
      (ontologyType === "All types" ||
        recordsById.get(relation.fromId)?.type === ontologyType ||
        recordsById.get(relation.toId)?.type === ontologyType) &&
      (!query ||
        `${titleFor(relation.fromId)} ${titleFor(relation.toId)} ${relation.relation}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const personRecords = (person: Person) => {
    const projects = data.records.filter(
      (record) =>
        record.type === "Projects" &&
        ((record.data.members as string[] | undefined) || []).includes(
          person.id,
        ),
    );
    const tasks = data.records.filter(
      (record) => record.type === "Tasks" && record.owner === person.id,
    );
    const documents = data.records.filter(
      (record) => record.type === "Documents" && record.owner === person.id,
    );
    return { projects, tasks, documents };
  };
  const approvals: Approval[] = data.approvals;
  const teamTasks = (team: string) =>
    data.records.filter(
      (record) =>
        record.type === "Tasks" &&
        record.department === team &&
        record.status !== "Done",
    ).length;
  const teamProjects = (members: Person[]) =>
    data.records.filter(
      (record) =>
        record.type === "Projects" &&
        record.status === "Active" &&
        members.some((person) =>
          ((record.data.members as string[]) || []).includes(person.id),
        ),
    ).length;
  const teamReviews = (members: Person[]) =>
    approvals.filter(
      (approval) =>
        approval.status === "PENDING_APPROVAL" &&
        members.some((person) => person.id === approval.requester),
    ).length;
  const reportCount = useMemo(
    () =>
      new Map(
        people.map((person) => [
          person.id,
          people.filter(
            (candidate) => candidate.profile.managerId === person.id,
          ).length,
        ]),
      ),
    [data.users.length, data.records.length],
  );
  const renderHierarchy = (
    person: Person,
    depth: number,
    path: Set<string> = new Set(),
  ): ReactNode => {
    if (path.has(person.id)) return null;
    const nextPath = new Set(path).add(person.id);
    const reports = filtered.filter(
      (candidate) => candidate.profile.managerId === person.id,
    );
    const manager = people.find(
      (candidate) => candidate.id === person.profile.managerId,
    );
    const collapsed = collapsedPeople.has(person.id);
    return (
      <div className="org-tree-node" key={person.id}>
        <div className="org-hierarchy-row">
          <button
            className="org-tree-toggle"
            aria-label={`${collapsed ? "Expand" : "Collapse"} reports for ${person.name}`}
            aria-expanded={!collapsed}
            disabled={!reports.length}
            onClick={() =>
              setCollapsedPeople((previous) => {
                const next = new Set(previous);
                if (next.has(person.id)) next.delete(person.id);
                else next.add(person.id);
                return next;
              })
            }
          >
            {reports.length ? (
              collapsed ? (
                <ChevronRight size={15} />
              ) : (
                <ChevronDown size={15} />
              )
            ) : (
              <span>·</span>
            )}
          </button>
          <button
            className="org-tree-person"
            onClick={() => setSelectedId(person.id)}
          >
            <span className="avatar">
              {person.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span className="directory-person-copy">
              <strong>{person.name}</strong>
              <small>
                {String(person.profile.jobTitle || "Team member")} ·{" "}
                {person.department}
              </small>
            </span>
          </button>
          <span className="org-tree-manager">
            {manager ? `Reports to ${manager.name}` : "Organisation lead"}
            {reportCount.get(person.id) ? ` · ${reportCount.get(person.id)} direct reports` : ""}
          </span>
        </div>
        {!collapsed &&
          reports.length > 0 && (
            <div className="org-chart-children">
              {reports.map((report) => renderHierarchy(report, depth + 1, nextPath))}
            </div>
          )}
      </div>
    );
  };
  const openEntity = (id: string) => {
    const record = recordsById.get(id);
    if (!record) return;
    if (record.type === "People") setSelectedId(record.id);
    else if (record.type === "Teams") {
      setTab("Teams");
      setTeamId(record.id);
    } else if (
      record.type === "Projects" ||
      (record.type === "Documents" && record.data.documentId)
    ) {
      onNavigateRecord(record);
    } else onOpenRecord(record);
  };
  return (
    <div className="standard-page org-page">
      <div className="section-heading">
        <div>
          <h1>People</h1>
          <p className="muted">
            Find people, teams, reporting lines and workspace access.
          </p>
        </div>
        <div className="org-header-actions">
          <span className="org-sample-label">Workspace directory</span>
          <button className="text-button" onClick={onRequestLeave}>
            Request leave · {data.user.leaveBalance} days available
          </button>
        </div>
      </div>
      <nav className="org-tabs" aria-label="People workspace">
        {[
          "Directory",
          "Teams",
          "Organisation",
          "Ontology",
          "Access",
          "Reviews",
        ].map((item) => (
          <button
            key={item}
            className={tab === item ? "active" : ""}
            onClick={() => {
              setTab(item);
              setSelectedId("");
              setTeamId("");
            }}
          >
            {item}
          </button>
        ))}
      </nav>
      {["Directory", "Teams", "Organisation", "Ontology", "Access"].includes(
        tab,
      ) && (
        <div className="org-controls">
          <label className="org-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, role, team or ID"
              aria-label="Search people and relationships"
            />
          </label>
          {(tab === "Directory" || tab === "Organisation") && (
            <select
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              aria-label="Filter by team"
            >
              <option>All teams</option>
              {departments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          )}
          {tab === "Ontology" && (
            <select
              value={ontologyType}
              onChange={(event) => setOntologyType(event.target.value)}
              aria-label="Filter by object type"
            >
              {[
                "All types",
                "People",
                "Teams",
                "Projects",
                "Tasks",
                "Documents",
                "IT",
              ].map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          )}
          {tab === "Directory" && (
            <button
              className="org-toggle"
              onClick={() => setLayout(layout === "list" ? "grid" : "list")}
            >
              {layout === "list" ? "Grid view" : "List view"}
            </button>
          )}
        </div>
      )}

      {tab === "Directory" && (
        <>
          <p className="org-result-count">
            {filtered.length} people · {teams.length} teams
          </p>
          <div
            className={
              "directory-people " + (layout === "grid" ? "grid" : "list")
            }
          >
            {filtered.map((person) => (
              <button
                className="directory-person"
                key={person.id}
                onClick={() => setSelectedId(person.id)}
              >
                <span className="avatar">
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="directory-person-copy">
                  <strong>{person.name}</strong>
                  <small>
                    {String(
                      person.profile.jobTitle ||
                        person.role.replaceAll("_", " "),
                    )}{" "}
                    · {person.department}
                  </small>
                </span>
                <span className="directory-person-id">
                  {String(person.profile.employeeId || person.id)}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <p className="org-empty">No people match this search.</p>
            )}
          </div>
        </>
      )}

      {tab === "Teams" && !teamId && (
        <div className="org-team-list">
          {teams.map(({ record, members, lead }) => (
            <button
              key={record.id}
              className="org-team-row"
              onClick={() => setTeamId(record.id)}
            >
              <span className="org-icon">
                <Users size={19} />
              </span>
              <span className="org-team-copy">
                <strong>{record.title}</strong>
                <small>
                  {lead?.name || "Team lead not set"} · {members.length} members
                  · {teamProjects(members)} active projects ·{" "}
                  {teamReviews(members)} reviews
                </small>
              </span>
              <span>{teamTasks(record.title)} open tasks</span>
              <span>View team →</span>
            </button>
          ))}
        </div>
      )}

      {tab === "Teams" &&
        !!teamId &&
        (() => {
          const team = teams.find((item) => item.record.id === teamId);
          if (!team) return null;
          return (
            <section className="org-team-detail">
              <button className="text-button" onClick={() => setTeamId("")}>
                All teams
              </button>
              <h2>{team.record.title}</h2>
              <p className="muted">{team.record.body}</p>
              <p>
                <strong>Team lead:</strong> {team.lead?.name || "Not assigned"}{" "}
                · <strong>{team.members.length}</strong> members ·{" "}
                <strong>{teamProjects(team.members)}</strong> active projects ·{" "}
                <strong>{teamTasks(team.record.title)}</strong> open tasks ·{" "}
                <strong>{teamReviews(team.members)}</strong> pending reviews
              </p>
              {team.members.map((person) => (
                <button
                  className="directory-person"
                  key={person.id}
                  onClick={() => setSelectedId(person.id)}
                >
                  <span className="avatar">
                    {person.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span className="directory-person-copy">
                    <strong>{person.name}</strong>
                    <small>
                      {String(person.profile.jobTitle || "Team member")}
                    </small>
                  </span>
                  <span>
                    {person.id === team.lead?.id ? "Team lead" : "Member"}
                  </span>
                </button>
              ))}
            </section>
          );
        })()}

      {tab === "Organisation" && (
        <section className="org-hierarchy">
          <div className="section-heading">
            <div>
              <h2>Organisation chart</h2>
              <p className="muted">Reporting lines from saved workspace profiles.</p>
            </div>
            <div className="org-chart-controls">
              <button onClick={() => setChartZoom((z) => Math.max(0.65, +(z - 0.1).toFixed(2)))} aria-label="Zoom out">−</button>
              <span>{Math.round(chartZoom * 100)}%</span>
              <button onClick={() => setChartZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))} aria-label="Zoom in">+</button>
              <button onClick={() => { setChartZoom(1); setCollapsedPeople(new Set()); }}>Fit / expand</button>
              <button onClick={() => setCollapsedPeople(new Set(filtered.map((p) => p.id)))}>Collapse all</button>
            </div>
          </div>
          <div className="org-chart-viewport">
            <div className="org-chart-canvas" style={{ transform: `scale(${chartZoom})`, transformOrigin: "top left" }}>
              {filtered
                .filter((person) => !person.profile.managerId || !filtered.some((candidate) => candidate.id === person.profile.managerId))
                .map((person) => renderHierarchy(person, 0))}
            </div>
          </div>
        </section>
      )}

      {tab === "Ontology" && (
        <section className="org-ontology">
          <div className="section-heading">
            <div>
              <h2>Workspace relationships</h2>
              <p className="muted">
                Links below come from saved people, project, task and document
                records.
              </p>
            </div>
            <Network size={20} />
          </div>
          {relations.map((relation) => (
            <div className="org-relation" key={relation.id}>
              <button onClick={() => openEntity(relation.fromId)}>
                {titleFor(relation.fromId)}
              </button>
              <span>
                {relation.relation.replaceAll("_", " ").toLowerCase()}
              </span>
              <button onClick={() => openEntity(relation.toId)}>
                {titleFor(relation.toId)}
              </button>
            </div>
          ))}
          {!relations.length && (
            <p className="org-empty">
              No saved relationships match this search.
            </p>
          )}
        </section>
      )}

      {tab === "Access" && (
        <section className="org-access">
          <div className="inline-note">
            <ShieldCheck size={18} />
            <span>
              Access shown here is based on the workspace role, team and project
              membership saved for each person.
            </span>
          </div>
          <div className="org-access-table">
            <div className="org-access-head">
              <span>Person</span>
              <span>Workspace role</span>
              <span>Team</span>
              <span>Project membership</span>
              <span>Approval work</span>
            </div>
            {filtered.map((person) => {
              const projects = personRecords(person).projects;
              return (
                <button
                  className="org-access-row"
                  key={person.id}
                  onClick={() => setSelectedId(person.id)}
                >
                  <span>{person.name}</span>
                  <span>{person.role.replaceAll("_", " ")}</span>
                  <span>{person.department}</span>
                  <span>
                    {projects.map((project) => project.title).join(", ") ||
                      "None"}
                  </span>
                  <span>
                    {(
                      person.profile.approvalResponsibilities as
                        string[] | undefined
                    )?.join(", ") || "Not listed"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="muted">
            Workspace access follows saved roles, teams and project membership.
          </p>
        </section>
      )}

      {tab === "Reviews" && (
        <section className="org-approvals">
          <div className="section-heading">
            <h2>Approval records you can access</h2>
            <button className="text-button" onClick={onOpenApprovals}>
              Open approvals
            </button>
          </div>
          {approvals.map((approval) => {
            const doc = data.documents.find(
              (item) => item.id === approval.documentId,
            );
            const requester = people.find(
              (person) => person.id === approval.requester,
            );
            return (
              <button
                className="org-approval-row"
                key={approval.id}
                onClick={() =>
                  doc &&
                  onOpenRecord(
                    recordsById.get("doc-" + doc.id) || {
                      id: doc.id,
                      type: "Documents",
                      title: doc.title,
                      body: doc.versions.at(-1)?.content || "",
                      department: doc.department,
                      owner: doc.owner,
                      status: doc.status,
                      updated: doc.versions.at(-1)?.created || "",
                      data: { documentId: doc.id },
                    },
                  )
                }
              >
                <CheckCircle2 size={18} />
                <span>
                  <strong>{doc?.title || "Document review"}</strong>
                  <small>
                    {requester?.name || approval.requester} ·{" "}
                    {approval.reviewerRole.replaceAll("_", " ")}
                  </small>
                </span>
                <span>
                  {approval.status.replaceAll("_", " ").toLowerCase()}
                </span>
              </button>
            );
          })}
        </section>
      )}

      {selected && (
        <div
          className="org-profile-backdrop"
          role="presentation"
          onClick={() => setSelectedId("")}
        >
          <aside
            className="org-profile"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} profile`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="org-profile-close"
              aria-label="Close profile"
              onClick={() => setSelectedId("")}
            >
              <X size={19} />
            </button>
            <span className="avatar org-profile-avatar">
              {selected.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <h2>{selected.name}</h2>
            <p>
              {String(
                selected.profile.jobTitle || selected.role.replaceAll("_", " "),
              )}
            </p>
            <dl>
              <dt>Team</dt>
              <dd>{selected.department}</dd>
              <dt>Employee ID</dt>
              <dd>{String(selected.profile.employeeId || selected.id)}</dd>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${selected.email}`}>{selected.email}</a>
              </dd>
              <dt>Phone</dt>
              <dd>{String(selected.profile.phone || "Not listed")}</dd>
              <dt>Manager</dt>
              <dd>
                {people.find(
                  (person) => person.id === selected.profile.managerId,
                )?.name || "Not listed"}
              </dd>
              <dt>Status</dt>
              <dd>{String(selected.profile.employmentStatus || "Active")}</dd>
              <dt>Approval work</dt>
              <dd>
                {(
                  selected.profile.approvalResponsibilities as
                    string[] | undefined
                )?.join(", ") || "Not listed"}
              </dd>
            </dl>
            {(() => {
              const linked = personRecords(selected);
              return (
                <>
                  <h3>Projects</h3>
                  {linked.projects.length ? (
                    linked.projects.map((record) => (
                      <button
                        className="org-linked-record"
                        key={record.id}
                        onClick={() => onOpenRecord(record)}
                      >
                        <FolderKanban size={16} />
                        {record.title}
                      </button>
                    ))
                  ) : (
                    <p className="muted">No project membership.</p>
                  )}
                  <h3>Tasks</h3>
                  {linked.tasks.length ? (
                    linked.tasks.map((record) => (
                      <button
                        className="org-linked-record"
                        key={record.id}
                        onClick={() => onOpenRecord(record)}
                      >
                        <CheckCircle2 size={16} />
                        {record.title}
                        <small>{record.status}</small>
                      </button>
                    ))
                  ) : (
                    <p className="muted">No assigned tasks.</p>
                  )}
                  <h3>Documents</h3>
                  {linked.documents.map((record) => (
                    <button
                      className="org-linked-record"
                      key={record.id}
                      onClick={() => onOpenRecord(record)}
                    >
                      <FileText size={16} />
                      {record.title}
                    </button>
                  ))}
                  <h3>Recent activity</h3>
                  {data.audit
                    .filter((event) => event.actor === selected.id)
                    .slice(0, 4)
                    .map((event) => (
                      <p className="org-profile-activity" key={event.id}>
                        {event.action} ·{" "}
                        {new Date(event.created).toLocaleDateString()}
                      </p>
                    ))}
                  <p className="muted">
                    {reportCount.get(selected.id) || 0} direct reports
                  </p>
                </>
              );
            })()}
          </aside>
        </div>
      )}
    </div>
  );
}
