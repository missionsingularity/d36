"use client";
import { useState, type ReactNode } from "react";
import {
  Search,
  FileText,
  ShieldCheck,
  Monitor,
  CheckCircle2,
  ChevronRight,
  Folder,
} from "lucide-react";
import type { Snapshot, RecordItem } from "@/lib/enterprise/types";

export default function WorkspaceHome({
  data,
  composer,
  go,
  send,
  openRecord,
}: {
  data: Snapshot;
  composer: ReactNode;
  go: (path: string) => void;
  send: (prompt: string) => void;
  openRecord: (record: RecordItem) => void;
}) {
  const [tab, setTab] = useState("For you");
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
  const documents = data.records.filter((r) => r.type === "Documents");
  const projects = new Set(
    data.records
      .filter(
        (r) =>
          r.type === "Projects" &&
          (r.data.members as string[] | undefined)?.includes(data.user.id),
      )
      .map((r) => r.id),
  );
  const relevance = (r: RecordItem) =>
    r.owner === data.user.id
      ? 3
      : r.project && projects.has(r.project)
        ? 2
        : r.department === "Company"
          ? 1
          : 0;
  const recommendedDocuments = [...documents].sort(
    (a, b) => relevance(b) - relevance(a) || b.updated.localeCompare(a.updated),
  );
  const tasks = data.records.filter(
    (r) =>
      r.type === "Tasks" && r.owner === data.user.id && r.status !== "Done",
  );
  const pending = data.approvals.filter((a) => a.status === "PENDING_APPROVAL");
  const shortDate = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });
  return (
    <div className="home-page assistant-home">
      <div className="home-intro">
        <p className="home-date">
          {new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "Asia/Kolkata",
          }).format(new Date())}
        </p>
        <h1>
          Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"},{" "}
          {data.user.name.split(" ")[0]}
        </h1>
        <p className="intro-subtitle">What would you like to accomplish?</p>
      </div>
      {composer}
      <div className="suggestions" aria-label="Suggested actions">
        {[
          {
            icon: Search,
            label: "Find project documents",
            description: "Get the context you need",
            prompt: "Find Project Alpha documents",
          },
          {
            icon: FileText,
            label: "Prepare my weekly report",
            description: "Turn progress into a first draft",
            prompt: "Prepare a Project Alpha progress report",
          },
          {
            icon: ShieldCheck,
            label: "Review pending approvals",
            description: "Keep decisions moving",
            path: "approvals",
          },
          {
            icon: Monitor,
            label: "Check unresolved incidents",
            description: "See what needs attention",
            prompt: "Find unresolved laptop incidents affecting Project Alpha",
          },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => (s.path ? go(s.path) : send(s.prompt!))}
          >
            <span className="suggestion-icon">
              <s.icon size={17} />
            </span>
            <span>
              <strong>{s.label}</strong>
              <small>{s.description}</small>
            </span>
          </button>
        ))}
      </div>
      <section className="home-feed" aria-label="Your workspace feed">
        <div className="feed-navigation">
          <div className="feed-tabs" role="tablist" aria-label="Workspace feed">
            {["For you", "Recent documents", "Your tasks"].map((t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? "active" : ""}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
                {t === "Your tasks" && tasks.length > 0 && (
                  <span>{tasks.length}</span>
                )}
              </button>
            ))}
          </div>
          <button
            className="feed-browse"
            onClick={() => go(tab === "Your tasks" ? "work" : "documents")}
          >
            {tab === "Your tasks" ? "View my work" : "Browse documents"}
            <ChevronRight size={15} />
          </button>
        </div>
        {tab === "For you" && (
          <div className="for-you-layout">
            <div>
              <div className="feed-section-title">
                <h3>Recommended for you</h3>
                <span>From your workspace</span>
              </div>
              {recommendedDocuments.slice(0, 3).map((r) => (
                <button
                  className="knowledge-row"
                  key={r.id}
                  onClick={() => openRecord(r)}
                >
                  <span className="knowledge-icon">
                    <FileText size={20} />
                  </span>
                  <span className="knowledge-content">
                    <strong>{r.title}</strong>
                    <span>
                      {data.users.find((u) => u.id === r.owner)?.name}{" "}
                      <span aria-hidden="true">·</span> {r.department}
                    </span>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
            <aside className="attention-list">
              <h3>On your radar</h3>
              {tasks.slice(0, 2).map((t) => (
                <button key={t.id} onClick={() => openRecord(t)}>
                  <CheckCircle2 size={17} />
                  <span>
                    <strong>{t.title}</strong>
                    <small>
                      {data.records.find((p) => p.id === t.project)?.title ||
                        "Assigned to you"}{" "}
                      · {t.status}
                    </small>
                  </span>
                </button>
              ))}
              {pending.length > 0 && (
                <button onClick={() => go("approvals")}>
                  <ShieldCheck size={17} />
                  <span>
                    <strong>
                      {pending.length} pending{" "}
                      {pending.length === 1 ? "approval" : "approvals"}
                    </strong>
                    <small>Ready for the next decision</small>
                  </span>
                </button>
              )}
              {tasks.length === 0 && pending.length === 0 && (
                <p className="radar-empty">
                  <CheckCircle2 size={18} />
                  You’re all caught up.
                  <span>New work and requests will appear here.</span>
                </p>
              )}
              <button
                className="project-shortcut"
                onClick={() => go("projects")}
              >
                <Folder size={17} />
                <span>
                  <strong>Your projects</strong>
                  <small>People, tasks, and shared context</small>
                </span>
                <ChevronRight size={14} />
              </button>
            </aside>
          </div>
        )}
        {tab === "Recent documents" && (
          <div className="feed-rows">
            {documents.slice(0, 6).map((r) => (
              <button
                className="knowledge-row"
                key={r.id}
                onClick={() => openRecord(r)}
              >
                <span className="knowledge-icon">
                  <FileText size={20} />
                </span>
                <span className="knowledge-content">
                  <strong>{r.title}</strong>
                  <span>
                    {r.department} ·{" "}
                    {data.users.find((u) => u.id === r.owner)?.name}
                  </span>
                </span>
                <small>{shortDate(r.updated)}</small>
                <ChevronRight size={15} />
              </button>
            ))}
            {documents.length === 0 && (
              <p className="feed-empty">Saved documents will appear here.</p>
            )}
          </div>
        )}
        {tab === "Your tasks" && (
          <div className="feed-rows">
            {tasks.map((r) => (
              <button
                className="knowledge-row"
                key={r.id}
                onClick={() => openRecord(r)}
              >
                <span className="knowledge-icon task-icon">
                  <CheckCircle2 size={20} />
                </span>
                <span className="knowledge-content">
                  <strong>{r.title}</strong>
                  <span>
                    {data.records.find((p) => p.id === r.project)?.title ||
                      "Workspace task"}{" "}
                    · {r.status}
                  </span>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
            {tasks.length === 0 && (
              <p className="feed-empty">
                You’re all caught up. New assigned tasks will appear here.
              </p>
            )}
          </div>
        )}
      </section>
      <p className="home-footnote">
        <ShieldCheck size={14} />
        Answers grounded in your workspace. Access stays with you.
      </p>
    </div>
  );
}
