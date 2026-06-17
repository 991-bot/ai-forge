# Server Functions

`createServerFn` — типизированный RPC для client→server вызовов.
Server routes (`src/routes/api/`) — для raw HTTP endpoints: webhooks, public APIs,
streaming.

## Folder layout

НЕ помещай server-functions, импортируемые клиентом, под `src/server/` —
import protection блокирует весь каталог.

- `*.functions.ts(x)` — в client-safe пути (`src/lib/`, `src/utils/`, или рядом с роутом)
- `*.server.ts(x)` хелперы — где угодно (import protection блокирует по имени)
- Компоненты импортируют `*.functions.ts`, никогда `*.server.ts` напрямую

## Канонический шейп

```ts
// src/lib/users.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchUser } from "./users.server";

export const getUser = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.API_KEY!; // читать ВНУТРИ .handler()
    return fetchUser(data.id, apiKey);
  });
```

## Failure modes

| Ошибка | Причина |
|---|---|
| `createServerFn is not a function` | Импорт не из `@tanstack/react-start` |
| `window is not defined` SSR crash | Client-only модуль в module scope |
| Build fails citing `src/server/*` | Импорт-цепочка тянет server в client |
| `process.env.X is undefined` | Читать внутри `.handler()`, не в module scope |

## Auth-protected server functions

`.middleware([requireSupabaseAuth])` бросает 401 без сессии, включая SSR
и `build:dev` prerender.

### Правила

- НЕ ставить protected fn в loader публичного роута — prerender без сессии
- Вызывать из компонента через `useServerFn` внутри `useQuery` или event handler
- Loader безопасен только под `_authenticated/` — там есть route gate

### Примеры

```ts
// ❌ ПЛОХО — публичный route, prerender 401
createFileRoute('/posts')({ loader: () => getUserPosts() })

// ✅ ХОРОШО — из компонента
const fetchPosts = useServerFn(getUserPosts)
useQuery({ queryKey: ['posts'], queryFn: fetchPosts })

// ✅ ХОРОШО — loader под _authenticated/
createFileRoute('/_authenticated/posts')({ loader: () => getUserPosts() })
```

## Три Supabase клиента

1. **Browser**: `@/integrations/supabase/client` — publishable key, RLS, auth flows
2. **Server publishable**: создавать в handler с `SUPABASE_URL`+`SUPABASE_PUBLISHABLE_KEY`
3. **Server auth user**: `requireSupabaseAuth` middleware — RLS как user
4. **Admin**: `@/integrations/supabase/client.server` — service role, BYPASS RLS,
   только для verified webhooks/admin

`process.env.*` — server-only. Public config — `import.meta.env.VITE_*`.
