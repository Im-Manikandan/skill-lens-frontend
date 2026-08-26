# Skill Lens React

A role-based skill management platform built with React 19, Vite, and Redux. Provides admin and client interfaces for managing industries, clients, users, skill frameworks, profiles, HCM/dimension configs, billing plans, and AI-assisted resume/semantic search.

## Tech Stack

- **Frontend:** React 19, React Router 7, Redux Toolkit, Redux Persist, React Query (TanStack)
- **Build:** Vite 8 (base path `/skill-lens`, output `build/`, esbuild minify, optional gzip + brotli compression)
- **UI:** MUI 9, Reactstrap (Bootstrap 5), Tailwind CSS 4, Framer Motion, SimpleBar, Lucide / React Feather icons
- **Charts:** ApexCharts, Chart.js, Recharts
- **Forms:** Formik + Yup
- **Security:** JWT (jose), `@devopsthink/react-security-util` (compress/decrypt), SecureLS, Sentry
- **Testing:** Playwright
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js
- pnpm

### Environment Variables

Build-time `VITE_*` vars (read via `import.meta.env`). Runtime vars are injected via `public/env.js` (`window.env`) and merged with build-time vars in `src/properties/properties-env.jsx` (runtime takes precedence).

```env
VITE_API_URL=<backend-api-base-url>
```

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Runs at [http://localhost:3000/skill-lens](http://localhost:3000/skill-lens).

### Build

```bash
pnpm build              # Standard build
pnpm build:sklens       # Production build (VITE_APP_ENV=sklens), gzip + brotli compression
pnpm build:analyze      # Build with rollup-plugin-visualizer (stats.html)
pnpm preview            # Serve built bundle on port 3000
```

### Linting

```bash
pnpm lint:report              # ESLint HTML report
pnpm lint:security:report     # Security-focused ESLint report
```

## Project Structure

```
src/
├── api/                          # API controllers + fetch helpers
│   ├── admin/                    # users, clients, industries, frameworks, profiles, self-assessment,
│   │                              # dimension-config, hcm-config
│   ├── auth/                     # login (admin/client)
│   ├── client/                   # dashboard, billing-plan, profile-insight, client-admin (me/clients)
│   ├── search/                   # semantic search, resume-processing (bulk resume upload/job polling)
│   ├── token/                    # token controller
│   ├── ApiUtils.jsx              # secure storage + cookie helpers
│   ├── fetch-config-controller.jsx
│   ├── infographic-controller.jsx
│   └── fetch-helpers.jsx         # authFetch + getJSON/postJSON wrappers
├── components/                   # Reusable UI (admin, buttons, visualizations, infographic)
├── config/                       # React Query client config
├── data/                         # Skill framework + competency seed data
├── error/                        # RootErrorBoundary
├── hooks/
│   ├── query/                    # useLoginAdmin, useLoginClient, useMyClients
│   └── useLogoutSync.jsx
├── layouts/
│   ├── FullLayout.jsx, BlankLayout.jsx
│   ├── header/, sidebars/, breadcrumbs/, loader/, logo/, customizer/, theme/
├── pages/
│   ├── admin/                    # AdminDashboard + clients/, industries/, skills/, users/, profiles/, config/
│   ├── auth/                     # LoginAdmin, LoginClient, Logout, *Authorized
│   ├── client/                   # ClientDashboard, ClientSelect, MyAccount, ProfileInsight, SkillInsight,
│   │   └── search/                   # SearchInterface, components/ (SearchInput, ResumeProcessingModal), hooks/ (useResumeProcessing)
│   └── print/                    # InfographicPrintPage — unauthenticated, token-gated page that a
│                                    # backend-driven headless browser screenshots to produce the PDF report
├── properties/                   # properties-env.jsx, properties.js
├── routes/                       # Router.jsx, AdminRouter.jsx, ClientRouter.jsx, ProtectedRoute.jsx
├── store/
│   ├── apps/auth/                # AuthSlice, UserInfoSlice, UserTypeSlice
│   ├── apps/client/               # ClientInfoSlice, ProfileInsightSlice
│   ├── customizer/                # theme + layout settings
│   └── Store.js                  # Redux store + persist config
├── styles/                       # Global SCSS
├── tests/                        # Playwright tests
├── utils/                        # decodeBase64, formatEducationEntry
└── views/                        # Error, Maintenance, RecoverPassword
```

## Features

### Admin Portal
- **Dashboard** — Animated stats and chart visualizations
- **Industries Management** — CRUD for industries
- **Clients Management** — Client CRUD with logo upload
- **Users Management** — User CRUD + admin/client-admin role assignment
- **Skill Framework Management** — Global and client-scoped frameworks
- **Self-Assessment Management** — Per-framework self-assessment definitions
- **Profiles Management** — Per-client profile insight thresholds, HCM/LinkedIn PDF generation, bulk profile upload
- **Client Dimension Config** — Per-client scoring dimension weighting
- **Client HCM Config** — Per-client HCM scorecard configuration

### Client Portal
- **Dashboard** — Client-specific statistics and charts
- **Search Interface** — Semantic search with filters, timeline, result visualizations, and bulk resume upload/processing (job-polling progress modal); each resume (PDF/DOCX) is sent as-is to the backend via `src/api/search/resume-processing-controller.jsx`, which calls `ProfilesController.parseResume` — the backend's existing OpenAI integration reads the document and returns a Talent-schema profile, which then flows through the same `uploadProfiles()` pipeline (and triggers HCM precompute scoped to `source=recruitment` + batch id)
- **Profile Insight** — Profile-level skill insight view
- **Skill Insight** — Skill-level analytics view
- **My Account** — Billing plan + account settings
- **Switch Account (Client Select)** — Switch between accessible client workspaces (fetched via `/client-admin/me/clients`); auto-redirects when only one workspace exists

## Routes

| Path | Description |
|------|-------------|
| `/` | Redirects to `/auth/login/client` |
| `/auth/login/admin` | Admin login |
| `/auth/login/client` | Client login |
| `/auth/logout` | Logout |
| `/auth/admin/authorized` | Admin authorized landing |
| `/auth/client/authorized` | Client authorized landing |
| `/auth/recoverpwd` | Recover password |
| `/auth/maintenance` | Maintenance page |
| `/admin/dashboard` | Admin dashboard |
| `/admin/industries-management` | Industries CRUD |
| `/admin/clients-management` | Clients CRUD |
| `/admin/users-management` | Users CRUD |
| `/admin/skill-framework-management` | Global skill frameworks |
| `/admin/skill-framework-management/:clientId` | Client-scoped skill frameworks |
| `/admin/self-assessment-management/:frameworkId` | Self-assessment editor |
| `/admin/profiles/:clientId` | Profile insight management |
| `/admin/client-config/:clientId` | Client dimension config |
| `/admin/hcm-config/:clientId` | Client HCM config |
| `/client/select` | Switch / select client workspace |
| `/client/dashboard` | Client dashboard |
| `/client/search-interface` | Semantic search |
| `/client/profile-insight` | Profile insight view |
| `/client/skill-insight` | Skill insight view |
| `/client/my-account` | Billing plan + account |
| `/print/infographic-report/:token` | Unauthenticated print route — renders the infographic report for a headless-browser PDF capture, gated by a short-lived token instead of login |
| `/error/404` | 404 page |

## Deployment

Two-step process: build on host, then containerize.

1. `pnpm build` (or `pnpm build:sklens`) produces static assets in `build/`.
2. `docker/Dockerfile` builds a runtime-only `node:20-alpine` image — copies the repo (including prebuilt `build/`), installs production-only deps (Express, compression), runs as non-root user, listens on port 3000.
3. `docker/server.js` — Express server serving the SPA under base path `/skill-lens` via `express-static-gzip` (brotli-preferred). Applies `helmet` (CSP, HSTS, no-sniff, hide-powered-by, etc.), `express-sanitizer`, ESAPI middleware, Sentry request/tracing/error handlers, session-cookie auth interception (redirects unauthenticated requests to `/auth/logout`), and a basic user-agent gate. `/print` is explicitly exempted from the session-cookie gate — it's loaded by a backend-driven headless browser with no session, not a logged-in user.

> **Correction (7 Aug 2026):** the real Jenkins pipeline (`react/s3_publish/skill-lens-react`)
> does **not** actually use `docker/Dockerfile` or `docker/server.js` — those appear to be
> stale/unused. The real production runtime is assembled from a separate shared repo,
> `ansible_github` (`github.com/Lexenius/ansible_github`):
> - Server: `ansible_github/react/react-express/server.js` (+ `package.json`, `401.html`,
>   `config.json`, `exclude_url.json`, `javascript_integration.json` from the same folder)
> - Dockerfile: `ansible_github/react/react-deploy.Dockerfile`
> - Before building, the Jenkins pipeline copies `src/js/properties-sklens.jsx` over
>   `src/js/properties.jsx` — **this is what makes the built app resolve its API URL from
>   `window.location.origin` at runtime instead of a hardcoded domain.** Building without
>   this swap uses the default `properties.jsx`, which is hardcoded to `localhost:8000`.
> - `server.js` is a Jinja2 template (`{{ALB_PATH}}`, `{{FOLDER_NAME}}`, `{{BUILD_NUMBER}}`,
>   plus real `{% if %}...{% else %}...{% endif %}` control flow) — these get rendered by
>   Ansible during the real pipeline run. A standalone build needs those substituted
>   manually (see `pipeline/docker-dev/skill_lens_react_dev.Jenkinsfile` for a working
>   example that does this with `sed`).
>
> This repo's own `docker/` files should probably be removed or reconciled with the real
> pipeline at some point — until then, don't assume they reflect what's actually deployed.

### Dev environment

`docker/skill-lens-react-dev` Jenkins job — triggered automatically on push to `develop`
(see `.github/workflows/trigger-jenkins-dev.yml`), deploys to `dev.skilllens.ai`. Full
pipeline: `pipeline/docker-dev/skill_lens_react_dev.Jenkinsfile`. Implementation details
and the ALB routing bug that affected this environment: see `skill-lens-service`'s
`docs/deployment_runbook.md`, and the technical writeup linked from there.

## Security

- Role-based access control (Admin / Client) via `ProtectedRoute`
- JWT bearer auth — slim claims (`user_id`, `email`, `name`, `user_type`); client list fetched at runtime via `GET /client-admin/me/clients`
- Encrypted local storage (SecureLS) for sensitive client-side data
- Compressed Redux payloads (`@devopsthink/react-security-util`)
- Auto-logout on token expiration / 401 (`fetch-helpers.jsx`)
- Server-side session-cookie interception with secure/httpOnly/sameSite cookies (`docker/server.js`)
- `/print/infographic-report/:token` deliberately bypasses login — access is gated instead by a random, short-TTL token minted server-side per PDF request and discarded once the render completes (see the backend's `infographic_route.py`), scoped to exactly the data the requesting user already had
- Content-Security-Policy and other hardening headers via `helmet`
- Sentry error tracking (client and server)
- Runtime config (`window.env`) overrides build-time env vars
- ESLint security plugins: `eslint-plugin-security`, `eslint-plugin-no-secrets`, `eslint-plugin-no-unsanitized`
