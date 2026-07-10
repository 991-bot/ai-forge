import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, Trash2, Download, Eye, Code2, Plus, ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
  ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "AI Builder — сгенерируй сайт промптом" },
      { name: "description", content: "Мини-Lovable: опиши сайт, получи полный HTML, редактируй через контекстное меню. История в облачной БД." },
    ],
  }),
  component: BuilderPage,
});

type Msg = { role: "user" | "assistant"; content: string };
type Project = { id: string; title: string; prompt: string; html: string; created_at: string };

const SESSION_KEY = "builder-session-id";

function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const STARTERS = [
  "Лендинг для кофейни в Осло, тёмная тема, минимализм",
  "Портфолио веб-дизайнера с 3D-эффектами и фиолетовыми градиентами",
  "SaaS-лендинг для AI-стартапа, glassmorphism, hero с анимацией",
  "Сайт-визитка для фотографа, крупная типографика, галерея",
];

function BuilderPage() {
  const [sessionId, setSessionId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setSessionId(getSessionId()); }, []);

  useEffect(() => {
    if (!sessionId) return;
    supabase.from("builder_projects").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setProjects(data as Project[]); });
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => { inputRef.current?.focus(); }, [loading]);

  const deviceWidth = useMemo(() => ({ desktop: "100%", tablet: "768px", mobile: "390px" }[device]), [device]);

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || loading || !sessionId) return;
    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        if (res.status === 429) toast.error("Слишком много запросов. Подожди немного.");
        else if (res.status === 402) toast.error("Закончились кредиты AI Gateway. Пополни рабочее пространство.");
        else toast.error(err.error || "Ошибка генерации");
        setMessages(nextMessages);
        return;
      }
      const { html, title } = (await res.json()) as { html: string; title: string };
      setCurrentHtml(html);
      setCurrentTitle(title);
      setMessages([...nextMessages, { role: "assistant", content: `Готово: **${title}** (${Math.round(html.length / 1024)} KB HTML). Кликни правой кнопкой по превью для быстрых правок.` }]);

      const { data } = await supabase.from("builder_projects").insert({
        session_id: sessionId, title, prompt, html,
      }).select().single();
      if (data) setProjects((p) => [data as Project, ...p]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  function newProject() {
    setMessages([]); setCurrentHtml(""); setCurrentTitle(""); setInput("");
    inputRef.current?.focus();
  }

  function openProject(p: Project) {
    setMessages([
      { role: "user", content: p.prompt },
      { role: "assistant", content: `Открыто: **${p.title}**` },
    ]);
    setCurrentHtml(p.html); setCurrentTitle(p.title);
  }

  async function deleteProject(id: string) {
    await supabase.from("builder_projects").delete().eq("id", id);
    setProjects((p) => p.filter((x) => x.id !== id));
    toast.success("Удалено");
  }

  function download(html: string, title: string) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/[^a-z0-9\-_]+/gi, "_") || "site"}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  const quickEdits = [
    { label: "Сделай темнее / тёмная тема", prompt: "Переделай всю страницу в тёмную тему с глубоким фоном и мягкими акцентами." },
    { label: "Больше анимаций", prompt: "Добавь больше плавных CSS-анимаций: hover, fade-in, параллакс, микроанимации." },
    { label: "Glassmorphism", prompt: "Переделай в стиле glassmorphism: полупрозрачные карточки с блюром и градиентными подложками." },
    { label: "Другая цветовая палитра", prompt: "Смени всю цветовую палитру на современную и необычную — предложи и применяй." },
    { label: "Крупная типографика", prompt: "Сделай типографику намного крупнее и выразительнее, используй контрастные шрифты." },
    { label: "Мобильная адаптация", prompt: "Убедись, что все секции идеально работают на мобильных, оптимизируй сетки и отступы." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Профиль
          </Link>
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-brand)" }}>
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            AI Builder
          </div>
          {currentTitle && <span className="hidden text-sm text-muted-foreground md:inline">— {currentTitle}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-0.5 rounded-lg border p-0.5 md:flex">
            {(["desktop", "tablet", "mobile"] as const).map((d) => {
              const Icon = { desktop: Monitor, tablet: Tablet, mobile: Smartphone }[d];
              return (
                <button key={d} onClick={() => setDevice(d)}
                  className={`grid h-7 w-8 place-items-center rounded ${device === d ? "bg-accent" : "hover:bg-accent/50"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
            <button onClick={() => setView("preview")}
              className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${view === "preview" ? "bg-accent" : "hover:bg-accent/50"}`}>
              <Eye className="h-3.5 w-3.5" /> Превью
            </button>
            <button onClick={() => setView("code")}
              className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${view === "code" ? "bg-accent" : "hover:bg-accent/50"}`}>
              <Code2 className="h-3.5 w-3.5" /> Код
            </button>
          </div>
          {currentHtml && (
            <button onClick={() => download(currentHtml, currentTitle)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-accent">
              <Download className="h-4 w-4" /> HTML
            </button>
          )}
        </div>
      </header>

      <div className="grid h-[calc(100vh-53px)] grid-cols-1 md:grid-cols-[280px_1fr_1.4fr]">
        {/* Projects sidebar */}
        <aside className="hidden flex-col border-r md:flex">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Мои сайты</span>
            <button onClick={newProject} className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs hover:bg-accent">
              <Plus className="h-3 w-3" /> Новый
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {projects.length === 0 && (
              <p className="px-2 py-4 text-xs text-muted-foreground">Пока нет проектов. Опиши первый сайт справа →</p>
            )}
            {projects.map((p) => (
              <ContextMenu key={p.id}>
                <ContextMenuTrigger>
                  <button onClick={() => openProject(p)}
                    className="mb-1 w-full rounded-md p-2 text-left text-sm hover:bg-accent">
                    <div className="line-clamp-1 font-medium">{p.title}</div>
                    <div className="line-clamp-1 text-xs text-muted-foreground">{p.prompt}</div>
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-52">
                  <ContextMenuItem onClick={() => openProject(p)}><Eye className="mr-2 h-4 w-4" />Открыть</ContextMenuItem>
                  <ContextMenuItem onClick={() => download(p.html, p.title)}><Download className="mr-2 h-4 w-4" />Скачать HTML</ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => deleteProject(p.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Удалить
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <section className="flex min-h-0 flex-col border-r">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="mx-auto max-w-md space-y-4 pt-10">
                <div className="text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--gradient-brand)" }}>
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="mt-3 font-display text-xl font-bold">Опиши сайт</h2>
                  <p className="mt-1 text-sm text-muted-foreground">ИИ сгенерирует готовый HTML со стилями и анимацией.</p>
                </div>
                <div className="space-y-2">
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="w-full rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>{m.content}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2 text-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Генерирую сайт…
                </div>
              </div>
            )}
          </div>
          <div className="border-t p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={messages.length === 0 ? "Опиши, какой сайт создать…" : "Что изменить?"}
                rows={2}
                disabled={loading}
                className="w-full resize-none rounded-xl border bg-background p-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg text-white transition-transform disabled:opacity-40"
                style={{ background: "var(--gradient-brand)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Enter — отправить · Shift+Enter — новая строка · ПКМ по превью → быстрые правки</p>
          </div>
        </section>

        {/* Preview */}
        <section className="min-h-0 bg-muted/40">
          {!currentHtml ? (
            <div className="grid h-full place-items-center p-8 text-center text-muted-foreground">
              <div>
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-background border">
                  <Eye className="h-6 w-6" />
                </div>
                <p>Превью появится здесь после первой генерации</p>
              </div>
            </div>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="h-full overflow-auto p-4">
                  <div className="mx-auto h-full rounded-xl border bg-white shadow-sm transition-all" style={{ maxWidth: deviceWidth }}>
                    {view === "preview" ? (
                      <iframe
                        title="preview"
                        srcDoc={currentHtml}
                        sandbox="allow-scripts"
                        className="h-full w-full rounded-xl"
                      />
                    ) : (
                      <pre className="h-full w-full overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                        <code>{currentHtml}</code>
                      </pre>
                    )}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-64">
                <ContextMenuSub>
                  <ContextMenuSubTrigger><Sparkles className="mr-2 h-4 w-4" />Быстрые правки</ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-64">
                    {quickEdits.map((q) => (
                      <ContextMenuItem key={q.label} onClick={() => send(q.prompt)}>{q.label}</ContextMenuItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => setView(view === "preview" ? "code" : "preview")}>
                  {view === "preview" ? <><Code2 className="mr-2 h-4 w-4" />Показать код</> : <><Eye className="mr-2 h-4 w-4" />Показать превью</>}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => download(currentHtml, currentTitle)}>
                  <Download className="mr-2 h-4 w-4" />Скачать HTML
                </ContextMenuItem>
                <ContextMenuItem onClick={() => { navigator.clipboard.writeText(currentHtml); toast.success("HTML скопирован"); }}>
                  Копировать HTML
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
        </section>
      </div>
    </div>
  );
}
