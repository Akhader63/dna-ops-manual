# DNA Client Operations Manual App — Project Recovery & Handoff

> **Document Version:** 2.0.0
> **Last Updated:** 2026-05-04
> **Status:** Production Deployed
> **Prepared For:** Next AI Agent / Abdullah Khadim (Solution ERP)

---

## 🚀 Executive Summary

The **DNA Client Operations Manual App** is **COMPLETE and PRODUCTION-DEPLOYED**. All 14 pages are built, the Supabase backend is fully configured with 19 tables and 81 RLS policies, and the app is deployed on **Vercel** with source code on **GitHub**.

### Current State

| Component | Status |
|-----------|--------|
| Frontend (14 pages) | ✅ Complete |
| Supabase Database (19 tables) | ✅ Live with seed data |
| Authentication | ✅ Configured |
| GitHub Repository | ✅ Private, 95 files |
| Vercel Deployment | ✅ Live |
| RLS Policies | ✅ 81 policies active |

### Access Points

| Resource | URL/Location |
|----------|-------------|
| **GitHub Repository** | https://github.com/Akhader63/dna-ops-manual |
| **Vercel Dashboard** | Log in at vercel.com, linked to GitHub repo |
| **Supabase Dashboard** | https://app.supabase.com/project/ocgqvncgcbbdnpsuxona |
| **Live Preview** | https://wwetlpcvktix4.kimi.page |
| **Project Plan** | `/docs/PROJECT_PLAN.md` in repo |

---

## 📁 Critical File Index

### Source Code (All in GitHub)

| File | Purpose | Lines |
|------|---------|-------|
| `src/App.tsx` | Routes, HashRouter, Layout | ~100 |
| `src/pages/Dashboard.tsx` | KPIs, stats, activity feed | ~469 |
| `src/pages/Clients.tsx` | Client CRUD, modal, detail | ~400 |
| `src/pages/ModuleLibrary.tsx` | Module cards, filtering | ~350 |
| `src/pages/TransactionDetail.tsx` | Transaction explorer | ~300 |
| `src/pages/UseCaseDetail.tsx` | Use case documentation | ~350 |
| `src/pages/ManualBuilder.tsx` | 8-step wizard | ~1,200 |
| `src/pages/ApprovalGateways.tsx` | Approval flows, diagrams | ~500 |
| `src/pages/RoleSetup.tsx` | Role cards, permissions | ~600 |
| `src/pages/RoadmapGenerator.tsx` | Interactive SVG canvas | ~900 |
| `src/pages/ManualPreview.tsx` | Internal manual viewer | ~600 |
| `src/pages/SharedManual.tsx` | Client share view | ~800 |
| `src/pages/ProjectTracker.tsx` | Timeline/Kanban/List | ~500 |
| `src/pages/IssuesTracker.tsx` | Bug tracking table | ~600 |
| `src/pages/Settings.tsx` | Admin panels | ~500 |
| `src/hooks/useData.ts` | Generic Supabase CRUD | ~200 |
| `src/hooks/useAuth.ts` | Auth state machine | ~150 |
| `src/services/dataService.ts` | Typed data operations | ~100 |
| `src/types/database.ts` | TypeScript types | ~400 |
| `src/lib/supabase.ts` | Supabase client | ~50 |

### Documentation (All in GitHub)

| File | Purpose | Lines |
|------|---------|-------|
| `docs/PROJECT_PLAN.md` | Master project plan | 1,000+ |
| `docs/BRAND_GUIDE.md` | DNA brand guidelines | ~400 |
| `docs/CORE_SCREENS.md` | Screen specifications | ~700 |
| `docs/DATABASE_SCHEMA.md` | Full schema documentation | ~1,200 |
| `docs/DEPLOYMENT_STRATEGY.md` | Deployment guide | ~2,200 |
| `docs/SUPABASE_SETUP_GUIDE.md` | Setup instructions | ~3,500 |
| `docs/TECH_STACK.md` | Technology decisions | ~700 |
| `README.md` | Project README | ~300 |

### Database

| File | Purpose | Lines |
|------|---------|-------|
| `supabase/migrations/20250502000001_initial_schema.sql` | Full migration | ~627 |
| `database/001_initial_schema.sql` | Complete schema | ~1,524 |

---

## 🔐 Credentials (CONFIDENTIAL)

### Supabase Production

| Field | Value |
|-------|-------|
| Project URL | `https://ocgqvncgcbbdnpsuxona.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3F2bmNnY2JiZG5wc3V4b25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjcxNTMsImV4cCI6MjA5MzMwMzE1M30.o0tA40y52m1CwygY7LTYfBhZMeYH1USLtjbPhf07HXY` |
| Service Role Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3F2bmNnY2JiZG5wc3V4b25hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcyNzE1MywiZXhwIjoyMDkzMzAzMTUzfQ.fu23uYueYh_i4xzWGT8dZa2O-oYgEfeXXKdlf0rx7D4` |
| DB Password | `Ak892763507` |
| Management API Token | `sbp_da30362b22700943b4e7fd042dbea36fcf55ab3e` |

### GitHub

| Field | Value |
|-------|-------|
| Repository | `https://github.com/Akhader63/dna-ops-manual` |
| Owner | `Akhader63` |
| Visibility | Private |

### Vercel

| Field | Value |
|-------|-------|
| Status | Deployed |
| Framework | Vite |
| Build | `npm run build` |
| Output | `dist` |
| Env Vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

---

## 🛠️ How to Continue Development

### For the Next AI Agent

1. **Read the Project Plan first:**
   ```
   docs/PROJECT_PLAN.md
   ```
   This contains the complete status, architecture decisions, and deployment details.

2. **Clone the repository:**
   ```bash
   git clone https://github.com/Akhader63/dna-ops-manual.git
   cd dna-ops-manual
   npm install
   ```

3. **Create `.env` file:**
   ```env
   VITE_SUPABASE_URL=https://ocgqvncgcbbdnpsuxona.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jZ3F2bmNnY2JiZG5wc3V4b25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjcxNTMsImV4cCI6MjA5MzMwMzE1M30.o0tA40y52m1CwygY7LTYfBhZMeYH1USLtjbPhf07HXY
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

5. **Make changes, then build:**
   ```bash
   npm run build
   ```

6. **Commit and push:**
   ```bash
   git add -A
   git commit -m "feat: your changes"
   git push origin main
   ```

   Vercel will auto-deploy.

### Tech Stack Reference

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 7.2.4 | Build tool |
| Tailwind CSS | 3.4.19 | Styling |
| shadcn/ui | Latest | UI components (40+ pre-installed) |
| Framer Motion | Latest | Animations |
| Supabase | Latest | Backend (auth + database) |
| Lucide React | Latest | Icons |
| Recharts | Latest | Charts |
| HashRouter | React Router | Static hosting compatible routing |

---

## ⚠️ Important Notes for Next Agent

### 1. No Server-Side Rendering
This is a **React SPA** using **HashRouter**. It works with static file hosting (Vercel, Netlify, S3). No Next.js, no SSR.

### 2. Supabase Connection Method
Direct PostgreSQL connections are blocked by Supabase firewall. The **ONLY** way to execute SQL is via:
- **Management API** (`api.supabase.com`) with Personal Access Token
- **Supabase Dashboard SQL Editor** (manual copy/paste)
- The REST API works for CRUD operations (dataService.ts uses this)

### 3. TypeScript Strictness
Vercel's build uses `noUnusedLocals: true` and `noUnusedParameters: true`. Any unused variable will fail the build. Remove unused imports and variables before pushing.

### 4. Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Public anon key (safe for frontend)
- **NEVER** expose Service Role Key in frontend code
- `.env` is **NOT** tracked in Git (removed from repo for security)

### 5. Database Schema
19 tables with RLS enabled. Full migration at `supabase/migrations/20250502000001_initial_schema.sql`. Seed data included.

### 6. Common Pitfalls to Avoid
- Don't add heavy canvas libraries (RoadmapGenerator uses HTML/CSS/SVG)
- Don't modify `tsconfig.app.json` to disable strict checks (Vercel will reject)
- Don't commit `.env` or any credentials
- Don't use `supabase.from('table').update()` with `eq` on unindexed columns
- Don't forget to add new routes in `App.tsx` and `Navbar.tsx`

---

## 📋 Remaining Work (For Next Phase)

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | Add automated tests (Jest + React Testing Library) | High | No tests exist yet |
| 2 | Add E2E tests (Playwright) | High | Test critical user flows |
| 3 | Performance audit (Lighthouse) | High | Target score > 90 |
| 4 | Accessibility audit (WCAG 2.1 AA) | High | Keyboard navigation, ARIA labels |
| 5 | Add error boundaries | Medium | Crash recovery for production |
| 6 | Add code splitting / lazy loading | Medium | Reduce initial bundle size |
| 7 | Implement PDF export for manuals | High | Feature requested by users |
| 8 | Add email notifications | Medium | For approvals, manual updates |
| 9 | Multi-language support (Bahasa Indonesia) | Medium | International clients |
| 10 | PWA / offline support | Low | Service worker + caching |

---

## 🆘 Emergency Contacts & Resources

| Resource | URL/Command |
|----------|-------------|
| **GitHub Repo** | https://github.com/Akhader63/dna-ops-manual |
| **Supabase Dashboard** | https://app.supabase.com/project/ocgqvncgcbbdnpsuxona |
| **Supabase Docs** | https://supabase.com/docs |
| **Vercel Docs** | https://vercel.com/docs |
| **Vite Docs** | https://vitejs.dev/guide/ |
| **shadcn/ui Docs** | https://ui.shadcn.com/docs |
| **Tailwind Docs** | https://tailwindcss.com/docs |

---

## ✅ Verification Checklist (For Next Agent)

Before starting work, verify:

- [ ] Can clone GitHub repo successfully
- [ ] Can run `npm install` without errors
- [ ] Can create `.env` with credentials
- [ ] Can run `npm run dev` and app loads at `localhost:5173`
- [ ] Can see Dashboard with KPIs loading from Supabase
- [ ] Can navigate to all 14 pages without errors
- [ ] Can run `npm run build` successfully
- [ ] Can read `docs/PROJECT_PLAN.md` for full context

---

**End of Document — Ready for Next AI Agent**

