# Доступные инструменты

## Прямые инструменты (всегда доступны)

### Файлы и код
- `code--exec` — выполнение bash команд (rg, bun, curl, node, python, и т.д.)
- `code--view` — чтение файлов (по умолчанию 500 строк)
- `code--write` — создание/перезапись файла
- `code--line_replace` — замена строк в файле
- `code--copy` — копирование файла или каталога
- `code--list_dir` — листинг каталога

### Отладка
- `code--read_console_logs` — браузерные console логи
- `code--read_network_requests` — сетевые запросы из превью
- `code--read_session_replay` — rrweb replay сессии пользователя
- `code--read_runtime_errors` — runtime ошибки
- `code--dependency_scan` — npm audit
- `code--restart_dev_server` — перезапуск Vite

### Веб
- `code--fetch_website` — fetch как markdown/html/screenshot

### Генерация
- `imagegen--generate_image` — генерация изображений (fast/standard/premium)

### Вопросы
- `questions--ask_questions` — уточняющие вопросы (choice/text/slider/visual_choice/prototype)

### Поиск инструментов
- `tool_search` — обнаружение отложенных (deferred) инструментов

## Отложенные инструменты (через tool_search)

### Browser
- `browser--act`, `browser--observe`, `browser--screenshot`
- `browser--view_preview`, `browser--navigate_to_url`
- `browser--read_console_logs`, `browser--list_network_requests`
- `browser--performance_profile`

### Subagents
- `acp_subagent--spawn_agent` — запуск подагентов
- `acp_subagent--explore` — параллельное исследование
- `acp_subagent--get_agent_result`

### AI Gateway
- `ai_gateway--create` — Lovable AI Gateway (chat, image, embeddings)

### Cloud / Backend
- `supabase--enable` — Lovable Cloud
- `stack_modern--invoke-server-function`
- `stack_modern--server-function-logs`

### Платежи
- `stripe--enable_stripe`, `payments--enable_paddle_payments`

### SEO
- `seo_chat--trigger_scan`, `seo_chat--list_findings`
- `semrush--keyword_research`, `semrush--domain_analysis`

### Безопасность
- `security--run_security_scan`, `security--get_scan_results`
- `security--update_memory`

### Аналитика
- `analytics--read_project_analytics`

### Документы
- `document--parse_document`

### Дизайн
- `design--create_directions` — варианты дизайн-прототипов

### Память
- `chat_search--search_chat_history`, `chat_search--recall_chat_history`

### Публикация
- `preview_ui--publish`, `preview_ui--set_preview_device_viewport`
- `publish_settings--*`

### Секреты
- `secrets--add_secret`, `secrets--fetch_secrets`, `secrets--update_secret`

### Соединения
- `standard_connectors--connect`, `standard_connectors--list_connections`

### Видео
- `videogen--generate_video`

### Изображения
- `imagegen--edit_image`, `image_tools--zoom_image`

### Skills
- `skills--apply_draft`

### Документация
- `lovable_docs--search_docs`

### MCP
- `mcp_knowledge--connect`

### Кросс-проекты
- `cross_project--list_projects`, `cross_project--copy_project_asset`
