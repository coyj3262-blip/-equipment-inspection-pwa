# Repository Guidelines

## Project Structure & Module Organization
- `main.js` drives the Electron main process, window lifecycle, and IPC wiring.
- `preload.js` exposes the approved bridge API; keep surface area lean and audited.
- Renderer UI lives in `renderer.js` and `index.html`; the JSA workflow anchors in `renderer.js` under the Inspections v2 views.
- SQLite access is centralized in `db.js`; treat it as read-only unless a schema change has been signed off.
- Support assets belong in `assets/`; automated checks and specs go under `tests/`.

## Build, Test, and Development Commands
- `npm ci` installs dependencies from `package-lock.json` for reproducible builds.
- `npm start` launches the Electron shell with startup logs.
- `npm test` executes the Jest suite (or skips if no tests are present).
- `npm run build` produces a packaged desktop build when release prep is needed.
- On Windows desktops you can alternatively run `run-me.bat` to start the app with environment defaults.

## Coding Style & Naming Conventions
- JavaScript across main, preload, and renderer: 2-space indent, semicolons, trailing commas where valid.
- Favor `const` and `let`, async/await over promise chains, and modular helpers over large files.
- Components and classes use PascalCase, functions and variables use camelCase, files prefer kebab-case or match legacy names.
- Keep renderer logic responsive; push blocking I/O to the main process or async IPC handlers.

## Testing Guidelines
- Author unit tests as `*.test.js` beside the module or in `tests/` when shared.
- Use lightweight mocks for SQLite calls; do not open production `.db` files in tests.
- Aim for Arrange-Act-Assert structure and cover the JSA flow, IPC handlers, and data transforms when feasible.
- Run `npm test` locally before publishing or opening a pull request.

## Commit & Pull Request Guidelines
- Follow Conventional Commits such as `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- Keep commits focused; include rationale and issue references (for example `Closes #123`).
- Pull requests need a clear summary, linked tickets, UI screenshots for renderer changes, and manual test notes.
- Confirm linting/tests pass and avoid bundling unrelated refactors.

## Security & Configuration Tips
- Never commit secrets; rely on `.env` with a mirrored `.env.example` and keep `.env` ignored.
- Maintain `contextIsolation: true` and `nodeIntegration: false`; whitelist IPC channels explicitly.
- Back up user data before migrations and treat SQLite files as read-only unless approved.