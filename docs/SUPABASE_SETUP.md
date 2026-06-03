# Supabase + Google Auth setup

Follow these steps in order. The app code is already wired; you only need a Supabase project, SQL, and OAuth config.

## 1. Create Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick a name (e.g. `longhouse-tools`), region, and database password (save the password).
3. Wait until the project is **Active**.

## 2. Copy API keys into `.env`

Project **Settings** → **API**:

| Supabase field | Your `.env` variable |
|----------------|----------------------|
| Project URL | `VITE_SUPABASE_URL` |
| anon public | `VITE_SUPABASE_ANON_KEY` |

Edit [`.env`](../.env) in the project root:

```bash
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ALLOWED_EMAIL_DOMAIN=longhouse.co
VITE_USE_MOCK=false
```

Restart the dev server after changing `.env`:

```bash
npm run dev
```

## 3. Run database schema (SQL Editor)

### Fresh project

1. Supabase → **SQL Editor** → **New query**.
2. Paste the full contents of [`supabase/setup_all.sql`](../supabase/setup_all.sql) (includes migrations 001–006).
3. Click **Run**. You should see success (no errors).

This creates tables, RLS, hierarchical roles (ranks 1–5), `user_department_roles`, `tool_access_tiers`, departments, feature requests, bug reports, and storage bucket `bug-screenshots`.

### Existing project (already ran 001–006)

Run any migrations you have not applied yet, in order:

| Migration | Purpose |
|-----------|---------|
| [`006_roles_v2.sql`](../supabase/migrations/006_roles_v2.sql) | Hierarchical roles, department assignments, tool access tiers |
| [`007_feature_request_comment_counts.sql`](../supabase/migrations/007_feature_request_comment_counts.sql) | Comment counts on feature requests |
| [`008_tool_thumbnail_storage.sql`](../supabase/migrations/008_tool_thumbnail_storage.sql) | **Required for tool preview uploads** — creates public `tool-thumbnails` bucket |
| [`009_feature_request_deletes.sql`](../supabase/migrations/009_feature_request_deletes.sql) | Users can delete their own feature requests and comments |
| [`010_tool_access_by_slug.sql`](../supabase/migrations/010_tool_access_by_slug.sql) | **Required for external tool auth** — slug-based access RPC |

**Warning:** Migration 006 drops `user_roles` and `tool_roles`, reseeds `roles`, and replaces access RPCs. Back up any custom role assignments first, then re-assign users via **Manage access** in the app (Developer) or `after_first_signin.sql`.

## 4. Seed sample tools (optional)

1. New SQL query → paste [`supabase/seed.sql`](../supabase/seed.sql).
2. **Run**.

Seeds three sample tools with department tags and tier-based access (Specialist / Results Manager / Department Head examples). Edit URLs in `seed.sql` before running if needed.

## 5. Configure Google OAuth

### 5a. Supabase

1. **Authentication** → **Providers** → **Google** → Enable.
2. Leave Client ID/Secret empty for now — you’ll paste them from Google in step 5c.
3. Copy the **Callback URL** shown (e.g. `https://YOUR_PROJECT.supabase.co/auth/v1/callback`).

### 5b. Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**.
2. **Create credentials** → **OAuth client ID** → Application type **Web application**.
3. **Authorized JavaScript origins** (add the hub **and each tool app**):
   - `http://localhost:5173` (hub)
   - `http://localhost:5174` (example tool — use each tool's port)
   - (later) `https://tools.yourdomain.com`
   - (later) `https://ads.yourdomain.com` (each tool subdomain)
4. **Authorized redirect URIs**:
   - The Supabase callback URL from step 5a (exact match).
5. Create → copy **Client ID** and **Client secret**.

### 5c. Back to Supabase

1. Paste Client ID and Client secret into the Google provider → **Save**.
2. **Authentication** → **URL configuration**:
   - **Site URL**: `http://localhost:5173` (use production URL when deployed)
   - **Redirect URLs** (add the hub **and each tool app**):
     - `http://localhost:5173/**` (hub)
     - `http://localhost:5174/**` (example tool)
     - `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

See [TOOL_INTEGRATION.md](./TOOL_INTEGRATION.md) for the full external tool setup checklist.

## 6. First sign-in and Developer access

1. Open [http://localhost:5173](http://localhost:5173).
2. You should see the **login screen** (not mock data).
3. Click **Continue with Google** with your `@longhouse.co` account.
4. If login works but the hub is **empty**, assign yourself the **Developer** role:
   - SQL Editor → open [`supabase/after_first_signin.sql`](../supabase/after_first_signin.sql)
   - Replace `YOUR_EMAIL@longhouse.co` with your email
   - Run the script
5. Refresh the app — you should see seeded tools and **Add tool** / **Manage access** in the sidebar (Developer only).

## Role hierarchy (quick reference)

| Rank | Role | Tool access |
|------|------|-------------|
| 1 | Specialist | Dept + tier rules |
| 2 | Results Manager | Dept + tier rules |
| 3 | Department Head | Dept + tier rules |
| 4 | Leadership | All tools |
| 5 | Developer | All tools + admin UI |

One role per department per user (`user_department_roles`). Tools use `tool_departments` + `tool_access_tiers` (minimum tier cascades upward).

## 7. Verify

| Check | Expected |
|-------|----------|
| Sign out | Login screen appears |
| Sign in | Hub with tool cards |
| Wrong domain email | Rejected with Workspace message |
| Request a feature | Works per tool |
| Submit a bug | Form submits (screenshot → storage bucket) |
| Developer sidebar | Add tool, Manage access |
| Leadership (rank 4) | All tools, no admin tabs |

## Troubleshooting

**“Missing VITE_SUPABASE_URL…”**  
Keys not in `.env` or dev server not restarted.

**Google redirect error**  
Redirect URI in Google must exactly match Supabase callback URL. Origins must include `http://localhost:5173`.

**Empty tools after login**  
Run `after_first_signin.sql` with your email. Confirm `seed.sql` ran. Check `user_department_roles` has at least one row for your user (or Leadership/Developer rank for all tools).

**OAuth works but instant sign-out**  
Email must end with `@longhouse.co` (see `VITE_ALLOWED_EMAIL_DOMAIN`).

**Storage upload fails on bug report**  
Confirm migration `003` ran (bucket `bug-screenshots` + policies).

**Admin pages redirect to hub**  
Only **Developer** (rank 5) sees admin tabs. Assign `developer` role in a department via SQL or Manage access.

## Production (later)

1. Vercel env vars: same `VITE_*` values.
2. Add production URL to Supabase redirect URLs and Google OAuth origins.
3. Custom domain `tools.yourdomain.com` when ready.
