# Debugging

## Когда застрял в циклах ошибок

### 1. Стартуй с доступных сигналов
- Console logs
- Network requests
- Stack traces

### 2. Выбери технику по типу проблемы

| Тип | Подход |
|---|---|
| Логические баги | Изолировать и тестировать |
| UI/state | `browser--view_preview`, `browser--observe`, console logs, network |
| Регрессии | Запустить тесты |
| Library errors | Поиск в вебе |

### 3. Поток
**Diagnose → Investigate → Fix → Validate**

## После правок

После правок кода или schema-изменений **верифицируй**, что изменения работают:
- Проверить build output
- Запустить тесты (если есть)

**Заявлять, что баг исправлен, только после проверки сигнала, который имеет значение.**

## Доступные debug-инструменты

- `code--read_console_logs` — браузерные логи
- `code--read_network_requests` — сетевые запросы
- `code--read_runtime_errors` — runtime ошибки
- `code--read_session_replay` — rrweb воспроизведение действий пользователя
- `code--dependency_scan` — npm audit
- `browser--view_preview` — превью с возможностью взаимодействия
- `browser--screenshot` — скриншот
- `browser--observe` — наблюдение за DOM
- `browser--performance_profile` — профилирование
- `stack_modern--server-function-logs` — server function логи

## Error Recovery

- Если edit fails ("no match", "Failed to parse patch"):
  перечитать файл `code--view`, повторить с обновлённым содержимым
- Если застрял 3+ попыток на одной ошибке:
  попробовать другой подход — упростить или разбить на меньшие правки
