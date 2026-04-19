# CLAUDE.md

Guidance for AI coding assistants (Claude Code and similar) working in this repository.

## Project overview

**famfinance** — inferred to be a family-finance project based on the repo name. The repository is currently in a **pre-scaffolding state**: no application code, framework, or tooling has been committed yet.

> When the stack is chosen and initial code lands, update this file. Do not let it drift from reality — an outdated CLAUDE.md is worse than none.

## Repository status

As of the latest commit on `main`, the working tree contains:

- `README.md` — single line (`# famfinance`), placeholder.
- `CLAUDE.md` — this file.

There is **no** `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `Dockerfile`, CI config, or `src/` directory. Do not assume a stack. If the user's request presumes one, ask before proceeding.

## Development workflow

All sections below are placeholders. Fill them in the same commit that introduces the corresponding tooling.

### Install / bootstrap

TODO — document the install command (e.g., `npm install`, `uv sync`, `cargo build`) once a package manifest exists.

### Run locally

TODO — document the dev-server or entry-point command once an app exists.

### Test

TODO — document the test runner and how to run a single test.

### Lint / typecheck

TODO — document linter and typechecker commands; note which are required before commit.

### Build

TODO — document the production build command and output location.

## Git conventions

- Default branch: `main`.
- Feature work happens on descriptive branches. Claude Code sessions typically use `claude/<short-slug>` (e.g., `claude/add-claude-documentation-muLeM`).
- Create a **new commit** for each logical change — do not amend published commits.
- Never use `--no-verify` or bypass hooks. If a hook fails, fix the cause.
- Never force-push `main`.
- First push of a branch: `git push -u origin <branch-name>`.
- Open pull requests only when the user explicitly asks for one.

## Conventions for AI assistants

- **Keep this file current.** When you add structure (source dirs, scripts, CI, deps), update the matching section in the same commit.
- **Don't invent a stack.** If the user hasn't chosen a framework, language version, or library, ask instead of picking one.
- **Prefer editing over creating.** Only add new files when the task genuinely requires them.
- **No emojis** in code or docs unless the user asks for them.
- **Minimal comments.** Only comment when the *why* is non-obvious; let names carry the *what*.
- **Trust boundaries only.** Add validation at external inputs, not between internal functions.
- **Scope discipline.** Don't refactor, add abstractions, or introduce backwards-compat shims beyond what the task requires.

## Next steps for the next contributor

1. Decide on the stack (language, framework, package manager) — confirm with the repo owner.
2. Add the package manifest and commit it.
3. Add lint, typecheck, test, and build scripts; document the exact commands under **Development workflow** above.
4. Replace the **Project overview** with a concrete description of what famfinance is and who uses it.
5. Expand **Repository status** into a directory map once `src/` (or equivalent) exists.
