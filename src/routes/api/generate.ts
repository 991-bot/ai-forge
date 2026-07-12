import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Ты — mini-Lovable, ИИ, который создаёт целые одностраничные сайты.

СТРОГИЕ ПРАВИЛА:
1. Возвращай ТОЛЬКО один полный самодостаточный HTML-документ, без пояснений, без markdown-блоков.
2. Начинай ответ ровно с "<!DOCTYPE html>".
3. Подключай Tailwind через <script src="https://cdn.tailwindcss.com"></script>.
4. Шрифты — через <link> Google Fonts (Inter, Space Grotesk, Playfair Display и т.п.).
5. Иконки — inline SVG.
6. Современный дизайн 2026: glassmorphism, градиенты, плавные CSS-анимации, hover-эффекты.
7. Полностью адаптивно (mobile-first).
8. Никаких внешних JS-фреймворков.
9. Реалистичный содержательный контент по теме, а не lorem ipsum.
10. Если пользователь просит правки — возвращай ПОЛНЫЙ обновлённый HTML целиком.`;

type ChatMsg = { role: "user" | "assistant"; content: string };

function extractHtml(text: string): string {
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1] : text;
  const idx = raw.indexOf("<!DOCTYPE");
  return (idx >= 0 ? raw.slice(idx) : raw).trim();
}

function extractTitle(html: string): string {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim().slice(0, 80) : "Сгенерированный сайт";
}

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, currentHtml } = (await request.json()) as {
          messages?: ChatMsg[];
          currentHtml?: string;
        };
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);

        // If we have an existing site, prepend it as context so the model edits, not recreates.
        const finalMessages: ChatMsg[] = currentHtml
          ? [
              {
                role: "user",
                content:
                  "Вот ТЕКУЩИЙ HTML сайта. Применяй правки к нему, сохраняй общую структуру и уже введённый контент. Возвращай ПОЛНЫЙ обновлённый HTML.\n\n```html\n" +
                  currentHtml.slice(0, 60000) +
                  "\n```",
              },
              { role: "assistant", content: "Понял, применяю правки к текущему сайту." },
              ...messages,
            ]
          : messages;

        try {
          const { text } = await generateText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM_PROMPT,
            messages: finalMessages.map((m) => ({ role: m.role, content: m.content })),
          });
          const html = extractHtml(text);
          const title = extractTitle(html);
          return Response.json({ html, title });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const status = /429|rate/i.test(msg) ? 429 : /402|credit/i.test(msg) ? 402 : 500;
          return Response.json({ error: msg }, { status });
        }
      },
    },
  },
});
