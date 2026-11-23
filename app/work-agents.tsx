"use client";
import {
  Monitor,
  Layers3,
  Users,
  FileText,
  Play,
  ChevronRight,
} from "lucide-react";
import type { RecordItem } from "@/lib/enterprise/types";
export type WorkAgent = "it" | "project" | "hr" | "document";
export default function WorkAgents({
  onSelect,
  onExplore,
  busy = false,
  projects = [],
}: {
  onSelect: (agent: WorkAgent) => void;
  onExplore?: () => void;
  busy?: boolean;
  projects?: RecordItem[];
}) {
  const project = projects[0];
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
            description: project
              ? `Incidents and equipment for ${project.title}`
              : "Find incidents and equipment you can access",
            icon: Monitor,
          },
          {
            id: "project" as const,
            name: "Project Agent",
            description: project
              ? `Tasks and reports for ${project.title}`
              : "Find projects and tasks you can access",
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
        ]
          .filter((agent) => agent.id !== "it" || projects.length > 0)
          .map((agent) => (
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
