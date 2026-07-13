import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Loader2, Trash2, Download, Eye, Code2, Plus, ArrowLeft,
  Monitor, Smartphone, Tablet, PanelLeftClose, PanelLeftOpen, Database, Inbox, FileText, Save,
  MousePointer2, Undo2, Redo2, X, Type, Palette, Layers,
} from "lucide-react";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
  ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "AI Builder — визуальный редактор сайтов" },
      { name: "description", content: "Создай сайт промптом, отредактируй визуально в WYSIWYG-режиме и собирай данные форм через встроенную CMS." },
    ],
  }),
  component: BuilderPage,
});

type Msg = { role: "user" | "assistant"; content: string };
type Project = { id: string; title: string; prompt: string; html: string; messages: Msg[]; createdAt: number; updatedAt: number };
type Submission = { id: string; formName: string; data: Record<string, string>; at: number };
type Selected = {
  selector: string;
  tag: string;
  text: string;
  styles: { color: string; backgroundColor: string; fontSize: string; fontWeight: string; textAlign: string; padding: string; margin: string; fontFamily: string };
};

const LS_PROJECTS = "builder-projects-v2";
const LS_SUBS = (pid: string) => `builder-subs-${pid}`;

const STARTERS = [
  "Лендинг для кофейни в Осло, тёмная тема, минимализм",
  "Портфолио веб-дизайнера с 3D-эффектами и фиолетовыми градиентами",
  "SaaS-лендинг для AI-стартапа, glassmorphism, hero с анимацией, форма подписки name+email",
  "Сайт-визитка фотографа с формой обратной связи",
];

// ---------- runtime injection: form capture + content edits + visual editor bridge ----------
const RUNTIME_SCRIPT = `<script>(function(){
  if (window.__cmsBridge) return; window.__cmsBridge = 1;
  var visual = false;
  var lastHover = null; var lastSel = null;

  function css(el){
    if (!el || el === document.body) return 'body';
    var parts = []; var node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      var name = node.tagName.toLowerCase();
      var parent = node.parentNode;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(c){ return c.tagName === node.tagName; });
        if (siblings.length > 1) name += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
      }
      parts.unshift(name);
      node = parent;
    }
    return 'body>' + parts.join('>');
  }

  function outline(el, color){
    if (!el) return;
    el.style.outline = '2px solid ' + color;
    el.style.outlineOffset = '2px';
  }
  function unoutline(el){ if (el) { el.style.outline=''; el.style.outlineOffset=''; } }

  function select(el){
    unoutline(lastSel); lastSel = el; outline(el, '#3b82f6');
    var cs = getComputedStyle(el);
    parent.postMessage({ __cms:1, type:'select', selector: css(el), tag: el.tagName.toLowerCase(),
      text: el.children.length === 0 ? (el.textContent||'').trim() : '',
      styles: {
        color: cs.color, backgroundColor: cs.backgroundColor, fontSize: cs.fontSize,
        fontWeight: cs.fontWeight, textAlign: cs.textAlign, padding: cs.padding,
        margin: cs.margin, fontFamily: cs.fontFamily,
      }
    }, '*');
  }

  document.addEventListener('mouseover', function(e){
    if (!visual) return;
    if (e.target === lastSel) return;
    unoutline(lastHover); lastHover = e.target; outline(lastHover, '#93c5fd');
  }, true);
  document.addEventListener('mouseout', function(e){
    if (!visual) return;
    if (e.target === lastSel) return;
    unoutline(e.target);
  }, true);
  document.addEventListener('click', function(e){
    if (!visual) return;
    e.preventDefault(); e.stopPropagation();
    unoutline(lastHover); lastHover = null;
    select(e.target);
  }, true);

  document.addEventListener('submit', function(e){
    var f = e.target;
    if (!(f instanceof HTMLFormElement)) return;
    e.preventDefault();
    var data = {};
    new FormData(f).forEach(function(v,k){ data[k] = typeof v === 'string' ? v : (v && v.name) || ''; });
    parent.postMessage({ __cms:1, type:'submit', formName: f.getAttribute('name')||f.id||'form', data: data, at: Date.now() }, '*');
    try { f.reset(); } catch(_){}
    var t = document.createElement('div');
    t.textContent = '✓ Отправлено — данные в CMS';
    t.style.cssText='position:fixed;bottom:20px;right:20px;background:#0f172a;color:#fff;padding:10px 16px;border-radius:10px;font:500 14px system-ui;z-index:99999;box-shadow:0 8px 30px rgba(0,0,0,.3)';
    document.body.appendChild(t); setTimeout(function(){t.remove();},2200);
  }, true);

  window.addEventListener('message', function(ev){
    var m = ev.data; if (!m || m.__cms !== 1) return;
    if (m.type === 'mode') {
      visual = !!m.visual;
      if (!visual) { unoutline(lastHover); unoutline(lastSel); lastHover=null; lastSel=null; }
      document.body.style.cursor = visual ? 'crosshair' : '';
    }
    if (m.type === 'patch') {
      try {
        var el = document.querySelector(m.selector);
        if (el) {
          if (m.attr) el.setAttribute(m.attr, m.value);
          else el.textContent = m.value;
        }
      } catch(_){}
    }
    if (m.type === 'setText' && lastSel) { lastSel.textContent = m.value; }
    if (m.type === 'setStyle' && lastSel) {
      for (var k in m.styles) { try { lastSel.style.setProperty(k, m.styles[k]); } catch(_){} }
    }
    if (m.type === 'requestHtml') {
      unoutline(lastHover); unoutline(lastSel);
      parent.postMessage({ __cms:1, type:'html', html: '<!DOCTYPE html>\\n' + document.documentElement.outerHTML }, '*');
      if (lastSel) outline(lastSel, '#3b82f6');
    }
    if (m.type === 'deselect') { unoutline(lastSel); lastSel=null; }
  });
  parent.postMessage({ __cms:1, type:'ready' }, '*');
})();</script>`;

function injectRuntime(html: string): string {
  if (!html) return html;
  if (html.includes("__cmsBridge")) return html;
  if (html.includes("</body>")) return html.replace("</body>", RUNTIME_SCRIPT + "</body>");
  return html + RUNTIME_SCRIPT;
}

// ---------- content extraction for the CMS content editor ----------
type ContentField = { selector: string; tag: string; attr?: string; value: string; label: string };

function extractContent(html: string): ContentField[] {
  if (typeof window === "undefined" || !html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const fields: ContentField[] = [];
  const tags = ["h1", "h2", "h3", "p", "a", "button", "li"] as const;
  tags.forEach((tag) => {
    const nodes = Array.from(doc.querySelectorAll(tag));
    nodes.forEach((n, i) => {
      const text = (n.textContent || "").trim();
      if (!text || text.length > 240) return;
      const all = Array.from(doc.querySelectorAll(tag));
      const idx = all.indexOf(n);
      fields.push({ selector: `${tag}:nth-of-type(${idx + 1})`, tag, value: text, label: `${tag.toUpperCase()} #${i + 1}` });
    });
  });
  Array.from(doc.querySelectorAll("img")).forEach((n, i) => {
    const src = n.getAttribute("src") || "";
    const all = Array.from(doc.querySelectorAll("img"));
    const idx = all.indexOf(n);
    fields.push({ selector: `img:nth-of-type(${idx + 1})`, tag: "img", attr: "src", value: src, label: `IMG #${i + 1}` });
  });
  return fields.slice(0, 60);
}

function applyContentPatch(html: string, patch: ContentField): string {
  if (typeof window === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  try {
    const el = doc.querySelector(patch.selector);
    if (!el) return html;
    if (patch.attr) el.setAttribute(patch.attr, patch.value);
    else el.textContent = patch.value;
  } catch { return html; }
  return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
}

// ---------- localStorage helpers ----------
function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_PROJECTS) || "[]"); } catch { return []; }
}
function saveProjects(p: Project[]) { localStorage.setItem(LS_PROJECTS, JSON.stringify(p)); }
function loadSubs(pid: string): Submission[] {
  try { return JSON.parse(localStorage.getItem(LS_SUBS(pid)) || "[]"); } catch { return []; }
}
function saveSubs(pid: string, s: Submission[]) { localStorage.setItem(LS_SUBS(pid), JSON.stringify(s)); }

function BuilderPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentHtml, setCurrentHtml] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"preview" | "code" | "cms">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [cmsTab, setCmsTab] = useState<"submissions" | "content">("submissions");
  const [contentFields, setContentFields] = useState<ContentField[]>([]);
  const [visualMode, setVisualMode] = useState(false);
  const [selected, setSelected] = useState<Selected | null>(null);
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const [historyTick, setHistoryTick] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pendingSaveRef = useRef<((html: string) => void) | null>(null);

  useEffect(() => { setProjects(loadProjects()); }, []);
  useEffect(() => { setContentFields(extractContent(currentHtml)); }, [currentHtml]);
  useEffect(() => { if (activeId) setSubs(loadSubs(activeId)); else setSubs([]); }, [activeId]);

  // Toggle visual mode inside iframe
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ __cms: 1, type: "mode", visual: visualMode }, "*");
    if (!visualMode) setSelected(null);
  }, [visualMode, view, currentHtml]);

  // iframe → parent messages
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const m = e.data;
      if (!m || m.__cms !== 1) return;
      if (m.type === "submit" && activeId) {
        const s: Submission = { id: crypto.randomUUID(), formName: String(m.formName || "form"), data: m.data || {}, at: m.at || Date.now() };
        setSubs((prev) => { const next = [s, ...prev]; saveSubs(activeId, next); return next; });
        toast.success(`Форма «${s.formName}» — данные в CMS`);
      }
      if (m.type === "select") {
        setSelected({ selector: m.selector, tag: m.tag, text: m.text, styles: m.styles });
      }
      if (m.type === "html" && pendingSaveRef.current) {
        pendingSaveRef.current(m.html);
        pendingSaveRef.current = null;
      }
      if (m.type === "ready" && visualMode) {
        e.source && (e.source as Window).postMessage({ __cms: 1, type: "mode", visual: true }, "*");
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [activeId, visualMode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);
  useEffect(() => { inputRef.current?.focus(); }, [loading]);

  const deviceWidth = useMemo(() => ({ desktop: "100%", tablet: "768px", mobile: "390px" }[device]), [device]);
  const injectedHtml = useMemo(() => injectRuntime(currentHtml), [currentHtml]);

  const persistProject = useCallback((p: Project) => {
    setProjects((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      const next = idx >= 0 ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      saveProjects(next);
      return next;
    });
  }, []);

  const commitHtml = useCallback((next: string, opts?: { pushHistory?: boolean }) => {
    if (opts?.pushHistory !== false && currentHtml && next !== currentHtml) {
      historyRef.current.past.push(currentHtml);
      if (historyRef.current.past.length > 50) historyRef.current.past.shift();
      historyRef.current.future = [];
      setHistoryTick((t) => t + 1);
    }
    setCurrentHtml(next);
    if (activeId) {
      const proj = projects.find((p) => p.id === activeId);
      if (proj) persistProject({ ...proj, html: next, updatedAt: Date.now() });
    }
  }, [currentHtml, activeId, projects, persistProject]);

  const captureHtml = useCallback((cb: (html: string) => void) => {
    pendingSaveRef.current = cb;
    iframeRef.current?.contentWindow?.postMessage({ __cms: 1, type: "requestHtml" }, "*");
  }, []);

  function undo() {
    const html = historyRef.current.past.pop();
    if (!html) return;
    historyRef.current.future.unshift(currentHtml);
    setHistoryTick((t) => t + 1);
    setCurrentHtml(html);
    if (activeId) {
      const proj = projects.find((p) => p.id === activeId);
      if (proj) persistProject({ ...proj, html, updatedAt: Date.now() });
    }
  }
  function redo() {
    const html = historyRef.current.future.shift();
    if (!html) return;
    historyRef.current.past.push(currentHtml);
    setHistoryTick((t) => t + 1);
    setCurrentHtml(html);
    if (activeId) {
      const proj = projects.find((p) => p.id === activeId);
      if (proj) persistProject({ ...proj, html, updatedAt: Date.now() });
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key === "y") || (e.key === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentHtml, activeId]);

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, currentHtml: currentHtml || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        if (res.status === 429) toast.error("Слишком много запросов. Подожди немного.");
        else if (res.status === 402) toast.error("Закончились кредиты AI. Пополни рабочее пространство.");
        else toast.error(err.error || "Ошибка генерации");
        setMessages(nextMessages);
        return;
      }
      const { html, title } = (await res.json()) as { html: string; title: string };
      commitHtml(html);
      setCurrentTitle(title);
      const assistantMsg: Msg = { role: "assistant", content: `Готово: **${title}** (${Math.round(html.length / 1024)} KB). Клик по «Визуал» — редактирование прямо на превью.` };
      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);

      const now = Date.now();
      const proj: Project = activeId
        ? { ...(projects.find((p) => p.id === activeId) as Project), title, html, messages: finalMessages, updatedAt: now }
        : { id: crypto.randomUUID(), title, prompt, html, messages: finalMessages, createdAt: now, updatedAt: now };
      if (!activeId) setActiveId(proj.id);
      persistProject(proj);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  function newProject() {
    setActiveId(null);
    setMessages([]); setCurrentHtml(""); setCurrentTitle(""); setInput(""); setSubs([]);
    setSidebarOpen(false); setView("preview"); setVisualMode(false); setSelected(null);
    historyRef.current = { past: [], future: [] };
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function openProject(p: Project) {
    setActiveId(p.id);
    setMessages(p.messages && p.messages.length ? p.messages : [
      { role: "user", content: p.prompt },
      { role: "assistant", content: `Открыто: **${p.title}**` },
    ]);
    setCurrentHtml(p.html); setCurrentTitle(p.title);
    historyRef.current = { past: [], future: [] };
    setSelected(null);
  }

  function deleteProject(id: string) {
    setProjects((prev) => { const next = prev.filter((x) => x.id !== id); saveProjects(next); return next; });
    localStorage.removeItem(LS_SUBS(id));
    if (activeId === id) newProject();
    toast.success("Удалено");
  }

  function download(html: string, title: string) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title.replace(/[^a-z0-9\-_]+/gi, "_") || "site"}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  function patchField(f: ContentField, value: string) {
    const nextField = { ...f, value };
    setContentFields((prev) => prev.map((x) => (x.selector === f.selector && x.attr === f.attr ? nextField : x)));
    iframeRef.current?.contentWindow?.postMessage({ __cms: 1, type: "patch", selector: f.selector, attr: f.attr, value }, "*");
    const nextHtml = applyContentPatch(currentHtml, nextField);
    commitHtml(nextHtml);
  }

  function clearSubs() {
    if (!activeId) return;
    saveSubs(activeId, []); setSubs([]); toast.success("Отправки очищены");
  }

  // Visual-mode edits: apply live to iframe, then capture full HTML back
  function applyStyle(styleUpdates: Partial<Selected["styles"]>) {
    if (!selected) return;
    setSelected({ ...selected, styles: { ...selected.styles, ...styleUpdates } });
    // convert to CSS property names (camelCase → kebab)
    const cssStyles: Record<string, string> = {};
    Object.entries(styleUpdates).forEach(([k, v]) => {
      cssStyles[k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())] = v as string;
    });
    iframeRef.current?.contentWindow?.postMessage({ __cms: 1, type: "setStyle", styles: cssStyles }, "*");
    captureHtml((html) => commitHtml(html));
  }
  function applyText(value: string) {
    if (!selected) return;
    setSelected({ ...selected, text: value });
    iframeRef.current?.contentWindow?.postMessage({ __cms: 1, type: "setText", value }, "*");
    captureHtml((html) => commitHtml(html));
  }

  const quickEdits = [
    { label: "Сделай темнее / тёмная тема", prompt: "Переделай в глубокую тёмную тему с мягкими акцентами, сохрани контент." },
    { label: "Больше анимаций", prompt: "Добавь плавные CSS-анимации: hover, fade-in, параллакс, микроанимации." },
    { label: "Glassmorphism", prompt: "Переделай в glassmorphism: полупрозрачные карточки с блюром." },
    { label: "Другая палитра", prompt: "Смени палитру на современную и необычную." },
    { label: "Крупная типографика", prompt: "Сделай типографику намного крупнее и выразительнее." },
    { label: "Мобильная адаптация", prompt: "Оптимизируй все секции под мобильные." },
  ];

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  void historyTick;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen((s) => !s)}
            className="hidden h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:grid"
            title={sidebarOpen ? "Скрыть панель" : "Показать панель"}>
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
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
          {currentHtml && view === "preview" && (
            <>
              <button
                onClick={() => setVisualMode((v) => !v)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm ${visualMode ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                title="Визуальное редактирование">
                <MousePointer2 className="h-4 w-4" /> Визуал
              </button>
              <div className="hidden items-center gap-0.5 rounded-lg border p-0.5 md:flex">
                <button onClick={undo} disabled={!canUndo}
                  className="grid h-7 w-8 place-items-center rounded hover:bg-accent/50 disabled:opacity-30" title="Отменить (Ctrl+Z)">
                  <Undo2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={redo} disabled={!canRedo}
                  className="grid h-7 w-8 place-items-center rounded hover:bg-accent/50 disabled:opacity-30" title="Повторить (Ctrl+Y)">
                  <Redo2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
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
            <button onClick={() => { setView("code"); setVisualMode(false); }}
              className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${view === "code" ? "bg-accent" : "hover:bg-accent/50"}`}>
              <Code2 className="h-3.5 w-3.5" /> Код
            </button>
            <button onClick={() => { setView("cms"); setVisualMode(false); }}
              className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${view === "cms" ? "bg-accent" : "hover:bg-accent/50"}`}>
              <Database className="h-3.5 w-3.5" /> CMS
              {subs.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] leading-4 text-primary-foreground">{subs.length}</span>}
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

      <div className={`grid h-[calc(100vh-53px)] grid-cols-1 ${sidebarOpen ? "md:grid-cols-[280px_1fr_1.4fr]" : "md:grid-cols-[1fr_1.4fr]"}`}>
        {sidebarOpen && (
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
                    className={`mb-1 w-full rounded-md p-2 text-left text-sm hover:bg-accent ${activeId === p.id ? "bg-accent" : ""}`}>
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
          <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
            localStorage · Ctrl+Z / Ctrl+Y
          </div>
        </aside>
        )}

        <section className="flex min-h-0 flex-col border-r">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="mx-auto max-w-md space-y-4 pt-10">
                <div className="text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--gradient-brand)" }}>
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="mt-3 font-display text-xl font-bold">Опиши сайт</h2>
                  <p className="mt-1 text-sm text-muted-foreground">ИИ сгенерирует HTML. Дальше — визуальное редактирование или правки промптом.</p>
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {activeId ? "Правлю сайт…" : "Генерирую сайт…"}
                </div>
              </div>
            )}
          </div>
          <div className="border-t p-3">
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="relative">
              <textarea
                ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={messages.length === 0 ? "Опиши, какой сайт создать…" : "Что изменить?"}
                rows={2} disabled={loading}
                className="w-full resize-none rounded-xl border bg-background p-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg text-white transition-transform disabled:opacity-40"
                style={{ background: "var(--gradient-brand)" }}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Enter — отправить · включи «Визуал» и кликай по элементам на превью
            </p>
          </div>
        </section>

        <section className="relative min-h-0 bg-muted/40">
          {!currentHtml ? (
            <div className="grid h-full place-items-center p-8 text-center text-muted-foreground">
              <div>
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-background border">
                  <Eye className="h-6 w-6" />
                </div>
                <p>Превью появится после первой генерации</p>
              </div>
            </div>
          ) : view === "cms" ? (
            <CmsPanel
              tab={cmsTab} setTab={setCmsTab}
              subs={subs} clearSubs={clearSubs}
              fields={contentFields} onPatch={patchField}
              hasProject={!!activeId}
            />
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="h-full overflow-auto p-4">
                  <div className={`mx-auto h-full rounded-xl border bg-white shadow-sm transition-all ${visualMode ? "ring-2 ring-primary" : ""}`} style={{ maxWidth: deviceWidth }}>
                    {view === "preview" ? (
                      <iframe
                        ref={iframeRef} title="preview"
                        srcDoc={injectedHtml}
                        sandbox="allow-scripts allow-forms allow-same-origin"
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
                <ContextMenuItem onClick={() => setVisualMode((v) => !v)}>
                  <MousePointer2 className="mr-2 h-4 w-4" />{visualMode ? "Выйти из Визуала" : "Включить Визуал"}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => setView("cms")}><Database className="mr-2 h-4 w-4" />Открыть CMS</ContextMenuItem>
                <ContextMenuItem onClick={() => setView(view === "preview" ? "code" : "preview")}>
                  {view === "preview" ? <><Code2 className="mr-2 h-4 w-4" />Показать код</> : <><Eye className="mr-2 h-4 w-4" />Показать превью</>}
                </ContextMenuItem>
                <ContextMenuItem onClick={() => download(currentHtml, currentTitle)}>
                  <Download className="mr-2 h-4 w-4" />Скачать HTML
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}

          {/* Floating visual editor panel */}
          {view === "preview" && visualMode && selected && (
            <VisualPanel
              selected={selected}
              onText={applyText}
              onStyle={applyStyle}
              onClose={() => {
                iframeRef.current?.contentWindow?.postMessage({ __cms: 1, type: "deselect" }, "*");
                setSelected(null);
              }}
            />
          )}
          {view === "preview" && visualMode && !selected && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-foreground/90 px-4 py-2 text-xs text-background shadow-lg">
              Кликни любой элемент на превью для редактирования
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function VisualPanel({
  selected, onText, onStyle, onClose,
}: {
  selected: Selected;
  onText: (v: string) => void;
  onStyle: (u: Partial<Selected["styles"]>) => void;
  onClose: () => void;
}) {
  const s = selected.styles;
  const rgbToHex = (rgb: string) => {
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return "#000000";
    return "#" + [m[0], m[1], m[2]].map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  };
  const fontPx = parseInt(s.fontSize) || 16;

  return (
    <div className="absolute right-4 top-4 z-30 w-72 rounded-xl border bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs">{selected.tag}</span>
        </div>
        <button onClick={onClose} className="grid h-6 w-6 place-items-center rounded hover:bg-accent">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="max-h-[70vh] space-y-3 overflow-y-auto p-3">
        {selected.text !== "" && (
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
              <Type className="h-3 w-3" /> Текст
            </label>
            <textarea
              value={selected.text}
              onChange={(e) => onText(e.target.value)}
              rows={selected.text.length > 60 ? 3 : 1}
              className="w-full resize-none rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
              <Palette className="h-3 w-3" /> Цвет
            </label>
            <input type="color" value={rgbToHex(s.color)} onChange={(e) => onStyle({ color: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border" />
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">
              Фон
            </label>
            <input type="color" value={rgbToHex(s.backgroundColor)} onChange={(e) => onStyle({ backgroundColor: e.target.value })}
              className="h-8 w-full cursor-pointer rounded border" />
          </div>
        </div>

        <div>
          <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase text-muted-foreground">
            <span>Размер шрифта</span><span className="font-mono normal-case">{fontPx}px</span>
          </label>
          <input type="range" min={8} max={120} value={fontPx}
            onChange={(e) => onStyle({ fontSize: `${e.target.value}px` })}
            className="w-full" />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">Жирность</label>
          <div className="grid grid-cols-4 gap-1">
            {["300", "400", "600", "800"].map((w) => (
              <button key={w} onClick={() => onStyle({ fontWeight: w })}
                className={`rounded border px-2 py-1 text-xs ${s.fontWeight === w ? "border-primary bg-primary/10" : "hover:bg-accent"}`}>
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">Выравнивание</label>
          <div className="grid grid-cols-4 gap-1">
            {(["left", "center", "right", "justify"] as const).map((a) => (
              <button key={a} onClick={() => onStyle({ textAlign: a })}
                className={`rounded border px-2 py-1 text-xs capitalize ${s.textAlign === a ? "border-primary bg-primary/10" : "hover:bg-accent"}`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">Padding</label>
          <input type="text" defaultValue={s.padding}
            onBlur={(e) => e.target.value !== s.padding && onStyle({ padding: e.target.value })}
            placeholder="16px или 8px 16px"
            className="w-full rounded-md border bg-background p-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase text-muted-foreground">Margin</label>
          <input type="text" defaultValue={s.margin}
            onBlur={(e) => e.target.value !== s.margin && onStyle({ margin: e.target.value })}
            placeholder="0 auto"
            className="w-full rounded-md border bg-background p-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <p className="pt-1 text-[10px] text-muted-foreground">
          <Save className="mr-1 inline h-3 w-3" />Автосохранение в localStorage · Ctrl+Z отменяет
        </p>
      </div>
    </div>
  );
}

function CmsPanel({
  tab, setTab, subs, clearSubs, fields, onPatch, hasProject,
}: {
  tab: "submissions" | "content"; setTab: (t: "submissions" | "content") => void;
  subs: Submission[]; clearSubs: () => void;
  fields: ContentField[]; onPatch: (f: ContentField, v: string) => void;
  hasProject: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-semibold">React CMS</span>
          <span className="text-xs text-muted-foreground">· локальная</span>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border p-0.5">
          <button onClick={() => setTab("submissions")}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${tab === "submissions" ? "bg-accent" : "hover:bg-accent/50"}`}>
            <Inbox className="h-3.5 w-3.5" /> Отправки {subs.length > 0 && <span className="ml-1 text-muted-foreground">({subs.length})</span>}
          </button>
          <button onClick={() => setTab("content")}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${tab === "content" ? "bg-accent" : "hover:bg-accent/50"}`}>
            <FileText className="h-3.5 w-3.5" /> Контент
          </button>
        </div>
      </div>
      {!hasProject ? (
        <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted-foreground">
          Сначала сгенерируй сайт — CMS привязана к проекту.
        </div>
      ) : tab === "submissions" ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Данные из форм на превью сохраняются здесь автоматически.</p>
            {subs.length > 0 && (
              <button onClick={clearSubs} className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs hover:bg-accent">
                <Trash2 className="h-3 w-3" /> Очистить
              </button>
            )}
          </div>
          {subs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Пока пусто. Отправь форму на превью — она появится тут.
            </div>
          ) : (
            <div className="space-y-3">
              {subs.map((s) => (
                <div key={s.id} className="rounded-xl border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{s.formName}</span>
                      <span className="text-xs text-muted-foreground">{new Date(s.at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="grid gap-1.5 text-sm">
                    {Object.entries(s.data).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[120px_1fr] gap-2">
                        <span className="truncate text-muted-foreground">{k}</span>
                        <span className="break-words font-medium">{v || <em className="text-muted-foreground">—</em>}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-sm text-muted-foreground">Правь тексты и картинки. Изменения применяются к превью и сохраняются.</p>
          {fields.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Не нашёл редактируемых полей.</div>
          ) : (
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={f.selector + i} className="rounded-lg border bg-card p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase">{f.label}</span>
                    {f.attr && <span className="text-[10px] text-muted-foreground">attr={f.attr}</span>}
                  </div>
                  {f.tag === "p" || (f.value && f.value.length > 60) ? (
                    <textarea
                      defaultValue={f.value} rows={3}
                      onBlur={(e) => e.target.value !== f.value && onPatch(f, e.target.value)}
                      className="w-full resize-none rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <input
                      defaultValue={f.value}
                      onBlur={(e) => e.target.value !== f.value && onPatch(f, e.target.value)}
                      className="w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
              ))}
              <p className="pt-2 text-[11px] text-muted-foreground"><Save className="mr-1 inline h-3 w-3" />Сохраняется при потере фокуса поля.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
