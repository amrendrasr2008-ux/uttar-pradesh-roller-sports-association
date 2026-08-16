# UPRSA Official Portal - Production Deployment & Operations Guide

This guide details the end-to-end setup, database initialization, security policies, authentication, storage, and deployment instructions for the **Uttar Pradesh Roller Sports Association (UPRSA)** official web application and tournament management portal.

---

## A. Required Environment Variables

The application connects to Supabase using standard frontend client environment variables. **Never expose the Supabase service-role secret key in frontend application code or environment files.**

| Variable Name | Environment | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Client / Production | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Client / Production | Your Supabase public `anon` API key |
| `APP_URL` | Production / Server | Canonical public URL (e.g. `https://uprsa.org.in`) |

---

## B. Supabase Setup Instructions

1. Log into [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**, select your organization, and name the project `uprsa-portal-prod`.
3. Select a database region close to Uttar Pradesh users (e.g., `Mumbai (ap-south-1)`).
4. Set a strong Database Password and store it in a secure password manager.
5. Once provisioned, navigate to **Project Settings > API** to copy your `Project URL` and `anon public` key.

---

## C. Required SQL Migrations

Execute the consolidated SQL migration script located in `/supabase_migrations_scoring.sql` via the **Supabase SQL Editor**:

```sql
-- Full UPRSA Database Schema
-- Includes Profiles, Districts, Clubs, Skaters, Tournaments, Tournament Events, 
-- Tournament Registrations, Races, Race Participants, Race Results, Tournament Results, 
-- Ranking Snapshots, Scoring Rules, Certificates, Certificate Templates, Scoreboard State.

-- Execute /supabase_migrations_scoring.sql in the Supabase SQL Editor.
```

### Table Definitions Included:
1. `public.profiles` (User role mappings - admin, operator, skater)
2. `public.districts` (75 UP Districts metadata and contact info)
3. `public.clubs` (Affiliated clubs with district linking)
4. `public.skaters` (Registered skaters with official UPRSA registration numbers)
5. `public.tournaments` (State & District tournaments metadata)
6. `public.tournament_events` (Discipline, age group, gender, distance, heat count)
7. `public.tournament_registrations` (Bib numbers, heat/lane assignments)
8. `public.races` (Heats/Races schedule, timing/score mode, status)
9. `public.race_participants` (Live start list & lane assignments)
10. `public.race_results` (Live raw timing, penalty, final timing, positions, medal, approval status)
11. `public.tournament_results` (Global published official results)
12. `public.ranking_snapshots` (Historical state & district ranking snapshots)
13. `public.scoring_rules` (Official point allocation system: 1st=10, 2nd=7, 3rd=5, 4th=3, 5th=2, 6th+=1)
14. `public.certificates` (Issued merit, participation, and appreciation certificates)
15. `public.certificate_templates` (Configurable layout templates)
16. `public.scoreboard_state` (Live Stadium LED display state synchronization)

---

## D. Required Supabase Storage Buckets

Navigate to **Supabase > Storage** and create the following buckets:

1. **`skater-photos`**:
   - Public: **Yes**
   - File Size Limit: **5 MB**
   - Allowed MIME Types: `image/jpeg`, `image/png`, `image/webp`
   - Purpose: Skater profile photos and digital ID card photos.

2. **`certificates`**:
   - Public: **Yes**
   - File Size Limit: **10 MB**
   - Allowed MIME Types: `application/pdf`, `image/png`, `image/jpeg`
   - Purpose: Generated official certificate PDFs and templates.

---

## E. Authentication Setup

1. In Supabase Dashboard, navigate to **Authentication > Settings**.
2. **Site URL**: Set to `https://uprsa.org.in` (or your Cloud Run deployment domain).
3. **Redirect URLs**: Add `https://uprsa.org.in/*` and `http://localhost:3000/*`.
4. Enable **Email / Password** provider under **Auth > Providers**.
5. Disable "Confirm email" for immediate operator onboarding if desired, or configure SMTP for official UPRSA email verification.

---

## F. Admin Account Creation

To provision an Official UPRSA Administrator:

1. Register a user via the UPRSA Portal Sign-Up or create the account directly in **Supabase Auth > Users**.
2. Copy the generated `UUID` for the user.
3. In **Supabase SQL Editor**, assign the `admin` role in `public.profiles`:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('<USER_AUTH_UUID>', 'admin@uprsa.org.in', 'UPRSA State Administrator', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

---

## G. Operator Account Creation

To provision a Track Operator / Scoring Official:

1. Create the user in **Supabase Auth > Users** (e.g. `operator.lucknow@uprsa.org.in`).
2. Assign the `operator` role in `public.profiles`:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('<OPERATOR_AUTH_UUID>', 'operator.lucknow@uprsa.org.in', 'Lucknow Track Operator', 'operator')
ON CONFLICT (id) DO UPDATE SET role = 'operator';
```

---

## H. RLS Verification

Ensure Row Level Security is active on all public tables:

```sql
-- Verify RLS Status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All 16 tables must show `rowsecurity = true`.
- **Public Read Access**: Allowed for all public viewers on tournaments, published results, rankings, clubs, and active live scoreboard state.
- **Admin/Operator Write Access**: restricted to authenticated users with `admin` or `operator` role.

---

## I. Realtime Setup

1. In Supabase Dashboard, navigate to **Database > Replication**.
2. Verify that `supabase_realtime` publication includes:
   - `public.races`
   - `public.race_results`
   - `public.scoreboard_state`
   - `public.tournament_results`
3. Toggle on **INSERT, UPDATE, DELETE** replication for these tables to ensure instantaneous live scoreboard updates on stadium screens without page refresh.

---

## J. Production Build Command

To compile and verify the bundle locally or in CI/CD:

```bash
npm run build
```

The output directory will be `/dist`, containing all optimized static assets, JS bundles, and HTML entry points.

---

## K. Deployment Instructions

### Cloud Run Container Deployment
1. Set container build environment variable: `NODE_ENV=production`.
2. Build command: `npm run build`.
3. Start command: Serve static content from `dist/` or launch standard proxy entry point on port 3000.
4. Pass standard runtime environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## L. Custom Domain Instructions

1. Point your domain DNS records (e.g., `uprsa.org.in`):
   - **A Record**: Point `@` to Cloud Run / Ingress IP address.
   - **CNAME Record**: Point `www` to `@` host.
2. In Supabase Dashboard > Authentication > URL Configuration:
   - Add `https://uprsa.org.in` as **Site URL**.
   - Add `https://uprsa.org.in/**` to **Redirect URLs**.

---

## M. Final Testing Checklist

- [x] **Database Schema**: All 16 tables and foreign key constraints migrated.
- [x] **RLS Enabled**: Public read access active; operator/admin write policies active.
- [x] **Realtime Sync**: Subscriptions on `races`, `race_results`, and `scoreboard_state` tested.
- [x] **Authentication**: Admin and Operator roles properly checked via `profiles`.
- [x] **Public Scoreboard**: Unauthenticated visitors can view real-time timing & positions.
- [x] **Results Approval Workflow**: Draft results hidden from public; Published results immediately sync to global scoreboard and club/district points.
- [x] **Certificate Engine**: PDF generation and print views rendered cleanly without missing fields.
- [x] **Export Capabilities**: CSV/Excel downloads working for start lists, results, and rankings.
- [x] **Mobile Responsiveness**: UI adapts fluidly from mobile touch devices to widescreen stadium LED screens.
- [x] **Clean Build**: Zero build or compilation errors (`npm run build` succeeds cleanly).

---

**Uttar Pradesh Roller Sports Association (UPRSA) Portal is officially fully audited and READY FOR PRODUCTION.**
