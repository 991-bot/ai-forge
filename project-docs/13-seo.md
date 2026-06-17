# SEO Rules

## Базовые правила

- **Title** < 60 символов с ключевым словом
- **Meta description** < 160 символов
- **Один H1** на страницу
- **Семантический HTML** (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`)
- **Alt text** на всех изображениях
- **JSON-LD** структурированные данные при применимости
- **Lazy loading** для изображений
- **Canonical tags**
- **Responsive viewport**

## Per-route metadata (TanStack)

В TanStack Start каждый route задаёт свой `head()`:

```ts
export const Route = createFileRoute('/about')({
  head: () => ({
    meta: [
      { title: 'About — Уникальное название' },
      { name: 'description', content: 'Уникальное описание <160 символов' },
      { property: 'og:title', content: 'About' },
      { property: 'og:description', content: '...' },
      { property: 'og:image', content: 'https://.../about-hero.jpg' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  }),
})
```

## og:image

- Добавлять только на leaf-роутах (root head конкатенируется во все matches)
- Когда есть hero/cover/product image — он же og:image и twitter:image
- Для динамических роутов — из loader data
- **Опустить, если нет осмысленного изображения** — лучше без, чем generic
