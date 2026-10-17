# ReConstruct

A personal productivity hub for six areas: Task Manager, Career Growth, Business Growth, Review Time, Entertainment Review, and Spend Manager.

## Stack
- React + Vite
- Supabase Auth and Postgres with row-level security
- GitHub Pages deployment workflow

## Local development
1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.

The Supabase URL and publishable key are configured in `src/lib/supabase.js`. The key is a browser-safe publishable key; access to records is protected by Supabase Auth and row-level security.

## Deployment
The included GitHub Actions workflow builds the app and deploys it to GitHub Pages. In repository Settings → Pages, select GitHub Actions as the source. Add the deployed site URL to Supabase Authentication → URL Configuration → Redirect URLs before using email confirmation/sign-in links.
