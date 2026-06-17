# Технологический стек

## Основа

Lovable-проекты построены на **TanStack Start v1** — full-stack React 19 фреймворке
с поддержкой SSR/SSG и серверных функций.

- **Runtime**: React 19
- **Framework**: TanStack Start v1
- **Build**: Vite 7
- **Target**: Edge function (Cloudflare Workers)
- **Routing**: TanStack Router (file-based)
- **State**: TanStack Query

## Стилизация

**Tailwind CSS v4** — настроен через `src/styles.css` с нативными CSS `@import`
и theme-переменными вместо legacy `tailwind.config.js`.

- Lightning CSS build резолвит `@import` из файловой системы
- Web-шрифты загружаются через `<link>` в `src/routes/__root.tsx`
- НЕ `@import` удалённых URL в `src/styles.css`

## UI-компоненты

**shadcn/ui** — Radix UI primitives + Tailwind, кастомизированные через CSS-переменные.

## База данных и Backend

**Lovable Cloud** (Supabase под капотом):
- PostgreSQL
- Authentication
- Storage
- Edge Functions (для внешних/публичных API)
- Server Functions (через TanStack `createServerFn` для внутренней логики)

## AI

**Lovable AI Gateway** — единый шлюз для:
- Chat completions
- Image generation
- Embeddings

## НЕ поддерживается

- Angular, Vue, Svelte
- Native mobile apps
- Next.js, Remix conventions (`src/pages/`, `app/layout.tsx`)
- React Router DOM
