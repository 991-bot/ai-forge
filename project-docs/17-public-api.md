# Public API Endpoints (`/api/public/*`)

При реализации webhooks, cron endpoints или public APIs, которые вызывают
внешние сервисы, помещай routes под `/api/public/`. Этот префикс **обходит
аутентификацию** на published сайтах.

## Использовать для

- Webhook endpoints, получающие callbacks от внешних сервисов
- Cron endpoints, вызываемые pg_cron или внешними schedulers
- Public read-only endpoints (health checks, public stats)

## КРИТИЧНО: security в handler

- Verify webhook signatures ПЕРЕД обработкой данных
- Validate весь input через Zod
- Никогда не возвращать user PII / sensitive data
- Никогда не выполнять write operations без верификации caller

## Пример: verified webhook

```ts
// app/routes/api/public/webhook.ts
import { createFileRoute } from '@tanstack/react-router'
import { createHmac, timingSafeEqual } from 'crypto'

export const Route = createFileRoute('/api/public/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get('x-webhook-signature')
        const body = await request.text()

        // ВСЕГДА verify signature перед обработкой
        const expected = createHmac('sha256', process.env.WEBHOOK_SECRET!)
          .update(body).digest('hex')

        if (!signature || !timingSafeEqual(
          Buffer.from(signature),
          Buffer.from(expected)
        )) {
          return new Response('Invalid signature', { status: 401 })
        }

        // Теперь безопасно обрабатывать verified payload
        const payload = JSON.parse(body)
        await handleWebhookEvent(payload)
        return new Response('ok')
      }
    }
  }
})
```

## Stable URLs для cron и внешних сервисов

- `project--{project-id}.lovable.app` — стабильный production URL
  (отдаёт published deployment)
- `project--{project-id}-dev.lovable.app` — стабильный preview URL
  (отдаёт latest preview build)

Эти URL **immutable** (не изменятся при переименовании проекта) и идеальны
для конфигурации внешних сервисов как pg_cron.

Для `/api/public/*` routes специальные headers не требуются.
