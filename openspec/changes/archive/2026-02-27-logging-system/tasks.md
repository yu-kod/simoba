## 1. Setup

- [x] 1.1 Install `@logtape/logtape` in root `package.json` and `server/package.json`
- [x] 1.2 Create `shared/logging.ts` with `createClientLogger` / `createServerLogger` factory functions

## 2. Backend Logging

- [x] 2.1 Create `server/src/config/logging.ts` with JSON stdout sink + console sink, environment-based level config
- [x] 2.2 Initialize LogTape in `server/src/index.ts` (before server listen), replace existing `console.log` with logger
- [x] 2.3 Add room lifecycle logging to `server/src/rooms/GameRoom.ts` (onCreate, onJoin, onLeave, onDispose)

## 3. Frontend Logging

- [x] 3.1 Create `src/config/logging.ts` with console sink, environment-based level config
- [x] 3.2 Initialize LogTape in `src/main.ts` (before Phaser game creation), add top-level await
- [x] 3.3 Replace `console.error` in `src/scenes/GameScene.ts` with logger, add scene lifecycle logging (create, shutdown)

## 4. ESLint & Quality

- [x] 4.1 Add `no-console: "warn"` rule to `eslint.config.mjs` for source files, exclude test files
- [x] 4.2 Remove existing `// eslint-disable-next-line no-console` comments that are now covered by logger

## 5. Tests

- [x] 5.1 Add unit tests for `shared/logging.ts` (factory function returns correct category loggers)
- [x] 5.2 Add unit tests for `server/src/config/logging.ts` (JSON sink output format, level filtering)
- [x] 5.3 Verify existing tests pass with LogTape initialization (no side effects)
