"use client";
import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Home,
  MessageSquare,
  Folder,
  FileText,
  SlidersHorizontal,
  Monitor,
  Users,
  Bell,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Paperclip,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Check,
  CheckCircle2,
  X,
  Sun,
  Moon,
  Briefcase,
  ShieldCheck,
  Download,
  History,
  ExternalLink,
  Loader2,
  Link2,
  Upload,
  MoreHorizontal,
  Command,
  BookOpen,
  ArrowRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import type {
  Snapshot,
  RecordItem,
  DocumentItem,
  Workflow,
  Version,
} from "@/lib/enterprise/types";

const nav = [
  { id: "", label: "Home", icon: Home },
  { id: "chat", label: "New chat", icon: MessageSquare },
  { id: "search", label: "Search", icon: Search },
  { id: "work", label: "My work", icon: Briefcase },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "customize", label: "Customize", icon: SlidersHorizontal },
];
const date = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
const initials = (s: string) =>
  s
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
function Mark({ small = false }: { small?: boolean }) {
  return (
    <span className={"brand-mark " + (small ? "small" : "")}>
      <span />
      <span />
      <span />
    </span>
  );
}
function Status({ children }: { children: ReactNode }) {
  return (
    <span
      className={
        "status " +
        (/completed|approved|done/i.test(String(children))
          ? "success"
          : /failed|returned/i.test(String(children))
            ? "warning"
            : "")
      }
    >
      {String(children).replaceAll("_", " ").toLowerCase()}
    </span>
  );
}
function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <BookOpen />
      <h3>{title}</h3>
      <p>{children || "Your saved work will appear here."}</p>
    </div>
  );
}

export default function EnterpriseWorkspace() {
  const pathname = usePathname(),
    router = useRouter(),
    parts = pathname.split("/").filter(Boolean),
    section = parts[0] || "",
    selectedId = parts[1];
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { dark, setDark } = useTheme();
  const [prompt, setPrompt] = useState(""),
    [workMode, setWorkMode] = useState(false),
    [query, setQuery] = useState(""),
    [searchType, setSearchType] = useState("All"),
    [results, setResults] = useState<RecordItem[]>([]),
    [searching, setSearching] = useState(false),
    [preview, setPreview] = useState<RecordItem>();
  const [modal, setModal] = useState<{ title: string; content: ReactNode }>();
  const [docTitle, setDocTitle] = useState(""),
    [docContent, setDocContent] = useState(""),
    [reason, setReason] = useState(""),
    [versionId, setVersionId] = useState("");
  const [settingsText, setSettingsText] = useState("");
  const [csv, setCsv] = useState(
      "id,title,body,department\nlegacy-lt-01,SG-LT-2001,Imported laptop,IT",
    ),
    [importKind, setImportKind] = useState("Assets"),
    [mapping, setMapping] = useState<Record<string, string>>({
      id: "id",
      title: "title",
      body: "body",
      department: "department",
      email: "email",
    }),
    [importPreview, setImportPreview] = useState<{
      rows: { id: string; title: string }[];
      errors: string[];
      count: number;
      receipt?: { id: string };
    }>();
  const [customTab, setCustomTab] = useState("Templates");
  const fileRef = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const searchSequence = useRef(0);
  const currentDocument = data?.documents.find((d) => d.id === selectedId);
  const chat = data?.chats.find((c) => c.id === selectedId);
  const run = data?.workflows.find((r) => r.id === selectedId);
  const selectedVersion =
    currentDocument?.versions.find((v) => v.id === versionId) ||
    currentDocument?.versions.at(-1);
  async function refresh() {
    const res = await fetch("/api/workspace", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    setData(json);
    return json as Snapshot;
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    setDrawer(false);
    setPreview(undefined);
    setError("");
  }, [pathname]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (currentDocument) {
      const v = currentDocument.versions.at(-1)!;
      setVersionId(v.id);
      setDocTitle(v.title);
      setDocContent(v.content);
      setReason("");
    }
  }, [currentDocument?.id, currentDocument?.versions.length]);
  useEffect(() => {
    if (data) setSettingsText(JSON.stringify(data.settings, null, 2));
  }, [data?.settings]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages.length]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        router.push("/search");
        setTimeout(
          () => document.getElementById("enterprise-search")?.focus(),
          100,
        );
      }
      if (e.key === "Escape") {
        setModal(undefined);
        setPreview(undefined);
        setDrawer(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
  useEffect(() => {
    if (section !== "search") return;
    const sequence = ++searchSequence.current;
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          "/api/workspace?q=" +
            encodeURIComponent(query) +
            "&type=" +
            searchType,
          { signal: controller.signal },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (sequence === searchSequence.current) setResults(json.results);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      } finally {
        if (sequence === searchSequence.current) setSearching(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [section, query, searchType, data?.records.length]);
  function go(path: string) {
    router.push("/" + path);
  }
  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await refresh();
      return json.result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  async function act(
    body: Record<string, unknown>,
    message = "Saved to your workspace",
  ) {
    try {
      const result = await post(body);
      setToast(message);
      return result;
    } catch {
      return undefined;
    }
  }
  async function send(text = prompt) {
    if (!text.trim() || busy) return;
    const value = text;
    setPrompt("");
    try {
      const out = await post({
        action: "chat",
        prompt: value,
        chatId: section === "chat" ? chat?.id : undefined,
      });
      go((workMode ? "work/" : "chat/") + (workMode ? out.run.id : out.chatId));
    } catch {
      setPrompt(value);
    }
  }
  function openRecord(r: RecordItem) {
    if (r.data.documentId) {
      go("documents/" + r.data.documentId);
      return;
    }
    setPreview(r);
  }
  function form(
    title: string,
    fields: ReactNode,
    submit: (f: FormData) => Promise<unknown>,
  ) {
    setModal({
      title,
      content: (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await submit(new FormData(e.currentTarget));
              setModal(undefined);
            } catch {}
          }}
        >
          {fields}
          <div className="dialog-actions">
            <button type="button" onClick={() => setModal(undefined)}>
              Cancel
            </button>
            <button type="submit" className="primary">
              Save
            </button>
          </div>
        </form>
      ),
    });
  }
  function newDocument(template?: { name: string; content: string }) {
    form(
      template ? "Use template" : "New document",
      <>
        <label>
          Title
          <input
            name="title"
            required
            defaultValue={template?.name || ""}
            placeholder="Untitled document"
          />
        </label>
        <label>
          Content
          <textarea
            name="content"
            required
            rows={8}
            defaultValue={template?.content || ""}
          />
        </label>
      </>,
      async (f) => {
        const d = await post({
          action: "draft",
          title: f.get("title"),
          content: f.get("content"),
          department: data?.user.department,
        });
        go("documents/" + d.id);
      },
    );
  }
  function projectForm() {
    form(
      "Create a project",
      <>
        <label>
          Project name
          <input name="title" required />
        </label>
        <label>
          Objective
          <textarea name="body" rows={3} required />
        </label>
        <fieldset>
          <legend>Team members</legend>
          {data?.users.map((u) => (
            <label className="check-label" key={u.id}>
              <input
                type="checkbox"
                name="members"
                value={u.id}
                defaultChecked={u.id === data.user.id}
              />
              {u.name}
              <span className="muted">{u.department}</span>
            </label>
          ))}
        </fieldset>
      </>,
      async (f) => {
        const id = await post({
          action: "project",
          title: f.get("title"),
          body: f.get("body"),
          members: f.getAll("members"),
        });
        go("projects/" + id);
      },
    );
  }
  function leaveForm() {
    form(
      "Request time away",
      <>
        <p className="muted">
          Available balance: {data?.user.leaveBalance} working days. An HR
          Manager reviews your exact request.
        </p>
        <div className="two-cols">
          <label>
            First day
            <input type="date" name="start" required />
          </label>
          <label>
            Last day
            <input type="date" name="end" required />
          </label>
        </div>
        <label>
          Reason
          <textarea name="reason" required rows={3} />
        </label>
      </>,
      async (f) => {
        const d = await post({
          action: "leave",
          start: f.get("start"),
          end: f.get("end"),
          reason: f.get("reason"),
        });
        go("documents/" + d.id);
      },
    );
  }
  function composer() {
    return (
      <div className="composer">
        <textarea
          aria-label="Ask, search, or create anything"
          placeholder="Ask, search, or create anything..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
        />
        <div className="composer-actions">
          <div>
            <button
              title="Attach a text or CSV document"
              aria-label="Attach"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip size={17} />
            </button>
            <button
              onClick={() => {
                setQuery(prompt);
                go("search");
              }}
            >
              <Search size={16} />
              <span>Search</span>
            </button>
            <button
              className={workMode ? "mode-active" : ""}
              onClick={() => setWorkMode(!workMode)}
            >
              <Briefcase size={16} />
              <span>Work mode</span>
            </button>
          </div>
          <button
            className="send-button"
            disabled={busy || !prompt.trim()}
            onClick={() => send()}
            aria-label="Send message"
          >
            {busy ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <ArrowUp size={19} />
            )}
          </button>
        </div>
      </div>
    );
  }
  function sourceRow(r: RecordItem) {
    return (
      <button className="result-row" key={r.id} onClick={() => openRecord(r)}>
        <span className={"source-icon type-" + r.type}>
          {r.type === "People" ? (
            <Users size={18} />
          ) : r.type === "Projects" ? (
            <Folder size={18} />
          ) : r.type === "IT" ? (
            <Monitor size={18} />
          ) : (
            <FileText size={18} />
          )}
        </span>
        <span className="result-content">
          <span className="row-top">
            <strong>{r.title}</strong>
            <span className="muted">{r.type}</span>
          </span>
          <span className="snippet">{r.body.slice(0, 220)}</span>
          <span className="result-meta">
            {data?.users.find((u) => u.id === r.owner)?.name || r.owner}
            <span>·</span>
            {r.department}
            <span>·</span>Updated {date(r.updated)}
            {r.data.version ? ` · v${r.data.version}` : ""}
          </span>
        </span>
        <ChevronRight size={16} />
      </button>
    );
  }
  function workflowView(w: Workflow) {
    return (
      <div className="workflow-view">
        <div className="section-heading">
          <div>
            <span className="eyebrow">WORKSPACE ACTIVITY</span>
            <h2>{w.objective}</h2>
          </div>
          <Status>{w.status}</Status>
        </div>
        <p className="muted">
          {w.mode} · {date(w.created)}
        </p>
        <h3>Execution timeline</h3>
        <ol className="timeline">
          {w.events.map((event, i) => (
            <li key={i}>
              <span
                className={
                  event.status === "completed"
                    ? "timeline-check"
                    : "timeline-error"
                }
              >
                {event.status === "completed" ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
              </span>
              <div>
                <strong>{event.tool.replaceAll("_", " ")}</strong>
                <p>{event.detail}</p>
                <small>
                  {new Date(event.at).toLocaleTimeString("en-GB", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </small>
              </div>
            </li>
          ))}
        </ol>
        {w.documentId && (
          <button
            className="output-link"
            onClick={() => go("documents/" + w.documentId)}
          >
            <FileText />
            <span>
              <strong>Open saved draft</strong>
              <small>Versions, evidence & approval</small>
            </span>
            <ExternalLink size={17} />
          </button>
        )}
        <h3>Evidence · {w.sources.length} sources</h3>
        {w.sources.map(sourceRow)}
      </div>
    );
  }
  const content = () => {
    if (!data)
      return (
        <div className="loading">
          <Loader2 className="spin" />
          Opening your workspace…
        </div>
      );
    if (section === "" || (section === "chat" && !chat))
      return (
        <div className="home-page">
          <div className="home-intro">
            <span className="intro-mark">
              <Mark />
            </span>
            <p className="eyebrow">YOUR WORK, CONNECTED</p>
            <h1>
              Good{" "}
              {Number(
                new Intl.DateTimeFormat("en-GB", {
                  hour: "numeric",
                  hourCycle: "h23",
                  timeZone: "Asia/Kolkata",
                }).format(new Date()),
              ) < 12
                ? "morning"
                : Number(
                      new Intl.DateTimeFormat("en-GB", {
                        hour: "numeric",
                        hourCycle: "h23",
                        timeZone: "Asia/Kolkata",
                      }).format(new Date()),
                    ) < 17
                  ? "afternoon"
                  : "evening"}
              , {data.user.name.split(" ")[0]}
            </h1>
            <p className="intro-subtitle">What would you like to accomplish?</p>
          </div>
          {composer()}
          <div className="suggestions">
            {[
              {
                icon: Search,
                label: "Find project documents",
                prompt: "Find Project Alpha documents",
              },
              {
                icon: FileText,
                label: "Prepare my weekly report",
                prompt: "Prepare a Project Alpha progress report",
              },
              {
                icon: ShieldCheck,
                label: "Review pending approvals",
                path: "approvals",
              },
              {
                icon: Monitor,
                label: "Check unresolved incidents",
                prompt:
                  "Find unresolved laptop incidents affecting Project Alpha",
              },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => (s.path ? go(s.path) : send(s.prompt))}
              >
                <s.icon size={15} />
                {s.label}
              </button>
            ))}
          </div>
          <div className="home-sections">
            <div className="section-heading">
              <h3>Pick up where you left off</h3>
              <button className="text-button" onClick={() => go("work")}>
                View my work <ChevronRight size={15} />
              </button>
            </div>
            <div className="activity-list">
              {data.records
                .filter(
                  (r) =>
                    r.type === "Tasks" &&
                    r.owner === data.user.id &&
                    r.status !== "Done",
                )
                .slice(0, 2)
                .map((r) => (
                  <button key={r.id} onClick={() => openRecord(r)}>
                    <span className="activity-icon">
                      <CheckCircle2 size={18} />
                    </span>
                    <span>
                      <strong>{r.title}</strong>
                      <small>Project Alpha · Assigned to you</small>
                    </span>
                    <Status>{r.status}</Status>
                  </button>
                ))}
              {data.approvals
                .filter((a) => a.status === "PENDING_APPROVAL")
                .slice(0, 1)
                .map((a) => (
                  <button key={a.id} onClick={() => go("approvals")}>
                    <span className="activity-icon">
                      <ShieldCheck size={18} />
                    </span>
                    <span>
                      <strong>
                        {
                          data.documents.find((d) => d.id === a.documentId)
                            ?.title
                        }
                      </strong>
                      <small>Awaiting review</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
            </div>
            <div className="section-heading recent-heading">
              <h3>From your workspace</h3>
              <button className="text-button" onClick={() => go("documents")}>
                All documents <ChevronRight size={15} />
              </button>
            </div>
            {data.records
              .filter((r) => r.type === "Documents")
              .slice(0, 3)
              .map((r) => (
                <button
                  className="compact-document"
                  key={r.id}
                  onClick={() => openRecord(r)}
                >
                  <FileText size={17} />
                  <span>{r.title}</span>
                  <small>{r.department}</small>
                  <ChevronRight size={14} />
                </button>
              ))}
          </div>
          <p className="home-footnote">
            <ShieldCheck size={13} />
            Private by design. Answers use the records you can access.
          </p>
        </div>
      );
    if (section === "chat" && chat)
      return (
        <div className="chat-page">
          <div className="chat-messages">
            <span className="eyebrow">{chat.title}</span>
            {chat.messages.map((m) => (
              <article key={m.id} className={"message " + m.role}>
                <div className="message-avatar">
                  {m.role === "user" ? (
                    initials(data.user.name)
                  ) : (
                    <Mark small />
                  )}
                </div>
                <div>
                  <strong>
                    {m.role === "user" ? data.user.name : "BrahmaGPT"}
                  </strong>
                  <p className="message-text">{m.text}</p>
                  {m.runId &&
                    (() => {
                      const w = data.workflows.find((w) => w.id === m.runId);
                      return (
                        w && (
                          <>
                            <details className="execution-details">
                              <summary>
                                <CheckCircle2 size={15} />
                                {
                                  w.events.filter(
                                    (e) => e.status === "completed",
                                  ).length
                                }{" "}
                                tool operations · {w.status}
                                <ChevronDown size={14} />
                              </summary>
                              {w.events.map((e, i) => (
                                <p key={i}>
                                  <Status>{e.status}</Status> {e.detail}
                                </p>
                              ))}
                            </details>
                            <div className="citation-chips">
                              {w.sources.slice(0, 5).map((r, i) => (
                                <button
                                  key={r.id}
                                  onClick={() => openRecord(r)}
                                >
                                  <span>{i + 1}</span>
                                  {r.title}
                                </button>
                              ))}
                            </div>
                            <div className="message-links">
                              {w.status === "Failed" && !w.documentId && (
                                <button
                                  disabled={busy}
                                  onClick={() => send(w.objective)}
                                >
                                  Retry request
                                </button>
                              )}
                              <button onClick={() => go("work/" + w.id)}>
                                <Briefcase size={15} />
                                Open in Work
                              </button>
                              {w.documentId && (
                                <button
                                  onClick={() =>
                                    go("documents/" + w.documentId)
                                  }
                                >
                                  <FileText size={15} />
                                  Open draft
                                </button>
                              )}
                            </div>
                          </>
                        )
                      );
                    })()}
                </div>
              </article>
            ))}
            {busy && (
              <p className="working-state">
                <Loader2 className="spin" size={17} />
                Running validated workspace tools…
              </p>
            )}
            <div ref={bottom} />
          </div>
          <div className="chat-composer">
            {composer()}
            <p>
              {data.mode} · Review important information against its sources.
            </p>
          </div>
        </div>
      );
    if (section === "search")
      return (
        <div className="search-page">
          <span className="eyebrow">ONE SEARCH. YOUR WHOLE WORKSPACE.</span>
          <h1>Find what moves work forward.</h1>
          <form
            className="search-field"
            onSubmit={(e) => {
              e.preventDefault();
              fetch(
                "/api/workspace?q=" + encodeURIComponent(query) + "&save=1",
              ).then(() => refresh());
            }}
          >
            <Search size={22} />
            <input
              id="enterprise-search"
              placeholder="Search documents, people, projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={18} />
              </button>
            )}
            <kbd>Enter</kbd>
          </form>
          <div className="search-tabs">
            {[
              "All",
              "Documents",
              "People",
              "Projects",
              "Tasks",
              "IT",
              "HR",
            ].map((t) => (
              <button
                key={t}
                className={searchType === t ? "active" : ""}
                onClick={() => setSearchType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          {!query && data.searchHistory.length > 0 && (
            <div className="search-history">
              <Clock size={14} />
              {data.searchHistory.map((q) => (
                <button key={q} onClick={() => setQuery(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="section-heading">
            <p className="muted">
              {searching
                ? "Searching your permitted records…"
                : `${results.length} ${query ? "results" : "workspace records"}`}
            </p>
            <span className="filter-label">
              <ShieldCheck size={14} />
              Your access only
            </span>
          </div>
          <div className="search-results">
            {results.map(sourceRow)}
            {!searching && !results.length && (
              <Empty title="No matching records">
                Try a project name, document title, or colleague.
              </Empty>
            )}
          </div>
        </div>
      );
    if (section === "documents" && currentDocument)
      return (
        <div className="document-workspace">
          <aside className="document-context">
            <span className="eyebrow">DOCUMENT WORKSPACE</span>
            <h3>Make it your own</h3>
            <p className="muted">
              Edit the draft, explain your revision, then save a new version.
            </p>
            <button
              onClick={() => {
                setPrompt(
                  "Find related documents for " + currentDocument.title,
                );
                go("chat");
              }}
            >
              <MessageSquare size={16} />
              Ask about this document
            </button>
            <h4>Sources & context</h4>
            {data.workflows
              .filter((w) => w.documentId === currentDocument.id)
              .flatMap((w) => w.sources)
              .map((r) => (
                <button key={r.id} onClick={() => openRecord(r)}>
                  <FileText size={15} />
                  {r.title}
                </button>
              ))}
            <p className="muted">
              Owner:{" "}
              {data.users.find((u) => u.id === currentDocument.owner)?.name}
            </p>
            <Status>{currentDocument.status}</Status>
          </aside>
          <div className="document-center">
            <div className="document-toolbar">
              <button onClick={() => go("documents")}>
                <ChevronRight className="back-icon" size={16} />
                Documents
              </button>
              <div>
                {["pdf", "docx"].map((format) => (
                  <a
                    key={format}
                    href={
                      "/api/workspace?document=" +
                      currentDocument.id +
                      "&version=" +
                      selectedVersion?.id +
                      "&format=" +
                      format
                    }
                  >
                    <Download size={14} />
                    {format.toUpperCase()}
                  </a>
                ))}
                <button
                  className="primary"
                  disabled={
                    busy ||
                    currentDocument.owner !== data.user.id ||
                    ["PENDING_APPROVAL", "COMPLETED"].includes(
                      currentDocument.status,
                    ) ||
                    versionId !== currentDocument.versions.at(-1)?.id
                  }
                  onClick={async () => {
                    if (
                      await act(
                        {
                          action: "revise",
                          id: currentDocument.id,
                          baseVersion: currentDocument.versions.at(-1)?.id,
                          title: docTitle,
                          content: docContent,
                          reason,
                        },
                        "New version saved",
                      )
                    )
                      setReason("");
                  }}
                >
                  Save version
                </button>
              </div>
            </div>
            <div className="paper">
              <div className="paper-meta">
                <FileText size={16} />
                Version {selectedVersion?.number}
                <span>·</span>
                {selectedVersion && date(selectedVersion.created)}
              </div>
              <input
                className="document-title"
                aria-label="Document title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                readOnly={
                  versionId !== currentDocument.versions.at(-1)?.id ||
                  currentDocument.owner !== data.user.id ||
                  ["PENDING_APPROVAL", "COMPLETED"].includes(
                    currentDocument.status,
                  )
                }
              />
              <textarea
                className="document-body"
                aria-label="Document content"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                readOnly={
                  versionId !== currentDocument.versions.at(-1)?.id ||
                  currentDocument.owner !== data.user.id ||
                  ["PENDING_APPROVAL", "COMPLETED"].includes(
                    currentDocument.status,
                  )
                }
              />
            </div>
            <label className="revision-reason">
              Explain this revision
              <input
                placeholder="What changed and why? Required to save."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          </div>
          <aside className="version-panel">
            <h3>
              <History size={17} />
              Version history
            </h3>
            {[...currentDocument.versions].reverse().map((v) => (
              <button
                className={
                  "version-row " + (versionId === v.id ? "selected" : "")
                }
                key={v.id}
                onClick={() => {
                  setVersionId(v.id);
                  setDocTitle(v.title);
                  setDocContent(v.content);
                }}
              >
                <span>
                  <strong>Version {v.number}</strong>
                  <small>{date(v.created)}</small>
                </span>
                <p>{v.reason}</p>
              </button>
            ))}
            {currentDocument.versions.length > 1 && (
              <button
                className="text-button"
                onClick={() => {
                  const a = currentDocument.versions.at(-2)!,
                    b = currentDocument.versions.at(-1)!;
                  setModal({
                    title: `Compare v${a.number} and v${b.number}`,
                    content: (
                      <div className="compare">
                        <div>
                          <h4>Version {a.number}</h4>
                          <pre>{a.content}</pre>
                        </div>
                        <div>
                          <h4>Version {b.number}</h4>
                          <pre>{b.content}</pre>
                        </div>
                      </div>
                    ),
                  });
                }}
              >
                Compare latest versions
              </button>
            )}
            <h4>Approval</h4>
            <Status>{currentDocument.status}</Status>
            {currentDocument.owner === data.user.id &&
              currentDocument.status === "DRAFT" && (
                <button
                  className="primary full"
                  disabled={busy}
                  onClick={() =>
                    act(
                      { action: "submit", id: currentDocument.id },
                      "Submitted for independent approval",
                    )
                  }
                >
                  Submit for approval
                </button>
              )}
            {data.approvals
              .filter((a) => a.documentId === currentDocument.id)
              .map((a) => (
                <div className="approval-note" key={a.id}>
                  <strong>
                    Version{" "}
                    {
                      currentDocument.versions.find((v) => v.id === a.versionId)
                        ?.number
                    }
                  </strong>
                  <p>{a.status.replaceAll("_", " ")}</p>
                  <small>{a.comment || "No reviewer comments"}</small>
                </div>
              ))}
          </aside>
        </div>
      );
    if (section === "documents")
      return (
        <div className="standard-page">
          <div className="section-heading">
            <div>
              <span className="eyebrow">COLLECTIVE KNOWLEDGE</span>
              <h1>Documents</h1>
              <p className="muted">
                Ideas, evidence, and decisions. All in one place.
              </p>
            </div>
            <button className="primary" onClick={() => newDocument()}>
              <Plus size={16} />
              New document
            </button>
          </div>
          <div className="section-heading">
            <h3>Your working documents</h3>
            <button className="text-button" onClick={() => go("customize")}>
              Browse templates
            </button>
          </div>
          {data.documents.length ? (
            data.documents.map((d) => (
              <button
                className="document-list-row"
                key={d.id}
                onClick={() => go("documents/" + d.id)}
              >
                <span className="source-icon">
                  <FileText size={19} />
                </span>
                <span>
                  <strong>{d.title}</strong>
                  <small>
                    Version {d.versions.at(-1)?.number} ·{" "}
                    {date(d.versions.at(-1)!.created)}
                  </small>
                </span>
                <Status>{d.status}</Status>
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <Empty title="A place for your next idea">
              Create a document, use a template, or ask BrahmaGPT to prepare a
              report.
            </Empty>
          )}
          <h3 className="spaced">Workspace knowledge</h3>
          {data.records
            .filter((r) => r.type === "Documents" && !r.data.documentId)
            .map(sourceRow)}
        </div>
      );
    if (section === "work" && run)
      return <div className="standard-page">{workflowView(run)}</div>;
    if (section === "work")
      return (
        <div className="standard-page">
          <div className="section-heading">
            <div>
              <span className="eyebrow">FROM INTENT TO OUTCOME</span>
              <h1>My work</h1>
              <p className="muted">
                Real tool operations, saved outputs, and a clear trail.
              </p>
            </div>
            <button className="primary" onClick={() => go("chat")}>
              <Plus size={16} />
              Start work
            </button>
          </div>
          <button className="approval-banner" onClick={() => go("approvals")}>
            <ShieldCheck size={20} />
            <span>
              <strong>Review & approvals</strong>
              <small>
                {
                  data.approvals.filter((a) => a.status === "PENDING_APPROVAL")
                    .length
                }{" "}
                pending in your workspace
              </small>
            </span>
            <ChevronRight size={17} />
          </button>
          {data.workflows.length ? (
            data.workflows.map((w) => (
              <button
                className="work-list-row"
                key={w.id}
                onClick={() => go("work/" + w.id)}
              >
                <Briefcase size={18} />
                <span>
                  <strong>{w.objective}</strong>
                  <small>
                    {w.events.length} events · {date(w.created)} · {w.mode}
                  </small>
                </span>
                <Status>{w.status}</Status>
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <Empty title="Great work starts with a question">
              Ask BrahmaGPT to prepare a report or review laptop replacements.
            </Empty>
          )}
          <h3 className="spaced">Assigned to you</h3>
          {data.records
            .filter((r) => r.type === "Tasks" && r.owner === data.user.id)
            .map((r) => (
              <div className="task-row" key={r.id}>
                <CheckCircle2 size={18} />
                <span>{r.title}</span>
                <select
                  aria-label={"Task status for " + r.title}
                  value={r.status}
                  disabled={busy}
                  onChange={(e) =>
                    act({ action: "task", id: r.id, status: e.target.value })
                  }
                >
                  {["Open", "In progress", "Done"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
        </div>
      );
    if (section === "approvals")
      return (
        <div className="standard-page">
          <span className="eyebrow">HUMAN JUDGMENT, BUILT IN</span>
          <h1>Review & approvals</h1>
          <p className="muted">
            Every decision is tied to an exact, immutable document version.
          </p>
          {!data.approvals.length && (
            <Empty title="You’re all caught up">
              Requests you submit or are authorized to review will appear here.
            </Empty>
          )}
          {data.approvals.map((a) => {
            const d = data.documents.find((d) => d.id === a.documentId)!;
            const v = d?.versions.find((v) => v.id === a.versionId);
            const reviewer =
              [a.reviewerRole, "admin"].includes(data.user.role) &&
              a.requester !== data.user.id;
            return (
              <article className="approval-card" key={a.id}>
                <div className="section-heading">
                  <div>
                    <h3>{d?.title}</h3>
                    <p className="muted">
                      Requested by{" "}
                      {data.users.find((u) => u.id === a.requester)?.name} ·
                      Version {v?.number} ·{" "}
                      {a.reviewerRole.replaceAll("_", " ")}
                    </p>
                  </div>
                  <Status>{a.status}</Status>
                </div>
                <pre>{v?.content}</pre>
                {a.comment && (
                  <p className="reviewer-comment">Reviewer: {a.comment}</p>
                )}
                <div className="approval-actions">
                  <button onClick={() => go("documents/" + d.id)}>
                    <FileText size={15} />
                    View document & history
                  </button>
                  {reviewer && a.status === "PENDING_APPROVAL" && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() =>
                          form(
                            "Return with comments",
                            <label>
                              Reviewer comments
                              <textarea name="comment" required rows={4} />
                            </label>,
                            async (f) => {
                              await post({
                                action: "decide",
                                id: a.id,
                                decision: "return",
                                comment: f.get("comment"),
                              });
                            },
                          )
                        }
                      >
                        Return with comments
                      </button>
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() =>
                          act(
                            { action: "decide", id: a.id, decision: "approve" },
                            "Exact version approved",
                          )
                        }
                      >
                        Approve version {v?.number}
                      </button>
                    </>
                  )}
                  {reviewer && a.status === "APPROVED" && (
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() =>
                        act(
                          { action: "execute", id: a.id },
                          "Local action completed. Receipt saved.",
                        )
                      }
                    >
                      Execute approved action
                    </button>
                  )}
                </div>
                {data.receipts
                  .filter((r) => r.approvalId === a.id)
                  .map((r) => (
                    <div className="receipt" key={r.id}>
                      <CheckCircle2 size={17} />
                      <span>
                        <strong>Receipt {r.id.slice(0, 8)}</strong>
                        <p>{r.detail}</p>
                        <small>{date(r.created)}</small>
                      </span>
                    </div>
                  ))}
              </article>
            );
          })}
        </div>
      );
    if (section === "projects") {
      const projects = data.records.filter((r) => r.type === "Projects");
      const p = projects.find((p) => p.id === selectedId);
      if (p) {
        const tasks = data.records.filter(
          (r) => r.type === "Tasks" && r.project === p.id,
        );
        const done = tasks.filter((t) => t.status === "Done").length;
        return (
          <div className="standard-page">
            <button className="text-button" onClick={() => go("projects")}>
              All projects
            </button>
            <div className="section-heading">
              <div>
                <h1>{p.title}</h1>
                <p className="muted">{p.body}</p>
              </div>
              <Status>{p.status}</Status>
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
            <h3>Team</h3>
            <div className="team-list">
              {((p.data.members as string[]) || []).map((id) => {
                const u = data.users.find((u) => u.id === id);
                return (
                  <span key={id}>
                    <span className="avatar">{initials(u?.name || id)}</span>
                    {u?.name}
                  </span>
                );
              })}
            </div>
            <div className="section-heading">
              <h3>Tasks & dependencies</h3>
              <button
                onClick={() => {
                  setPrompt("Propose a task for project " + p.id + ": ");
                  go("chat");
                }}
              >
                <Plus size={15} />
                Propose task
              </button>
            </div>
            {tasks.map((t) => (
              <div className="task-row" key={t.id}>
                <CheckCircle2 size={17} />
                <span>
                  <strong>{t.title}</strong>
                  <small>
                    {data.users.find((u) => u.id === t.owner)?.name}
                    {((t.data.dependsOn as string[]) || []).length
                      ? ` · Depends on ${(t.data.dependsOn as string[]).map((id) => data.records.find((r) => r.id === id)?.title).join(", ")}`
                      : ""}
                  </small>
                </span>
                {t.owner === data.user.id || data.user.role === "admin" ? (
                  <select
                    aria-label={"Task status for " + t.title}
                    value={t.status}
                    disabled={busy}
                    onChange={(e) =>
                      act({ action: "task", id: t.id, status: e.target.value })
                    }
                  >
                    {["Open", "In progress", "Done"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <Status>{t.status}</Status>
                )}
              </div>
            ))}
            <h3 className="spaced">Related documents & incidents</h3>
            {data.records
              .filter((r) => r.project === p.id && r.type !== "Tasks")
              .map(sourceRow)}
          </div>
        );
      }
      return (
        <div className="standard-page">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BETTER, TOGETHER</span>
              <h1>Projects</h1>
              <p className="muted">
                The people, knowledge, and tasks behind your next milestone.
              </p>
            </div>
            <button className="primary" onClick={projectForm}>
              <Plus size={16} />
              Create project
            </button>
          </div>
          {projects.map((p) => {
            const tasks = data.records.filter(
                (r) => r.type === "Tasks" && r.project === p.id,
              ),
              done = tasks.filter((t) => t.status === "Done").length;
            return (
              <button
                key={p.id}
                className="project-row"
                onClick={() => go("projects/" + p.id)}
              >
                <span className="project-folder">
                  <Folder size={23} />
                </span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <div className="avatar-stack">
                    {((p.data.members as string[]) || []).map((id) => (
                      <span
                        className="avatar"
                        key={id}
                        title={data.users.find((u) => u.id === id)?.name}
                      >
                        {initials(
                          data.users.find((u) => u.id === id)?.name || id,
                        )}
                      </span>
                    ))}
                    <small>{tasks.length} tasks</small>
                  </div>
                </div>
                <div className="project-percent">
                  <strong>
                    {tasks.length ? Math.round((done / tasks.length) * 100) : 0}
                    %
                  </strong>
                  <small>complete</small>
                </div>
                <ChevronRight size={17} />
              </button>
            );
          })}
        </div>
      );
    }
    if (section === "it")
      return (
        <div className="standard-page">
          <div className="section-heading">
            <div>
              <span className="eyebrow">KEEP YOUR TEAM MOVING</span>
              <h1>IT Operations</h1>
              <p className="muted">
                Equipment, incidents, and governed replacement requests.
              </p>
            </div>
            <button
              className="primary"
              disabled={busy}
              onClick={() =>
                send(
                  "Find unresolved laptop issues affecting Project Alpha, check the replacement policy, prepare requests and send to the IT Manager for approval.",
                )
              }
            >
              <Sparkles size={16} />
              Review replacements
            </button>
          </div>
          <div className="inline-note">
            <Monitor size={18} />
            <span>
              Connected to the same search, documents, approvals, and audit
              history.
            </span>
          </div>
          <h3>Unresolved incidents</h3>
          {data.records
            .filter(
              (r) =>
                r.type === "IT" &&
                r.data.category === "Incident" &&
                !["Resolved", "Closed"].includes(r.status),
            )
            .map(sourceRow)}
          <h3 className="spaced">Assets & procurement</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset / request</th>
                  <th>Assigned to</th>
                  <th>Project</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.records
                  .filter(
                    (r) => r.type === "IT" && r.data.category !== "Incident",
                  )
                  .map((r) => (
                    <tr key={r.id}>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => openRecord(r)}
                        >
                          {r.title}
                        </button>
                        <small>
                          {String(r.data.serial || r.data.category || "")}
                        </small>
                      </td>
                      <td>{data.users.find((u) => u.id === r.owner)?.name}</td>
                      <td>
                        {data.records.find((p) => p.id === r.project)?.title ||
                          "—"}
                      </td>
                      <td>
                        <Status>{r.status}</Status>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    if (section === "hr")
      return (
        <div className="standard-page">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PEOPLE FIRST</span>
              <h1>People & HR</h1>
              <p className="muted">Find your people. Take time to recharge.</p>
            </div>
            <button className="primary" onClick={leaveForm}>
              <Calendar size={16} />
              Request leave
            </button>
          </div>
          <div className="leave-balance">
            <Calendar size={22} />
            <span>
              <strong>{data.user.leaveBalance} days</strong>
              <small>Your available annual leave · working days</small>
            </span>
            <button
              onClick={() =>
                openRecord(data.records.find((r) => r.id === "policy-leave")!)
              }
            >
              Read policy <ExternalLink size={14} />
            </button>
          </div>
          <h3>Your permitted HR records</h3>
          {data.records.filter((r) => r.type === "HR").map(sourceRow)}
          <h3 className="spaced">Employee directory</h3>
          <div className="people-grid">
            {data.users.map((u) => (
              <div className="person-row" key={u.id}>
                <span className="avatar">{initials(u.name)}</span>
                <span>
                  <strong>{u.name}</strong>
                  <small>{u.department}</small>
                  <a href={"mailto:" + u.email}>{u.email}</a>
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    if (section === "customize")
      return (
        <div className="standard-page">
          <span className="eyebrow">A WORKSPACE THAT WORKS YOUR WAY</span>
          <h1>Customize</h1>
          <p className="muted">
            Start from a template, bring your records, or configure your
            workspace.
          </p>
          <div className="search-tabs">
            {["Templates", "Legacy import", "Workspace"].map((t) => (
              <button
                key={t}
                onClick={() => setCustomTab(t)}
                className={customTab === t ? "active" : ""}
              >
                {t}
              </button>
            ))}
          </div>
          {customTab === "Templates" && (
            <>
              <h3 className="spaced">Document templates</h3>
              {(
                data.settings.templates as { name: string; content: string }[]
              ).map((t) => (
                <button
                  key={t.name}
                  className="template-row"
                  onClick={() => newDocument(t)}
                >
                  <span className="source-icon">
                    <FileText size={19} />
                  </span>
                  <span>
                    <strong>{t.name}</strong>
                    <small>
                      Create an editable document with version history
                    </small>
                  </span>
                  <Plus size={18} />
                </button>
              ))}
              <h3 className="spaced">Workflow templates</h3>
              {(data.settings.workflowTemplates as string[]).map((t, i) => (
                <button
                  className="template-row"
                  key={t}
                  onClick={() => {
                    setPrompt(
                      i === 0
                        ? "Prepare laptop replacement requests for Alpha and submit for approval"
                        : i === 1
                          ? "Generate a Project Alpha progress report"
                          : "",
                    );
                    i === 2 ? leaveForm() : go("chat");
                  }}
                >
                  <span className="source-icon">
                    <Briefcase size={19} />
                  </span>
                  <span>
                    <strong>{t}</strong>
                    <small>Review the instruction before running</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </>
          )}
          {customTab === "Legacy import" && (
            <div className="import-area">
              <div className="inline-note">
                <Upload size={18} />
                <span>
                  Local CSV import. Validate and preview before confirming.
                  Administrator access required.
                </span>
              </div>
              <label>
                Record type
                <select
                  value={importKind}
                  onChange={(e) => {
                    setImportKind(e.target.value);
                    setImportPreview(undefined);
                  }}
                >
                  {["Assets", "Projects", "Employees"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Choose CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 1000000) {
                        setError("CSV limit is 1 MB");
                        return;
                      }
                      setCsv(await f.text());
                      setImportPreview(undefined);
                    }
                  }}
                />
              </label>
              <label>
                CSV content
                <textarea
                  rows={7}
                  value={csv}
                  onChange={(e) => {
                    setCsv(e.target.value);
                    setImportPreview(undefined);
                  }}
                />
              </label>
              <h4>Column mapping</h4>
              <div className="mapping-grid">
                {[
                  "id",
                  "title",
                  "body",
                  "department",
                  ...(importKind === "Employees" ? ["email"] : []),
                ].map((key) => (
                  <label key={key}>
                    {key}
                    <input
                      value={mapping[key]}
                      onChange={(e) => {
                        setMapping({ ...mapping, [key]: e.target.value });
                        setImportPreview(undefined);
                      }}
                    />
                  </label>
                ))}
              </div>
              <button
                className="primary"
                disabled={busy || data.user.role !== "admin"}
                onClick={async () => {
                  const result = await act(
                    {
                      action: "import",
                      kind: importKind,
                      csv,
                      mapping,
                      confirm: false,
                    },
                    "Validation complete",
                  );
                  if (result) setImportPreview(result);
                }}
              >
                Validate & preview
              </button>
              {importPreview && (
                <div className="import-preview">
                  <h3>{importPreview.count} records found</h3>
                  {importPreview.errors.map((e) => (
                    <p className="error-text" key={e}>
                      {e}
                    </p>
                  ))}
                  {importPreview.rows.slice(0, 10).map((r, i) => (
                    <p key={i}>
                      {r.id} · {r.title}
                    </p>
                  ))}
                  {importPreview.receipt ? (
                    <div className="receipt">
                      Import receipt: {importPreview.receipt.id}
                    </div>
                  ) : (
                    <button
                      className="primary"
                      disabled={busy || importPreview.errors.length > 0}
                      onClick={async () => {
                        const result = await act(
                          {
                            action: "import",
                            kind: importKind,
                            csv,
                            mapping,
                            confirm: true,
                          },
                          "Import completed",
                        );
                        if (result) setImportPreview(result);
                      }}
                    >
                      Confirm import
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {customTab === "Workspace" && (
            <>
              <p className="inline-note">
                Administrator configuration includes workspace, departments,
                roles, modules, templates, custom fields, and approval
                reviewers.
              </p>
              <label>
                Workspace configuration
                <textarea
                  className="config-editor"
                  rows={24}
                  spellCheck={false}
                  value={settingsText}
                  onChange={(e) => setSettingsText(e.target.value)}
                  readOnly={data.user.role !== "admin"}
                />
              </label>
              <button
                className="primary"
                disabled={busy || data.user.role !== "admin"}
                onClick={() => {
                  try {
                    act(
                      { action: "settings", value: JSON.parse(settingsText) },
                      "Workspace configuration saved",
                    );
                  } catch {
                    setError("Configuration must be valid JSON");
                  }
                }}
              >
                Save configuration
              </button>
            </>
          )}
        </div>
      );
    if (section === "notifications")
      return (
        <div className="standard-page">
          <div className="section-heading">
            <h1>Notifications</h1>
            <button
              onClick={() =>
                act(
                  { action: "readNotifications" },
                  "Notifications marked as read",
                )
              }
            >
              Mark all read
            </button>
          </div>
          {data.notifications.length ? (
            data.notifications.map((n) => (
              <div
                className={"notification-row " + (!n.read ? "unread" : "")}
                key={n.id}
              >
                <Bell size={18} />
                <span>
                  <p>{n.text}</p>
                  <small>{date(n.created)}</small>
                </span>
                {!n.read && <span className="unread-dot" />}
              </div>
            ))
          ) : (
            <Empty title="Nothing new for now" />
          )}
        </div>
      );
    if (section === "settings")
      return (
        <div className="standard-page settings-page">
          <span className="eyebrow">YOUR SINGULARITY WORKSPACE</span>
          <h1>Settings</h1>
          <section>
            <h3>Profile & local demo identity</h3>
            <p className="muted">
              All accounts are fictional. Role switching is for this local
              prototype.
            </p>
            <label>
              Active employee
              <select
                aria-label="Active employee"
                value={data.user.id}
                disabled={busy}
                onChange={(e) => {
                  act(
                    { action: "switchUser", id: e.target.value },
                    "Active employee changed",
                  );
                  go("settings");
                }}
              >
                {data.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.role.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {data.user.email} · {data.user.department}
            </p>
          </section>
          <section>
            <h3>Appearance</h3>
            <div className="appearance-options">
              <button
                className={!dark ? "selected" : ""}
                onClick={() => setDark(false)}
              >
                <Sun size={18} />
                Light
              </button>
              <button
                className={dark ? "selected" : ""}
                onClick={() => setDark(true)}
              >
                <Moon size={18} />
                Dark
              </button>
            </div>
          </section>
          <section>
            <div className="section-heading">
              <h3>Gemini connection</h3>
              <Status>{data.mode}</Status>
            </div>
            <p className="muted">
              Your key stays on the server. It is never sent to this browser.
            </p>
            <ol className="setup-steps">
              <li>
                Open <code>C:\Users\spond\Singularity\d36\.env.local</code>
              </li>
              <li>
                Add your key after <code>GEMINI_API_KEY=</code>
              </li>
              <li>
                Restart the app with <code>npm.cmd run dev</code>
              </li>
            </ol>
            <p>
              Model: <code>{data.model}</code>. Set <code>GEMINI_MODEL</code> in
              the same file to change it.
            </p>
            <p className="muted">
              Without a key, local search, predefined workflows, documents, and
              authorized approvals work in offline local mode.
            </p>
          </section>
          <section>
            <h3>Activity & audit trail</h3>
            {data.audit.slice(0, 20).map((a) => (
              <div className="audit-row" key={a.id}>
                <span>
                  <strong>{a.action}</strong>
                  <small>{a.detail}</small>
                </span>
                <small>{date(a.created)}</small>
              </div>
            ))}
          </section>
        </div>
      );
    return (
      <div className="standard-page">
        <Empty title="This page isn’t available">
          Use the workspace navigation to continue.
        </Empty>
        <button onClick={() => go("")}>Back to home</button>
      </div>
    );
  };
  return (
    <div className={"enterprise-app " + (collapsed ? "sidebar-collapsed" : "")}>
      {drawer && (
        <button
          className="drawer-overlay"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside className={"sidebar " + (drawer ? "drawer-open" : "")}>
        <div className="sidebar-brand">
          <button className="brand-link" onClick={() => go("")}>
            <Mark small />
            <span>
              Singularity<span className="brand-sub">BRAHMAGPT</span>
            </span>
          </button>
          <button
            className="sidebar-toggle"
            aria-label="Collapse navigation"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <PanelLeftClose size={17} />
            )}
          </button>
        </div>
        <button className="workspace-picker" onClick={() => go("settings")}>
          <span className="workspace-letter">S</span>
          <span>
            {String(data?.settings.workspace || "Singularity")}
            <small>Enterprise workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <button
              title={n.label}
              key={n.id}
              className={section === n.id ? "active" : ""}
              onClick={() => {
                go(n.id);
                if (n.id === "chat") setPrompt("");
              }}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.id === "search" && <kbd>⌘ K</kbd>}
            </button>
          ))}
        </nav>
        <p className="nav-caption">WORKSPACE</p>
        <nav aria-label="Workspace modules">
          {[
            { id: "it", label: "IT Operations", icon: Monitor },
            { id: "hr", label: "People & HR", icon: Users },
            { id: "approvals", label: "Approvals", icon: ShieldCheck },
          ]
            .filter(
              (n) =>
                n.id === "approvals" ||
                !data ||
                ((data.settings.modules as string[]) || []).includes(
                  n.id.toUpperCase(),
                ),
            )
            .map((n) => (
              <button
                title={n.label}
                key={n.id}
                className={section === n.id ? "active" : ""}
                onClick={() => go(n.id)}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
                {n.id === "approvals" &&
                  !!data?.approvals.filter(
                    (a) => a.status === "PENDING_APPROVAL",
                  ).length && (
                    <span className="nav-count">
                      {
                        data.approvals.filter(
                          (a) => a.status === "PENDING_APPROVAL",
                        ).length
                      }
                    </span>
                  )}
              </button>
            ))}
        </nav>
        <div className="sidebar-recents">
          <p className="nav-caption">RECENT CHATS</p>
          {data?.chats.slice(0, 4).map((c) => (
            <button
              title={c.title}
              key={c.id}
              onClick={() => go("chat/" + c.id)}
            >
              <MessageSquare size={15} />
              <span>{c.title}</span>
            </button>
          ))}
          {!data?.chats.length && (
            <p className="empty-recents">
              A little space for your next big idea.
            </p>
          )}
        </div>
        <div className="sidebar-bottom">
          <button
            className={section === "settings" ? "active" : ""}
            onClick={() => go("settings")}
            title="Settings"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="profile-button" onClick={() => go("settings")}>
            <span className="avatar">
              {initials(data?.user.name || "Maya Rao")}
            </span>
            <span>
              <strong>{data?.user.name || "Maya Rao"}</strong>
              <small>{data?.user.department || "Your workspace"}</small>
            </span>
            <MoreHorizontal size={17} />
          </button>
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setDrawer(true)}
            >
              <PanelLeftOpen size={20} />
            </button>
            <span className="breadcrumb">
              Workspace
              <ChevronRight size={13} />
              <strong>
                {section
                  ? section === "it"
                    ? "IT Operations"
                    : section === "hr"
                      ? "People & HR"
                      : section.charAt(0).toUpperCase() + section.slice(1)
                  : "Home"}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="connection-label">
              <span
                className={
                  data?.mode === "LIVE GEMINI" ? "live-dot" : "offline-dot"
                }
              />
              {data?.mode === "LIVE GEMINI"
                ? "Live Gemini"
                : "Offline local mode"}
            </span>
            <button
              aria-label="Toggle theme"
              title="Toggle theme"
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() => go("notifications")}
            >
              <Bell size={18} />
              {!!data?.notifications.some((n) => !n.read) && <span />}
            </button>
            <span className="topbar-separator" />
            <button
              className="topbar-avatar avatar"
              aria-label="Profile and settings"
              onClick={() => go("settings")}
            >
              {initials(data?.user.name || "Maya Rao")}
            </button>
          </div>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="page-body">{content()}</div>
      </main>
      {preview && (
        <>
          <button
            className="preview-overlay"
            aria-label="Close preview"
            onClick={() => setPreview(undefined)}
          />
          <aside className="source-preview">
            <div className="section-heading">
              <span className="eyebrow">SOURCE PREVIEW</span>
              <button
                aria-label="Close source preview"
                onClick={() => setPreview(undefined)}
              >
                <X size={19} />
              </button>
            </div>
            <span className="source-icon">
              <FileText size={23} />
            </span>
            <h2>{preview.title}</h2>
            <div className="preview-meta">
              {preview.type} · {preview.department} · {date(preview.updated)}
            </div>
            <Status>{preview.status}</Status>
            <p className="preview-body">{preview.body}</p>
            <h4>Source details</h4>
            <dl>
              <dt>Record ID</dt>
              <dd>{preview.id}</dd>
              <dt>Owner</dt>
              <dd>{data?.users.find((u) => u.id === preview.owner)?.name}</dd>
              {preview.project && (
                <>
                  <dt>Related project</dt>
                  <dd>
                    <button
                      className="text-button"
                      onClick={() => {
                        go("projects/" + preview.project);
                        setPreview(undefined);
                      }}
                    >
                      {
                        data?.records.find((r) => r.id === preview.project)
                          ?.title
                      }
                    </button>
                  </dd>
                </>
              )}
            </dl>
            <h4>Related records</h4>
            {data?.records
              .filter(
                (r) =>
                  r.id !== preview.id &&
                  ((r.project && r.project === preview.project) ||
                    r.data.assetId === preview.id ||
                    preview.data.assetId === r.id),
              )
              .slice(0, 6)
              .map((r) => (
                <button
                  className="related-record"
                  key={r.id}
                  onClick={() => setPreview(r)}
                >
                  <Link2 size={14} />
                  {r.title}
                </button>
              ))}
          </aside>
        </>
      )}
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(undefined);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="modal"
          >
            <div className="section-heading">
              <h2 id="modal-title">{modal.title}</h2>
              <button
                aria-label="Close dialog"
                onClick={() => setModal(undefined)}
              >
                <X size={19} />
              </button>
            </div>
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
            <fieldset disabled={busy}>{modal.content}</fieldset>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
        </div>
      )}
      <input
        type="file"
        hidden
        ref={fileRef}
        accept=".txt,.md,.csv"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 1000000) {
            setError("Attachment limit is 1 MB");
            return;
          }
          const content = await f.text();
          const d = await act(
            {
              action: "draft",
              title: f.name,
              content,
              department: data?.user.department,
            },
            "File saved and indexed as a document",
          );
          if (d) go("documents/" + d.id);
          e.target.value = "";
        }}
      />
    </div>
  );
}
