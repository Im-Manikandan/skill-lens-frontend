---
name: update-readme
description: Update the project README.md to accurately reflect the current codebase — tech stack, structure, routes, features, scripts, and environment variables.
---

# Update README Skill

Regenerate `README.md` to match the current state of the codebase. Follow these steps exactly.

## Step 1 — Gather current state

Read these files to extract up-to-date information:

| What to extract | Source files |
|-----------------|-------------|
| Dependencies & scripts | `package.json` |
| Vite config, base path, aliases | `vite.config.js` |
| Environment variables used | `src/properties/properties-env.jsx`, `.env` (if exists) |
| All routes | `src/routes/Router.jsx`, `src/routes/AdminRouter.jsx`, `src/routes/ClientRouter.jsx` |
| Sidebar navigation | `src/layouts/sidebars/sidebardata/AdminSidebarData.jsx`, `src/layouts/sidebars/sidebardata/ClientSidebarData.jsx` |
| Page components | Glob `src/pages/**/*.jsx` — note every page and its purpose |
| API controllers | Glob `src/api/**/*.jsx` — note each controller module |
| Reusable components | Glob `src/components/**/*.jsx` |
| Redux slices | Glob `src/store/**/*.js` |
| Docker / deployment | `Dockerfile`, `server.js` (if they exist) |
| Project structure | `ls src/` top-level directories |

## Step 2 — Write the README

Overwrite `README.md` with the sections below. Keep it concise — no filler, no marketing language.

### Required sections (in order)

1. **Title & one-liner** — `# Skill Lens React` followed by a single sentence describing the project.

2. **Tech Stack** — Bulleted list grouped by category (Frontend, Build, UI, Charts, Forms, Security, Testing, Package Manager). Include major version numbers.

3. **Getting Started**
   - Prerequisites (Node.js, pnpm)
   - Environment Variables — list every `VITE_*` variable found in source with a short description. Use a fenced `env` block with placeholder values.
   - Installation (`pnpm install`)
   - Development (`pnpm dev`) with the local URL
   - Build — show all build scripts from `package.json`
   - Linting — show lint scripts

4. **Project Structure** — A `tree`-style fenced block of `src/` showing directories and key files. Include brief inline comments for non-obvious directories. Keep it to two levels deep except where a third level adds clarity (e.g., `pages/admin/users/`).

5. **Features** — Grouped under **Admin Portal** and **Client Portal** sub-headings. One bullet per feature with a short description.

6. **Routes** — A markdown table with columns `Path` and `Description` listing every route from the router files.

7. **Deployment** — If `Dockerfile` and `server.js` exist, briefly describe the Docker build and Express server setup (port, security middleware, base path). If they don't exist, omit this section.

8. **Security** — Bullet list of security measures (RBAC, encrypted storage, CSP, Sentry, etc.).

### Formatting rules

- Use GitHub-Flavored Markdown.
- No badges, shields, or images.
- No emojis.
- No "Table of Contents" section.
- Code blocks use the appropriate language tag (`bash`, `env`, etc.).
- Keep the total length under 200 lines.

## Step 3 — Verify

After writing, read the new `README.md` back and verify:
- Every route from the router files appears in the Routes table.
- Every `pnpm` script from `package.json` is mentioned.
- The project structure matches the actual `src/` directory layout.
- No references to removed or non-existent files.
