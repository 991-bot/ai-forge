import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Sandpack,
  SandpackProvider, SandpackLayout, SandpackCodeEditor, SandpackFileExplorer, SandpackPreview,
} from "@codesandbox/sandpack-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  Sparkles, Send, Plus, LogOut, Loader2, FileCode, Eye, Code2,
  Trash2, MessageSquare, Brain, ListChecks, ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/builder")({
  head: () => ({ meta: [{ title: "AI Builder — Мои проекты" }] }),
  component: BuilderPage,
});

type ProjectRow = Database["public"]["Tables"]["builder_projects"]["Row"];
type FileRow = Database["public"]["Tables"]["builder_files"]["Row"];
type MessageRow = Database["public"]["Tables"]["builder_messages"]["Row"];

type SandpackFiles = Record<string, { code: string }>;

const DEFAULT_APP = `export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl mb-4">✨</div>
      <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
        Пустой проект
      </h1>
      <p className="text-white/70 max-w-md">
        Опиши в чате слева, какой сайт создать — и я сгенерирую весь код.
      </p>
    </div>
  );
}
`;

function filesToSandpack(files: FileRow[] | { path: string; content: string }[]): SandpackFiles {
  const out: SandpackFiles = {};
  for (const f of files) out[f.path.startsWith("/") ? f.path : `/${f.path}`] = { code: f.content };
  if (!out["/App.tsx"] && !out["/App.js"]) out["/App.tsx"] = { code: DEFAULT_APP };
  return out;
}

function BuilderPage() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("");
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [files, setFiles] = useState<SandpackFiles>({ "/App.tsx": { code: DEFAULT_APP } });
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"preview" | "code">("preview");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ""));
    loadProjects();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function loadProjects() {
    const { data } = await supabase
      .from("builder_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      setProjects(data);
      if (!activeId && data.length > 0) selectProject(data[0].id);
    }
  }

  async function selectProject(id: string) {
    setActiveId(id);
    const [{ data: fs }, { data: ms }] = await Promise.all([
      supabase.from("builder_files").select("*").eq("project_id", id),
      supabase.from("builder_messages").select("*").eq("project_id", id).order("created_at"),
    ]);
    setFiles(filesToSandpack(fs ?? []));
    setMessages(ms ?? []);
  }

  async function createProject() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("builder_projects")
      .insert({ user_id: u.user.id, title: "Новый проект" })
      .select().single();
    if (error) return toast.error(error.message);
    setProjects((p) => [data, ...p]);
    setActiveId(data.id);
    setFiles({ "/App.tsx": { code: DEFAULT_APP } });
    setMessages([]);
  }

  async function deleteProject(id: string) {
    await supabase.from("builder_projects").delete().eq("id", id);
    setProjects((p) => p.filter((x) => x.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setFiles({ "/App.tsx": { code: DEFAULT_APP } });
      setMessages([]);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  async function send() {
    const prompt = input.trim();
    if (!prompt || busy) return;
    setInput("");
    setBusy(true);

    let projectId = activeId;
    if (!projectId) {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data, error } = await supabase
        .from("builder_projects")
        .insert({ user_id: u.user.id, title: prompt.slice(0, 40) })
        .select().single();
      if (error) { toast.error(error.message); setBusy(false); return; }
      projectId = data.id;
      setActiveId(projectId);
      setProjects((p) => [data, ...p]);
    }

    // Optimistic user message
    const userMsg: MessageRow = {
      id: crypto.randomUUID(), project_id: projectId, role: "user",
      content: prompt, plan: null, thinking: null, files_changed: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    await supabase.from("builder_messages").insert({
      project_id: projectId, role: "user", content: prompt,
    });

    // Build history for AI (limit last 10)
    const history = [...messages, userMsg].slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.role === "assistant" && m.files_changed
        ? `${m.content}\n\n[Текущие файлы проекта уже применены]`
        : m.content,
    }));

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const data = await res.json() as {
        plan: string; thinking: string; summary: string; title: string;
        files: Array<{ path: string; content: string }>;
      };

      // Save files: wipe & reinsert
      await supabase.from("builder_files").delete().eq("project_id", projectId);
      const rows = data.files.map((f) => ({
        project_id: projectId!,
        path: f.path.startsWith("/") ? f.path : `/${f.path}`,
        content: f.content,
      }));
      if (rows.length) await supabase.from("builder_files").insert(rows);

      const newFiles = filesToSandpack(data.files);
      setFiles(newFiles);

      // Update project title if it's still default
      const proj = projects.find((p) => p.id === projectId);
      if (data.title && (!proj?.title || proj.title === "Новый проект")) {
        await supabase.from("builder_projects").update({ title: data.title }).eq("id", projectId);
        setProjects((ps) => ps.map((p) => p.id === projectId ? { ...p, title: data.title } : p));
      }

      // Save assistant message
      const { data: saved } = await supabase.from("builder_messages").insert({
        project_id: projectId,
        role: "assistant",
        content: data.summary,
        plan: data.plan,
        thinking: data.thinking,
        files_changed: data.files.map((f) => f.path),
      }).select().single();
      if (saved) setMessages((m) => [...m, saved]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка генерации");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-border flex flex-col bg-card/40">
        <div className="p-3 border-b border-border">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-sm mb-3">
            <span className="grid h-7 w-7 place-items-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            AI Builder
          </Link>
          <button
            onClick={createProject}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-sm py-2 font-medium hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Новый проект
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition ${
                activeId === p.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
              onClick={() => selectProject(p.id)}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span className="flex-1 truncate">{p.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                className="opacity-0 group-hover:opacity-100 transition hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-xs text-muted-foreground p-3 text-center">
              Пока пусто. Создай первый проект.
            </p>
          )}
        </div>
        <div className="p-3 border-t border-border flex items-center gap-2">
          <div className="h-7 w-7 shrink-0 rounded-full bg-muted grid place-items-center text-xs font-semibold">
            {userEmail.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="flex-1 truncate text-xs text-muted-foreground">{userEmail}</span>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground" title="Выйти">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Chat panel */}
      <section className="w-[380px] shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="font-semibold text-sm">Диалог с AI</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <Sparkles className="mx-auto h-8 w-8 mb-2 opacity-50" />
              Опиши, какой сайт создать —<br /> напр. «SaaS-лендинг для CRM с ценами и FAQ».
            </div>
          )}
          {messages.map((m) => (
            <ChatMessage key={m.id} m={m} />
          ))}
          {busy && <ThinkingIndicator />}
          <div ref={chatEndRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); void send(); }}
          className="p-3 border-t border-border"
        >
          <div className="relative">
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
              placeholder="Опиши сайт или правку…"
              rows={3}
              disabled={busy}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 pr-11 text-sm outline-none focus:border-primary disabled:opacity-50"
            />
            <button
              type="submit" disabled={busy || !input.trim()}
              className="absolute right-2 bottom-2 grid h-8 w-8 place-items-center rounded-lg text-white disabled:opacity-40"
              style={{ background: "var(--gradient-brand)" }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </section>

      {/* Editor + Preview */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 p-2 border-b border-border">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              onClick={() => setView("preview")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${view === "preview" ? "bg-accent" : ""}`}
            >
              <Eye className="h-3.5 w-3.5" /> Превью
            </button>
            <button
              onClick={() => setView("code")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border-l border-border ${view === "code" ? "bg-accent" : ""}`}
            >
              <Code2 className="h-3.5 w-3.5" /> Код
            </button>
          </div>
          <div className="text-xs text-muted-foreground ml-auto">
            <FileCode className="inline h-3.5 w-3.5 mr-1" />
            {Object.keys(files).length} файлов
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <SandpackProvider
            key={activeId ?? "empty"}
            template="react-ts"
            files={files}
            theme="dark"
            customSetup={{
              dependencies: {
                "lucide-react": "latest",
                "framer-motion": "latest",
              },
            }}
            options={{ recompileMode: "delayed", recompileDelay: 500 }}
          >
            <SandpackLayout style={{ height: "100%", border: "none", borderRadius: 0 }}>
              {view === "code" && (
                <>
                  <SandpackFileExplorer style={{ height: "100%" }} />
                  <SandpackCodeEditor
                    showLineNumbers showInlineErrors wrapContent
                    style={{ height: "100%", flex: 1 }}
                  />
                </>
              )}
              {view === "preview" && (
                <SandpackPreview
                  style={{ height: "100%", flex: 1 }}
                  showNavigator showRefreshButton
                />
              )}
            </SandpackLayout>
          </SandpackProvider>
        </div>
      </section>
    </div>
  );
}

function ChatMessage({ m }: { m: MessageRow }) {
  const [openPlan, setOpenPlan] = useState(false);
  const [openThinking, setOpenThinking] = useState(false);

  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-3 py-2 text-sm">
          {m.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
          <Sparkles className="h-3 w-3 text-white" />
        </span>
        AI
      </div>

      {m.plan && (
        <Collapsible
          open={openPlan} onToggle={() => setOpenPlan(!openPlan)}
          icon={<ListChecks className="h-3.5 w-3.5" />}
          label="План"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
            <ReactMarkdown>{m.plan}</ReactMarkdown>
          </div>
        </Collapsible>
      )}

      {m.thinking && (
        <Collapsible
          open={openThinking} onToggle={() => setOpenThinking(!openThinking)}
          icon={<Brain className="h-3.5 w-3.5" />}
          label="Размышления"
        >
          <p className="text-sm text-muted-foreground italic">{m.thinking}</p>
        </Collapsible>
      )}

      <div className="rounded-xl bg-card border border-border px-3 py-2 text-sm">
        {m.content}
      </div>

      {Array.isArray(m.files_changed) && m.files_changed.length > 0 && (
        <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
          {(m.files_changed as string[]).map((f) => (
            <span key={f} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono">
              <FileCode className="h-3 w-3" />{f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Collapsible({
  open, onToggle, icon, label, children,
}: { open: boolean; onToggle: () => void; icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-accent/50 transition"
      >
        {icon} {label}
        <ChevronDown className={`h-3.5 w-3.5 ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
        <Loader2 className="h-3 w-3 text-white animate-spin" />
      </span>
      <span className="inline-flex gap-1">
        Размышляю
        <span className="animate-pulse">.</span>
        <span className="animate-pulse [animation-delay:0.15s]">.</span>
        <span className="animate-pulse [animation-delay:0.3s]">.</span>
      </span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keepSandpack = Sandpack;
