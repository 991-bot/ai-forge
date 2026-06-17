# Архитектура агента — 8 слоёв

```
┌─────────────────────────────────────────────┐
│  1. LLM (мозг)                              │
│     Claude / GPT / Gemini                   │
├─────────────────────────────────────────────┤
│  2. System Prompt (конституция)             │
│     Роль, правила, формат, запреты          │
├─────────────────────────────────────────────┤
│  3. Tools (руки)                            │
│     Функции с JSON-schema                   │
├─────────────────────────────────────────────┤
│  4. Skills (специализация)                  │
│     SKILL.md + ресурсы по требованию        │
├─────────────────────────────────────────────┤
│  5. Memory (долгая память)                  │
│     mem:// — правила всегда в контексте     │
├─────────────────────────────────────────────┤
│  6. Context (короткая память)               │
│     Файлы, логи, скриншоты, история чата    │
├─────────────────────────────────────────────┤
│  7. Guardrails (защита)                     │
│     Secrets, validation, RLS, roles         │
├─────────────────────────────────────────────┤
│  8. Loop (цикл выполнения)                  │
│     Receive → Plan → Act → Observe → Verify │
└─────────────────────────────────────────────┘
```

## 1. LLM

Большая языковая модель — "мозг" агента. Принимает решения, какие tools вызвать,
какой код написать. Примеры: Claude 4, GPT-5, Gemini 3.

## 2. System Prompt

"Конституция" агента. Определяет:
- Роль (кто я)
- Стиль коммуникации
- Workflow (как работать)
- Правила кода (что обязательно/запрещено)
- Формат ответа

## 3. Tools

Функции, которые модель может вызвать. Каждый tool — JSON schema с:
- `name`
- `description`
- `inputSchema` (zod / json-schema)
- `execute` (async function)

Базовый набор:
- `read_file`, `write_file`, `line_replace`
- `exec` (bash)
- `browser` (act, observe, screenshot)
- `search_web`, `fetch_website`
- `generate_image`
- `db_query`

## 4. Skills

Папки с `SKILL.md` (frontmatter + инструкции) и ресурсами.
Загружаются только когда релевантны — описание матчится с задачей.

## 5. Memory

Долгосрочные правила проекта в `mem://`, всегда в контексте.

Типы: design, constraint, preference, feature, reference.

## 6. Context

То, что попадает в сообщение модели на каждом шаге:
- Открытые файлы (current-code)
- Console logs
- Network requests
- Screenshots
- История чата
- Session replay (rrweb)

## 7. Guardrails

- Secrets только на server
- Zod validation на всех входах
- RLS policies в БД
- Role management через отдельную таблицу
- Подтверждение деструктивных действий

## 8. Loop

```
while (not done && step < maxSteps) {
  message = await llm.generate(context)
  if (message.toolCalls) {
    results = await Promise.all(message.toolCalls.map(call => execute(call)))
    context.push(message, results)
  } else {
    return message  // final answer
  }
}
```

Stop conditions:
- `stopWhen: stepCountIs(50)`
- Модель не вызвала tool
- Превышен токен-лимит

## Минимальный стек для "mini-Lovable"

| Слой | Решение |
|---|---|
| LLM | `google/gemini-3-flash-preview` |
| AI SDK | `ai`, `@ai-sdk/openai-compatible` |
| Tools | `tool({ inputSchema: z.object(...), execute })` |
| Skills | Loader по описанию + glob |
| Memory | File-based в `mem://` |
| Loop | `stopWhen: stepCountIs(50)` |
| UI | React + Tailwind + Framer Motion |
| Sandbox | Cloudflare Workers / Docker |
