# Git City Repository Analysis

Last analyzed: 2026-03-26  
Scope: static analysis of the repository structure, runtime architecture, routes, APIs, data model, integrations, and background jobs.

## Quick Summary

Git City is a single-repo full-stack Next.js application. It is **not** split into a separate frontend repo and backend repo.

At a high level:

- The **frontend** is built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, and a heavy 3D rendering layer built with Three.js + React Three Fiber.
- The **backend** is built inside the same repo using Next.js route handlers, server components, Supabase (Postgres, Auth, Storage, Realtime, SQL migrations, RPCs), and PartyKit workers for realtime arcade rooms.
- The repo also contains a **second distributable artifact**: a VS Code extension called **Git City: Pulse**, which sends coding heartbeats to the web app.

This repository is much broader than a simple "3D GitHub city" landing page. It contains:

- A 3D city explorer
- Developer profile pages
- Live presence
- A shop and pixel economy
- Ads and advertiser dashboards
- Raids, drops, dailies, streaks, rabbit quest, and flight minigame
- A PartyKit-based multiplayer arcade
- Roadmap voting
- Investor pitch deck / experimental pages
- Cron jobs, payment webhooks, and notification infrastructure

Approximate repo surface area:

- **35 page routes** in `src/app/**/page.tsx`
- **100 API route handlers** in `src/app/api/**/route.ts(x)`
- **52 Supabase SQL migrations** in `supabase/migrations`
- **2 PartyKit workers** in `party/`
- **1 VS Code extension package** in `packages/vscode-extension`

## 1. Repository Shape

| Path | What it is | Why it matters |
| --- | --- | --- |
| `src/app` | Next.js App Router pages, layouts, route handlers, metadata routes | Main web app surface |
| `src/components` | UI and scene components | Most reusable frontend pieces live here |
| `src/lib` | Domain logic and integrations | GitHub ingestion, Supabase helpers, shop, ads, raids, pixels, notifications, arcade client, etc. |
| `party` | PartyKit workers | Realtime multiplayer arcade server logic |
| `packages/vscode-extension` | VS Code extension package | Sends coding presence to the app |
| `supabase/migrations` | SQL schema and backend logic | The database is a major part of the backend |
| `public` | Static assets | Models, sprites, fonts, audio, OG assets |
| `docs` | Internal docs/plans | This analysis file now lives here |
| `vercel.json` | Cron schedule config | Background jobs are triggered by Vercel cron |
| `partykit.json` | PartyKit runtime config | Declares arcade worker entrypoints |
| `.env.example` | Documented environment vars | Shows the core external dependencies |

Important repo-level observations:

- The repo contains a nested extension package, but the root `package.json` does **not** define npm workspaces.
- There is **no root test script** in `package.json`.
- The app is designed for **Vercel + Supabase + PartyKit**, not for a traditional long-running Node server.

## 2. How The Frontend Is Built

### Core frontend stack

The web frontend is built with:

- **Next.js 16.2.0**
- **React 19.2.3**
- **TypeScript**
- **Tailwind CSS v4**
- **Three.js**
- **@react-three/fiber**
- **@react-three/drei**
- **@react-three/postprocessing**

The main frontend entrypoints are under `src/app`. Styling is global and theme-driven through `src/app/globals.css`, with the pixel font loaded in `src/app/layout.tsx`.

### Rendering model

This app uses a **hybrid rendering model**:

- **Client-heavy pages** for immersive/interactive experiences
- **Server-rendered pages** for SEO-friendly or data-heavy views
- **Route handlers** for mutations, polling, webhooks, and integration APIs
- **One server action** (`src/app/roadmap/actions.ts`) for roadmap voting

In practice:

- The main city page (`/`) is almost a mini-SPA inside App Router.
- Several data pages (`/dev/[username]`, `/leaderboard`, `/pixels`, `/roadmap`, `/pitch`, `/shop/[username]`) fetch initial data directly from Supabase in server components instead of going through internal `/api/*` routes.

### Main frontend shells and infrastructure

| File | Role |
| --- | --- |
| `src/app/layout.tsx` | Root HTML shell, metadata, JSON-LD, font loading, analytics, global audio, optional Himetrica scripts |
| `src/app/globals.css` | Global Tailwind/theme/pixel UI styles |
| `src/app/page.tsx` | Main interactive city page; a large client-side orchestrator |
| `src/components/CityCanvas.tsx` | 3D canvas and scene shell |
| `src/components/CityScene.tsx` | Core city rendering logic |
| `src/lib/github.ts` | City layout generation and building dimensions |
| `src/lib/cityCache.ts` | Client-side 5 minute cache of computed city data |

### 3D city rendering

The visual heart of the app is the main page (`/`):

- It is a `"use client"` page.
- It dynamically imports many heavyweight components with `ssr: false`.
- It builds the city layout in memory using `generateCityLayout()` from `src/lib/github.ts`.
- It renders the scene with React Three Fiber.

Notable scene features:

- Themeable sky and lighting presets
- Custom building sizing based on GitHub metrics
- Sponsor landmarks
- Ads in the sky and on buildings
- White Rabbit quest elements
- Compare mode
- Flight / cinematic sequences
- Raid effects and celebration effects
- Wallpaper mode reuse

### How city data reaches the browser

The city page is optimized around a two-step data loading strategy:

1. Try to load a **precomputed gzip snapshot** from Supabase Storage:
   - Bucket: `city-data`
   - Object: `snapshot.json`
2. If snapshot loading fails, fall back to chunked calls to `/api/city`

Important details:

- The snapshot is generated every 10 minutes by a cron route.
- The browser decompresses the gzip snapshot using `DecompressionStream`.
- Fallback `/api/city` loads data in chunks of up to 1000 developers.
- The client keeps a 5 minute in-memory cache via `src/lib/cityCache.ts`.

### Client-heavy pages

These pages are primarily client rendered or client orchestrated:

- `/`
- `/live`
- `/arcade`
- `/arcade/[slug]`
- `/rabbit`
- `/support`
- `/wallpaper`
- `/poc`
- `/poc/effects`
- large parts of advertiser dashboard pages

### Server-rendered pages

These pages lean more on server components and direct Supabase reads:

- `/dev/[username]`
- `/leaderboard`
- `/pixels`
- `/roadmap`
- `/pitch`
- `/shop`
- `/shop/[username]`
- `/privacy`
- `/terms`
- `/unsubscribe`

### SEO, metadata, and social image routes

The app has a fairly complete SEO/social layer:

- `src/app/manifest.ts`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/opengraph-image.tsx`
- `src/app/dev/[username]/opengraph-image.tsx`
- `src/app/compare/[userA]/[userB]/opengraph-image.tsx`
- `src/app/rabbit/opengraph-image.tsx`
- `src/app/pitch/opengraph-image.tsx`
- `/api/share-card/[username]`
- `/api/compare-card/[userA]/[userB]`

The image APIs use `next/og` and generate downloadable/shareable cards from live database data.

## 3. How The Backend Is Built

### Backend shape

There is no standalone Express, Nest, Rails, Django, or dedicated API service here.

The "backend" is split across four layers:

1. **Next.js route handlers** in `src/app/api/**`
2. **Server components** that query Supabase directly
3. **Supabase** as database/auth/storage/realtime/backend logic
4. **PartyKit** for realtime multiplayer rooms

An accurate mental model is:

```text
Browser / VS Code Extension
        |
        v
Next.js App Router
  - pages
  - server components
  - route handlers
        |
        +--> PartyKit workers (arcade realtime)
        |
        v
Supabase
  - Postgres
  - Auth
  - Storage
  - Realtime
  - SQL migrations / RPCs
        |
        +--> GitHub API
        +--> Stripe / AbacatePay / NOWPayments
        +--> Resend
        +--> Discord invite API
```

### Supabase as a major backend layer

Supabase is not just used as a simple database. It is central to the app:

- **Auth**: GitHub OAuth via Supabase
- **Database**: core application data
- **Storage**: city snapshot and billboard uploads
- **Realtime**: coding presence broadcasts
- **RPCs**: XP, check-in, visitor heartbeats, wallet operations, ad stats, ranking, etc.

Key helper files:

| File | Role |
| --- | --- |
| `src/lib/supabase.ts` | Browser client, service-role admin client, realtime broadcast helper |
| `src/lib/supabase-server.ts` | Cookie-based server client for server components / route handlers |
| `src/middleware.ts` | Session refresh + rate limiting + security headers |

Important behavior:

- Browser code uses the anon key and RLS-aware client.
- Many server handlers use the **service role** via `getSupabaseAdmin()`, so authorization is enforced mostly in application code rather than purely through RLS.

### Authentication flows

There are **three different auth/access models** in the repo:

#### 1. User auth (GitHub via Supabase)

- OAuth callback route: `src/app/auth/callback/route.ts`
- On login, the backend:
  - exchanges auth code for session
  - identifies GitHub login
  - creates or claims a `developers` row
  - fetches GitHub profile/contribution data
  - grants XP / rank
  - inserts feed events
  - initializes notifications / referrals / achievements

#### 2. Advertiser auth (custom magic link)

- Routes under `/api/ads/auth/*`
- Uses its own cookie session: `gc_advertiser_session`
- Sessions are stored in `advertiser_sessions`
- Magic links are emailed via Resend

#### 3. Admin access

- Admin pages like `/admin/ads` and `/admin/drops`
- Access is gated by GitHub usernames from `ADMIN_GITHUB_LOGINS`

### Middleware, security, and rate limiting

`src/middleware.ts` does real backend work:

- Applies route-group-based **in-memory rate limiting**
- Skips expensive auth refresh on selected read-mostly endpoints
- Refreshes Supabase auth session cookies when needed
- Adds security headers
- Adds rate limit headers to responses

Important caveat:

- The rate limiter is **in-memory**, so it is per-process/per-instance, not globally consistent across all serverless instances.

`next.config.ts` also adds:

- HSTS
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- long-lived cache headers for `/models/*` and `/audio/*`

## 4. Main Data Flows

### A. Developer search / onboarding flow

```text
Home page search
  -> /api/dev/[username]
  -> check cached developer in Supabase
  -> if missing, call GitHub REST + GraphQL
  -> create preview or insert/update developer row
  -> return developer data
  -> client refreshes city/profile views
```

Key detail: `/api/dev/[username]` returns either:

- a cached/existing developer
- a preview for a new developer
- or creates the developer if the logged-in user is requesting their own profile

### B. City loading flow

```text
Home page or wallpaper page
  -> Supabase Storage city snapshot (preferred)
  -> if unavailable, /api/city?from=...&to=...
  -> merge developers + items + achievements + drops
  -> generateCityLayout()
  -> render CityCanvas
```

### C. Coding presence flow

```text
VS Code extension
  -> POST /api/heartbeats with X-API-Key
  -> update developer_sessions
  -> broadcast to Supabase Realtime channel "coding-presence"
  -> /live and homepage consume presence via polling + realtime
```

There are actually two presence systems:

- **Anonymous site presence**: `/api/online`
- **Authenticated coding presence**: `/api/heartbeats` + `/api/presence` + Realtime

### D. Ad purchase / delivery / analytics flow

```text
/advertise or /ads/dashboard/new
  -> /api/ads/checkout or /api/ads/checkout/pix
  -> Stripe / Pix checkout
  -> webhook activates or updates sky_ads
  -> /api/sky-ads serves active ads to the city
  -> /api/sky-ads/track records impressions/clicks/cta_clicks
  -> /api/v1/ads/conversions records conversions
  -> /api/ads/stats and /api/ads/audience/[adId] power dashboards
```

### E. Arcade flow

```text
/arcade
  -> /api/arcade/rooms
  -> PartyKit lobby room list

/arcade/[slug]
  -> /api/arcade/rooms/[slug]
  -> PartyKit websocket connection
  -> PartyKit room server validates auth token via Supabase
  -> realtime movement/chat/avatar sync
```

## 5. Frontend Route Catalog

### Core city and community pages

| Route | Purpose | Notes |
| --- | --- | --- |
| `/` | Main 3D city experience | Client-heavy page; loads city snapshot or `/api/city`; drives ads, raids, dailies, rabbit, visits, kudos, compare mode, VS Code key flow, flight game, etc. |
| `/dev/[username]` | Developer profile page | Server-rendered profile with achievements, referrals, district info, claim controls, share tools, and owner actions |
| `/compare/[userA]/[userB]` | Compare/share route | Generates compare metadata then redirects client-side back to homepage compare mode |
| `/leaderboard` | Developer and game leaderboards | Server page with client subcomponents for position, fly scores, dailies, drops |
| `/live` | Live coding presence page | Polls `/api/presence` to show active developers |
| `/rabbit` | White Rabbit quest page | Client page for progress and hall of completers |
| `/roadmap` | Public roadmap and voting page | Server-rendered counts plus server action voting |
| `/wallpaper` | Live wallpaper mode | Reuses city rendering in a fullscreen display mode |

### Commerce, monetization, and profile customization

| Route | Purpose | Notes |
| --- | --- | --- |
| `/shop` | Shop landing / redirect page | Redirects logged-in claimed users to their personal shop |
| `/shop/[username]` | Building customization shop | Main cosmetics / loadout / checkout / gifting surface |
| `/pixels` | Pixel store and wallet page | Server-rendered package list + client checkout flow |
| `/support` | Creator support page | Stripe donation checkout plus GitHub Sponsors / ETH info |
| `/advertise` | Public ad sales landing page | Ad purchase form for sky/building ads |
| `/advertise/setup/[token]` | Post-purchase ad setup | Lets purchaser finish ad metadata/config |
| `/advertise/track/[token]` | Public ad tracking view | Read-only tracking page using tracking token |
| `/ads` | Short alias route | Redirects to `/advertise` |
| `/ads/login` | Advertiser login | Magic-link sign-in page |
| `/ads/dashboard` | Advertiser analytics overview | Client dashboard backed by `/api/ads/stats` |
| `/ads/dashboard/new` | Create a new ad | Dashboard-side ad creation flow |
| `/ads/dashboard/api-keys` | Advertiser API key management | Create/revoke API keys for external reporting |
| `/ads/dashboard/billing` | Billing controls | Stripe billing portal entrypoint and billing status |
| `/ads/dashboard/integration` | Conversion/webhook setup | Shows tracking and integration instructions |
| `/ads/dashboard/[adId]` | Single ad detail page | Ad-level stats and management |
| `/ads/dashboard/[adId]/edit` | Single ad edit page | Edit/activate/pause/update ad details |

### Games, arcade, and experiments

| Route | Purpose | Notes |
| --- | --- | --- |
| `/arcade` | Arcade room browser | Lists rooms, favorites, categories, lobby counts |
| `/arcade/[slug]` | Multiplayer arcade room | 2D realtime room with chat, avatar selection, discoveries, terminal interactions |
| `/pitch` | Investor pitch deck | Uses aggregated pitch stats from Supabase |
| `/poc` | Experimental page | Prototype / proof-of-concept surface |
| `/poc/effects` | Experimental effects page | Prototype visual effects |
| `/token` | Community token disclaimer page | Explains relationship to the community-created `$GITC` token |

### Admin, legal, and system pages

| Route | Purpose | Notes |
| --- | --- | --- |
| `/admin/ads` | Internal ads admin dashboard | Protected by GitHub admin allowlist |
| `/admin/drops` | Internal drops admin page | Plants / manages city drops |
| `/privacy` | Privacy policy | Static/legal |
| `/terms` | Terms page | Static/legal |
| `/unsubscribe` | Email preference page | Email unsubscribe / preference handling |

### Special non-page routes in `src/app`

| Route / file | Purpose |
| --- | --- |
| `/auth/callback` | GitHub OAuth callback and user onboarding |
| `/manifest.webmanifest` | PWA/app metadata |
| `/robots.txt` | Robots directives |
| `/sitemap.xml` | Generated sitemap |
| `/opengraph-image` and route-specific OG image files | Social image generation |

## 6. Backend / API Route Catalog

### Core app, identity, and content APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/account/delete` | `POST` | Delete an authenticated account/building relationship |
| `/api/auth/signout` | `POST` | Sign the user out |
| `/api/claim` | `POST` | Claim the logged-in user's building atomically |
| `/api/dev/[username]` | `GET` | Return cached developer data or fetch/create via GitHub |
| `/api/github/[username]` | `GET` | Redirect alias to `/api/dev/[username]` |
| `/api/city` | `GET` | Chunked city payload used as snapshot fallback |
| `/api/feed` | `GET` | Activity feed with synthetic-event backfill |
| `/api/share-card/[username]` | `GET` | Generate a downloadable/shareable profile card image |
| `/api/compare-card/[userA]/[userB]` | `GET` | Generate compare/share image |
| `/api/preferences/theme` | `GET`, `PATCH` | Read/update theme preference |
| `/api/notification-preferences` | `GET`, `PATCH` | Read/update notification preferences |
| `/api/unsubscribe` | `GET`, `POST` | Unsubscribe endpoint and preference updates |
| `/api/leaderboard-position` | `GET` | Return the user's relative leaderboard position |
| `/api/milestone-celebration` | `GET`, `POST` | Track active milestone celebration state |
| `/api/survey` | `GET`, `POST` | Survey endpoints tied to product experiments / E.Arcade |

### Presence, live users, and VS Code integration APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/vscode-key` | `GET`, `POST` | Read/create per-developer API key for Pulse |
| `/api/heartbeats` | `POST` | Receive editor heartbeats from VS Code/Cursor-like editors |
| `/api/presence` | `GET` | Return active/idle coding developers |
| `/api/online` | `GET`, `POST` | Track anonymous site visitors and return cached live visitor count |

### Shop, customization, checkout, and pixels APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/items` | `GET` | Return active shop catalog |
| `/api/checkout` | `POST` | Start item checkout for Stripe / Pix / crypto providers |
| `/api/checkout/status` | `GET` | Check purchase status after redirect |
| `/api/customizations` | `GET`, `POST` | Read/write developer customizations like custom color |
| `/api/customizations/upload` | `POST` | Upload billboard image to Supabase Storage |
| `/api/loadout` | `GET`, `POST` | Read/update equipped cosmetic loadout |
| `/api/claim-free-item` | `POST` | Claim eligible free items |
| `/api/pixels/balance` | `GET` | Return wallet balance |
| `/api/pixels/checkout` | `POST` | Start PX package checkout |
| `/api/pixels/purchase-status` | `GET` | Check PX purchase status |
| `/api/pixels/history` | `GET` | Return wallet transaction history |
| `/api/pixels/spend` | `POST` | Spend PX on cosmetics / gifts / consumables |
| `/api/support/checkout` | `POST` | Start support donation checkout |

### Social, achievements, streaks, and gameplay APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/checkin` | `POST` | Daily check-in, streak progression, XP, rewards |
| `/api/achievements/[developerId]` | `GET` | Return developer achievements |
| `/api/achievements/mark-seen` | `POST` | Mark achievement notifications as seen |
| `/api/dailies` | `GET` | Read daily missions |
| `/api/dailies/progress` | `POST` | Track/update mission progress |
| `/api/dailies/claim` | `POST` | Claim daily rewards |
| `/api/dailies/leaderboard` | `GET` | Dailies leaderboard |
| `/api/interactions/visit` | `POST` | Record building visit |
| `/api/interactions/kudos` | `POST` | Send kudos |
| `/api/rabbit` | `GET`, `POST` | Rabbit progress check and quest progression |
| `/api/raid/preview` | `POST` | Preview raid outcome / strength estimates |
| `/api/raid/execute` | `POST` | Execute raid and grant rewards/tags |
| `/api/raid/history` | `GET` | Raid history and active tag info |
| `/api/raid/loadout` | `GET`, `POST` | Read/update raid equipment |
| `/api/fly-scores` | `GET`, `POST` | Flight game score submission and leaderboards |
| `/api/drops/active` | `GET` | List active building drops |
| `/api/drops/pull` | `POST` | Pull a building drop |
| `/api/drops/my-pulls` | `GET` | Read the user's recent pulls |
| `/api/drops/leaderboard` | `GET` | Drops leaderboard |
| `/api/district/change` | `POST` | Change developer district |
| `/api/verify-github-star` | `POST` | Verify the user starred the repo and grant item |

### Arcade APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/arcade/rooms` | `GET` | Paginated/searchable room list, favorites, recent visits |
| `/api/arcade/rooms/[slug]` | `GET`, `POST` | Read room map data; admin cache invalidation for PartyKit |
| `/api/arcade/favorites` | `POST` | Toggle room favorite state |
| `/api/arcade/avatar` | `GET`, `POST` | Read/update arcade avatar config |
| `/api/arcade/discoveries` | `GET`, `POST` | Read/update arcade discoveries/progression |

### Ads, advertiser auth, and public ads APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/sky-ads` | `GET` | Public endpoint serving currently active/rotated sky/building ads |
| `/api/sky-ads/track` | `POST` | Record ad impressions, clicks, and CTA clicks with dedup + bot filtering |
| `/api/sky-ads/status` | `GET` | Ad status lookup |
| `/api/sky-ads/setup` | `POST` | Finish configuring purchased ad metadata |
| `/api/sky-ads/manage` | `POST`, `PUT`, `DELETE`, `PATCH` | CRUD-style ad management endpoints |
| `/api/sky-ads/analytics` | `GET` | Ad analytics/history endpoint |
| `/api/sky-ads/checkout` | `POST` | Older/legacy-style Stripe ad checkout flow |
| `/api/ads/checkout` | `POST` | Main ad checkout flow for Stripe |
| `/api/ads/checkout/pix` | `POST` | Pix ad checkout |
| `/api/ads/checkout/pix/status` | `GET` | Pix payment status lookup |
| `/api/ads/stats` | `GET` | Advertiser dashboard analytics |
| `/api/ads/manage` | `POST` | Advertiser-side ad state updates |
| `/api/ads/api-keys` | `GET`, `POST`, `DELETE` | Create/list/revoke advertiser API keys |
| `/api/ads/audience/[adId]` | `GET` | Ad audience breakdown |
| `/api/ads/webhook-secret` | `GET`, `POST` | Read/create advertiser webhook secret |
| `/api/ads/billing/portal` | `POST` | Open Stripe billing portal |
| `/api/ads/landmark-ids` | `GET` | Map sponsor landmarks to active tracked ad IDs |
| `/api/ads/auth/send-magic-link` | `POST` | Email advertiser magic link |
| `/api/ads/auth/verify` | `GET` | Verify magic link and create advertiser session |
| `/api/ads/auth/logout` | `POST` | Clear advertiser session |
| `/api/v1/ads` | `GET` | Public/external advertiser API to list ads |
| `/api/v1/ads/stats` | `GET` | External advertiser API for aggregated stats |
| `/api/v1/ads/[adId]/stats` | `GET` | External advertiser API for per-ad stats |
| `/api/v1/ads/[adId]/audience` | `GET` | External advertiser API for audience breakdown |
| `/api/v1/ads/conversions` | `POST` | Pixel or server-to-server conversion ingestion |

### Admin APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/admin/drops` | `POST` | Plant an admin-created building drop |
| `/api/admin/drops/[id]` | `DELETE` | Delete a building drop |
| `/api/admin/send-update-email` | `POST` | Protected bulk/product email send trigger |

### Cron APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/cron/ad-expiry` | `GET` | Notify about expiring/expired ads |
| `/api/cron/ad-weekly-report` | `GET` | Send weekly ad performance reports |
| `/api/cron/city-snapshot` | `GET` | Build and upload gzip city snapshot |
| `/api/cron/cleanup-sessions` | `GET` | Mark coding sessions idle/offline and prune visitor sessions |
| `/api/cron/flush-batches` | `GET` | Flush notification batches |
| `/api/cron/monthly-digest` | `GET` | Monthly digest notifications |
| `/api/cron/re-engagement` | `GET` | Re-engagement notification flow |
| `/api/cron/refresh-ad-stats` | `GET` | Refresh materialized/statistical ad aggregates |
| `/api/cron/streak-reminder` | `GET` | Streak reminder notifications |
| `/api/cron/weekly-digest` | `GET` | Weekly digest notifications |

### Webhook APIs

| Route | Methods | Purpose |
| --- | --- | --- |
| `/api/webhooks/stripe` | `POST` | Stripe payments, subscriptions, refunds, chargebacks |
| `/api/webhooks/abacatepay` | `POST` | Pix payment confirmation/status updates |
| `/api/webhooks/nowpayments` | `POST` | Crypto invoice/payment updates |
| `/api/webhooks/resend` | `POST` | Email delivery lifecycle, bounces, complaints, opens, clicks |

## 7. Which Pages Make Which API Calls

This repo does **not** use a strict rule that "pages always call internal APIs". Many server pages query Supabase directly. Still, the main client-side API traffic looks like this:

| Page / surface | Main requests made |
| --- | --- |
| `/` | `/api/sky-ads`, `/api/feed`, `/api/dev/[username]`, `/api/checkin`, `/api/interactions/visit`, `/api/interactions/kudos`, `/api/items`, `/api/raid/loadout`, `/api/raid/preview`, `/api/raid/execute`, `/api/drops/my-pulls`, `/api/drops/pull`, `/api/admin/drops`, `/api/pixels/spend`, `/api/rabbit`, `/api/vscode-key`, `/api/preferences/theme`, `/api/claim`, `/api/claim-free-item`, `/api/milestone-celebration`, `/api/fly-scores`, `/api/sky-ads/track`, `/api/compare-card/[userA]/[userB]`, plus GitHub repo stats and Discord invite count fetches |
| `/dev/[username]` | Mostly server-side Supabase reads; profile tracking / claim/share interactions are handled by client components |
| `/shop/[username]` | `/api/items`, `/api/loadout`, `/api/customizations`, `/api/customizations/upload`, `/api/checkout`, `/api/checkout/status`, `/api/pixels/spend`, `/api/claim-free-item`, `/api/verify-github-star`, `/api/raid/loadout`, `/api/dailies/progress` |
| `/pixels` | `/api/pixels/balance`, `/api/pixels/checkout`, `/api/pixels/purchase-status` |
| `/live` | `/api/presence` |
| `/advertise` | `/api/ads/checkout`, `/api/ads/checkout/pix` |
| `/ads/dashboard*` | `/api/ads/stats`, `/api/ads/manage`, `/api/ads/api-keys`, `/api/ads/webhook-secret`, `/api/ads/billing/portal`, `/api/ads/audience/[adId]` |
| `/arcade` | `/api/arcade/rooms`, `/api/arcade/favorites`, PartyKit lobby room list |
| `/arcade/[slug]` | `/api/arcade/rooms/[slug]`, `/api/arcade/avatar`, `/api/arcade/discoveries`, then PartyKit websocket/game networking |
| `/rabbit` | `/api/rabbit` |
| `/support` | `/api/support/checkout` |
| `/wallpaper` | Supabase snapshot URL or `/api/city` fallback |

Important architectural pattern:

- **Server pages often skip `/api/*` entirely** and read Supabase directly.
- `/api/*` is used more for:
  - mutations
  - polling endpoints
  - integrations/webhooks
  - client-only data
  - admin/external APIs

## 8. Backend Data Model And Storage

### Key database table families

| Domain | Important tables | Notes |
| --- | --- | --- |
| Core city | `developers`, `city_stats`, `add_requests` | Developer/building core, city totals, rate-limit bookkeeping |
| Shop/customization | `items`, `purchases`, `developer_customizations` | Cosmetics, ownership, appearance config |
| Achievements/social | `achievements`, `developer_achievements`, `developer_kudos`, `building_visits`, `activity_feed` | Social loop and progression |
| Streaks/dailies/xp | `streak_checkins`, `streak_freeze_log`, `streak_rewards`, `daily_mission_progress`, `xp_log` | Daily retention systems |
| Districts / milestones / roadmap | `districts`, `district_changes`, `milestone_celebrations`, `roadmap_votes` | Meta progression / personalization |
| Gameplay | `fly_scores`, `building_drops`, `drop_pulls`, `raids`, `raid_tags` | Minigames and PvP/PvE mechanics |
| Pixel economy | `wallets`, `wallet_transactions`, `pixel_packages`, `pixel_purchases`, `earn_rules` | Soft-currency economy |
| Ads | `sky_ads`, `sky_ad_events`, `sky_ad_conversions`, `advertiser_accounts`, `advertiser_sessions`, `advertiser_api_keys` | Ad delivery, tracking, auth, analytics |
| Presence / arcade | `developer_sessions`, `site_visitors`, `arcade_rooms`, `arcade_room_favorites`, `arcade_room_visits`, `arcade_avatars`, `arcade_discoveries` | Live presence and arcade product |
| Notifications | `notification_preferences`, `notification_log`, `notification_batches`, `notification_batch_items`, `notification_suppressions`, `push_subscriptions` | Notification backend |
| Misc | `city_snapshot_cache`, `survey_responses` | Snapshot cache and experiments |

### Important RPCs / database-backed behaviors

The backend relies heavily on SQL/RPC helpers. Important examples include:

- `assign_new_dev_rank`
- `recalculate_ranks`
- `grant_xp`
- `perform_checkin`
- `grant_streak_freeze`
- `spend_pixels`
- `credit_pixels`
- `debit_pixels`
- `heartbeat_visitor`
- `top_achievers`
- `upsert_arcade_visit`
- `refresh_sky_ad_stats`

This means the database is part of the business logic, not just storage.

### Storage buckets

Confirmed storage usage in code:

- `city-data`
  - stores the gzip city snapshot used by the homepage and wallpaper mode
- `billboards`
  - stores uploaded billboard images for building customization

### Realtime channels

Confirmed realtime usage:

- Supabase Realtime broadcast topic: `coding-presence`

That channel is fed by `/api/heartbeats` and consumed by browser hooks like `src/lib/useCodingPresence.ts`.

## 9. External Integrations And Outgoing API Calls

| Service | Used for | Where it appears |
| --- | --- | --- |
| GitHub REST API | User profile, repo, star, and repo metadata fetches | `src/lib/github-api.ts`, `/api/dev/[username]`, auth callback, star verification |
| GitHub GraphQL API | Contribution calendars, PRs, reviews, streaks, yearly totals | `src/lib/github-api.ts`, `/api/checkin` |
| Supabase | Auth, database, storage, realtime | throughout repo |
| Stripe | Shop checkout, support donations, ads checkout, subscriptions, billing portal, webhooks | `src/lib/stripe.ts`, multiple `/api/*` routes |
| AbacatePay | Pix checkout and webhook handling | `src/lib/abacatepay.ts`, `/api/ads/checkout/pix`, `/api/pixels/checkout`, webhook |
| NOWPayments | Crypto invoices and webhook handling | `src/lib/nowpayments.ts`, shop checkout / webhook |
| Resend | Transactional email + advertiser magic links + notification delivery lifecycle | `src/lib/resend.ts`, `/api/ads/auth/send-magic-link`, cron jobs, webhook |
| PartyKit | Realtime arcade room server and room lobby aggregation | `party/arcade.ts`, `party/lobby.ts` |
| Discord invite API | Public invite member counts | homepage client fetch |
| Vercel Analytics / Speed Insights | Analytics and performance instrumentation | `src/app/layout.tsx` |
| Himetrica | Optional client analytics | `src/app/layout.tsx`, tracking helpers |

## 10. PartyKit / Arcade Subsystem

This repo contains a fairly separate product inside the same app: **E.Arcade**.

### Runtime shape

`partykit.json` defines:

- main worker: `party/arcade.ts`
- named party: `party/lobby.ts`

### What the arcade backend does

`party/arcade.ts` is a realtime room server that:

- validates a Supabase auth token on connect
- loads room map config from Supabase REST
- caches room config in PartyKit room storage
- keeps player state in room storage
- syncs movement/chat/avatar state
- rate limits movement/chat/avatar updates
- applies profanity/scam filtering
- stores chat history
- reports room counts to the lobby worker

`party/lobby.ts`:

- tracks room player counts
- exposes `/rooms`
- exposes a total online count

### What the arcade frontend does

The arcade client is custom-built rather than using a third-party game engine:

- tile map loading
- custom renderer
- custom input handling
- touch controls
- chat log
- sprite animation
- terminal interactions / discoveries

The browser-side arcade code lives mostly in:

- `src/app/arcade/[slug]/page.tsx`
- `src/lib/arcade/engine/*`
- `src/lib/arcade/network/client.ts`

## 11. VS Code Extension Subsystem

The repo contains a full VS Code extension in `packages/vscode-extension`.

### What it does

The extension:

- activates on startup
- tracks coding activity from editor, terminal, debug, task, filesystem, and notebook events
- batches/sends sanitized heartbeats to `/api/heartbeats`
- supports connect/disconnect/pause/open-city commands
- has privacy settings for sharing language/project names

### Extension architecture

| File | Role |
| --- | --- |
| `packages/vscode-extension/src/extension.ts` | Main extension activation |
| `packages/vscode-extension/src/activity/tracker.ts` | Event tracking and idle/offline logic |
| `packages/vscode-extension/src/api/client.ts` | POST to `/api/heartbeats` with retries |
| `packages/vscode-extension/src/api/queue.ts` | Persistent heartbeat queue/batching |

### Important backend tie-in

Pulse is not a toy demo. It is integrated into the main product:

- `/api/vscode-key` provisions API keys
- `/api/heartbeats` validates key and updates `developer_sessions`
- `/api/presence` powers the live coding UI
- the homepage uses live presence to make buildings appear "active"

## 12. Cron Jobs, Background Processing, And Caching

### Vercel cron jobs

Configured in `vercel.json`:

| Route | Schedule | What it does |
| --- | --- | --- |
| `/api/cron/ad-expiry` | `0 */6 * * *` | Expiry / reminder emails for ads |
| `/api/cron/flush-batches` | `*/15 * * * *` | Flush queued notification batches |
| `/api/cron/streak-reminder` | `0 20 * * *` | Daily streak reminder notifications |
| `/api/cron/weekly-digest` | `0 10 * * 1` | Weekly digest |
| `/api/cron/monthly-digest` | `0 10 1 * *` | Monthly digest |
| `/api/cron/re-engagement` | `0 14 * * *` | Re-engagement notifications |
| `/api/cron/city-snapshot` | `*/10 * * * *` | Rebuild gzip city snapshot |
| `/api/cron/cleanup-sessions` | `*/5 * * * *` | Mark sessions idle/offline, prune stale visitors |
| `/api/cron/refresh-ad-stats` | `0 * * * *` | Refresh ad stats aggregates |
| `/api/cron/ad-weekly-report` | `0 10 * * 1` | Weekly advertiser report |

### Caching patterns

The codebase uses multiple caching approaches:

- CDN cache headers on many route handlers
- ISR on several server pages
- snapshot precomputation for city payloads
- in-memory frontend cache (`cityCache.ts`)
- in-memory rate limiters / dedup caches on server
- PartyKit room storage for arcade room cache/state

Examples:

- `/api/city`: `s-maxage=300, stale-while-revalidate=600`
- `/api/feed`: `s-maxage=60`
- `/api/presence`: `s-maxage=10`
- profile page: `revalidate = 3600`
- leaderboard: `revalidate = 300`
- roadmap: `revalidate = 300`
- pitch: `revalidate = 300`

## 13. Architectural Assessment

### What is built well

- The repo is surprisingly cohesive for a product with this many features.
- The "single app + Supabase + PartyKit" model is a good fit for rapid product iteration.
- The city snapshot strategy is a smart performance optimization.
- Ads, live presence, gameplay, and profile data all feed back into the same city metaphor.
- The route organization is mostly domain-oriented and easy to scan.

### Important architectural realities

1. The main landing page is a very large client orchestrator.
   - `src/app/page.tsx` owns a lot of concerns at once: loading, auth, search, ads, feed, dailies, raids, drops, rabbit, compare mode, themes, presence, and minigames.
   - It works, but it is also the clearest frontend maintainability hotspot.

2. The backend is distributed across TypeScript and SQL.
   - You cannot understand behavior from route handlers alone.
   - Supabase migrations/RPCs are part of the real backend implementation.

3. Server-side access control is often enforced in application code.
   - The service role client is used widely.
   - That is powerful, but it means authorization discipline in route handlers matters a lot.

4. Some rate limiting and dedup logic is instance-local.
   - Good for defense in depth.
   - Not perfect across multiple serverless instances.

5. The ads subsystem is a first-class product area.
   - It is not just a banner ad feature.
   - It has checkout, auth, API keys, conversion tracking, analytics, audience breakdown, cron reports, and public APIs.

6. The repo contains multiple products sharing one backend.
   - Main web app
   - Arcade
   - VS Code extension
   - Advertiser dashboard/API

### Risks / things to know before changing this repo

- Changes to Supabase schema or RPCs can break major app behavior even if TypeScript builds.
- The homepage has many feature couplings.
- Payment webhooks touch multiple domains: ads, pixels, shop purchases, refunds, subscriptions.
- Presence uses both polling and realtime, so bugs can appear in either path.
- The environment documentation appears slightly incomplete compared to actual code references.

Examples of env vars referenced in code but not clearly documented in `.env.example`:

- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`
- `NOWPAYMENTS_SANDBOX`
- `NEXT_PUBLIC_PARTYKIT_HOST`
- `ARCADE_ADMIN_KEY`
- `RESEND_WEBHOOK_SECRET`
- `UNSUBSCRIBE_HMAC_SECRET`

## 14. Bottom Line

Git City is best understood as a **serverless product platform** built inside one Next.js repo, not just as a frontend visualization site.

Frontend:

- Next.js App Router
- React 19
- Tailwind v4
- React Three Fiber for the main 3D experience

Backend:

- Next.js route handlers
- Supabase Postgres/Auth/Storage/Realtime/RPC
- PartyKit realtime workers
- Stripe/PIX/crypto/email/webhook integrations

If you are onboarding to this codebase, the most important files to read first are:

1. `src/app/page.tsx`
2. `src/lib/github.ts`
3. `src/lib/github-api.ts`
4. `src/lib/supabase.ts`
5. `src/middleware.ts`
6. `src/app/api/city/route.ts`
7. `src/app/api/dev/[username]/route.ts`
8. `party/arcade.ts`
9. `packages/vscode-extension/src/activity/tracker.ts`
10. representative Supabase migrations in `supabase/migrations`

Those files explain most of the app's real architecture.
