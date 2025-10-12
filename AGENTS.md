# Repository Guidelines

## Project Structure & Module Organization
- Monorepo-style layout with app folders and small utilities at the root.
- `inspection-v2/` — Vite + TypeScript + Firebase app (own `src/`, configs, `dist/`).
- `dashboard/` — static site (HTML/CSS/JS).
- Root contains utilities (`*.py`, `*.js`) and data/assets (`*.kml`, `*.json`, `*.html`).
- Each app owns its config and lockfiles; scope changes to the relevant folder.

## Build, Test, and Development Commands
- inspection-v2 (dev): `cd inspection-v2 && npm ci && npm run dev`
- inspection-v2 (build/preview): `npm run build && npm run preview`
- dashboard (serve locally): `cd dashboard && python -m http.server 8000` (or `npx serve`)
- Playwright tools (root): `npx playwright install`; run `npx playwright test` if tests exist.

## Coding Style & Naming Conventions
- TypeScript/JS: 2-space indent; lint via ESLint in `inspection-v2/` (`eslint.config.js`).
- Filenames: kebab-case for web assets, PascalCase for components, snake_case for Python.
- Python: 4-space indent; prefer f-strings; format with `black` if available.
- JSON/configs: 2-space indent; keep stable key ordering and minimal diffs.

## Testing Guidelines
- inspection-v2: place unit tests as `src/**/*.test.ts`; e2e under `e2e/` using Playwright.
- Keep tests deterministic; mock network/Firebase calls; fixtures under `tests/fixtures/` (create if absent).
- For small scripts, include minimal example-based tests or usage notes alongside the file.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`).
- PRs include purpose, linked issues, test steps, and UI screenshots when applicable.
- Update READMEs/configs if behavior or contracts change.

## Security & Configuration Tips
- Never commit secrets. Copy `inspection-v2/.env.example` to `.env.local`.
- Keep Firebase rules in sync (`database.rules.json`, `storage.rules`); deploy from `inspection-v2/` when needed.
- Ignore large/derived files; prefer data samples over full datasets.

## Agent-Specific Instructions
- This AGENTS.md applies repo-wide; nested `AGENTS.md` files in subfolders take precedence.
- Follow app-local tooling and configs; keep changes minimal and localized.
