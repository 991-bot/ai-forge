import { motion } from "framer-motion";
import {
  Brain, Wrench, BookOpen, Database, Eye, ShieldCheck, GitBranch,
  Terminal, FileCode, Image as ImageIcon, Globe2, MessageCircle,
  Sparkles, Cpu, Layers, Zap, Lock, CheckCircle2,
} from "lucide-react";

const layers = [
  {
    icon: Brain,
    title: "1. LLM — мозг",
    tag: "Foundation Model",
    desc: "Базовая языковая модель. У меня — связка передовых LLM (Gemini 3, GPT-5.x), которая меняется по мере выхода новых версий. Сама по себе модель только генерирует текст.",
    bullets: ["Multimodal: текст + изображения", "Контекст 200K+ токенов", "Function calling", "Streaming ответов"],
  },
  {
    icon: FileCode,
    title: "2. System Prompt — характер",
    tag: "Instructions",
    desc: "Конституция агента: роль, стиль, воркфлоу, запреты. Определяет, как агент думает и реагирует. Это самый дешёвый и мощный рычаг настройки.",
    bullets: ["Роль и тон общения", "Правила кодирования", "Воркфлоу: уточни → собери → сделай → проверь", "Что НЕЛЬЗЯ делать"],
  },
  {
    icon: Wrench,
    title: "3. Tools — руки",
    tag: "Function Calling",
    desc: "Без инструментов модель только говорит. Tools превращают её в агента, который действует — читает файлы, ставит пакеты, делает запросы к БД, генерирует изображения.",
    bullets: ["JSON-Schema контракт", "Параллельные вызовы", "Стриминг результата обратно в модель", "Подтверждение для опасных действий"],
  },
  {
    icon: BookOpen,
    title: "4. Skills — навыки",
    tag: "Retrieval Knowledge",
    desc: "Папка с инструкцией + ресурсами, которая подгружается только когда нужна. Так агент не таскает всю экспертизу в голове и остаётся быстрым.",
    bullets: ["SKILL.md + frontmatter", "Семантический матч по description", "scripts/ + references/ + assets/", "Версионирование и переиспользование"],
  },
  {
    icon: Database,
    title: "5. Memory — долгая память",
    tag: "Persistent",
    desc: "Правила, дизайн-токены, запреты, формулы — всё, что должно пережить сессию. Всегда в контексте, чтобы не повторять одни и те же ошибки.",
    bullets: ["design / constraint / preference / feature", "Индекс mem://index.md", "Авто-применение в каждом ответе", "Cross-session user prefs"],
  },
  {
    icon: Eye,
    title: "6. Context — глаза и уши",
    tag: "Live State",
    desc: "Что я вижу прямо сейчас: открытые файлы, консоль превью, сетевые запросы, скриншоты, история чата, session replay действий пользователя.",
    bullets: ["Console + Network snapshots", "Browser DOM observation", "Файловое дерево проекта", "Runtime errors с stack trace"],
  },
  {
    icon: ShieldCheck,
    title: "7. Guardrails — рамки",
    tag: "Safety",
    desc: "Безопасность и предсказуемость. Без них агент может слить ключи, сломать БД или принять необратимые решения без подтверждения.",
    bullets: ["Секреты только server-side", "RLS + роли в отдельной таблице", "Валидация ввода через zod", "needsApproval для мутаций"],
  },
  {
    icon: GitBranch,
    title: "8. Loop — цикл рассуждения",
    tag: "Agent Loop",
    desc: "Многошаговый цикл: думаю → зову инструмент → читаю результат → думаю дальше. Завершается по stopWhen — например, stepCountIs(50).",
    bullets: ["Plan → Act → Observe → Reflect", "stopWhen(stepCountIs(50))", "Self-correction по ошибкам", "Параллельное выполнение шагов"],
  },
];

const tools = [
  { icon: FileCode, name: "File Editor", d: "read/write/edit с line-replace" },
  { icon: Terminal, name: "Bash Exec", d: "shell + bun + python в песочнице" },
  { icon: Globe2, name: "Browser", d: "превью, скриншоты, observe DOM" },
  { icon: ImageIcon, name: "Image Gen", d: "GPT-Image-2 / Nano Banana" },
  { icon: Database, name: "DB / Supabase", d: "миграции, RLS, edge functions" },
  { icon: MessageCircle, name: "Web Search", d: "актуальные данные из сети" },
  { icon: Sparkles, name: "AI Gateway", d: "Lovable AI: чат, embeddings, image" },
  { icon: Layers, name: "Subagents", d: "spawn_agent для параллельных задач" },
];

const stack = [
  { group: "Runtime", items: ["TanStack Start v1", "React 19", "Vite 7", "Cloudflare Workers", "Bun"] },
  { group: "Styling", items: ["Tailwind CSS v4", "oklch tokens", "shadcn/ui", "Framer Motion", "Lucide Icons"] },
  { group: "Backend", items: ["Supabase Postgres", "Row-Level Security", "Edge Functions", "Server Functions", "REST + RPC"] },
  { group: "AI Layer", items: ["Vercel AI SDK", "@ai-sdk/openai-compatible", "Lovable AI Gateway", "Tool Calling", "Streaming UI"] },
  { group: "Models", items: ["gemini-3-flash", "gemini-3-pro", "gpt-5.4", "gpt-image-2", "gemini-embedding-001"] },
  { group: "Skills SDK", items: ["SKILL.md spec", "Frontmatter + description", "scripts/", "references/", "skills--apply_draft"] },
  { group: "DevOps", items: ["Auto preview", "Hot reload", "Git managed by Lovable", "Custom domains", "Edge deploy"] },
  { group: "Security", items: ["zod validation", "XSS / CSRF", "Secrets vault", "Auth middleware", "Audit logs"] },
];

export function AgentArchitecture() {
  return (
    <section id="architecture" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-40" />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-3 inline-block rounded-full glass px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inside the Agent
          </div>
          <h2 className="font-display text-3xl font-bold sm:text-5xl">Архитектура агента</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Из чего я состою. Восемь слоёв, которые превращают языковую модель в полноценного разработчика.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {layers.map((l, i) => (
            <motion.article
              key={l.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: (i % 4) * 0.06, duration: 0.5 }}
              className="glass group relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow sm:p-7"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <l.icon className="h-5 w-5 text-white" />
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {l.tag}
                </span>
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold sm:text-xl">{l.title}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{l.desc}</p>
              <ul className="space-y-1.5">
                {l.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-2)]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        {/* Tools showcase */}
        <div className="mt-20">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
                <Wrench className="h-3 w-3" /> Tools registry
              </div>
              <h3 className="font-display text-2xl font-bold sm:text-3xl">Мои инструменты</h3>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Каждый инструмент — это типизированный контракт с JSON-схемой. Модель сама решает, когда и как его вызвать.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="glass flex items-start gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-glow"
              >
                <div
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <t.icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Full stack matrix */}
        <div className="mt-20">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground">
                <Cpu className="h-3 w-3" /> Full Stack Matrix
              </div>
              <h3 className="font-display text-2xl font-bold sm:text-3xl">Полный стек системы</h3>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Восемь категорий технологий, на которых работает агент и приложения, которые он создаёт.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stack.map((s, i) => (
              <motion.div
                key={s.group}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.05 }}
                className="glass rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold">{s.group}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {s.items.map((it) => (
                    <li key={it} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ background: "var(--gradient-brand)" }}
                      />
                      <span className="font-mono">{it}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Loop diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass mt-20 rounded-3xl p-6 sm:p-10 shadow-glow"
        >
          <div className="mb-6 flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">Цикл рассуждения агента</h3>
              <p className="text-sm text-muted-foreground">Как одна задача превращается в готовый код</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {[
              { n: "01", t: "Receive", d: "Запрос + контекст превью, файлов, логов" },
              { n: "02", t: "Plan", d: "Разбиваю на шаги, выбираю tools" },
              { n: "03", t: "Act", d: "Параллельные вызовы инструментов" },
              { n: "04", t: "Observe", d: "Читаю результаты, ошибки, состояние" },
              { n: "05", t: "Verify", d: "Build, тесты, скриншот превью" },
            ].map((step, i) => (
              <div key={step.n} className="relative">
                <div className="rounded-2xl border border-border bg-background/50 p-4">
                  <div className="mb-1 font-mono text-xs text-[color:var(--brand-2)]">{step.n}</div>
                  <div className="mb-1 font-display font-semibold">{step.t}</div>
                  <div className="text-xs text-muted-foreground">{step.d}</div>
                </div>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 h-px w-4 bg-border" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-muted/50 p-4 font-mono text-xs">
            <Lock className="h-3.5 w-3.5 text-[color:var(--brand-2)]" />
            <span className="text-muted-foreground">stopWhen:</span>
            <span>stepCountIs(50)</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">onError:</span>
            <span>self-correct & retry</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">onSuccess:</span>
            <span>report + close</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
