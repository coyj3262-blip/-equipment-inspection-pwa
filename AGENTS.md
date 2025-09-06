# Repository Guidelines

*** Begin Patch
*** Add File: AGENTS.md
+# AGENTS.md
+
+This file tells any coding agent how to work inside this repo.
+**Audience:** A non-programmer. Explanations must be beginner-friendly.
+
+---
+
+## 1) Communication Defaults
+- Start every reply with a **Plain-English Summary (3–5 bullets)**.
+- **Define jargon inline** on first use (e.g., “linter = a tool that checks code style”).
+- **Show, don’t tell:** include **copy-paste commands** and expected output.
+- Use the reply template in §8 (Summary ? Plan ? Diff ? Run & Verify ? Rollback ? Beginner Notes ? Next Step).
+- If a step could break things, **ask before proceeding**.
+- Tone: patient, concrete, concise. Avoid walls of text.
+
+> Treat the user (Coy) as **new to coding**. Prefer clarity over speed.
+
+---
+
+## 2) Safety & Approval Gates
+All work must follow and pause for approval at each gate:
+1. **PLAN** – approach, files to touch, blast radius, alternatives.
+2. **DIFF** – show a unified diff preview. **Do not apply yet.**
+3. **APPLY** – apply only after approval.
+4. **TEST** – run verification steps; report results verbatim.
+5. **ROLLBACK PLAN** – exact undo steps.
+
+**Do not**:
+- Add dependencies or enable network calls without explicit approval.
+- Modify **database files** (`*.db`, `*.sqlite`) or **schema logic** in `db.js` without approval.
+- Change more than **100 lines or 3 files** in one step—split into smaller PRs.
+
+---
+
+## 3) Deliverables (Every Task)
+- **Unified diff** of all changes.
+- **Why it matters** (one short paragraph).
+- **How to run** (exact commands).
+- **How to verify** (what success looks like).
+- **How to undo** (exact commands or git steps).
+- **Beginner Notes**: 3–6 bullets teaching the key idea in plain English.
+
+---
+
+## 4) Project Map
+- Type: **Desktop app** using **Electron** (JavaScript runtime for desktop apps).
+- Database: **SQLite** via `sqlite3`.
+- Entrypoints (app root): **`main.js`** (main process), `preload.js`, `renderer.js`, `index.html`, `db.js`.
+- Monorepo: **No** (single package).
+- “Do-not-touch” areas by default:
+  - `db.js` data model and any `*.db` / `*.sqlite` files.
+  - Any user data directories the app creates.
+  - Build/packaging scripts if/when added.
+
+---
+
+## 5) Tooling & Package Manager
+- Package manager: **npm** (lockfile: `package-lock.json`).
+- Node: prefer current **LTS**.
+- Electron runtime launched via app script.
+
+---
+
+## 6) Build / Run / Test
+This project is currently **run-only** (no build/test scripts defined).
+
+### Install & Run (Option A: included helper)
+1) Double-click **`run-me.bat`**  
+   - It downloads a portable Node (if needed), runs `npm install`, then `npm start`.
+
+### Install & Run (Option B: your own Node)
+```bash
+# Windows PowerShell (from repo root)
+npm ci   # or: npm install
+npm start
+```
+**Expected result:** Electron window opens. The console may show Electron startup logs; a SQLite DB file may be created on first use.
+
+### Scripts (from package.json)
+- `start`: `electron .`
+> If you later add scripts (e.g., `build`, `test`, `lint`), document them here.
+
+---
+
+## 7) Policies & Conventions
+- Code style: follow existing patterns; avoid introducing new tooling without approval.
+- Public behavior changes must include a short doc note and (when tests exist) updated tests.
+- **Secrets:** never paste secrets into code or prompts; use an `.env.example` pattern if needed.
+- Commits/PRs: imperative titles (`feat: add X`), include a **Test plan** section.
+
+---
+
+## 8) Reply Template (Agents must use this)
+**Summary** – bullets in plain English  
+**Plan** – files to touch, approach, alternatives  
+**Diff (preview)** – unified diff  
+**Run & Verify** – commands + expected output  
+**Rollback** – exact undo steps  
+**Beginner Notes** – short teaching bullets  
+**Next Step** – what you’ll wait on or do next
+
+---
+
+## 9) Windows Notes for `sqlite3`
+If `npm install` fails compiling `sqlite3`:
+- Ensure you’re on **Node LTS**.
+- Install **Python 3** and ensure it’s on PATH.
+- Install **Microsoft C++ Build Tools** (Visual Studio Build Tools 2019/2022, C++ workload).
+- Retry: `npm ci` (or `npm install`). If still failing, propose switching to a prebuilt binary version or pin a compatible `sqlite3` version—with approval.
+
+---
+
+## 10) Operating Constraints
+- Default runtime budget: **? 15 min per agent step**, then report back.
+- Prefer deterministic, local steps; avoid flaky network-dependent actions.
+- Save any generated logs under `docs/agent-runs/<date>/` if added.
+
+---
+
+## 11) When In Doubt
+Pause, summarize options, and ask for a choice.
+
*** End Patch

## Project Structure & Module Organization
- Source lives in `src/`; tests in `tests/`; docs in `docs/`; helper scripts in `scripts/`; static assets in `assets/`. Monorepos place packages under `packages/*`.
- Organize modules by feature; each folder owns its code, tests, and fixtures. Re-export a minimal public API via `index.ts`/`__init__.py` where idiomatic.

## Build, Test, and Development Commands
- Use the tooling present in this repo; examples below match common setups:
  - Node: `npm ci`, `npm run dev` (start locally), `npm run build` (production), `npm test` (unit tests).
  - Python: `python -m venv .venv` && `.venv\\Scripts\\activate`, `pip install -e .[dev]`, `pytest -q`.
  - Rust: `cargo build`, `cargo test`, `cargo run`.
- Lint/format before pushing: `npm run lint` / `ruff check .` / `cargo fmt` (whichever applies).

## Coding Style & Naming Conventions
- Honor repo formatters/configs if present: `.prettierrc`, `eslint`, `pyproject.toml` (black/ruff), `.rustfmt.toml`.
- Indentation: 2 spaces for JS/TS; 4 spaces for Python; use tool defaults for other languages.
- Naming: `PascalCase` types/classes, `camelCase` functions/variables, `kebab-case` filenames; tests end with `.test.ts` or start with `test_*.py`.
- Keep lines â‰¤ 100 chars; write clear docstrings/comments when intent isnâ€™t obvious.

## Testing Guidelines
- Frameworks typically used: Jest/Vitest (JS/TS), Pytest (Python), Cargo test (Rust).
- Place tests in `tests/` mirroring `src/` structure; keep tests fast and deterministic (use fakes over network/IO).
- Aim for 80%+ line coverage where practical. Examples: `pytest -q --maxfail=1`, `npm test -- --run`, `cargo test --quiet`.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`; imperative subject â‰¤ 72 chars (e.g., `feat(api): add pagination`).
- PRs include: clear description, linked issues (`Closes #123`), screenshots for UI changes, updated docs/tests, and passing CI/lint.

## Security & Configuration Tips
- Never commit secrets. Use `.env` (ignored) and provide `.env.example`. Rotate leaked tokens immediately.
- Keep dependencies current; run `npm audit` / `pip-audit` / `cargo audit` if applicable.

