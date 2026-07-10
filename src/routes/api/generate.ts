import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Ты — AI-разработчик уровня Lovable. Ты создаёшь и итеративно правишь многофайловые React + TypeScript + Vite + Tailwind проекты.

ФОРМАТ ОТВЕТА — СТРОГО JSON (без markdown-заборов, без пояснений вокруг):
{
  "plan": "Короткий план — что именно ты собираешься сделать, 2-5 пунктов, markdown-списком",
  "thinking": "Твои размышления: почему ты выбираешь именно такую архитектуру, компоненты, стили. 3-6 предложений.",
  "summary": "Одно короткое предложение по-русски о том, что готово",
  "title": "Короткое название проекта (макс 40 симв)",
  "files": [
    { "path": "/App.tsx", "content": "..." },
    { "path": "/components/Hero.tsx", "content": "..." },
    { "path": "/styles.css", "content": "..." }
  ]
}

ТЕХНИЧЕСКИЕ ПРАВИЛА:
- Основной файл ВСЕГДА "/App.tsx" — экспорт по умолчанию React-компонента App
- Импорты компонентов только относительные: import Hero from "./components/Hero"
- Используй Tailwind классы (Tailwind уже подключён)
- Разрешённые библиотеки уже установлены: react, react-dom, lucide-react, framer-motion
- НИКАКИХ external CSS/JS через <link> или <script>. Всё inline / Tailwind / lucide-react.
- Если пользователь просит правки — верни ВСЕ файлы проекта заново (полностью), не diff.
- Верни минимум "/App.tsx". Разбивай крупные UI на компоненты в /components/*.tsx
- НЕ создавай package.json, index.html, main.tsx, vite.config — только код приложения.
- Контент — реалистичный, содержательный, на языке запроса пользователя.
- Дизайн 2026: современный, glassmorphism, градиенты, плавные motion-анимации, mobile-first.

ВАЖНО: ответ должен парситься JSON.parse. Экранируй кавычки внутри content правильно.`;

type ChatMsg = { role: "user" | "assistant"; content: string };

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: ChatMsg[] };
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        try {
          const { text } = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM_PROMPT,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            providerOptions: {
              lovable: { response_format: { type: "json_object" } },
            },
          });

          // Try to extract JSON: model sometimes wraps in ```json ... ```
          let raw = text.trim();
          const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
          if (fence) raw = fence[1].trim();
          const first = raw.indexOf("{");
          const last = raw.lastIndexOf("}");
          if (first >= 0 && last > first) raw = raw.slice(first, last + 1);

          const parsed = JSON.parse(raw) as {
            plan?: string; thinking?: string; summary?: string; title?: string;
            files?: Array<{ path: string; content: string }>;
          };

          if (!parsed.files || parsed.files.length === 0) {
            return Response.json({ error: "AI не вернул файлы" }, { status: 502 });
          }

          return Response.json({
            plan: parsed.plan ?? "",
            thinking: parsed.thinking ?? "",
            summary: parsed.summary ?? "Готово",
            title: parsed.title ?? "Проект",
            files: parsed.files,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const status = /429|rate/i.test(msg) ? 429 : /402|credit/i.test(msg) ? 402 : 500;
          return Response.json({ error: msg }, { status });
        }
      },
    },
  },
});
