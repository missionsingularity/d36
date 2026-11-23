"use client";
import {
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  Paperclip,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Check,
  CheckCircle2,
  X,
  MoreHorizontal,
  Sun,
  Moon,
  Briefcase,
  ShieldCheck,
  Download,
  History,
  ExternalLink,
  LogOut,
  Loader2,
  Link2,
  Upload,
  Command,
  BookOpen,
  ArrowRight,
  Calendar,
  AlertCircle,
  Copy,
  CircleHelp,
  SquarePen,
  Database,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import WorkspaceHome from "./workspace-home";
import MessageBody from "./message-body";
import WorkEngine from "./work-engine";
import OrganizationDirectory from "./organization-directory";
import ProjectWorkspace from "./project-workspace";
import LoginPanel from "./login-panel";
import { requestJson } from "./request-json";
import type {
  Snapshot,
  RecordItem,
  DocumentItem,
  Workflow,
  Version,
} from "@/lib/enterprise/types";

const nav = [
  { id: "", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "projects", label: "Projects", icon: Folder },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "people", label: "People", icon: Users },
  { id: "approvals", label: "Reviews", icon: ShieldCheck },
  { id: "it", label: "IT Operations", icon: Monitor },
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
      <img
        src="/brand/brahmagpt-lotus-white.svg"
        alt=""
        aria-hidden="true"
        width="43"
        height="43"
      />
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

function StartupScreen({
  title,
  message,
  loading = false,
  userName,
  onRetry,
  onSignOut,
}: {
  title: string;
  message?: string;
  loading?: boolean;
  userName?: string;
  onRetry?: () => void;
  onSignOut?: () => void;
}) {
  return (
    <main className="startup-screen">
      <section className="startup-card" role={loading ? "status" : undefined} aria-live="polite">
        <Mark small />
        <h1>{title}</h1>
        {userName && <p className="muted">Signed in as {userName}</p>}
        {loading ? <Loader2 className="startup-spinner" aria-hidden="true" /> : null}
        {message && <p className="startup-message" role="alert">{message}</p>}
        {(onRetry || onSignOut) && (
          <div className="startup-actions">
            {onRetry && <button className="primary" onClick={onRetry}>Retry</button>}
            {onSignOut && <button onClick={onSignOut}>Sign out</button>}
          </div>
        )}
      </section>
    </main>
  );
}

export default function EnterpriseWorkspace() {
  const pathname = usePathname(),
    router = useRouter(),
    searchParams = useSearchParams(),
    parts = pathname.split("/").filter(Boolean),
    section = parts[0] || "",
    selectedId = parts[1];
  const [data, setData] = useState<Snapshot>();
  const [authState, setAuthState] = useState<"checking" | "signedIn" | "signedOut" | "error">("checking");
  const [sessionUser, setSessionUser] = useState<{ name: string }>();
  const [authError, setAuthError] = useState("");
  const [workspaceState, setWorkspaceState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [workspaceError, setWorkspaceError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [searchActive, setSearchActive] = useState(
    searchParams.has("q") ||
      searchParams.get("view") === "search" ||
      section === "search",
  );
  const [toast, setToast] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState("Pending");
  const [profileMenu, setProfileMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState("General");
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    connectionVariable: string | null;
    supabaseApiConfigured: boolean;
    message: string;
  }>();
  const [supabaseBusy, setSupabaseBusy] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationBadgeEnabled, setNotificationBadgeEnabled] =
    useState(true);
  const [landingPagePreference, setLandingPagePreference] = useState("");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [sourceList, setSourceList] = useState<RecordItem[]>();
  const [searchDepartment, setSearchDepartment] = useState("All departments");
  const [searchOwner, setSearchOwner] = useState("Anyone");
  const [drawer, setDrawer] = useState(false);
  const { appearance, setAppearance } = useTheme();
  const [prompt, setPrompt] = useState(""),
    [workMode, setWorkMode] = useState(false),
    [query, setQuery] = useState(searchParams.get("q") || ""),
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
      "id,title,body,department\nlegacy-asset-01,SG-WS-2018 · QA workstation,QA workstation used for browser compatibility checks,IT\nlegacy-asset-02,SG-NAS-04 · Backup storage,Encrypted local backup storage for evaluation records,IT\nlegacy-asset-03,SG-SW-12 · Office network switch,Managed switch serving the engineering lab,IT",
    ),
    [importKind, setImportKind] = useState("Assets"),
    [importExample, setImportExample] = useState("assets"),
    [mapping, setMapping] = useState<Record<string, string>>({
      id: "id",
      title: "title",
      body: "body",
      department: "department",
      email: "email",
      owner: "owner",
      project: "project",
      members: "members",
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
  const renderedChat = useRef<string | undefined>(undefined);
  const modalRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const landingPreferenceApplied = useRef(false);
  const searchSequence = useRef(0);
  const sessionRequestVersion = useRef(0);
  const workspaceRequestVersion = useRef(0);
  const currentDocument = data?.documents.find((d) => d.id === selectedId);
  const chat = data?.chats.find((c) => c.id === selectedId);
  const run = data?.workflows.find((r) => r.id === selectedId);
  const selectedVersion =
    currentDocument?.versions.find((v) => v.id === versionId) ||
    currentDocument?.versions.at(-1);
  const visibleApprovals = (data?.approvals || [])
    .filter((approval) => {
      if (approvalFilter === "Pending")
        return approval.status === "PENDING_APPROVAL";
      if (approvalFilter === "Approved")
        return ["APPROVED", "COMPLETED"].includes(approval.status);
      if (approvalFilter === "Rejected") return approval.status === "REJECTED";
      if (approvalFilter === "Returned") return approval.status === "RETURNED";
      return true;
    })
    .sort((a, b) => b.created.localeCompare(a.created));
  async function checkSession() {
    const requestVersion = ++sessionRequestVersion.current;
    setAuthState("checking");
    setAuthError("");
    try {
      const { response, body } = await requestJson("/api/auth?session=1", {}, 12_000);
      if (requestVersion !== sessionRequestVersion.current) return false;
      if (response.status === 401 || (response.ok && body.authenticated === false)) {
        setSessionUser(undefined);
        setAuthState("signedOut");
        return false;
      }
      if (!response.ok) {
        const message = typeof body.error === "string" ? body.error : "Your sign-in could not be checked. Retry or sign out.";
        throw new Error(typeof body.requestId === "string" ? `${message} Reference: ${body.requestId}` : message);
      }
      if (body.authenticated !== true) throw new Error("Your sign-in response was incomplete. Retry or sign out.");
      setSessionUser(body.user as { name: string } | undefined);
      setAuthState("signedIn");
      setWorkspaceState(data ? "ready" : "idle");
      return true;
    } catch (e) {
      if (requestVersion !== sessionRequestVersion.current) return false;
      const message = e instanceof Error ? e.message : "Your sign-in could not be checked. Retry or sign out.";
      setAuthError(message);
      setAuthState("error");
      throw e;
    }
  }
  async function refresh() {
    const requestVersion = ++workspaceRequestVersion.current;
    const { response: res, body: json } = await requestJson("/api/workspace", {}, 20_000);
    if (requestVersion !== workspaceRequestVersion.current) return json as Snapshot;
    if (!res.ok) {
      if (res.status === 401) {
        setAuthState("signedOut");
        setData(undefined);
      }
      const message = typeof json.error === "string" ? json.error : "Your workspace could not be loaded. Retry or sign out.";
      throw new Error(typeof json.requestId === "string" ? `${message} Reference: ${json.requestId}` : message);
    }
    setData(json as Snapshot);
    setAuthState("signedIn");
    setSessionUser({ name: json.user.name });
    setWorkspaceState("ready");
    setWorkspaceError("");
    return json as Snapshot;
  }
  useEffect(() => {
    checkSession().catch((e) => {
      setAuthError(e instanceof Error ? e.message : "Your sign-in could not be checked. Retry or sign out.");
      setAuthState("error");
    });
    try {
      setCollapsed(
        localStorage.getItem("singularity-sidebar-collapsed") === "true",
      );
      setNotificationBadgeEnabled(
        localStorage.getItem("brahma-notification-badge") !== "false",
      );
      setLandingPagePreference(
        localStorage.getItem("brahma-landing-page") || "",
      );
    } catch {}
  }, []);
  useEffect(() => {
    if (authState !== "signedIn" || data || workspaceState !== "idle") return;
    let active = true;
    setWorkspaceState("loading");
    refresh().catch((e) => {
      if (!active) return;
      setWorkspaceError(e instanceof Error ? e.message : "Your workspace could not be loaded. Retry or sign out.");
      setWorkspaceState("error");
    });
    return () => { active = false; };
  }, [authState, data, workspaceState]);
  useEffect(() => {
    if (authState === "signedIn" && section === "profile") router.replace("/");
  }, [authState, section, router]);
  useEffect(() => {
    if (landingPreferenceApplied.current) return;
    landingPreferenceApplied.current = true;
    if (
      section === "" &&
      !searchParams.has("q") &&
      searchParams.get("view") !== "search"
    ) {
      try {
        const preferred = localStorage.getItem("brahma-landing-page");
        if (preferred && preferred !== "home") router.replace("/" + preferred);
      } catch {}
    }
  }, [section, searchParams, router]);
  useEffect(() => {
    if (!notificationsOpen) return;
    const outside = (event: PointerEvent) => {
      if (!notificationPanelRef.current?.contains(event.target as Node))
        setNotificationsOpen(false);
    };
    window.addEventListener("pointerdown", outside);
    return () => window.removeEventListener("pointerdown", outside);
  }, [notificationsOpen]);
  useEffect(() => {
    if (!profileMenu) return;
    const outside = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node))
        setProfileMenu(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenu(false);
    };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("keydown", escape);
    };
  }, [profileMenu]);
  const queryString = searchParams.toString();
  useEffect(() => {
    if (section === "search") {
      router.replace(
        "/?" +
          (searchParams.get("q")
            ? "q=" + encodeURIComponent(searchParams.get("q")!)
            : "view=search"),
      );
      return;
    }
    if (section === "") {
      const value = searchParams.get("q") || "";
      setQuery(value);
      setSearchActive(
        searchParams.has("q") || searchParams.get("view") === "search",
      );
    }
    if (section === "chat" && !selectedId) {
      const agent = searchParams.get("agent");
      const initial = searchParams.get("prompt") || "";
      setPrompt(initial);
      setWorkMode(searchParams.get("mode") === "work" || !!agent);
    }
  }, [section, selectedId, queryString, router]);
  useEffect(() => {
    setDrawer(false);
    setPreview(undefined);
    setSourceList(undefined);
    setError("");
  }, [pathname]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const container = modalRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container
      ?.querySelector<HTMLElement>("input, textarea, select, button")
      ?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !container) return;
      const items = [
        ...container.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]",
        ),
      ];
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    container?.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = overflow;
      container?.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [modal]);
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
    if (!chat) return;
    bottom.current?.scrollIntoView({
      behavior: renderedChat.current === chat.id ? "smooth" : "auto",
      block: "end",
    });
    renderedChat.current = chat.id;
  }, [chat?.id, chat?.messages.length]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>(".enterprise-search-input")
          ?.focus() ||
          document
            .querySelector<HTMLTextAreaElement>(".composer textarea")
            ?.focus();
      }
      if (e.key === "Escape") {
        setModal(undefined);
        setPreview(undefined);
        setDrawer(false);
        setSourceList(undefined);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);
  useEffect(() => {
    if (!(section === "search" || (section === "" && searchActive))) return;
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
  }, [section, searchActive, query, searchType, data?.records.length]);
  function openSearch(value = query) {
    setQuery(value);
    setSearchActive(true);
    router.replace(
      "/" + (value.trim() ? "?q=" + encodeURIComponent(value) : "?view=search"),
      { scroll: false },
    );
  }
  function startConversation(value: string, work = false) {
    setPrompt(value);
    setWorkMode(work);
    router.push(
      "/chat?prompt=" + encodeURIComponent(value) + (work ? "&mode=work" : ""),
      { scroll: false },
    );
  }
  function startNewChat() {
    setPrompt("");
    setWorkMode(false);
    setQuery("");
    setSearchActive(false);
    setSearchType("All");
    router.push("/", { scroll: false });
    window.setTimeout(() => {
      document
        .querySelector<HTMLTextAreaElement>(".composer textarea")
        ?.focus();
    }, 40);
  }
  function go(path: string) {
    if (path === "hr") path = "people";
    if (path === "search") {
      openSearch();
      return;
    }
    if (path === "") {
      setQuery("");
      setSearchActive(false);
      setSearchType("All");
      setSearchDepartment("All departments");
      setSearchOwner("Anyone");
    }
    if (path === "chat") {
      setPrompt("");
      setWorkMode(false);
    }
    router.push("/" + path);
  }
  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const { response: res, body: json } = await requestJson("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, 20_000);
      if (res.status === 401) setAuthState("signedOut");
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
  async function signOut() {
    sessionRequestVersion.current++;
    workspaceRequestVersion.current++;
    await requestJson("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    }, 8_000).catch(() => undefined);
    setData(undefined);
    setSessionUser(undefined);
    setWorkspaceState("idle");
    setAuthState("signedOut");
    setProfileMenu(false);
    router.replace("/");
  }
  async function changeDemoRole(role: "admin" | "manager" | "employee") {
    setBusy(true);
    try {
      const { response, body: result } = await requestJson("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switchDemoRole", role }),
      }, 12_000);
      if (!response.ok) throw new Error(result.error);
      setProfileMenu(false);
      router.replace("/");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not switch role.");
    } finally {
      setBusy(false);
    }
  }
  async function send(text = prompt) {
    if (!text.trim() || busy) return;
    const value = text;
    if (workMode) {
      setBusy(true);
      try {
        const agentId = /laptop|replace|incident/i.test(value)
          ? "it"
          : /project|report|progress/i.test(value)
            ? "project"
            : "research";
        const response = await fetch("/api/work-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "launch",
            input: { agentId, instruction: value, mode: "auto" },
          }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setPrompt("");
        router.push("/work?run=" + body.result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to start work");
      } finally {
        setBusy(false);
      }
      return;
    }
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
    setSourceList(undefined);
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
        <div className="composer-context">
          <span>
            <ShieldCheck size={13} />
            Your workspace
          </span>
          <span>
            {workMode ? "Plan and carry out work" : "Ask, find, and create"}
          </span>
        </div>
        <textarea
          aria-label="Ask a question or describe a task"
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
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip size={17} />
            </button>
            <button onClick={() => openSearch(prompt)}>
              <Search size={16} />
              <span>Search</span>
            </button>
            <button
              className={workMode ? "mode-active" : ""}
              aria-pressed={workMode}
              onClick={() => setWorkMode(!workMode)}
            >
              <Briefcase size={16} />
              <span>Work mode</span>
            </button>
          </div>
          <span className="composer-hint">
            {busy ? "Working on it…" : "Enter to send"}
          </span>
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
      <button
        className="result-row"
        key={r.id}
        onClick={() => openRecord(r)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            (
              e.currentTarget.nextElementSibling as HTMLButtonElement | null
            )?.focus();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            const previous = e.currentTarget
              .previousElementSibling as HTMLButtonElement | null;
            if (previous) previous.focus();
            else
              document
                .querySelector<HTMLTextAreaElement>(".composer textarea")
                ?.focus();
          }
        }}
      >
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
            {typeof r.data.projectCode === "string"
              ? `Project ${r.data.projectCode}`
              : r.department}
            <span>·</span>Updated {date(r.updated)}
            {r.data.version ? ` · v${r.data.version}` : ""}
          </span>
        </span>
        <ChevronRight size={16} />
      </button>
    );
  }
  const visibleResults = results.filter(
    (r) =>
      (searchDepartment === "All departments" ||
        r.department === searchDepartment) &&
      (searchOwner === "Anyone" || r.owner === searchOwner),
  );
  function workflowView(w: Workflow) {
    return (
      <div className="workflow-view">
        <div className="section-heading">
          <div>
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
        <>
          <WorkspaceHome
            data={data}
            composer={composer()}
            startConversation={startConversation}
            onSearch={openSearch}
            busy={busy}
            compact={section === "chat"}
          />
          {section === "" && searchActive && (
            <section
              className="home-search-results"
              aria-label="Search results"
            >
              <label className="enterprise-search-box">
                <Search size={19} aria-hidden="true" />
                <input
                  className="enterprise-search-input"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      document
                        .querySelector<HTMLButtonElement>(
                          ".home-search-results .search-results .result-row",
                        )
                        ?.focus();
                    }
                    if (event.key === "Escape") setSearchActive(false);
                  }}
                  placeholder="Search documents, people, projects, tasks..."
                  aria-label="Search across Singularity"
                />
                <kbd>Ctrl K</kbd>
              </label>
              <div className="unified-search-actions">
                <button
                  className="primary"
                  disabled={busy || !query.trim()}
                  onClick={() => send(query)}
                >
                  <MessageSquare size={15} />
                  Ask about these records
                </button>
              </div>
              <div className="search-tabs">
                {[
                  "All",
                  "Documents",
                  "People",
                  "Projects",
                  "Tasks",
                  "IT",
                  "HR",
                ].map((type) => (
                  <button
                    key={type}
                    className={searchType === type ? "active" : ""}
                    onClick={() => setSearchType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="section-heading">
                <p className="muted">
                  {searching
                    ? "Searching records you can access…"
                    : `${visibleResults.length} ${query ? "results" : "workspace records"}`}
                </p>
                <span className="filter-label">
                  <ShieldCheck size={14} />
                  Records you can access
                </span>
              </div>
              <div className="search-results">
                {visibleResults.map(sourceRow)}
                {!searching && !visibleResults.length && (
                  <Empty
                    title={
                      query ? "No matching records" : "Search your workspace"
                    }
                  >
                    {query
                      ? "Try a different name or a few words from the document."
                      : "Type a question or record name above to find documents, people and projects."}
                  </Empty>
                )}
              </div>
            </section>
          )}
        </>
      );
    if (section === "chat" && chat)
      return (
        <div className="chat-page">
          <div className="chat-messages">
            {chat.messages.map((m) => {
              const linkedWorkflow = m.runId
                ? data.workflows.find((w) => w.id === m.runId)
                : undefined;
              const visibleMessage =
                linkedWorkflow?.status === "Failed" && linkedWorkflow.documentId
                  ? "Your report draft was saved, but the approval request could not be created. You can retry the approval submission."
                  : m.text;
              return (
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
                    {m.role === "assistant" ? (
                      <MessageBody text={visibleMessage} />
                    ) : (
                      <p className="message-text">{m.text}</p>
                    )}
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
                                    <Status>{e.status}</Status>{" "}
                                    {w.status === "Failed" &&
                                    w.documentId &&
                                    /table approvals has \d+ columns|SQLITE_(?:ERROR|CONSTRAINT)/i.test(
                                      e.detail,
                                    )
                                      ? "Approval submission failed. The saved draft and completed work are available for retry."
                                      : e.detail}
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
                                    {typeof r.data.sourceDocumentId ===
                                      "string" && (
                                      <small className="citation-chip-meta">
                                        {r.data.sourceDocumentId}@v
                                        {String(r.data.version)}
                                      </small>
                                    )}
                                  </button>
                                ))}
                              </div>
                              <div className="message-links">
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        visibleMessage,
                                      );
                                      setToast("Response copied");
                                    } catch {
                                      setError(
                                        "Could not copy. Select the response text to copy it manually.",
                                      );
                                    }
                                  }}
                                >
                                  <Copy size={14} />
                                  Copy response
                                </button>
                                <button
                                  onClick={() => {
                                    setPreview(undefined);
                                    setSourceList(w.sources);
                                  }}
                                >
                                  <BookOpen size={15} />
                                  Sources ({w.sources.length})
                                </button>
                                {w.status === "Failed" && !w.documentId && (
                                  <button
                                    disabled={busy}
                                    onClick={() => send(w.objective)}
                                  >
                                    Retry request
                                  </button>
                                )}
                                {w.status === "Failed" && w.documentId && (
                                  <button
                                    disabled={busy}
                                    onClick={async () => {
                                      const result = (await act(
                                        { action: "retryApproval", id: w.id },
                                        "Approval submitted",
                                      )) as
                                        | {
                                            approvalId: string;
                                            reviewer: string;
                                          }
                                        | undefined;
                                      if (result)
                                        setToast(
                                          `Approval ${result.approvalId} sent to ${result.reviewer}`,
                                        );
                                    }}
                                  >
                                    Retry Approval
                                  </button>
                                )}
                                <button onClick={() => go("work/" + w.id)}>
                                  <Briefcase size={15} />
                                  View Workflow Details
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
                              {m.id === chat.messages.at(-1)?.id &&
                                w.status !== "Failed" && (
                                  <div className="answer-followups">
                                    <span>Keep exploring</span>
                                    <button
                                      onClick={() => {
                                        setPrompt(
                                          "Find policies related to " +
                                            w.objective,
                                        );
                                        document
                                          .querySelector<HTMLTextAreaElement>(
                                            ".chat-composer textarea",
                                          )
                                          ?.focus();
                                      }}
                                    >
                                      Find related policies
                                    </button>
                                    <button
                                      onClick={() => {
                                        openSearch(
                                          w.sources.find(
                                            (r) => r.type === "Projects",
                                          )?.title || "",
                                        );
                                      }}
                                    >
                                      Explore in Search
                                    </button>
                                  </div>
                                )}
                            </>
                          )
                        );
                      })()}
                  </div>
                </article>
              );
            })}
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
              Check each answer against its sources.
            </p>
          </div>
        </div>
      );
    if (section === "search" || (section === "" && searchActive))
      return (
        <div className="search-page">
          <h1>
            {query ? (
              <>
                Results for <span>“{query}”</span>
              </>
            ) : (
              "Search across Singularity"
            )}
          </h1>
          <label className="enterprise-search-box">
            <Search size={19} aria-hidden="true" />
            <input
              className="enterprise-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  document
                    .querySelector<HTMLButtonElement>(
                      ".search-page .search-results .result-row",
                    )
                    ?.focus();
                }
                if (event.key === "Escape") setQuery("");
              }}
              placeholder="Search documents, people, projects, tasks..."
              aria-label="Search across Singularity"
            />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="unified-search-actions">
            <button className="text-button" onClick={() => go("")}>
              <Home size={15} />
              Back to Assistant
            </button>
            <button
              className="primary"
              disabled={busy || !query.trim()}
              onClick={() => send(query)}
            >
              <MessageSquare size={15} />
              Ask about these records
            </button>
          </div>
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
          <div className="search-filter-bar">
            <span>
              <SlidersHorizontal size={14} />
              Filter by
            </span>
            <label className="sr-only" htmlFor="department-filter">
              Department
            </label>
            <select
              id="department-filter"
              value={searchDepartment}
              onChange={(e) => setSearchDepartment(e.target.value)}
            >
              <option>All departments</option>
              {[...new Set(data.records.map((r) => r.department))].map(
                (department) => (
                  <option key={department}>{department}</option>
                ),
              )}
            </select>
            <label className="sr-only" htmlFor="owner-filter">
              Owner
            </label>
            <select
              id="owner-filter"
              value={searchOwner}
              onChange={(e) => setSearchOwner(e.target.value)}
            >
              <option value="Anyone">Anyone</option>
              {data.users.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            {(searchDepartment !== "All departments" ||
              searchOwner !== "Anyone") && (
              <button
                className="clear-filters"
                onClick={() => {
                  setSearchDepartment("All departments");
                  setSearchOwner("Anyone");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
          {!query && data.searchHistory.length > 0 && (
            <div className="search-history">
              <Clock size={14} />
              {data.searchHistory.map((q) => (
                <button key={q} onClick={() => openSearch(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <div className="section-heading">
            <p className="muted">
              {searching
                ? "Searching your permitted records…"
                : `${visibleResults.length} ${query ? "results" : "workspace records"}`}
            </p>
            <span className="filter-label">
              <ShieldCheck size={14} />
              Records you can access
            </span>
          </div>
          <div className="search-results">
            {visibleResults.map(sourceRow)}
            {!searching && !visibleResults.length && (
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
            <h3>Edit document</h3>
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
                {["pdf", "docx", "xlsx", "pptx"].map((format) => (
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
              <h1>Documents</h1>
              <p className="muted">Browse and open documents you can access.</p>
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
            <Empty title="No documents yet">
              Create a document, use a template, or ask BrahmaGPT to prepare a
              report.
            </Empty>
          )}
          <h3 className="spaced">Workspace documents</h3>
          {data.records
            .filter((r) => r.type === "Documents" && !r.data.documentId)
            .map(sourceRow)}
        </div>
      );
    if (section === "work" && run)
      return <div className="standard-page">{workflowView(run)}</div>;
    if (section === "work")
      return (
        <WorkEngine
          user={data.user}
          workspace={data}
          onOpenSource={openRecord}
          onTask={(id, status) => {
            void act({ action: "task", id, status });
          }}
          onApprovals={() => go("approvals")}
        />
      );
    if (section === "approvals")
      return (
        <div className="standard-page">
          <h1>Reviews</h1>
          <p className="muted">
            Every decision is tied to an exact, immutable document version.
          </p>
          <div className="approval-filters" aria-label="Filter approvals">
            {[
              ["Pending", "Waiting for review"],
              ["Approved", "Approved"],
              ["Rejected", "Rejected"],
              ["Returned", "Returned"],
              ["All", "All requests"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={approvalFilter === value ? "active" : ""}
                aria-pressed={approvalFilter === value}
                onClick={() => setApprovalFilter(value)}
              >
                {label}
                <span>
                  {
                    (data.approvals || []).filter((approval) => {
                      if (value === "Pending")
                        return approval.status === "PENDING_APPROVAL";
                      if (value === "Approved")
                        return ["APPROVED", "COMPLETED"].includes(
                          approval.status,
                        );
                      if (value === "Rejected")
                        return approval.status === "REJECTED";
                      if (value === "Returned")
                        return approval.status === "RETURNED";
                      return true;
                    }).length
                  }
                </span>
              </button>
            ))}
          </div>
          {!visibleApprovals.length && (
            <Empty title="You’re all caught up">
              {data.approvals.length
                ? `There are no ${approvalFilter.toLowerCase()} requests for you.`
                : "Requests you submit or are assigned to review will appear here."}
            </Empty>
          )}
          {!!data.approvals.length && (
            <div className="inline-note approval-sample-note">
              <ShieldCheck size={17} />
              <span>
                Sample requests are marked synthetic and link to saved document
                versions. Decisions show who reviewed them and why.
              </span>
            </div>
          )}
          {visibleApprovals.map((a) => {
            const d = data.documents.find((d) => d.id === a.documentId)!;
            const v = d?.versions.find((v) => v.id === a.versionId);
            const reviewer =
              (a.reviewerId
                ? a.reviewerId === data.user.id
                : [a.reviewerRole, "admin"].includes(data.user.role)) &&
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
                      {a.reviewerId
                        ? ` · Assigned to ${data.users.find((u) => u.id === a.reviewerId)?.name || a.reviewerId}`
                        : ""}
                    </p>
                    <small className="approval-context">
                      {data.records.find((record) => record.id === d?.target)
                        ?.title ||
                        d?.department ||
                        "Workspace"}{" "}
                      · {date(a.created)} · Synthetic example
                    </small>
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
                        disabled={busy}
                        onClick={() =>
                          form(
                            "Reject version",
                            <label>
                              Reason
                              <textarea name="comment" required rows={4} />
                            </label>,
                            async (f) =>
                              post({
                                action: "decide",
                                id: a.id,
                                decision: "reject",
                                comment: f.get("comment"),
                              }),
                          )
                        }
                      >
                        Reject version
                      </button>
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() =>
                          form(
                            "Approve this version",
                            <label>
                              Reason for approval
                              <textarea
                                name="comment"
                                required
                                minLength={3}
                                rows={4}
                              />
                            </label>,
                            async (f) =>
                              post({
                                action: "decide",
                                id: a.id,
                                decision: "approve",
                                comment: f.get("comment"),
                              }),
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
        return (
          <ProjectWorkspace
            project={p}
            data={data}
            busy={busy}
            onTask={(id, status) =>
              act({ action: "task", id, status }, "Task status saved")
            }
            onEditTask={(id, fields) =>
              act({ action: "task", id, ...fields }, "Task updated")
            }
            onOpenRecord={openRecord}
            onBack={() => go("projects")}
          />
        );
      }
      return (
        <div className="standard-page">
          <div className="section-heading">
            <div>
              <h1>Projects</h1>
              <p className="muted">View project tasks and team assignments.</p>
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
              <h1>IT Operations</h1>
              <p className="muted">
                Equipment, incidents, and governed replacement requests.
              </p>
            </div>
            <div className="it-header-actions">
              <button
                disabled={busy}
                onClick={() => {
                  const project = data.records.find(
                    (r) =>
                      r.type === "Projects" &&
                      (r.data.members as string[] | undefined)?.includes(
                        data.user.id,
                      ),
                  );
                  send(
                    project
                      ? `Find open incidents and equipment for ${project.title}. Show the related policy.`
                      : "Find open incidents and equipment I can access.",
                  );
                }}
              >
                <MessageSquare size={16} /> Find incidents
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  form(
                    "Log an IT incident",
                    <>
                      <label>
                        What is the issue?
                        <input name="title" required maxLength={200} />
                      </label>
                      <label>
                        What happened?
                        <textarea
                          name="body"
                          required
                          rows={4}
                          maxLength={5000}
                        />
                      </label>
                      <label>
                        Severity
                        <select name="severity" defaultValue="Medium">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                          <option>Critical</option>
                        </select>
                      </label>
                      <label>
                        Related asset
                        <select name="assetId">
                          <option value="">No asset selected</option>
                          {data.records
                            .filter(
                              (r) =>
                                r.type === "IT" && r.data.category === "Asset",
                            )
                            .map((asset) => (
                              <option key={asset.id} value={asset.id}>
                                {asset.title}
                              </option>
                            ))}
                        </select>
                      </label>
                    </>,
                    async (fields) =>
                      post({
                        action: "createITIncident",
                        title: fields.get("title"),
                        body: fields.get("body"),
                        severity: fields.get("severity"),
                        assetId: fields.get("assetId"),
                      }),
                  )
                }
              >
                <Plus size={16} /> Log incident
              </button>
            </div>
          </div>
          <div className="inline-note">
            <Monitor size={18} />
            <span>
              Connected to the same search, documents, reviews, and audit
              history.
            </span>
          </div>
          <div className="it-summary-grid">
            {[
              {
                label: "Open incidents",
                value: data.records.filter(
                  (r) =>
                    r.type === "IT" &&
                    r.data.category === "Incident" &&
                    !["Resolved", "Closed"].includes(r.status),
                ).length,
                icon: AlertCircle,
              },
              {
                label: "High severity",
                value: data.records.filter(
                  (r) =>
                    r.type === "IT" &&
                    r.data.category === "Incident" &&
                    r.data.severity === "High" &&
                    !["Resolved", "Closed"].includes(r.status),
                ).length,
                icon: ShieldCheck,
              },
              {
                label: "Tracked assets",
                value: data.records.filter(
                  (r) => r.type === "IT" && r.data.category === "Asset",
                ).length,
                icon: Monitor,
              },
              {
                label: "Services",
                value: data.records.filter(
                  (r) => r.type === "IT" && r.data.category === "Service",
                ).length,
                icon: Settings,
              },
            ].map((item) => (
              <div className="it-summary-card" key={item.label}>
                <span>
                  <item.icon size={18} />
                </span>
                <div>
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </div>
              </div>
            ))}
          </div>
          <h3>Unresolved incidents</h3>
          {data.records
            .filter(
              (r) =>
                r.type === "IT" &&
                r.data.category === "Incident" &&
                !["Resolved", "Closed"].includes(r.status),
            )
            .map((incident) => (
              <article className="it-incident-card" key={incident.id}>
                {sourceRow(incident)}
                <div className="it-incident-controls">
                  <label>
                    Assigned to
                    <select
                      value={incident.owner}
                      disabled={
                        busy ||
                        !["admin", "it_manager"].includes(data.user.role)
                      }
                      onChange={(event) =>
                        void act(
                          {
                            action: "itIncident",
                            id: incident.id,
                            owner: event.target.value,
                          },
                          "Incident assignment saved",
                        )
                      }
                    >
                      {data.users
                        .filter(
                          (user) =>
                            ["IT", "Engineering"].includes(user.department) ||
                            ["admin", "it_manager"].includes(user.role),
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={incident.status}
                      disabled={
                        busy ||
                        (!["admin", "it_manager"].includes(data.user.role) &&
                          incident.owner !== data.user.id) ||
                        incident.status === "Closed" ||
                        (incident.status === "Resolved" &&
                          !["admin", "it_manager"].includes(data.user.role))
                      }
                      onChange={(event) =>
                        void act(
                          {
                            action: "itIncident",
                            id: incident.id,
                            status: event.target.value,
                          },
                          "Incident status saved",
                        )
                      }
                    >
                      {(incident.status === "Resolved"
                        ? ["Resolved", "Closed"]
                        : [
                            "Open",
                            "In progress",
                            "Investigating",
                            "Pending review",
                            "Resolved",
                            "Closed",
                          ]
                      ).map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
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
                    (r) =>
                      r.type === "IT" &&
                      ["Asset", "Procurement"].includes(
                        String(r.data.category),
                      ),
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
          <h3 className="spaced">Services</h3>
          <div className="it-service-grid">
            {data.records
              .filter((r) => r.type === "IT" && r.data.category === "Service")
              .map((service) => (
                <article className="it-service-card" key={service.id}>
                  <span className="source-icon">
                    <Monitor size={18} />
                  </span>
                  <div>
                    <strong>{service.title}</strong>
                    <p>{service.body}</p>
                  </div>
                  <Status>{service.status}</Status>
                </article>
              ))}
          </div>
        </div>
      );
    if (section === "people" || section === "hr")
      return (
        <OrganizationDirectory
          data={data}
          onOpenRecord={openRecord}
          onOpenApprovals={() => go("approvals")}
          onRequestLeave={leaveForm}
          onNavigateRecord={(record) =>
            record.type === "Projects"
              ? go("projects/" + record.id)
              : go("documents/" + String(record.data.documentId))
          }
        />
      );
    if (section === "customize")
      return (
        <div className="standard-page">
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
              <h3 className="spaced">Workspace modules</h3>
              <div className="custom-module-grid">
                {[
                  {
                    title: "Knowledge",
                    description:
                      "Search approved documents and open their source versions.",
                    count: data.records.filter((r) => r.type === "Documents")
                      .length,
                    detail: "documents",
                    icon: BookOpen,
                    action: () => go("documents"),
                  },
                  {
                    title: "Projects",
                    description:
                      "Review project records, tasks and linked people.",
                    count: data.records.filter((r) => r.type === "Projects")
                      .length,
                    detail: "projects",
                    icon: Folder,
                    action: () => go("projects"),
                  },
                  {
                    title: "People",
                    description:
                      "Find employee profiles, teams and reporting lines.",
                    count: data.users.length,
                    detail: "employees",
                    icon: Users,
                    action: () => go("people"),
                  },
                  {
                    title: "Reviews",
                    description:
                      "Review saved requests linked to exact document versions.",
                    count: data.approvals.filter(
                      (a) => a.status === "PENDING_APPROVAL",
                    ).length,
                    detail: "waiting for review",
                    icon: ShieldCheck,
                    action: () => go("approvals"),
                  },
                  {
                    title: "IT Operations",
                    description:
                      "Track sample incidents, assets and service health.",
                    count: data.records.filter(
                      (r) =>
                        r.type === "IT" &&
                        r.data.category === "Incident" &&
                        !["Resolved", "Closed"].includes(r.status),
                    ).length,
                    detail: "open incidents",
                    icon: Monitor,
                    action: () => go("it"),
                  },
                  {
                    title: "Local imports",
                    description:
                      "Preview and reconcile a CSV file before importing it.",
                    count: data.audit.filter((event) =>
                      /import/i.test(event.action),
                    ).length,
                    detail: "saved imports",
                    icon: Upload,
                    action: () => setCustomTab("Legacy import"),
                  },
                ].map((module) => (
                  <button
                    className="custom-module-card"
                    key={module.title}
                    onClick={module.action}
                  >
                    <span className="custom-module-icon">
                      <module.icon size={19} />
                    </span>
                    <span className="custom-module-copy">
                      <strong>{module.title}</strong>
                      <small>{module.description}</small>
                      <span className="custom-module-count">
                        {module.count} {module.detail}
                      </span>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
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
                    const project = data.records.find(
                      (r) =>
                        r.type === "Projects" &&
                        (r.data.members as string[] | undefined)?.includes(
                          data.user.id,
                        ),
                    );
                    setPrompt(
                      i === 0
                        ? "Review open tasks and prepare a request for approval"
                        : i === 1 && project
                          ? `Prepare a progress report for ${project.title}`
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
                  {["Assets", "Projects", "Employees", "Tasks"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Example CSV
                <select
                  value={importExample}
                  onChange={(e) => {
                    const examples: Record<
                      string,
                      { kind: string; csv: string }
                    > = {
                      assets: {
                        kind: "Assets",
                        csv: "id,title,body,department\nlegacy-asset-11,SG-WS-2201 · QA workstation,QA workstation used for browser compatibility checks,IT\nlegacy-asset-12,SG-NAS-08 · Backup storage,Encrypted local backup storage for evaluation records,IT",
                      },
                      people: {
                        kind: "Employees",
                        csv: "id,title,email,department\nlegacy-employee-01,Jordan Lee,jordan.lee@example.invalid,Engineering\nlegacy-employee-02,Casey Morgan,casey.morgan@example.invalid,People",
                      },
                      projects: {
                        kind: "Projects",
                        csv: "id,title,body,department,members\nlegacy-project-northstar,Northstar knowledge cleanup,Review and tag the shared team library,Engineering,maya;noah\nlegacy-project-onboarding,New starter onboarding refresh,Update the first week checklist,People,leah;sam",
                      },
                      tasks: {
                        kind: "Tasks",
                        csv: "id,title,body,department,owner,project\nlegacy-task-search,Check search result labels,Review names and source links in search results,Engineering,maya,alpha\nlegacy-task-onboarding,Review welcome checklist,Check the first week steps with People Operations,People,leah,atlas",
                      },
                      nis: {
                        kind: "Employees",
                        csv: "id,title,email,department\nnis-sample-01,Avery Kim,avery.kim@example.invalid,Operations\nnis-sample-02,Robin Shah,robin.shah@example.invalid,Engineering",
                      },
                    };
                    const sample = examples[e.target.value];
                    setImportExample(e.target.value);
                    setImportKind(sample.kind);
                    setCsv(sample.csv);
                    setMapping({
                      id: "id",
                      title: "title",
                      body: "body",
                      department: "department",
                      email: "email",
                      owner: "owner",
                      project: "project",
                      members: "members",
                    });
                    setImportPreview(undefined);
                  }}
                >
                  <option value="assets">Asset register</option>
                  <option value="people">Legacy employee list</option>
                  <option value="projects">Project tracker</option>
                  <option value="tasks">Assigned task list</option>
                  <option value="nis">
                    NIS style employee export (sample)
                  </option>
                </select>
                <small>
                  Examples use fictional local data. No NIS or external system
                  is connected.
                </small>
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
                  ...(importKind === "Tasks" ? ["owner", "project"] : []),
                  ...(importKind === "Projects" ? ["members"] : []),
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
    if (section === "profile")
      return (
        <div className="standard-page profile-page">
          <h1>Profile</h1>
          <p className="muted">Your workspace identity and account details.</p>
          <section className="profile-summary-card">
            <span className="profile-large-avatar">
              {initials(data.user.name)}
            </span>
            <div>
              <h2>{data.user.name}</h2>
              <p>{data.user.email}</p>
              <Status>{data.user.role}</Status>
            </div>
          </section>
          <section>
            <h3>Work details</h3>
            <p>
              <strong>Team</strong> · {data.user.department}
            </p>
            <p>
              <strong>Leave available</strong> · {data.user.leaveBalance} days
            </p>
          </section>
          <section>
            <h3>Switch employee</h3>
            <p className="muted">
              Change the active sample account to view its work and approvals.
            </p>
            <label>
              Active employee
              <select
                aria-label="Active employee"
                value={data.user.id}
                disabled={busy}
                onChange={async (event) => {
                  await act(
                    { action: "switchUser", id: event.target.value },
                    "Profile changed",
                  );
                  go("profile");
                }}
              >
                {data.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.role.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
      );
    if (section === "settings")
      return (
        <div className="standard-page settings-page">
          <h1>Settings</h1>
          <div className="settings-layout">
            <nav className="settings-nav" aria-label="Settings sections">
              {[
                "General",
                "Appearance",
                "Usage",
                "Supabase",
                "Activity",
              ].map((tab) => (
                <button
                  key={tab}
                  className={settingsTab === tab ? "active" : ""}
                  aria-current={settingsTab === tab ? "page" : undefined}
                  onClick={() => setSettingsTab(tab)}
                >
                  {tab === "Appearance" ? (
                    <Sun size={16} />
                  ) : tab === "Usage" ? (
                    <Briefcase size={16} />
                  ) : tab === "Supabase" ? (
                    <Database size={16} />
                  ) : tab === "Activity" ? (
                    <History size={16} />
                  ) : (
                    <Settings size={16} />
                  )}
                  {tab}
                </button>
              ))}
            </nav>
            <div className="settings-content">
              {settingsTab === "Appearance" && (
                <section>
                  <h3>Appearance</h3>
                  <p className="muted">
                    Choose how BrahmaGPT looks on this device.
                  </p>
                  <div className="appearance-options appearance-options-chatgpt">
                    {(
                      [
                        ["system", "System", Monitor],
                        ["light", "Light", Sun],
                        ["dark", "Dark", Moon],
                      ] as const
                    ).map(([mode, label, Icon]) => (
                      <button
                        key={mode}
                        className={appearance === mode ? "selected" : ""}
                        aria-pressed={appearance === mode}
                        onClick={() => setAppearance(mode)}
                      >
                        <Icon size={18} />
                        <span>{label}</span>
                        <small>
                          {mode === "system"
                            ? "Match your device"
                            : mode === "light"
                              ? "Bright workspace"
                              : "Low-light workspace"}
                        </small>
                      </button>
                    ))}
                  </div>
                </section>
              )}
              {settingsTab === "General" && (
                <section>
                  <h3>Preferences</h3>
                  <label className="settings-field">
                    Start page
                    <select
                      value={landingPagePreference || "home"}
                      onChange={(event) => {
                        setLandingPagePreference(event.target.value);
                        try {
                          localStorage.setItem(
                            "brahma-landing-page",
                            event.target.value,
                          );
                        } catch {}
                      }}
                    >
                      {[
                        ["home", "Home"],
                        ["work", "Work"],
                        ["projects", "Projects"],
                        ["documents", "Documents"],
                        ["people", "People"],
                        ["approvals", "Reviews"],
                        ["it", "IT Operations"],
                      ].map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <small>Used the next time you open the workspace.</small>
                  </label>
                  <div className="settings-preference-row">
                    <span>
                      <strong>Compact sidebar</strong>
                      <small>
                        Show icons only to leave more room for your work.
                      </small>
                    </span>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        const next = !collapsed;
                        setCollapsed(next);
                        try {
                          localStorage.setItem(
                            "singularity-sidebar-collapsed",
                            String(next),
                          );
                        } catch {}
                      }}
                    >
                      {collapsed ? "Show labels" : "Make compact"}
                    </button>
                  </div>
                  <label className="settings-toggle-row">
                    <span>
                      <strong>Show unread badge</strong>
                      <small>
                        Show a dot on the bell when you have new notifications.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={notificationBadgeEnabled}
                      onChange={(event) => {
                        setNotificationBadgeEnabled(event.target.checked);
                        try {
                          localStorage.setItem(
                            "brahma-notification-badge",
                            String(event.target.checked),
                          );
                        } catch {}
                      }}
                    />
                  </label>
                </section>
              )}
              {settingsTab === "Usage" && (
                <section>
                  <h3>Workspace activity</h3>
                  <p className="muted">Counts from records you can access.</p>
                  <div className="settings-usage-grid">
                    {[
                      [
                        "Documents",
                        data.records.filter((r) => r.type === "Documents")
                          .length,
                      ],
                      [
                        "Tasks",
                        data.records.filter((r) => r.type === "Tasks").length,
                      ],
                      ["Reviews", data.approvals.length],
                      ["Work sessions", data.workflows.length],
                      ["Conversations", data.chats.length],
                      ["Recent searches", data.searchHistory.length],
                    ].map(([label, count]) => (
                      <div key={label}>
                        <strong>{count}</strong>
                        <small>{label}</small>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {settingsTab === "Usage" && (
                <section>
                  <h3>My access</h3>
                  <p className="muted">
                    Your role is{" "}
                    <strong>{data.user.role.replaceAll("_", " ")}</strong>.
                    Workspace modules enabled for your organization:
                  </p>
                  <div className="settings-access-list">
                    {[
                      "Home",
                      "Work",
                      "Projects",
                      "Documents",
                      "People",
                      "Reviews",
                      ...(((data.settings.modules as string[]) || []).includes(
                        "IT",
                      )
                        ? ["IT Operations"]
                        : []),
                    ].map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </section>
              )}
              {settingsTab === "Supabase" && (
                <section>
                  <div className="section-heading">
                    <h3>Supabase connection</h3>
                    {supabaseStatus && (
                      <Status>
                        {supabaseStatus.connected
                          ? "Connected"
                          : supabaseStatus.configured
                            ? "Connection failed"
                            : "Not configured"}
                      </Status>
                    )}
                  </div>
                  <p className="muted">
                    Check the Vercel PostgreSQL connection without showing
                    credentials in the browser.
                  </p>
                  <button
                    disabled={supabaseBusy}
                    onClick={async () => {
                      setSupabaseBusy(true);
                      try {
                        const response = await fetch("/api/supabase/status", {
                          cache: "no-store",
                        });
                        setSupabaseStatus(await response.json());
                      } catch {
                        setSupabaseStatus({
                          configured: false,
                          connected: false,
                          connectionVariable: null,
                          supabaseApiConfigured: false,
                          message: "The connection check could not run.",
                        });
                      } finally {
                        setSupabaseBusy(false);
                      }
                    }}
                  >
                    {supabaseBusy ? "Checking..." : "Check connection"}
                  </button>
                  {supabaseStatus && (
                    <p role="status" className="muted">
                      {supabaseStatus.message}
                      {supabaseStatus.connectionVariable && (
                        <>
                          {" "}
                          Connected using{" "}
                          <code>{supabaseStatus.connectionVariable}</code>.
                        </>
                      )}
                    </p>
                  )}
                  <p className="inline-note">
                    This checks PostgreSQL only. Workspace records still use
                    SQLite until the data migration is completed and verified.
                  </p>
                  <p className="muted">
                    See <code>docs/SUPABASE_SETUP.md</code> for setup steps.
                  </p>
                </section>
              )}
              {settingsTab === "Activity" && (
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
              )}
            </div>
          </div>
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
  if (
    data &&
    ((section === "customize" && data.user.role !== "admin") ||
      (section === "it" && !["admin", "manager", "it_manager"].includes(data.user.role)))
  ) {
    return (
      <div className="standard-page">
        <Empty title="You don’t have access to this area">
          Ask your workspace administrator if you need access.
        </Empty>
        <button onClick={() => go("")}>Back to home</button>
      </div>
    );
  }
  if (authState === "checking")
    return <StartupScreen title="Checking your sign-in…" loading />;
  if (authState === "error")
    return (
      <StartupScreen
        title="We couldn’t check your sign-in"
        message={authError}
        onRetry={() => void checkSession().catch(() => undefined)}
        onSignOut={() => void signOut()}
      />
    );
  if (authState === "signedOut") {
    return (
      <LoginPanel
        setupAvailable={false}
        onLogin={async () => {
          setData(undefined);
          setWorkspaceError("");
          setWorkspaceState("idle");
          if (!(await checkSession())) throw new Error("Sign-in succeeded, but the session could not be confirmed. Please sign in again.");
        }}
      />
    );
  }
  if (!data)
    return (
      <StartupScreen
        title={workspaceState === "error" ? "We couldn’t open your workspace" : "Opening your workspace…"}
        message={workspaceState === "error" ? workspaceError : undefined}
        loading={workspaceState !== "error"}
        userName={sessionUser?.name}
        onRetry={workspaceState === "error" ? () => {
          setWorkspaceError("");
          setWorkspaceState("loading");
          refresh().catch((e) => {
            setWorkspaceError(e instanceof Error ? e.message : "Your workspace could not be loaded. Retry or sign out.");
            setWorkspaceState("error");
          });
        } : undefined}
        onSignOut={() => void signOut()}
      />
    );
  return (
    <div
      className={
        "enterprise-app " +
        (collapsed ? "sidebar-collapsed " : "") +
        (preview || sourceList ? "context-open" : "")
      }
    >
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
              BrahmaGPT<span className="brand-sub">by Singularity</span>
            </span>
          </button>
          <button
            className="sidebar-toggle"
            aria-label="Collapse navigation"
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              try {
                localStorage.setItem(
                  "singularity-sidebar-collapsed",
                  String(next),
                );
              } catch {}
            }}
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
          {nav
            .filter(
              (n) => {
                const role = data.user.role;
                if (n.id === "customize" && role !== "admin") return false;
                if (n.id === "it" && !["admin", "manager", "it_manager"].includes(role)) return false;
                return n.id !== "it" || ((data.settings.modules as string[]) || []).includes("IT");
              },
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
              </button>
            ))}
        </nav>
        <div className="sidebar-recents">
          <div className="recent-heading">
            <p className="nav-caption">Recent Chats</p>
            <button
              className="new-chat-button"
              title="New chat"
              aria-label="New chat"
              onClick={startNewChat}
            >
              <SquarePen size={16} />
            </button>
          </div>
          <button
            className="all-chats-link"
            onClick={() => {
              setChatSearchQuery("");
              setModal({
                title: "Search chats",
                content: (
                  <div className="conversation-picker">
                    <label className="org-search">
                      <Search size={17} />
                      <input
                        autoFocus
                        value={chatSearchQuery}
                        onChange={(event) =>
                          setChatSearchQuery(event.target.value)
                        }
                        placeholder="Search your conversations"
                      />
                    </label>
                    {(data?.chats || [])
                      .filter((chat) =>
                        `${chat.title} ${chat.messages.map((message) => message.text).join(" ")}`
                          .toLowerCase()
                          .includes(chatSearchQuery.toLowerCase()),
                      )
                      .map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => {
                            setModal(undefined);
                            go("chat/" + chat.id);
                          }}
                        >
                          <MessageSquare size={17} />
                          {chat.title}
                        </button>
                      ))}
                    {!(data?.chats || []).some((chat) =>
                      `${chat.title} ${chat.messages.map((message) => message.text).join(" ")}`
                        .toLowerCase()
                        .includes(chatSearchQuery.toLowerCase()),
                    ) && <p className="muted">No matching conversations.</p>}
                  </div>
                ),
              });
            }}
          >
            <Search size={15} />
            Search chats
          </button>
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
            <p className="empty-recents">No recent conversations.</p>
          )}
          {!!data?.chats.length && (
            <button
              className="all-chats-link"
              onClick={() =>
                setModal({
                  title: "Recent conversations",
                  content: (
                    <div className="conversation-picker">
                      {data.chats.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setModal(undefined);
                            go("chat/" + c.id);
                          }}
                        >
                          <MessageSquare size={17} />
                          {c.title}
                        </button>
                      ))}
                    </div>
                  ),
                })
              }
            >
              View all
            </button>
          )}
        </div>
        <div className="sidebar-bottom" ref={profileMenuRef}>
          <button
            className="profile-button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={profileMenu}
            onClick={() => setProfileMenu((open) => !open)}
          >
            <span className="avatar">
              {initials(data?.user.name || "Maya Rao")}
            </span>
            <span>
              <strong>{data?.user.name || "Maya Rao"}</strong>
              <small>
                {data?.user.role.replaceAll("_", " ") || "Workspace member"}
              </small>
            </span>
            <MoreHorizontal size={17} />
          </button>
          {profileMenu && (
            <div className="profile-menu" role="menu" aria-label="Account menu">
              <div className="profile-menu-header">
                <strong>{data?.user.name}</strong>
                <small>{data?.user.email}</small>
              </div>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileMenu(false);
                  go("profile");
                }}
              >
                <Users size={16} /> Profile
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileMenu(false);
                  go("settings");
                }}
              >
                <Settings size={16} /> Settings
              </button>
              {data?.user.demoAdmin && (
                <div className="demo-role-switch" role="group" aria-label="Switch demo role">
                  <span>Switch Demo Role</span>
                  {(["admin", "manager", "employee"] as const).map((role) => (
                    <button key={role} role="menuitemradio" aria-checked={data.user.demoRole === role} disabled={busy || data.user.demoRole === role} onClick={() => void changeDemoRole(role)}>
                      {role[0].toUpperCase() + role.slice(1)}{data.user.demoRole === role ? " · current" : ""}
                    </button>
                  ))}
                </div>
              )}
              <button role="menuitem" onClick={() => void signOut()}>
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="main-shell">
        <header className="topbar unified-topbar">
          <button
            className="mobile-menu"
            aria-label="Open navigation"
            onClick={() => {
              setCollapsed(false);
              setDrawer(true);
            }}
          >
            <PanelLeftOpen size={20} />
          </button>
          <div className="topbar-actions">
            <div className="notification-wrap" ref={notificationPanelRef}>
              <button
                className="notification-button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell size={20} />
                {notificationBadgeEnabled &&
                  !!data?.notifications.filter((n) => !n.read).length && (
                    <span>
                      {Math.min(
                        data.notifications.filter((n) => !n.read).length,
                        9,
                      )}
                    </span>
                  )}
              </button>
              {notificationsOpen && data && (
                <div
                  className="notification-popover"
                  role="dialog"
                  aria-label="Recent notifications"
                >
                  <div className="notification-popover-heading">
                    <span>
                      <strong>Notifications</strong>
                      <small>
                        {data.notifications.filter((n) => !n.read).length}{" "}
                        unread
                      </small>
                    </span>
                    <button
                      disabled={
                        !data.notifications.some((n) => !n.read) || busy
                      }
                      onClick={() =>
                        void act(
                          { action: "readNotifications" },
                          "Notifications marked as read",
                        )
                      }
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="notification-popover-list">
                    {data.notifications.slice(0, 6).map((notification) => (
                      <button
                        className={
                          "notification-popover-item " +
                          (!notification.read ? "unread" : "")
                        }
                        key={notification.id}
                        onClick={() => {
                          if (!notification.read)
                            void act(
                              {
                                action: "readNotification",
                                id: notification.id,
                              },
                              "Notification marked as read",
                            );
                        }}
                      >
                        <span className="notification-popover-icon">
                          <Bell size={15} />
                        </span>
                        <span>
                          <strong>{notification.text}</strong>
                          <small>{date(notification.created)}</small>
                        </span>
                        {!notification.read && <span className="unread-dot" />}
                      </button>
                    ))}
                    {!data.notifications.length && (
                      <p className="notification-empty">
                        You’re all caught up.
                      </p>
                    )}
                  </div>
                  <button
                    className="notification-view-all"
                    onClick={() => {
                      setNotificationsOpen(false);
                      go("notifications");
                    }}
                  >
                    View all notifications <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <button
              aria-label="Workspace help"
              onClick={() =>
                setModal({
                  title: "Your Singularity assistant",
                  content: (
                    <div className="workspace-help">
                      <p>
                        Use the Search button under the Home prompt to find
                        documents, people, projects and tasks. Press Ctrl + K to
                        focus the prompt.
                      </p>
                      <p>
                        Go to Home to ask a question or prepare work. Use Work
                        to review saved tasks and agent runs.
                      </p>
                      <p>
                        Open citations to inspect sources. Work shows saved
                        outputs, execution steps and approvals.
                      </p>
                      <button
                        className="primary"
                        onClick={() => setModal(undefined)}
                      >
                        Got it
                      </button>
                    </div>
                  ),
                })
              }
            >
              <CircleHelp size={20} />
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
      {sourceList && (
        <>
          <button
            className="preview-overlay"
            aria-label="Close sources"
            onClick={() => setSourceList(undefined)}
          />
          <aside className="source-preview source-list-panel">
            <div className="section-heading">
              <h3>
                Sources <span>{sourceList.length}</span>
              </h3>
              <button
                aria-label="Close sources panel"
                onClick={() => setSourceList(undefined)}
              >
                <X size={19} />
              </button>
            </div>
            <p className="source-list-intro">
              The workspace records used in this response. Open a source to
              verify the details.
            </p>
            {sourceList.map((r, i) => (
              <button
                className="source-list-item"
                key={r.id}
                onClick={() => openRecord(r)}
              >
                <span className="source-reference">{i + 1}</span>
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    {r.type} · {r.department}
                  </small>
                  <p>{r.body.slice(0, 150)}</p>
                </span>
              </button>
            ))}
            {sourceList.length === 0 && (
              <p className="muted">
                This request did not retrieve any sources.
              </p>
            )}
            <div className="sources-permission">
              <ShieldCheck size={15} />
              Only records you can access
            </div>
          </aside>
        </>
      )}
      {preview && (
        <>
          <button
            className="preview-overlay"
            aria-label="Close preview"
            onClick={() => setPreview(undefined)}
          />
          <aside className="source-preview">
            <div className="section-heading">
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
              {typeof preview.data.sourceDocumentId === "string" && (
                <>
                  <dt>Document citation</dt>
                  <dd>
                    {preview.data.sourceDocumentId}@v
                    {String(preview.data.version)}
                  </dd>
                  <dt>Available sections</dt>
                  <dd className="source-section-list">
                    {Array.isArray(preview.data.sectionAnchors)
                      ? (preview.data.sectionAnchors as string[]).join(" · ")
                      : "See the source document"}
                  </dd>
                </>
              )}
              <dt>Owner</dt>
              <dd>
                {data?.users.find((u) => u.id === preview.owner)?.name ||
                  preview.owner}
              </dd>
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
            {typeof preview.data.sourceFile === "string" && (
              <div className="source-file-links">
                <h4>Source files</h4>
                <a
                  href={`/api/workspace?source=${encodeURIComponent(preview.id)}&rendition=docx`}
                  className="source-file-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileText size={16} />
                  <span>
                    <strong>Open original Word file</strong>
                    <small>Checked against the indexed file version</small>
                  </span>
                  <ExternalLink size={15} />
                </a>
                {typeof preview.data.pdfFile === "string" &&
                  preview.data.pdfFile && (
                    <a
                      href={`/api/workspace?source=${encodeURIComponent(preview.id)}&rendition=pdf`}
                      className="source-file-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText size={16} />
                      <span>
                        <strong>Open PDF copy</strong>
                        <small>Alternate file for this charter</small>
                      </span>
                      <ExternalLink size={15} />
                    </a>
                  )}
                <small className="source-demo-label">
                  DEMO · Synthetic source document
                </small>
              </div>
            )}
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
            ref={modalRef}
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
