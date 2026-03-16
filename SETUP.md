# Omnia v2 — Setup Guide

## The #1 most important thing before deploying

Run the SQL migration in Supabase FIRST. This is critical.

---

## Step 1: Supabase SQL Migration

1. Go to supabase.com → your project → SQL Editor
2. Click "New query"  
3. Open the file: `supabase/migrations/001_schema.sql`
4. Copy the ENTIRE file contents
5. Paste into the SQL editor
6. Click Run
7. You should see "Success"

This creates ALL tables with TEXT types (no enums) so signup works perfectly.

---

## Step 2: Supabase Auth Settings

1. Authentication → Settings
2. Turn OFF "Confirm email" (so users go straight to dashboard)
3. Authentication → URL Configuration
4. Set Site URL to your Vercel URL
5. Add Redirect URL: https://your-vercel-url.vercel.app/**

---

## Step 3: Vercel Environment Variables

Add these in Vercel → Settings → Environment Variables:

| Variable | Value |
|---|---|
| NEXT_PUBLIC_APP_URL | https://your-vercel-url.vercel.app |
| NEXT_PUBLIC_APP_NAME | Omnia |
| NEXT_PUBLIC_SUPABASE_URL | https://xxxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJ... (anon key) |
| SUPABASE_SERVICE_ROLE_KEY | eyJ... (service role key) |
| OPENAI_API_KEY | sk-... |
| OPENAI_MODEL_DEFAULT | gpt-4o |
| OPENAI_MODEL_FAST | gpt-4o-mini |
| ENCRYPTION_KEY | mN7xK2pQ9vL4wR8tY1uI6oA3sD5fG0hJ |
| CRON_SECRET | omnia-cron-secret-2024 |
| INTERNAL_ADMIN_EMAIL | your@email.com |

---

## Step 4: Deploy

Push to GitHub → Vercel auto-deploys.

---

## Step 5: Test Signup

1. Go to your Vercel URL
2. Click "Get Started Free"  
3. Sign up with your email
4. You should land on /dashboard immediately

---

## Adding Stripe (for paid plans)

When ready to charge customers, add these env vars:
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  
- STRIPE_WEBHOOK_SECRET
- STRIPE_PLUS_PRICE_ID_MONTHLY
- STRIPE_PLUS_PRICE_ID_YEARLY
- STRIPE_PRO_PRICE_ID_MONTHLY
- STRIPE_PRO_PRICE_ID_YEARLY

The app works fully without Stripe - users just stay on free plan.

---

## Key Changes in v2 vs v1

1. **No ENUM types** - All columns use TEXT instead of PostgreSQL ENUMs.
   This was the root cause of the signup failure in v1.

2. **Self-healing profile creation** - If the trigger fails for any reason,
   the app layout automatically creates the profile on first login.

3. **Simplified routing** - No (public)/(app)/(auth) route groups that caused
   the page_client-reference-manifest.js build error.

4. **All features present** - Assistant, Planner, Notes, Files, Content Studio,
   Document Builder, Invoices, Reminders, Settings, Billing, Admin.
