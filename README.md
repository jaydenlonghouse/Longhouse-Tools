# Longhouse Tools Hub

Internal launcher for Longhouse team tools. Sign in with Google (`@longhouse.co`), see only the tools your roles allow, open external apps, and submit feedback.

## Local development

```bash
npm install
cp .env.example .env
```

### Demo mode (no Supabase)

```bash
# .env
VITE_USE_MOCK=true
```

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You’ll see mock tools and a fake session without configuring Supabase.

### With Supabase + Google Auth

**Full checklist:** [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

Quick version:

1. Create a Supabase project → copy **Project URL** and **anon key** into [`.env`](.env).
2. Set `VITE_USE_MOCK=false` and restart `npm run dev`.
3. SQL Editor → run [`supabase/setup_all.sql`](supabase/setup_all.sql) then [`supabase/seed.sql`](supabase/seed.sql).
4. Enable **Google** under Authentication → Providers; configure Google Cloud OAuth (see setup doc).
5. Sign in at [http://localhost:5173](http://localhost:5173), then run [`supabase/after_first_signin.sql`](supabase/after_first_signin.sql) with your email to get the **Developer** role.

The app sends `hd=longhouse.co` on Google sign-in and rejects non-`@longhouse.co` emails client-side.

## Deploy (Vercel)

1. Connect the repo to Vercel.
2. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.).
3. Add custom domain `tools.mydomain.com`.
4. `vercel.json` rewrites all routes to `index.html` for the SPA.

```bash
npm run build
```

## Tool integration

External Longhouse apps should use the **same Supabase project** and enforce permissions via the shared access RPCs.

**Full walkthrough:** [docs/TOOL_INTEGRATION.md](docs/TOOL_INTEGRATION.md)

**Copy-paste kit:** [integrations/tool-auth/](integrations/tool-auth/)

Each tool:

1. Uses the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as the hub.
2. Sets `VITE_TOOL_SLUG` to match the slug in **Manage Tools**.
3. Wraps the app with `ToolAuthGate` (React) or `runToolAuthGate` (vanilla JS).
4. On boot: check session → Google OAuth on **this tool's origin** if needed → call `user_can_access_tool_by_slug`.
5. If access denied: show "Permissions denied" and redirect to `{VITE_HUB_URL}/?denied={slug}`.

Sessions are **per origin** (each subdomain has its own sign-in). Permissions are **shared** via Supabase (`user_department_roles`, `tool_departments`, `tool_access_tiers`).

Until a tool adopts this kit, the hub hides its card from unauthorized users, but the tool's direct URL may still work.

Run [`supabase/migrations/010_tool_access_by_slug.sql`](supabase/migrations/010_tool_access_by_slug.sql) before integrating tools.

## Feature requests

The **Request a feature** sidebar tab lets users pick a tool, vote on requests (sorted by vote count), comment, and submit new ideas.

Schema is in [`supabase/setup_all.sql`](supabase/setup_all.sql) (combines migrations 001–005).

### Tool card thumbnails

Developers upload a preview image when adding or editing a tool in **Manage tools**. Images are stored in the public Supabase Storage bucket `tool-thumbnails` and shown on hub cards. Run migration [`008_tool_thumbnail_storage.sql`](supabase/migrations/008_tool_thumbnail_storage.sql) before uploading.

### Departments

Tools can have one or more department tags (Branding, Graphic Design, Web Design, etc.). Link them in `tool_departments` via the Supabase dashboard or `seed.sql`.

### Bug reports

The **Submit a bug** button on the All Tools page opens a hidden view (not in the sidebar). Reports include description, console logs, optional screenshot (stored in the `bug-screenshots` storage bucket), and page URL.

## Roles and access

Five hierarchical roles (rank 1–5): Specialist → Results Manager → Department Head → Leadership → Developer.

- **Per department:** each user has one role per department (`user_department_roles`).
- **Tools:** `tool_departments` + `tool_access_tiers` — users in a matching department with rank ≥ the tool’s minimum selected tier get access.
- **Leadership (4)** and **Developer (5):** see all active tools.
- **Developer only:** sidebar **Add tool** and **Manage access** (create tools and assign department/role rows).

Mock mode (`VITE_USE_MOCK=true`) signs in as a Developer with sample assignments for local UI testing.

Icons: `bar-chart-3`, `users`, `book-open`, `wrench`, `calculator`, `file-text`, `globe`, `settings`, `layout-grid`, `box` (see `src/lib/iconMap.js`).

## Project structure

```
src/
  components/   AppShell, Sidebar, ToolCard, ToolGrid, FeedbackModal, AuthGate
  contexts/     AuthContext
  hooks/        useTools, useProfile, useUserAccess
  lib/          supabase, toolsApi, adminApi, roles, mockData
  pages/        HubPage, FeatureRequestsPage, AddToolPage, ManageAccessPage, LoginPage
integrations/
  tool-auth/    Copy-paste kit for external tools (React + vanilla JS)
supabase/
  setup_all.sql Combined schema (run once on new project; includes 001–010)
  migrations/   001–010 (individual files)
  docs/         SUPABASE_SETUP.md, TOOL_INTEGRATION.md
  seed.sql
```
# Longhouse-Tools
