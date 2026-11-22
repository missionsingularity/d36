"use client";
import {
  Monitor,
  Layers3,
  Users,
  FileText,
  Play,
  ChevronRight,
} from "lucide-react";
export type WorkAgent = "it" | "project" | "hr" | "document";
export const agentStarters = {
  it: "Find unresolved laptop issues affecting Project Alpha, check the replacement policy, and prepare replacement requests for approval.",
  project:
    "Prepare a Project Alpha progress report from the saved tasks and project documents.",
};
export default function WorkAgents({
  onSelect,
  onExplore,
  busy = false,
}: {
  onSelect: (agent: WorkAgent) => void;
  onExplore?: () => void;
  busy?: boolean;
}) {
  return (
    <section className="featured-agents" aria-labelledby="agents-title">
      <div className="hub-section-heading">
        <h2 id="agents-title">Featured work agents</h2>
        {onExplore && (
          <button onClick={onExplore}>
            Explore agents
            <ChevronRight size={16} />
          </button>
        )}
      </div>
      <div className="agent-grid">
        {[
          {
            id: "it" as const,
            name: "IT Operations Agent",
            description: "Incidents, assets, and replacement requests",
            icon: Monitor,
          },
          {
            id: "project" as const,
            name: "Project Agent",
            description: "Project status, tasks, and progress reports",
            icon: Layers3,
          },
          {
            id: "hr" as const,
            name: "HR Agent",
            description: "Leave requests, people, and policies",
            icon: Users,
          },
          {
            id: "document" as const,
            name: "Document Agent",
            description: "Create, revise, and route documents",
            icon: FileText,
          },
        ].map((agent) => (
          <button
            key={agent.id}
            className="agent-card"
            disabled={busy}
            onClick={() => onSelect(agent.id)}
            aria-label={"Open " + agent.name}
          >
            <span className="agent-icon">
              <agent.icon size={25} />
            </span>
            <span className="agent-copy">
              <strong>{agent.name}</strong>
              <small>{agent.description}</small>
            </span>
            <span className="agent-launch">
              <Play size={12} fill="currentColor" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
