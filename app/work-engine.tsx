"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Play,
  Layers3,
  ShieldCheck,
  Clock,
  Plus,
  CheckCircle2,
  FileText,
  Pause,
  Square,
  RotateCcw,
} from "lucide-react";
import type { Employee } from "@/lib/enterprise/types";
import MessageBody from "./message-body";
import type {
  Agent,
  AgentConfig,
  overview,
  runDetail,
} from "@/lib/enterprise/work-engine";
type Overview = ReturnType<typeof overview>;
type Detail = ReturnType<typeof runDetail>;
const tabs = [
  "Overview",
  "My Work",
  "Agent Library",
  "Runs",
  "Approvals",
  "History",
];
const initial = {
  name: "",
  description: "",
  instructions: "",
  scopes: ["workspace"],
  allowedTools: ["search_records"],
  approvalPolicy: "human" as const,
  steps: [
    {
      id: "search",
      tool: "search_records",
      arguments: { query: "Alpha" },
      dependsOn: [],
      approvalPolicy: "none" as const,
    },
  ],
  published: false,
  inputSchema: { fields: [] },
  outputSchema: { format: "artifacts" as const },
};
export default function WorkEngine({
  user,
  onApprovals,
}: {
  user: Employee;
  onApprovals: () => void;
}) {
  const router = useRouter(),
    params = useSearchParams();
  const [tab, setTab] = useState("Overview"),
    [data, setData] = useState<Overview>(),
    [detail, setDetail] = useState<Detail>(),
    [agent, setAgent] = useState<Agent>(),
    [instruction, setInstruction] = useState(""),
    [mode, setMode] = useState("workflow"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pane, setPane] = useState("Execution"),
    [edit, setEdit] = useState<AgentConfig>(initial),
    [steps, setSteps] = useState(JSON.stringify(initial.steps, null, 2)),
    [notice, setNotice] = useState("");
  const runId = params.get("run");
  const [inputs, setInputs] = useState<Record<string, string | boolean>>({});
  const [inputFields, setInputFields] = useState("[]");
  useEffect(() => {
    setInputs(
      Object.fromEntries(
        (agent?.config.inputSchema?.fields || []).map((f) => [
          f.name,
          f.defaultValue ?? (f.type === "boolean" ? false : ""),
        ]),
      ),
    );
  }, [agent?.id, agent?.version]);
  const load = useCallback(async () => {
    const res = await fetch(
      "/api/work-engine" + (runId ? "?run=" + encodeURIComponent(runId) : ""),
    );
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    if (runId) setDetail(body);
    else setData(body);
  }, [runId, user.id]);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  useEffect(() => {
    if (!data) return;
    const id = params.get("agent");
    if (id) {
      const a = data.agents.find((a) => a.id === id);
      setAgent(a);
      if (a) setInstruction(params.get("instruction") || a.config.description);
    }
  }, [params, data]);
  async function action(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/work-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      await load();
      return body.result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!runId) return;
    let stopped = false;
    const poll = async () => {
      try {
        const res = await fetch("/api/work-engine?run=" + runId);
        const body = await res.json();
        if (!stopped && res.ok) setDetail(body);
      } catch {
        /* Next poll recovers connectivity. */
      }
    };
    const timer = setInterval(poll, 2000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [runId]);
  useEffect(() => {
    if (
      !runId ||
      !detail ||
      !["QUEUED", "RUNNING", "WAITING_FOR_APPROVAL"].includes(detail.status)
    )
      return;
    const timer = setTimeout(() => {
      fetch("/api/work-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tick", id: runId }),
      })
        .then(() => load())
        .catch((e) => setError(e.message));
    }, 1000);
    return () => clearTimeout(timer);
  }, [runId, detail?.status, detail?.updated, load]);
  function openAgent(a: Agent) {
    setAgent(a);
    setInstruction(a.config.description);
    router.push("/work?agent=" + a.id);
  }
  function navigate(name: string) {
    setTab(name);
    setAgent(undefined);
    setDetail(undefined);
    router.push("/work");
  }
  async function start() {
    if (!agent) return;
    const id = await action("launch", {
      input: {
        agentId: agent.id,
        instruction,
        mode,
        test: !agent.config.published,
        inputs,
      },
    });
    if (id) {
      setAgent(undefined);
      router.push("/work?run=" + id);
    }
  }
  const runList = (runs: Overview["runs"]) => (
    <div className="engine-list">
      {(
        runs as unknown as {
          id: string;
          instruction: string;
          status: string;
          created: string;
          mode: string;
        }[]
      ).map((r) => (
        <button key={r.id} onClick={() => router.push("/work?run=" + r.id)}>
          <span className="engine-symbol">
            <Layers3 size={20} />
          </span>
          <span>
            <strong>{r.instruction}</strong>
            <small>
              {r.mode} · {new Date(r.created).toLocaleString()}
            </small>
          </span>
          <span className="engine-status">{r.status.replaceAll("_", " ")}</span>
          <ArrowUpRight size={17} />
        </button>
      ))}
      {!runs.length && (
        <p className="muted">Your next completed outcome starts here.</p>
      )}
    </div>
  );
  return (
    <div className="standard-page engine-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SINGULARITY WORK ENGINE</span>
          <h1>
            {detail
              ? "Run workspace"
              : agent
                ? agent.config.name
                : "Good work, together."}
          </h1>
          <p className="muted">
            {detail
              ? detail.instruction
              : agent
                ? agent.config.description
                : "Turn organizational knowledge into outcomes you can trace."}
          </p>
        </div>
        <button onClick={() => navigate("Agent Library")}>
          <Plus size={16} /> Start work
        </button>
      </div>
      <nav className="engine-tabs" aria-label="Work views">
        {[
          ...tabs,
          ...(user.role === "admin"
            ? ["Agent Builder", "Tools", "Templates", "Settings"]
            : []),
        ].map((t) => (
          <button
            key={t}
            className={tab === t && !detail && !agent ? "active" : ""}
            onClick={() => navigate(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      {error && (
        <div role="alert" className="engine-error">
          {error}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {detail ? (
        <>
          <div className="engine-run-header">
            <span className="engine-status">
              {detail.status.replaceAll("_", " ")}
            </span>
            <small>
              Version {detail.version} ·{" "}
              {new Date(detail.created).toLocaleString()} · {detail.owner}
            </small>
            <div className="engine-controls">
              {!["COMPLETED", "CANCELLED"].includes(detail.status) && (
                <>
                  {detail.status === "PAUSED" ? (
                    <button
                      onClick={() =>
                        action("control", { id: detail.id, control: "resume" })
                      }
                    >
                      <Play size={15} /> Resume
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        action("control", { id: detail.id, control: "pause" })
                      }
                    >
                      <Pause size={15} /> Pause
                    </button>
                  )}
                  <button
                    onClick={() =>
                      action("control", { id: detail.id, control: "cancel" })
                    }
                  >
                    <Square size={15} /> Cancel
                  </button>
                  {detail.status === "FAILED" && (
                    <button
                      onClick={() =>
                        action("control", { id: detail.id, control: "retry" })
                      }
                    >
                      <RotateCcw size={15} /> Safe retry
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          {detail.error && <p className="engine-error">{detail.error}</p>}
          <div className="engine-run-layout">
            <section>
              <nav className="engine-tabs">
                {["Conversation", "Execution", "Artifacts"].map((t) => (
                  <button
                    className={pane === t ? "active" : ""}
                    key={t}
                    onClick={() => setPane(t)}
                  >
                    {t}
                  </button>
                ))}
              </nav>
              {pane === "Conversation" ? (
                <div className="engine-card">
                  <h2>Requested outcome</h2>
                  <p>{detail.instruction}</p>
                  <p>
                    {detail.status === "COMPLETED"
                      ? "The selected steps are complete. Review artifacts and receipts for the actual outcome."
                      : "This run retains its instruction, outputs and approvals across refreshes."}
                  </p>
                  <textarea
                    aria-label="Follow-up instruction"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Describe follow-up work…"
                  />
                  <button
                    onClick={() => {
                      const a = data?.agents.find(
                        (a) => a.id === detail.agentId,
                      );
                      if (a) openAgent(a);
                      else router.push("/work?agent=" + detail.agentId);
                    }}
                  >
                    Start a follow-up run
                  </button>
                </div>
              ) : pane === "Execution" ? (
                <div className="engine-timeline">
                  {detail.steps.map((s, i) => (
                    <article className="engine-card" key={s.id}>
                      <div className="engine-step-title">
                        <span>{i + 1}</span>
                        <h3>{s.spec.tool.replaceAll("_", " ")}</h3>
                        <small>{s.status}</small>
                      </div>
                      <p className="muted">
                        {s.spec.dependsOn.length
                          ? "After " + s.spec.dependsOn.join(", ")
                          : "Independent step"}{" "}
                        · Attempts {s.attempts}
                      </p>
                      {s.error && <p className="engine-error">{s.error}</p>}
                      <details>
                        <summary>Arguments and output</summary>
                        <pre>
                          {JSON.stringify(
                            { arguments: s.spec.arguments, output: s.output },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </article>
                  ))}
                  {!detail.steps.length && (
                    <p>Planning has not completed yet.</p>
                  )}
                </div>
              ) : (
                <div>
                  {detail.steps
                    .filter((s) => s.output)
                    .map((s) => (
                      <article className="engine-card" key={s.id}>
                        <h3>{s.spec.tool.replaceAll("_", " ")}</h3>
                        {typeof s.output === "object" &&
                          s.output &&
                          "versions" in s.output && (
                            <a
                              href={
                                "/documents/" + (s.output as { id: string }).id
                              }
                            >
                              Open document <ArrowUpRight size={14} />
                            </a>
                          )}
                        <Artifact value={s.output} />
                        <details>
                          <summary>Structured output</summary>
                          <pre>{JSON.stringify(s.output, null, 2)}</pre>
                        </details>
                      </article>
                    ))}
                </div>
              )}
            </section>
            <aside className="engine-context">
              <h3>Sources & related records</h3>
              {sourceRecords(detail.steps.map((s) => s.output)).map((r) => (
                <a
                  className="engine-source"
                  key={r.id}
                  href={"/?q=" + encodeURIComponent(r.title)}
                >
                  <FileText size={16} />
                  <span>
                    {r.title}
                    <small>
                      {r.type} · {r.id}
                    </small>
                  </span>
                </a>
              ))}
              {!sourceRecords(detail.steps.map((s) => s.output)).length && (
                <p className="muted">
                  Sources appear after retrieval completes.
                </p>
              )}
              <h3>Run context</h3>
              <p>
                <strong>Agent version</strong>
                <br />
                {detail.agentId} · v{detail.version}
              </p>
              <p>
                <strong>Execution mode</strong>
                <br />
                {detail.mode}
              </p>
              <h3>Action receipts</h3>
              {(
                detail.receipts as {
                  id: string;
                  tool: string;
                  created: string;
                }[]
              ).map((r) => (
                <div className="engine-receipt" key={r.id}>
                  <CheckCircle2 size={16} />
                  <span>
                    {r.tool}
                    <small>
                      {r.id}
                      <br />
                      {new Date(r.created).toLocaleString()}
                    </small>
                  </span>
                </div>
              ))}
              {!detail.receipts.length && (
                <p className="muted">No writes committed yet.</p>
              )}
              <h3>Activity</h3>
              {(
                detail.events as {
                  id: number;
                  kind: string;
                  detail: string;
                  created: string;
                }[]
              ).map((e) => (
                <p key={e.id}>
                  <strong>{e.kind.replaceAll("_", " ")}</strong>
                  <br />
                  {e.detail}
                  <small>{new Date(e.created).toLocaleTimeString()}</small>
                </p>
              ))}
              <button onClick={onApprovals}>
                <ShieldCheck size={16} /> Document approvals
              </button>
            </aside>
          </div>
        </>
      ) : agent ? (
        <div className="engine-launch-layout">
          <section className="engine-card">
            <span className="engine-symbol">
              <Layers3 size={30} />
            </span>
            <h2>{agent.config.name}</h2>
            <p>{agent.config.instructions}</p>
            <label>
              What would you like to accomplish?
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
              />
            </label>
            <label>
              Execution mode
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="workflow">Workflow · published steps</option>
                <option value="auto">Auto · Gemini plans the work</option>
              </select>
            </label>
            {(agent.config.inputSchema?.fields || []).map((f) => (
              <label key={f.name}>
                {f.label}
                {f.type === "boolean" ? (
                  <input
                    type="checkbox"
                    checked={!!inputs[f.name]}
                    onChange={(e) =>
                      setInputs({ ...inputs, [f.name]: e.target.checked })
                    }
                  />
                ) : (
                  <input
                    type={f.type === "date" ? "date" : "text"}
                    required={f.required}
                    value={String(inputs[f.name] ?? "")}
                    onChange={(e) =>
                      setInputs({ ...inputs, [f.name]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
            <p className="muted">
              Workflow uses the configured inputs below. Auto uses your
              instruction to produce a validated plan. Actions use your
              permissions; approval remains independent.
            </p>
            <button
              className="primary"
              disabled={busy || !instruction.trim()}
              onClick={start}
            >
              <Play size={16} /> {busy ? "Starting…" : "Run agent"}
            </button>
            {user.role === "admin" && (
              <button
                onClick={() => {
                  setEdit({ ...agent.config, id: agent.id });
                  setInputFields(
                    JSON.stringify(
                      agent.config.inputSchema?.fields || [],
                      null,
                      2,
                    ),
                  );
                  setSteps(JSON.stringify(agent.config.steps, null, 2));
                  setAgent(undefined);
                  setTab("Agent Builder");
                  router.push("/work");
                }}
              >
                Edit a new version
              </button>
            )}
          </section>
          <aside className="engine-card">
            <h3>Before you start</h3>
            <p>
              Published version {agent.version} · Owner {agent.owner}
            </p>
            <h3>Knowledge scopes</h3>
            <p>{agent.config.scopes.join(", ")}</p>
            <h3>Configured workflow</h3>
            {agent.config.steps.map((s, i) => (
              <p key={s.id}>
                {i + 1}. {s.tool.replaceAll("_", " ")}
                {s.condition && (
                  <small>
                    Branch: {s.condition.path} = {String(s.condition.equals)}
                  </small>
                )}
              </p>
            ))}
            <details>
              <summary>
                Tool permissions ({agent.config.allowedTools.length})
              </summary>
              <p>{agent.config.allowedTools.join(", ")}</p>
            </details>
          </aside>
        </div>
      ) : !data ? (
        <p>Loading your workspace…</p>
      ) : tab === "Agent Builder" ? (
        <div className="engine-builder engine-card">
          <h2>{edit.id ? "Create a new agent version" : "Create an agent"}</h2>
          <p>
            Publishing creates an immutable version. Existing runs keep their
            original version.
          </p>
          <label>
            Name
            <input
              value={edit.name}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </label>
          <label>
            Goal / description
            <input
              value={edit.description}
              onChange={(e) =>
                setEdit({ ...edit, description: e.target.value })
              }
            />
          </label>
          <label>
            Instructions
            <textarea
              value={edit.instructions}
              onChange={(e) =>
                setEdit({ ...edit, instructions: e.target.value })
              }
            />
          </label>
          <label>
            Input fields (JSON schema fields)
            <textarea
              value={inputFields}
              onChange={(e) => setInputFields(e.target.value)}
            />
          </label>
          <p className="muted">
            Each field has name, label, type (text, date, boolean), required and
            optional defaultValue. Reference it in a step with $input.name.
          </p>
          <label>
            Knowledge scopes (comma separated)
            <input
              value={edit.scopes.join(",")}
              onChange={(e) =>
                setEdit({
                  ...edit,
                  scopes: e.target.value.split(",").map((s) => s.trim()),
                })
              }
            />
          </label>
          <label>
            Approval policy
            <select
              value={edit.approvalPolicy}
              onChange={(e) =>
                setEdit({
                  ...edit,
                  approvalPolicy: e.target.value as "human" | "none",
                })
              }
            >
              <option value="human">Human review for actions</option>
              <option value="none">Tool-specific safeguards</option>
            </select>
          </label>
          <fieldset>
            <legend>Allowed tools</legend>
            <div className="engine-tool-grid">
              {data.tools.map((t) => (
                <label key={t.name}>
                  <input
                    type="checkbox"
                    checked={edit.allowedTools.includes(t.name)}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        inputSchema: { fields: JSON.parse(inputFields) },
                        allowedTools: e.target.checked
                          ? [...edit.allowedTools, t.name]
                          : edit.allowedTools.filter((n) => n !== t.name),
                      })
                    }
                  />
                  {t.name}
                  {t.write ? " · writes" : ""}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Workflow steps, dependencies and branch conditions (JSON)
            <textarea
              className="engine-code-input"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
            />
          </label>
          <p className="muted">
            References: $stepId.id. Branch: condition ={" "}
            {`{"stepId":"eligibility","path":"eligible","equals":true}`}. A
            branch must also appear in dependsOn.
          </p>
          <div className="engine-controls">
            {["Save draft", "Test draft", "Publish"].map((label) => (
              <button
                key={label}
                disabled={busy}
                className={label === "Publish" ? "primary" : ""}
                onClick={async () => {
                  try {
                    const result = (await action("saveAgent", {
                      input: {
                        ...edit,
                        steps: JSON.parse(steps),
                        published: label === "Publish",
                      },
                    })) as Agent | undefined;
                    if (result) {
                      setEdit({ ...result.config, id: result.id });
                      setNotice(`${label}: version ${result.version} saved`);
                      if (label === "Test draft") {
                        setAgent(result);
                        setInstruction(result.config.description);
                        setMode("workflow");
                      }
                    }
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Invalid steps");
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : tab === "Tools" ? (
        <div className="engine-grid">
          {data.tools.map((t) => (
            <article className="engine-card" key={t.name}>
              <h3>{t.name.replaceAll("_", " ")}</h3>
              <small>
                {t.write
                  ? "Writes · audited and receipted"
                  : "Reads · permission checked"}
              </small>
              <details>
                <summary>Argument schema</summary>
                <pre>{JSON.stringify(t.schema, null, 2)}</pre>
              </details>
            </article>
          ))}
        </div>
      ) : tab === "Settings" ? (
        <section className="engine-card">
          <h2>Local schedules</h2>
          <p>
            Run <code>npm run worker</code> alongside the app for unattended
            schedules and approval recovery.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              await action("schedule", {
                input: {
                  agentId: f.get("agentId"),
                  instruction: f.get("instruction"),
                  nextAt: new Date(String(f.get("nextAt"))).toISOString(),
                  intervalHours: Number(f.get("intervalHours")),
                },
              });
            }}
          >
            <label>
              Agent
              <select name="agentId">
                {data.agents
                  .filter((a) => a.config.published)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.config.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Instruction
              <input
                name="instruction"
                required
                defaultValue="Prepare the weekly project report"
              />
            </label>
            <label>
              First run
              <input type="datetime-local" name="nextAt" required />
            </label>
            <label>
              Repeat every (hours)
              <input
                name="intervalHours"
                type="number"
                min="1"
                max="8760"
                defaultValue="168"
              />
            </label>
            <button className="primary">Save schedule</button>
          </form>
          {(
            data.schedules as {
              id: string;
              instruction: string;
              nextAt: string;
            }[]
          ).map((s) => (
            <p key={s.id}>
              {s.instruction} · {new Date(s.nextAt).toLocaleString()}
            </p>
          ))}
        </section>
      ) : tab === "Approvals" ? (
        <>
          <button className="approval-banner" onClick={onApprovals}>
            <ShieldCheck /> Open document version approvals{" "}
            <ArrowUpRight size={16} />
          </button>
          {(
            data.gates as {
              runId: string;
              stepId: string;
              instruction: string;
              payload: string;
            }[]
          ).map((g) => (
            <article className="engine-card" key={g.runId + g.stepId}>
              <h3>{g.instruction}</h3>
              <p>{g.stepId}</p>
              <pre>{g.payload}</pre>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await action("decision", {
                    input: {
                      runId: g.runId,
                      stepId: g.stepId,
                      decision: f.get("decision"),
                      reason: f.get("reason"),
                    },
                  });
                }}
              >
                <label>
                  Reviewer reason
                  <input required name="reason" />
                </label>
                <select name="decision">
                  <option value="approve">Approve exact action</option>
                  <option value="return">Return for revision</option>
                  <option value="reject">Reject</option>
                </select>
                <button disabled={busy}>Record decision</button>
              </form>
            </article>
          ))}
          {!data.gates.length && (
            <p className="muted">
              No independent action reviews assigned to you.
            </p>
          )}
        </>
      ) : ["Agent Library", "Templates"].includes(tab) ? (
        <>
          <h2>
            {tab === "Templates"
              ? "Reusable published workflows"
              : "Find the right agent for your work"}
          </h2>
          <div className="engine-grid">
            {data.agents.map((a) => (
              <button
                className="engine-card engine-agent"
                key={a.id}
                onClick={() => openAgent(a)}
              >
                <span className="engine-symbol">
                  <Layers3 />
                </span>
                <h3>{a.config.name}</h3>
                <p>{a.config.description}</p>
                <small>
                  v{a.version} · {a.config.published ? "Published" : "Draft"} ·{" "}
                  {a.config.steps.length} steps
                </small>
                <span className="engine-agent-cta">
                  Review & launch <ArrowUpRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {tab === "Overview" && (
            <>
              <div className="engine-overview-banner">
                <div>
                  <span className="eyebrow">YOUR WORK, IN MOTION</span>
                  <h2>What would you like to get done?</h2>
                  <p>
                    Choose an agent, review its capabilities, and launch a
                    traceable run.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => navigate("Agent Library")}
                >
                  <Play size={16} /> Explore agents
                </button>
              </div>
              <div className="engine-metrics">
                {[
                  [
                    "Active runs",
                    (data.runs as RunRowUI[]).filter((r) =>
                      ["QUEUED", "PLANNING", "RUNNING"].includes(r.status),
                    ).length,
                    Layers3,
                  ],
                  [
                    "Awaiting review",
                    (data.runs as RunRowUI[]).filter(
                      (r) => r.status === "WAITING_FOR_APPROVAL",
                    ).length,
                    ShieldCheck,
                  ],
                  [
                    "Completed",
                    (data.runs as RunRowUI[]).filter(
                      (r) => r.status === "COMPLETED",
                    ).length,
                    CheckCircle2,
                  ],
                ].map(([name, count, Icon]) => {
                  const I = Icon as typeof Clock;
                  return (
                    <div className="engine-card" key={String(name)}>
                      <I size={20} />
                      <strong>{String(count)}</strong>
                      <span>{String(name)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="hub-section-heading">
                <h2>Featured work agents</h2>
                <button onClick={() => navigate("Agent Library")}>
                  View all <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="engine-grid">
                {data.agents.slice(0, 3).map((a) => (
                  <button
                    className="engine-card engine-agent"
                    key={a.id}
                    onClick={() => openAgent(a)}
                  >
                    <Layers3 />
                    <h3>{a.config.name}</h3>
                    <p>{a.config.description}</p>
                    <small>Review capabilities & launch →</small>
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="hub-section-heading">
            <h2>
              {tab === "History"
                ? "Completed outcomes"
                : tab === "My Work"
                  ? "Your assigned runs"
                  : "Recent work"}
            </h2>
            <Clock size={18} />
          </div>
          {runList(
            tab === "History"
              ? ((data.runs as RunRowUI[]).filter((r) =>
                  ["COMPLETED", "CANCELLED"].includes(r.status),
                ) as Overview["runs"])
              : tab === "My Work"
                ? ((data.runs as RunRowUI[]).filter(
                    (r) => r.owner === user.id,
                  ) as Overview["runs"])
                : data.runs,
          )}
        </>
      )}
    </div>
  );
}
type RunRowUI = { id: string; status: string; owner: string };
function sourceRecords(
  value: unknown,
): { id: string; title: string; type: string }[] {
  const found = new Map<string, { id: string; title: string; type: string }>();
  function visit(v: unknown) {
    if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === "object") {
      const r = v as Record<string, unknown>;
      if (
        typeof r.id === "string" &&
        typeof r.title === "string" &&
        typeof r.type === "string"
      )
        found.set(r.id, { id: r.id, title: r.title, type: r.type });
      Object.values(r).forEach(visit);
    }
  }
  visit(value);
  return [...found.values()];
}
function Artifact({ value }: { value: unknown }) {
  if (Array.isArray(value))
    return (
      <div>
        {value.length ? (
          value.map((v, i) => <Artifact key={i} value={v} />)
        ) : (
          <p className="muted">No matching records.</p>
        )}
      </div>
    );
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return <p>{String(value)}</p>;
  const v = value as Record<string, unknown>;
  if (Array.isArray(v.versions)) {
    const version = v.versions.at(-1) as
      { content: string; number: number } | undefined;
    return (
      <>
        <h3>{String(v.title)}</h3>
        <span className="engine-status">
          {String(v.status)} · Version {version?.number}
        </span>
        {version && <MessageBody text={version.content} />}
      </>
    );
  }
  if (typeof v.percent === "number")
    return (
      <>
        <h3>{String((v.project as { title: string })?.title)}</h3>
        <p className="engine-result-number">{v.percent}% complete</p>
        <p>
          {String(v.done)} of {String(v.total)} tasks completed
        </p>
        <Artifact value={v.tasks} />
      </>
    );
  if (typeof v.eligible === "boolean")
    return (
      <>
        <p className="engine-result-number">
          {v.eligible
            ? "Eligible for replacement"
            : "Replacement criteria not met"}
        </p>
        <Artifact value={v.asset} />
        <Artifact value={v.policy} />
      </>
    );
  if (typeof v.balance === "number")
    return <p className="engine-result-number">{v.balance} days available</p>;
  if (typeof v.title === "string")
    return (
      <div className="engine-artifact-record">
        <strong>{v.title}</strong>
        {typeof v.body === "string" && <p>{v.body}</p>}
        <small>
          {String(v.status || v.type || "Saved")} · {String(v.id || "")}
        </small>
      </div>
    );
  if (typeof v.name === "string")
    return (
      <p>
        <strong>{v.name}</strong>
        <br />
        {String(v.department || "")}
        <small>{String(v.id || "")}</small>
      </p>
    );
  if (typeof v.detail === "string")
    return (
      <p>
        {v.detail}
        <small>
          {String(v.id || "")} · {String(v.created || "")}
        </small>
      </p>
    );
  return (
    <p>
      Saved resource <strong>{String(v.id || "")}</strong>
      {typeof v.status === "string" ? " · " + v.status : ""}
    </p>
  );
}
