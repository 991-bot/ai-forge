# Skills (Навыки)

Навыки — это процедурные знания и ресурсы для задач, которые агент не мог бы
выполнить так же хорошо из общего обучения. Навык — это каталог с `SKILL.md`
плюс опциональные reference-файлы и скрипты.

## Структура навыка

```
.agents/skills/{skill-name}/
├── SKILL.md           # обязательный (frontmatter + инструкции)
├── references/        # опционально — документы по требованию
├── scripts/           # опционально — .sh, .py, .js, .ts, .bash
└── assets/            # опционально — шаблоны, шрифты
```

## Frontmatter

```yaml
---
name: my-skill
description: Что делает навык и когда срабатывает.
---
```

- `name`: lowercase, дефисы, max 64 символа
- `description`: главная строка — описывает, когда триггерится skill

## Как загружаются

- Навыки появляются в контексте, когда пользователь называет skill
- Или когда retrieval сопоставляет описание с текущей задачей
- Все bundled-файлы доступны через `knowledge://skill/{skill-name}/`

## Активные навыки в этой сессии

### skill-creator
Создание новых навыков. Триггер: "make a skill", "skillify this",
"save this so we can reuse it".

## Типы навыков

| Тип | Назначение |
|---|---|
| Procedural workflows | Повторяющиеся шаги, "skillify this" |
| Reference skills | Доменные знания: схемы, конвенции, API-паттерны |
| Output patterns | Структурированные форматы вывода |
| Progressive disclosure | Когда навык перерастает один файл |

## Создание/обновление

- Никогда не редактировать `.workspace/skills/` напрямую
- Писать draft в `.agents/skills/{skill-name}/`
- Применить через `skills--apply_draft`
