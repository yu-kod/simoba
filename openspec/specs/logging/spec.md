# Specification

## Purpose
LogTape によるロギング基盤（階層カテゴリ、サーバー/クライアント設定）の仕様

## Requirements

### Requirement: LogTape dependency
The project SHALL use `@logtape/logtape` v2.x as the logging library. The package SHALL be installed at the workspace root so both frontend (`src/`) and backend (`server/`) can import it.

#### Scenario: Package installation
- **WHEN** `npm install` is run at the project root
- **THEN** `@logtape/logtape` is available for import in both `src/` and `server/` code

### Requirement: Hierarchical category convention
All loggers SHALL use hierarchical categories with `"simoba"` as the root. The second level SHALL distinguish `"client"` and `"server"`. The third level and beyond SHALL identify the subsystem.

Category examples:
- `["simoba", "client", "scene"]` — scene lifecycle
- `["simoba", "client", "network"]` — network/connection events
- `["simoba", "server", "room"]` — Colyseus room lifecycle
- `["simoba", "server", "game"]` — game logic (systems, combat)
- `["simoba", "server", "system"]` — server startup/shutdown

#### Scenario: Client logger creation
- **WHEN** a frontend module creates a logger with `getLogger(["simoba", "client", "scene"])`
- **THEN** the logger inherits sink and level settings from parent categories `["simoba", "client"]` and `["simoba"]`

#### Scenario: Server logger creation
- **WHEN** a backend module creates a logger with `getLogger(["simoba", "server", "room"])`
- **THEN** the logger inherits sink and level settings from parent categories `["simoba", "server"]` and `["simoba"]`

### Requirement: Frontend log configuration
The frontend SHALL configure LogTape at application startup (before Phaser game creation) with a console sink. In development mode (`import.meta.env.DEV`), the lowest level SHALL be `"debug"`. In production mode, the lowest level SHALL be `"warning"`.

#### Scenario: Development mode logging
- **WHEN** the app runs in development mode (`import.meta.env.DEV === true`)
- **THEN** logs at debug level and above are output to the browser console

#### Scenario: Production mode logging
- **WHEN** the app runs in production mode (`import.meta.env.DEV === false`)
- **THEN** only logs at warning level and above are output to the browser console
- **THEN** debug and info logs are suppressed

### Requirement: Backend log configuration
The backend SHALL configure LogTape at server startup (before Colyseus server listen) with a structured JSON sink writing to stdout. In development mode (`NODE_ENV !== "production"`), an additional human-readable console sink SHALL be configured. In production mode, only the JSON sink SHALL be active.

#### Scenario: Production JSON output
- **WHEN** the server runs in production mode (`NODE_ENV === "production"`)
- **THEN** each log line is a single JSON object written to stdout containing at minimum: `timestamp` (ISO 8601), `level`, `category` (dot-joined string), and `message`

#### Scenario: Development console output
- **WHEN** the server runs in development mode (`NODE_ENV !== "production"`)
- **THEN** logs are output to the console in a human-readable format
- **THEN** a JSON sink to stdout is also active for testing the production format

### Requirement: Structured log properties
Loggers SHALL attach contextual properties to log messages using LogTape's structured logging API. Properties SHALL include domain-relevant data (e.g., `roomId`, `playerId`, `sceneKey`) without embedding them in message strings.

#### Scenario: Room event with properties
- **WHEN** a server room logs a join event
- **THEN** the log record contains structured properties like `{ roomId: "abc123", playerId: "xyz", playerCount: 3 }` accessible for JSON serialization and CloudWatch Logs Insights queries

### Requirement: Replace existing console calls
All existing `console.log`, `console.error`, `console.warn`, and `console.debug` calls in the codebase SHALL be replaced with the appropriate LogTape logger method.

#### Scenario: GameScene error replacement
- **WHEN** `GameScene` encounters a missing gameMode
- **THEN** it logs via `logger.error` instead of `console.error`

#### Scenario: Server startup replacement
- **WHEN** the Colyseus server starts listening
- **THEN** it logs via `logger.info` instead of `console.log`, including the port as a structured property

### Requirement: Server room lifecycle logging
The Colyseus `GameRoom` SHALL log key lifecycle events: room creation, player join, player leave, room disposal. Each log SHALL include the `roomId` and relevant context.

#### Scenario: Room created
- **WHEN** a GameRoom `onCreate` is called
- **THEN** an info-level log is emitted with category `["simoba", "server", "room"]` and property `roomId`

#### Scenario: Player joins
- **WHEN** a player joins a GameRoom
- **THEN** an info-level log is emitted with `roomId`, `playerId` (sessionId), and current `playerCount`

#### Scenario: Player leaves
- **WHEN** a player leaves a GameRoom
- **THEN** an info-level log is emitted with `roomId`, `playerId`, and remaining `playerCount`

#### Scenario: Room disposed
- **WHEN** a GameRoom `onDispose` is called
- **THEN** an info-level log is emitted with `roomId`

### Requirement: Client scene lifecycle logging
The Phaser game client SHALL log scene transitions at debug level with category `["simoba", "client", "scene"]`.

#### Scenario: Scene created
- **WHEN** a scene's `create` method is called
- **THEN** a debug-level log is emitted with the scene key

#### Scenario: Scene shutdown
- **WHEN** a scene's `shutdown` method is called
- **THEN** a debug-level log is emitted with the scene key

### Requirement: ESLint console restriction
An ESLint rule SHALL warn on direct `console.*` usage in `src/` and `server/src/` to encourage using the logger instead. Test files and configuration files SHALL be excluded from this rule.

#### Scenario: Direct console usage in source code
- **WHEN** a developer writes `console.log(...)` in a source file
- **THEN** ESLint emits a warning suggesting to use the logger

#### Scenario: Console usage in test files
- **WHEN** a developer writes `console.log(...)` in a test file (`*.test.ts`)
- **THEN** ESLint does NOT emit a warning
