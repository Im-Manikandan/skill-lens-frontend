---
applyTo: "README.md"
---

# Update README Skill

When asked to update or regenerate `README.md`, follow these steps exactly.

## Step 1 — Gather current state

Read these files to extract up-to-date information:

| What to extract              | Source files                                                                                            |
|------------------------------|---------------------------------------------------------------------------------------------------------|
| Dependencies & scripts       | `package.json`                                                                                          |
| Vite config, aliases         | `vite.config.js`                                                                                        |
| Environment variables        | `src/properties/properties-env.jsx`, `.env` (if exists)                                                 |
| All routes                   | `src/routes/Router.jsx`, `src/routes/AdminRouter.jsx`, `src/routes/ClientRouter.jsx`                     |
| Sidebar navigation           | `src/layouts/sidebars/sidebardata/AdminSidebarData.jsx`, `src/layouts/sidebars/sidebardata/ClientSidebarData.jsx` |
| Page components              | All files under `src/pages/**/*.jsx` — note every page and its purpose                                  |
| API controllers              | All files under `src/api/**/*.jsx` — note each controller module                                        |
| Reusable components          | All files under `src/components/**/*.jsx`                                                               |
| Redux slices                 | All files under `src/store/**/*.js`                                                                     |
| Docker / deployment          | `docker/Dockerfile`, `docker/server.js` (if they exist)                                                 |
| Project structure            | Top-level directories under `src/`                                                                      |

## Step 2 — Write the README

Overwrite `README.md` with the following sections in order. Keep it concise — no filler, no marketing language.

### Required Sections

1. **Title & one-liner** — `# Skill Lens React` followed by a single sentence describing the project.

2. **Tech Stack** — Bulleted list grouped by category (Frontend, Build, UI, Charts, Forms, Security, Testing, Package Manager). Include major version numbers.

3. **Getting Started**
   - Prerequisites (Node.js, pnpm)
   - Environment Variables — list every `VITE_*` variable found in source with a short description, using a fenced `env` block with placeholder values.
   - Installation: `pnpm install`
   - Development: `pnpm dev` with the local URL
   - Build: all build scripts from `package.json`
   - Linting: lint scripts

4. **Project Structure** — A `tree`-style fenced block of `src/` showing directories and key files with brief inline comments for non-obvious directories. Two levels deep, with a third level where it adds clarity (e.g., `pages/admin/users/`).

5. **Features** — Grouped under **Admin Portal** and **Client Portal** sub-headings. One bullet per feature.

6. **Routes** — Markdown table with columns `Path` and `Description` covering every route from the router files.

7. **Deployment** — If `docker/Dockerfile` and `docker/server.js` exist, briefly describe the Docker build and Express server setup (port, security middleware, base path). Omit this section if they don't exist.

8. **Security** — Bullet list of security measures (RBAC, encrypted storage, CSP, Sentry, etc.).

### Formatting Rules

- GitHub-Flavored Markdown.
- No badges, shields, or images.
- No emojis.
- No "Table of Contents" section.
- Code blocks use the appropriate language tag (`bash`, `env`, etc.).
- Total length under 200 lines.

## Step 3 — Verify

After writing, read the new `README.md` back and confirm:
- Every route from the router files appears in the Routes table.
- Every `pnpm` script from `package.json` is mentioned.
- The project structure matches the actual `src/` directory layout.
- No references to removed or non-existent files.
