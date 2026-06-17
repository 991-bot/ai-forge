# Public Schema Grants

Каждый `CREATE TABLE` в `public` ОБЯЗАН сопровождаться `GRANT` в **той же миграции**.

Supabase Data API (PostgREST) **НЕ** выдаёт default privileges на `public`
ролям `anon`, `authenticated`, `service_role`. Без явных `GRANT` приложение
не достучится до таблицы — RLS недостаточно.

## Строгий порядок

1. `CREATE TABLE public.<name>(...)`
2. `GRANT` на таблицу для ролей, разрешённых политиками
3. `ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY`
4. `CREATE POLICY ...`

## Default grant block

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<table> TO authenticated;
GRANT ALL ON public.<table> TO service_role;
-- Добавить только если есть anon policy:
GRANT SELECT ON public.<table> TO anon;
```

## Настройка под политики

- Убрать `anon` grant, когда все policy скоупятся к `auth.uid()`
- Расширять `anon` privileges только для полностью публичных таблиц
- Всегда включать `service_role` для таблиц, доступных edge-функциям

Если запрос упал с permission error и `HINT` — выполнить рекомендованный GRANT
дословно.

**Перед отправкой миграции с CREATE TABLE — перечитать SQL и подтвердить
GRANT для каждой новой таблицы.**
