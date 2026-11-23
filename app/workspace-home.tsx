"use client";
import type { ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  Folder,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import type { Snapshot, RecordItem } from "@/lib/enterprise/types";

export default function WorkspaceHome({
  data,
  composer,
  startConversation,
  onSearch,
  busy,
  compact = false,
}: {
  data: Snapshot;
  composer: ReactNode;
  startConversation: (prompt: string, work?: boolean) => void;
  onSearch: (value: string) => void;
  busy: boolean;
  compact?: boolean;
}) {
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
        (record) =>
          record.type === "Projects" &&
          (record.data.members as string[] | undefined)?.includes(data.user.id),
      )
      .map((record) => record.id),
  );
  const score = (record: RecordItem) =>
    record.owner === data.user.id
      ? 3
      : record.project && projects.has(record.project)
        ? 2
        : record.department === "Company"
          ? 1
          : 0;
  const documents = data.records
    .filter((record) => record.type === "Documents")
    .sort((a, b) => score(b) - score(a) || b.updated.localeCompare(a.updated));
  const project = data.records.find(
    (record) =>
      record.type === "Projects" &&
      (record.data.members as string[] | undefined)?.includes(data.user.id),
  );
  const hasAssignedIncident = data.records.some(
    (record) =>
      record.type === "IT" &&
      record.data.category === "Incident" &&
      record.project === project?.id,
  );

  return (
    <div className={"enterprise-home " + (compact ? "new-conversation" : "")}>
      <section className="assistant-hero" aria-labelledby="assistant-question">
        <span className="assistant-emblem" aria-hidden="true">
          <img src="/brand/brahmagpt-lotus-white.svg" alt="" />
        </span>
        <h2 className="assistant-greeting">
          Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"},{" "}
          {data.user.name.split(" ")[0]}.
        </h2>
        {!compact && (
          <p className="evaluation-note">
            Here’s what’s happening at Singularity.
          </p>
        )}
        <h1 id="assistant-question">Start your day with BrahmaGpt</h1>
      </section>
      <div className="hub-composer">{composer}</div>
      <div className="hub-suggestions" aria-label="Suggested actions">
        <button
          disabled={busy}
          onClick={() =>
            startConversation(
              "Summarise my work today and show any tasks due soon.",
            )
          }
        >
          <BarChart3 size={17} />
          Summarise my work today
        </button>
        <button
          disabled={busy}
          onClick={() =>
            startConversation("Show my open tasks and their due dates.")
          }
        >
          <ClipboardList size={17} />
          Show my pending tasks
        </button>
        <button
          disabled={busy}
          onClick={() =>
            startConversation(
              "Show the approval requests waiting for my review.",
            )
          }
        >
          <ShieldCheck size={17} />
          Review pending approvals
        </button>
        <button
          disabled={busy}
          onClick={() =>
            startConversation(
              `Prepare a status report for ${project?.title || "my project"}.`,
            )
          }
        >
          <Folder size={17} />
          Prepare a status report
        </button>
        <button
          disabled={busy}
          onClick={() =>
            startConversation(
              hasAssignedIncident && project
                ? `Find incidents for ${project.title}.`
                : "Find open incidents assigned to my team.",
            )
          }
        >
          <Monitor size={17} />
          Check unresolved incidents
        </button>
      </div>
    </div>
  );
}
