# Server Runtime (Cloudflare Workers)

Серверные функции и SSR entry point работают в **serverless Worker** рантайме.
С `nodejs_compat` многие Node.js built-ins доступны, но несколько распространённых
отсутствуют или сломаны.

## НЕ использовать в серверных функциях

Эти модули **упадут в runtime**:

- `child_process` (spawn, exec, fork) — нерабочая заглушка
  `"[unenv] <method> is not implemented yet!"`
- `sharp`, `canvas`, `puppeteer` — требуют native binaries или FS-доступа
- `fs.watch` / `fs.watchFile` — file watching не поддерживается
- `os.cpus()`, `os.networkInterfaces()` — `os` только частично заглушен
- Любой пакет, требующий настоящей OS FS

## Безопасно (с nodejs_compat)

`fs`, `path`, `crypto`, `Buffer`, `stream`, `url`, `events`, `timers`, `net`,
`http`, `https`, `zlib`.

Worker предоставляет виртуальную файловую систему.

## Node.js-only npm пакеты — избегать

Многие пакеты предполагают полный Node.js process на реальной машине.

**Признаки Node-only пакета:**
- README говорит "Node.js only" или упоминает node-gyp / prebuild-install
- Ship `.node` файлы или `binding.gyp`
- Spawn child processes, открывают raw TCP daemons, ожидают произвольные FS-пути

## Runtime ошибки = несовместимость

- `[unenv] X is not implemented yet!` — заглушка
- `Cannot find module 'X'` / `X is not a constructor` runtime — нужен native addon
- `__dirname is not defined` / `__filename is not defined` — Worker bundler emits ESM
- Работает в dev, падает в prod — dev на Node, prod на workerd

## Bundling

- Все npm пакеты должны быть полностью забандлены на build time
- Нет runtime module resolution в Worker
- Предпочитать пакеты с инлайн WASM
- **НЕ** ставить `ssr.external` или `resolve.external` для Worker SSR
