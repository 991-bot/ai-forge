import { createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  Sparkles, Sun, Moon, Smartphone, Eye, Search, Moon as MoonIcon, Palette, Zap, Shield,
  Gauge, Lock, Code2, Database, Server, Cloud, GitBranch, Layers, Cpu, Globe,
  Brush, Rocket, Bot, ShoppingBag, LayoutDashboard, Briefcase, Newspaper, User,
  MessageSquare, Workflow, Send, Mail, FileCode, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Website Builder Profile — Полный системный профиль ИИ" },
      { name: "description", content: "Полное описание настроек, алгоритмов и навыков ИИ, используемых при создании современных адаптивных веб-сайтов." },
      { property: "og:title", content: "AI Website Builder Profile" },
      { property: "og:description", content: "Документация и личный профиль искусственного интеллекта, создающего сайты." },
    ],
  }),
  component: Index,
});

const nav = [
  { id: "settings", label: "Настройки" },
  { id: "skills", label: "Навыки" },
  { id: "stack", label: "Технологии" },
  { id: "process", label: "Процесс" },
  { id: "contact", label: "Контакты" },
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="glass inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-105"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full glass px-4 py-2.5 shadow-glow">
        <a href="#top" className="flex items-center gap-2 font-display font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="hidden sm:inline">AI.Profile</span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map(n => (
            <a key={n.id} href={`#${n.id}`} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {n.label}
            </a>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <section ref={ref} id="top" className="relative overflow-hidden bg-mesh pt-36 pb-24 sm:pt-44 sm:pb-32">
      <motion.div style={{ y }} className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
      <div className="mx-auto max-w-5xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Система активна · v2026.1
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
        >
          AI Website Builder <br />
          <span className="text-gradient">Profile</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          Полное описание настроек, алгоритмов и навыков, используемых при создании современных веб-сайтов.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-wrap justify-center gap-2.5"
        >
          {nav.map(n => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="group inline-flex items-center gap-1.5 rounded-full glass px-5 py-2.5 text-sm font-medium transition-all hover:scale-105 hover:shadow-glow"
            >
              {n.label}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </a>
          ))}
        </motion.div>

        <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { k: "150+", v: "технологий" },
            { k: "12", v: "типов сайтов" },
            { k: "10", v: "этапов" },
            { k: "100%", v: "адаптив" },
          ].map((s, i) => (
            <motion.div
              key={s.v}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-4"
            >
              <div className="font-display text-2xl font-bold text-gradient sm:text-3xl">{s.k}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <div className="mb-3 inline-block rounded-full glass px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl font-bold sm:text-5xl">{title}</h2>
      {desc && <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{desc}</p>}
    </div>
  );
}

const settingsGroups = [
  {
    icon: Palette, title: "Дизайн",
    items: ["Адаптивная верстка", "Mobile First", "Responsive Layout", "Accessibility Ready", "SEO Friendly", "Dark Mode Support"],
  },
  {
    icon: Eye, title: "UI/UX",
    items: ["Современный интерфейс", "Минимализм", "Высокая читаемость", "Быстрая навигация", "Оптимизация конверсии"],
  },
  {
    icon: Gauge, title: "Производительность",
    items: ["Lazy Loading", "Code Splitting", "Image Optimization", "Core Web Vitals", "Fast Rendering"],
  },
  {
    icon: Shield, title: "Безопасность",
    items: ["Input Validation", "XSS Protection", "CSRF Protection", "Secure Authentication", "HTTPS Ready"],
  },
];

function Settings() {
  return (
    <section id="settings" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle eyebrow="System Settings" title="Настройки системы" desc="Базовая конфигурация, применяемая ко всем создаваемым проектам." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {settingsGroups.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass group relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "var(--gradient-brand)" }}>
                <g.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mb-3 font-display text-lg font-semibold">{g.title}</h3>
              <ul className="space-y-2">
                {g.items.map(it => (
                  <li key={it} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand-2)]" />
                    {it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const skillGroups = [
  { title: "Frontend", icon: Code2, items: [
    ["HTML5", 100], ["CSS3", 100], ["JavaScript", 95], ["TypeScript", 95],
    ["React", 95], ["Next.js", 90], ["Vue", 85], ["Tailwind CSS", 95], ["Bootstrap", 90],
  ]},
  { title: "Backend", icon: Server, items: [
    ["Node.js", 95], ["Express", 90], ["Python", 95], ["Django", 90],
    ["FastAPI", 95], ["PHP", 80], ["Laravel", 80], ["REST API", 100], ["GraphQL", 85],
  ]},
  { title: "Базы данных", icon: Database, items: [
    ["MySQL", 95], ["PostgreSQL", 95], ["MongoDB", 90], ["Firebase", 90], ["Supabase", 95], ["SQLite", 90],
  ]},
  { title: "DevOps", icon: Cloud, items: [
    ["Docker", 85], ["Git", 100], ["GitHub", 100], ["CI/CD", 85],
    ["Vercel", 95], ["Netlify", 95], ["AWS", 80],
  ]},
] as const;

function SkillBar({ name, value, delay }: { name: string; value: number; delay: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span className="font-mono text-xs text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }} whileInView={{ width: `${value}%` }} viewport={{ once: true }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: "var(--gradient-brand)" }}
        />
      </div>
    </div>
  );
}

function Skills() {
  return (
    <section id="skills" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-60" />
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle eyebrow="Capabilities" title="Навыки ИИ" desc="Уровень владения технологиями по результатам тренировки и практики." />
        <div className="grid gap-6 lg:grid-cols-2">
          {skillGroups.map((g, gi) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: gi * 0.1, duration: 0.5 }}
              className="glass rounded-3xl p-6 sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "var(--gradient-brand)" }}>
                  <g.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold">{g.title}</h3>
              </div>
              <div className="space-y-4">
                {g.items.map(([n, v], i) => (
                  <SkillBar key={n as string} name={n as string} value={v as number} delay={i * 0.04} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const processSteps = [
  "Анализ требований", "Создание структуры проекта", "Проектирование UX/UI",
  "Разработка Frontend", "Разработка Backend", "Интеграция базы данных",
  "Оптимизация производительности", "Тестирование", "SEO-настройка", "Развертывание проекта",
];

function Process() {
  return (
    <section id="process" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <SectionTitle eyebrow="Workflow" title="Процесс создания сайта" desc="Каждый проект проходит через 10 чётко определённых этапов." />
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent sm:left-1/2 sm:-translate-x-1/2" />
          <div className="space-y-8">
            {processSteps.map((step, i) => {
              const left = i % 2 === 0;
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: left ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5 }}
                  className={`relative flex items-start gap-4 sm:gap-0 ${left ? "sm:flex-row" : "sm:flex-row-reverse"}`}
                >
                  <div className="sm:w-1/2 sm:px-8">
                    <div className="glass rounded-2xl p-5">
                      <div className="font-mono text-xs text-[color:var(--brand-2)]">STEP {String(i + 1).padStart(2, "0")}</div>
                      <div className="mt-1 font-display text-lg font-semibold">{step}</div>
                    </div>
                  </div>
                  <div className="absolute left-4 top-5 sm:left-1/2 sm:-translate-x-1/2">
                    <div className="grid h-8 w-8 place-items-center rounded-full ring-4 ring-background" style={{ background: "var(--gradient-brand)" }}>
                      <span className="font-mono text-xs font-bold text-white">{i + 1}</span>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

const capabilities = [
  { icon: Rocket, label: "Создание лендингов" },
  { icon: ShoppingBag, label: "Интернет-магазины" },
  { icon: Layers, label: "SaaS-платформы" },
  { icon: Briefcase, label: "CRM-системы" },
  { icon: LayoutDashboard, label: "Панели администратора" },
  { icon: Globe, label: "Корпоративные сайты" },
  { icon: Newspaper, label: "Блоги" },
  { icon: User, label: "Портфолио" },
  { icon: Bot, label: "AI-приложения" },
  { icon: MessageSquare, label: "Telegram-боты" },
  { icon: FileCode, label: "API-интеграции" },
  { icon: Workflow, label: "Автоматизация бизнес-процессов" },
];

function Capabilities() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle eyebrow="What I build" title="Возможности ИИ" desc="Полный спектр продуктов — от посадочных страниц до автоматизированных систем." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.05 }}
              className="glass group flex items-center gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted transition-colors group-hover:bg-transparent" style={{ backgroundImage: "var(--gradient-brand)", backgroundClip: "padding-box" }}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium">{c.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const stack = [
  "HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
  "Python", "FastAPI", "PostgreSQL", "MongoDB", "Docker", "GitHub", "AWS",
  "Vercel", "Supabase", "Tailwind CSS",
];

function Stack() {
  return (
    <section id="stack" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-mesh opacity-50" />
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle eyebrow="Tech Stack" title="Технологический стек" desc="Инструменты, активно используемые в production-проектах." />
        <div className="flex flex-wrap justify-center gap-3">
          {stack.map((t, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-2xl px-5 py-3 font-mono text-sm font-medium transition-transform hover:-translate-y-1 hover:shadow-glow"
            >
              <span className="text-gradient">{t}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const principles = [
  { t: "Clean Code", d: "Чистый, читаемый и поддерживаемый код." },
  { t: "SOLID", d: "Пять принципов объектно-ориентированного проектирования." },
  { t: "DRY", d: "Don't Repeat Yourself — никаких дубликатов логики." },
  { t: "KISS", d: "Keep It Simple — простые решения сложных задач." },
  { t: "Scalable Architecture", d: "Архитектура, рассчитанная на рост нагрузки." },
  { t: "Component-Based Design", d: "Переиспользуемые автономные компоненты." },
  { t: "API First", d: "Проектирование начинается с контракта API." },
  { t: "Security By Design", d: "Безопасность встроена на уровне архитектуры." },
];

function Principles() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <SectionTitle eyebrow="Architecture" title="Архитектурные принципы" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p, i) => (
            <motion.div
              key={p.t}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="mb-2 font-mono text-xs text-[color:var(--brand-2)]">0{i + 1}</div>
              <div className="mb-1 font-display text-lg font-semibold">{p.t}</div>
              <div className="text-sm text-muted-foreground">{p.d}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.includes("@") || form.message.trim().length < 3) return;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4">
        <SectionTitle eyebrow="Contact" title="Связаться" desc="Опишите задачу — получите профессиональное решение." />
        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass rounded-3xl p-6 sm:p-10 shadow-glow"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Имя</span>
              <input
                required maxLength={100} value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 outline-none transition-all focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/30"
                placeholder="Иван"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input
                type="email" required maxLength={255} value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 outline-none transition-all focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/30"
                placeholder="you@example.com"
              />
            </label>
          </div>
          <label className="mt-5 block">
            <span className="mb-1.5 block text-sm font-medium">Сообщение</span>
            <textarea
              required maxLength={1000} rows={5} value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              className="w-full resize-none rounded-xl border border-input bg-background/50 px-4 py-3 outline-none transition-all focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand)]/30"
              placeholder="Расскажите о вашем проекте..."
            />
          </label>
          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white transition-all hover:scale-[1.01] hover:shadow-glow sm:w-auto"
            style={{ background: "var(--gradient-brand)" }}
          >
            {sent ? <><CheckCircle2 className="h-4 w-4" /> Отправлено</> : <><Send className="h-4 w-4" /> Связаться</>}
          </button>
        </motion.form>

        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
          <a href="mailto:hello@ai-profile.dev" className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 transition-transform hover:scale-105">
            <Mail className="h-4 w-4" /> hello@ai-profile.dev
          </a>
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2">
            <GitBranch className="h-4 w-4" /> github.com/ai-builder
          </span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 font-display font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-full" style={{ background: "var(--gradient-brand)" }}>
            <Cpu className="h-3 w-3 text-white" />
          </span>
          AI Website Builder Profile
        </div>
        <p className="mt-2">© 2026 · Built with care, code & gradients.</p>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Nav />
      <main>
        <Hero />
        <Settings />
        <Skills />
        <Process />
        <Capabilities />
        <Stack />
        <Principles />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
