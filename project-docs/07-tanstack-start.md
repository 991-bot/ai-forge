# TanStack Start — Правила

## Архитектура

TanStack Start v1.x использует Vite plugin, который обрабатывает SSR entry points
автоматически. **НЕ создавать** `entry-client.tsx` или `entry-server.tsx` — это
pre-1.0 vinxi паттерны.

## Router Bootstrap (КРИТИЧНО)

Должны существовать:
- `src/router.tsx`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`

**НЕ использовать:**
- `src/pages/` — это другой фреймворк
- `src/routes/_app/index.tsx` — Next.js-стиль, создаёт конфликт "/"
- `app/layout.tsx` — Remix-стиль
- React Router DOM

## File-Based Routing

Используется flat dot-separated convention, не директории:

| Файл | URL |
|---|---|
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `posts.$postId.tsx` | `/posts/:postId` |
| `settings.tsx` | `/settings` (layout с Outlet) |
| `settings.profile.tsx` | `/settings/profile` |

Серверные роуты — под `src/routes/api/`.

**НЕ редактировать** `src/routeTree.gen.ts` — генерируется автоматически.

## Strict Build (КРИТИЧНО)

Strict TypeScript. Каждый импорт должен резолвиться к существующему файлу или пакету.

- **Локальные файлы**: создавать ПЕРЕД импортом, в той же batch-правке
- **npm пакеты**: `bun add <package>` ПЕРЕД написанием import
- **Assets**: не импортировать `@/assets/...` без существования файла

## Навигация

```ts
import { Link, useNavigate } from '@tanstack/react-router'
// НЕ react-router-dom
```

- НЕ `Route.useRouter()` — `useRouter()` standalone
- НЕ trailing slashes (`/products`, не `/products/`)

## Layout Routes

Файл `src/routes/settings.tsx` с `<Outlet />` — layout для `settings.profile.tsx`.
Дочерние роуты рендерятся внутри `<Outlet />` автоматически.

**Если у parent есть children — он ДОЛЖЕН рендерить `<Outlet />`**.
Симптом: страница пустая, но URL правильный.

## Error и Not-Found Boundaries

Каждый route с loader ДОЛЖЕН задать оба:
- `errorComponent`
- `notFoundComponent`

Root route — `notFoundComponent`.
Router config — `defaultErrorComponent`.

В `errorComponent` retry-кнопка должна вызывать `router.invalidate()` И `reset()`.

## Контент-сайты

Для сайтов с секциями (Services, About, Contact, Blog) — **отдельные route-файлы**,
не hash-якоря на index. Каждый route — свой `head()` с уникальным
title/description/og.

Hash anchors (`#section`) — ТОЛЬКО для внутристраничного скролла (TOC).

## Syntax Rules

- Никаких дубликатов импортов/деклараций
- JSX тэги сбалансированы (1 open = 1 close)
- Соседние JSX обёрнуты в `<>...</>` или родителя
- Полные syntax-блоки: `try` → `catch`/`finally`
- `createServerFn` chain непрерывный: `.inputValidator().handler()`
