# DNA Client Operations Manual App

A professional SaaS platform for Solution ERP consultants to create, manage, and share client-specific operational manuals for the DNA ERP system.

## Live Demo

**[https://wwetlpcvktix4.kimi.page](https://wwetlpcvktix4.kimi.page)**

## Features

- **Dashboard** - KPI overview, activity feed, manual progress tracking, module coverage chart
- **Client Management** - Full CRUD for client organizations with search and filtering
- **Module Library** - Browse 12 DNA ERP modules with transaction/use case counts
- **Transaction Explorer** - Drill into transactions with accordion use case cards
- **Use Case Documentation** - 10-field documentation (what, why, when, who, etc.)
- **8-Step Manual Builder Wizard** - Modules -> Transactions -> Use Cases -> Approvals -> Roles -> Responsibilities -> Review -> Generate
- **Approval Gateway Configuration** - Multi-level approval flows with visual diagrams
- **Role Manager** - 12 standard roles with permission matrices and responsibility assignments
- **Interactive Roadmap Generator** - Visual process flow with zoom, pan, role filtering, SVG export
- **Manual Preview** - Internal consultant preview with TOC navigation
- **Client Sharing** - Secure read-only manual access via shareable links
- **Project Tracker** - Timeline (Gantt) and board (Kanban) views for milestones
- **Issues Tracker** - Bug/feature/change request tracking with status workflow
- **Settings** - User management, module configuration, audit logs, backup

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite v7.2.4 |
| Styling | Tailwind CSS v3.4.19 |
| UI Components | shadcn/ui (40+ components) |
| Animation | Framer Motion |
| Icons | Lucide React |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Router | HashRouter (static hosting compatible) |

## Design System

- **Primary Background**: `#F8F7F3` (Pampas)
- **Sidebar**: `#000000` (DNA Black)
- **Accent/CTA**: `#F3350C` (Pomegranate)
- **Text Primary**: `#000000`
- **Text Body**: `#434343` (Tundora)
- **Text Muted**: `#C7C7C7` (Silver)
- **Border**: `#DDDDDD` (Alto)
- **Font**: Inter (Google Fonts)
- **Grid**: 8px base unit

## Database Schema (Supabase)

19 tables with Row Level Security (RLS):

| Table | Purpose |
|-------|---------|
| `modules` | 12 DNA ERP modules |
| `transactions` | Module-level transactions |
| `use_cases` | Transaction use cases with documentation |
| `clients` | Client organizations |
| `user_accounts` | Consultant user accounts |
| `client_manuals` | Generated operation manuals |
| `manual_selections` | Wizard step selections |
| `approval_gateways` | Approval workflow rules |
| `roles` | Client role definitions |
| `role_responsibilities` | Role-to-module mappings |
| `roadmaps` | Generated roadmap metadata |
| `roadmap_nodes` | Process flow nodes |
| `roadmap_edges` | Process flow connections |
| `shared_links` | Client shareable links |
| `change_logs` | Audit trail |
| `bugs_issues` | Issue/bug tracking |
| `project_plan` | Implementation milestones |
| `optional_features` | Feature flags |
| `tasks_on_hold` | Deferred tasks |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/dna-ops-manual.git
cd dna-ops-manual

# Install dependencies
npm install

# Set up environment variables
cp .env .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your [Supabase Dashboard](https://app.supabase.com) -> Project Settings -> API.

### Building for Production

```bash
npm run build
```

Output will be in the `dist/` directory, ready for static hosting.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Set framework preset to **Vite**
5. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
6. Deploy

### Railway

1. Push to GitHub
2. Go to [railway.app/new](https://railway.app/new)
3. Deploy from GitHub repo
4. Add environment variables in the Variables tab
5. Deploy

### Any Static Host

The `dist/` folder is a fully static build. Upload it to any static host:
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Firebase Hosting
- GitHub Pages

## Project Structure

```
dna-ops/
  src/
    components/
      ui/           # shadcn/ui components
      Navbar.tsx    # Sidebar navigation
      TopHeader.tsx # Top bar with search/notifications
      Footer.tsx    # Page footer
      Layout.tsx    # Page layout wrapper
    pages/
      Dashboard.tsx           # Command center
      Clients.tsx             # Client archive
      ModuleLibrary.tsx       # ERP module browser
      TransactionDetail.tsx   # Transaction explorer
      UseCaseDetail.tsx       # Use case documentation
      ManualBuilder.tsx       # 8-step wizard
      ApprovalGateways.tsx    # Approval configuration
      RoleSetup.tsx           # Role manager
      RoadmapGenerator.tsx    # Interactive process diagram
      ManualPreview.tsx       # Internal manual preview
      SharedManual.tsx        # Client-facing share view
      ProjectTracker.tsx      # Milestone tracking
      IssuesTracker.tsx       # Bug/issue tracking
      Settings.tsx            # Admin panels
    hooks/
      useData.ts    # Generic Supabase CRUD hooks
      useAuth.ts    # Authentication hooks
    services/
      dataService.ts # Typed data operations
    types/
      database.ts   # TypeScript types for all tables
    lib/
      supabase.ts   # Supabase client configuration
    App.tsx         # Root component with routes
    main.tsx        # Entry point
    index.css       # Global styles + Tailwind
  index.html        # HTML entry
  package.json      # Dependencies
  vite.config.ts    # Vite configuration
  tailwind.config.js # Tailwind theme + DNA design tokens
  tsconfig.json     # TypeScript config
```

## Supabase Setup

### 1. Create Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Note the Project URL and Anon Key

### 2. Run Database Migration
The migration file is at `supabase/migrations/20250502000001_initial_schema.sql`

Execute via Supabase Dashboard -> SQL Editor:
1. Open a New Query
2. Paste the migration SQL
3. Run

Or use the Management API with your Personal Access Token.

### 3. Configure Auth
- Enable Email provider
- Set Site URL to your deployed domain
- Add redirect URLs for your domain

### 4. RLS Policies
Row Level Security is enabled on all 19 tables with policies for:
- Anonymous read access (for public data)
- Authenticated user access
- Admin-level operations

## Authentication

The app supports:
- Email/password authentication via Supabase Auth
- Automatic user record creation in `user_accounts` table via database trigger
- Role-based access (consultant, admin)
- Session persistence with automatic token refresh

## Screenshots

| Dashboard | Manual Builder | Roadmap Generator |
|-----------|---------------|-------------------|
| KPI overview, activity feed, progress cards | 8-step wizard with module selection | Interactive process flow with zoom/pan |

| Clients | Approval Gateways | Issues Tracker |
|-----------|-------------------|----------------|
| Card grid with search/filter | Visual flow with multi-level approvals | Status workflow with priority levels |

## License

Proprietary - Solution ERP

## Support

For support, contact Solution ERP at [your-support-email]

---

**Built with care by Solution ERP Consultants**
