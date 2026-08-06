# CampusKart v2

A campus marketplace for RVCE students to buy and sell used items. Built with React, Node.js, and Supabase.

**Live:** https://campuskart-v2.vercel.app

---

## What it does

- Students log in with their `@rvce.edu.in` Google account
- Sellers create listings with photos — listings go live after admin approval
- Buyers browse, search, and filter listings; click "I'm Interested" to get the seller's contact info
- Communication happens externally (email, Instagram, Telegram, Reddit, LinkedIn)
- Sellers mark items as sold or hidden from their dashboard
- Listings auto-expire after 90 days

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, deployed on Vercel |
| Backend | Node.js + Express, deployed on Render |
| Database | PostgreSQL via Supabase (4 tables) |
| Auth | Google OAuth via Supabase (RVCE domain restricted) |
| Images | Cloudinary (browser-compressed before upload) |
| Realtime | Supabase Realtime (seller notifications) |

---

## Project Layout

```
campuskart_v2/
├── backend/
│   └── src/
│       ├── app.js                  # Entry point
│       ├── db/supabase.js          # Supabase client (service role)
│       ├── middleware/auth.js      # JWT verification + admin guard
│       ├── controllers/            # Business logic
│       ├── routes/                 # URL → controller mapping
│       ├── jobs/cleanup.js         # 90-day expiry + keepalive ping
│       └── utils/cloudinary.js    # Image upload/delete helpers
├── frontend/
│   └── src/
│       ├── api/index.js            # Axios instance with auto JWT header
│       ├── context/AuthContext.jsx # Supabase session management
│       ├── components/             # Button, Input, Navbar, ProductCard, ErrorBoundary
│       └── pages/                 # Browse, Sell, Dashboard, Admin, etc.
└── database/
    ├── migration_v2.sql            # 4-table schema (run once in Supabase)
    └── rls_fix.sql                 # RLS policies + GRANT statements
```

---

## Database Schema

4 tables only:

- **users** — id, name, email, role, instagram, telegram, reddit, linkedin
- **products** — id, seller_id, title, description, price, category, image_urls[], status, expires_at
- **contact_requests** — tracks buyer interest (prevents duplicate notifications)
- **notifications** — in-app alerts, powered by Supabase Realtime

---

## Local Setup

### Prerequisites

- Node.js 20+
- A Supabase project (free tier works)
- A Cloudinary account (free tier works)
- Google OAuth credentials from [console.cloud.google.com](https://console.cloud.google.com)

### 1. Clone and install

```bash
git clone https://github.com/kushalgowdac/campuskart_v2.git
cd campuskart_v2

cd backend && npm install
cd ../frontend && npm install
```

### 2. Set up the database

Go to your Supabase project → SQL Editor → paste and run `database/migration_v2.sql`, then `database/add_product_pagination_indexes.sql`.

The index migration is safe to rerun because every index uses `IF NOT EXISTS`.

### 3. Configure environment variables

Create `backend/.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

> The backend uses the **service role key** (bypasses RLS, never expose to frontend).
> The frontend uses the **anon key** (safe to expose, used only for Google OAuth session management).

### 4. Configure Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → Create project → APIs & Services → Credentials → OAuth 2.0 Client ID
2. Authorized redirect URIs: `https://your-project-id.supabase.co/auth/v1/callback`
3. Paste Client ID and Secret into Supabase → Authentication → Providers → Google
4. In Supabase → Authentication → URL Configuration → set Site URL to `http://localhost:5173`

### 5. Run locally

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:5173. Log in with an `@rvce.edu.in` Google account.

### 6. Set yourself as admin

After your first login, go to Supabase → Table Editor → users → find your row → set `role` to `admin`. Then log out and back in.

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to main |
| Backend | Render | Free tier — set env vars in dashboard |
| Database | Supabase | Free tier — keepalive ping prevents pause |

### Updating the live database

Do **not** run `database/migration_v2.sql` against the live database. It is a
clean-install migration and drops existing tables before recreating them.

For this release, run only these additive migrations in Supabase SQL Editor,
in this order:

1. `database/add_other_contact_details.sql`
2. `database/secure_live_rls.sql`
3. `database/add_product_pagination_indexes.sql`

All three are safe to rerun. Apply them before deploying the backend, then deploy
the backend before the frontend so active users remain compatible throughout
the rollout.

**Keep Supabase active:** The backend pings Supabase every 4 days to prevent free-tier automatic pausing. Set up [UptimeRobot](https://uptimerobot.com) to ping your Render backend every 5 minutes to prevent cold starts.

---

## Key Design Decisions

**Why 4 tables instead of more?**
Images stored as `text[]` array on the products row. Contact info stored on users (not products) so one profile update propagates to all listings.

**Why no in-app chat?**
On a 512MB free-tier server, a WebSocket chat system would exhaust resources for ~20 concurrent users. Communication happens on platforms built for it (WhatsApp, email, etc.).

**Why fresh submission instead of editing rejected listings?**
Edit-in-place requires draft state, PATCH semantics, and race condition handling if admin acts during edit. A fresh INSERT is one clean operation with zero edge cases.

**Why Google OAuth only?**
Domain restriction (`@rvce.edu.in`) is enforced by Google — impossible to fake. Removes the need for bcrypt, JWT signing, and a password column entirely.

---

## Contributing

See [/contribute](https://campuskart-v2.vercel.app/contribute) on the live site for ways to get involved or send feedback.
