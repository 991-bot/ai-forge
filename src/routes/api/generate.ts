import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Ты — mini-Lovable, ИИ, который создаёт целые одностраничные веб-сайты.

ВАЖНЫЕ ПРАВИЛА:
1. На КАЖДЫЙ запрос возвращай ОДИН полный самодостаточный HTML-документ.
2. Ответ должен быть ТОЛЬКО кодом внутри одного блока \`\`\`html ... \`\`\` — без объяснений до или после.
3. Используй Tailwind через CDN: <script src="https://cdn.tailwindcss.com"></script>
4. Шрифты — через <link> на Google Fonts (Inter, Space Grotesk, Playfair и т.д.).
5. Иконки — inline SVG или lucide через CDN.
6. Современный дизайн 2026: glassmorphism, градиенты, плавные CSS-анимации, темная/светлая тема опционально.
7. Полностью адаптивно (mobile-first).
8. Никаких внешних JS-фреймворков (React/Vue). Только чистый HTML/CSS/JS + Tailwind CDN.
9. Реалистичный контент по теме (не lorem ipsum).
10. Если пользователь просит правки — возвращай ПОЛНЫЙ обновлённый HTML целиком, не патч.`;

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
