# Tool integration guide

Connect an external Longhouse app to the Tools Hub so users must sign in with Google, be provisioned on the platform, and have the correct department/role before using the tool.

## How it works

```text
User opens tool URL
  → No session?     Google OAuth on the tool's own domain
  → Wrong email?    Rejected (@longhouse.co only)
  → No permission?  "Permissions denied" → redirect to Tools Hub
  → Has access?     Tool loads
```

Each tool stores its **own session** in browser `localStorage` (per origin). All tools share the **same Supabase project** for users and permissions.

Copy the integration kit from [`integrations/tool-auth/`](../integrations/tool-auth/) into each tool repo.

---

## Part A — One-time platform setup (Developer)

### 1. Run migration 010

In Supabase **SQL Editor**, run [`supabase/migrations/010_tool_access_by_slug.sql`](../supabase/migrations/010_tool_access_by_slug.sql).

This adds `user_can_access_tool_by_slug(p_slug)` — the RPC external tools call to check access.

### 2. Register the tool in the hub

1. Sign in to the Tools Hub as **Developer**.
2. Open **Manage Tools** → add or edit the tool.
3. Set:
   - **Slug** — stable identifier (e.g. `ads-dashboard`). Tools use this in `VITE_TOOL_SLUG`.
   - **URL** — production URL of the tool.
   - **Departments** — which departments can access it.
   - **Access tiers** — minimum role rank required (Specialist / Results Manager / Department Head).

### 3. Provision users

**Manage Access** → assign each user a **department + role**.

Users with **no assignments** can sign in but cannot access any gated tool. **Leadership** (rank 4) and **Developer** (rank 5) see all tools.

### 4. OAuth allowlist (per tool domain)

For **each** tool origin (production + local dev):

**Supabase** → Authentication → URL configuration → **Redirect URLs**:

```text
http://localhost:5174/**
https://ads.yourdomain.com/**
```

**Google Cloud** → OAuth client → **Authorized JavaScript origins**:

```text
http://localhost:5174
https://ads.yourdomain.com
```

The **Authorized redirect URI** in Google stays the Supabase callback URL (shared across all apps):

```text
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

---

## Part B — Per-tool setup

### 1. Copy the integration kit

Copy [`integrations/tool-auth/`](../integrations/tool-auth/) into your tool project (e.g. `src/integrations/tool-auth/`).

The kit requires `@supabase/supabase-js` — same dependency as the hub.

### 2. Environment variables

Add to your tool's `.env`:

```bash
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co      # same as hub
VITE_SUPABASE_ANON_KEY=eyJ...                       # same as hub
VITE_TOOL_SLUG=ads-dashboard                        # must match Manage Tools slug
VITE_HUB_URL=https://tools.yourdomain.com
VITE_ALLOWED_EMAIL_DOMAIN=longhouse.co
```

### 3. React (Vite) — wrap your app

```jsx
import ToolAuthGate from './integrations/tool-auth/react/ToolAuthGate.jsx'

export default function App() {
  return (
    <ToolAuthGate
      toolSlug={import.meta.env.VITE_TOOL_SLUG}
      hubUrl={import.meta.env.VITE_HUB_URL}
    >
      <YourApp />
    </ToolAuthGate>
  )
}
```

`ToolAuthGate` handles:

- Session check
- Google sign-in button when unsigned
- `@longhouse.co` email validation
- `user_can_access_tool_by_slug` RPC
- Permissions denied screen → auto-redirect to hub with `?denied=slug`

### 4. Vanilla JS (non-React)

```js
import { subscribeToolAuthGate } from './integrations/tool-auth/lib/runToolAuthGate.js'
import { buildHubDeniedUrl } from './integrations/tool-auth/lib/hubRedirect.js'

const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  toolSlug: import.meta.env.VITE_TOOL_SLUG,
  allowedEmailDomain: import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN,
  autoSignIn: false,
}

subscribeToolAuthGate(config, result => {
  switch (result.status) {
    case 'sign_in':
      // Show login UI; on button click re-run with autoSignIn: true
      break
    case 'denied':
      window.location.href = buildHubDeniedUrl(
        import.meta.env.VITE_HUB_URL,
        import.meta.env.VITE_TOOL_SLUG,
      )
      break
    case 'ready':
      // Mount your application
      break
    case 'domain_rejected':
    case 'error':
      // Show error message (result.error)
      break
  }
})
```

See also [`integrations/tool-auth/react/useToolAuth.js`](../integrations/tool-auth/react/useToolAuth.js) for a React hook if you want a custom UI.

### 5. Deploy

Deploy the tool on its own subdomain/origin. Ensure production URLs are in Supabase redirect URLs and Google origins (step A.4).

---

## Testing checklist

| Scenario | Expected |
|----------|----------|
| Anonymous visit | Sign-in screen → Google OAuth |
| Signed in, no role assignments | Permissions denied → hub banner |
| Wrong department or tier | Permissions denied → hub banner |
| Correct access | Tool loads normally |
| Direct URL (bypass hub) | Tool still enforces access |
| Non-`@longhouse.co` email | Rejected at sign-in |

### Local dev

- Hub: `http://localhost:5173`
- Tool: `http://localhost:5174` (or any port — add that port to Supabase + Google allowlists)
- Use a real `@longhouse.co` account with known assignments in **Manage Access**

---

## Hub feedback after denial

When a user lacks permission, the tool redirects to:

```text
https://tools.yourdomain.com/?denied=ads-dashboard
```

The hub shows a dismissible banner: *"You don't have access to Ads Dashboard. Contact your administrator."*

---

## Backend APIs (optional)

If your tool has a server, validate the Supabase JWT on each request and call the same access logic server-side. Client-only checks are for UX; APIs must enforce permissions independently.

Example (pseudo-code):

```js
// Verify JWT → get user id
// Call Supabase as user or use service role + user_can_access_tool_by_slug
if (!allowed) return res.status(403).json({ error: 'Forbidden' })
```

---

## Troubleshooting

**OAuth redirect error on tool**  
Add the tool's exact origin to Supabase **Redirect URLs** and Google **Authorized JavaScript origins**.

**"Permissions denied" but user should have access**  
Check **Manage Access** assignments and the tool's departments/tiers in **Manage Tools**. User needs matching department and rank ≥ minimum tier.

**RPC error: function does not exist**  
Run migration [`010_tool_access_by_slug.sql`](../supabase/migrations/010_tool_access_by_slug.sql).

**Hub redirect after login doesn't give tool a session**  
Expected with per-origin sessions. Each tool runs its own OAuth on its domain — do not rely on hub redirect alone for tool sessions.

---

## Related docs

- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — hub Supabase + Google setup
- [integrations/tool-auth/README.md](../integrations/tool-auth/README.md) — kit quick reference
- [README.md](../README.md) — hub overview and roles
