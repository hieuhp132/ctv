# Deployment

## Render static site

Set the following environment variables in the Render service's **Environment** settings. Vite embeds these values during the build:

- `VITE_SUPABASE_URL`: the Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key

Do not add server secrets such as `RESEND_API_KEY` to frontend `VITE_` variables. Keep server-only secrets in the backend service environment.

Use `npm run build` as the build command and `dist` as the publish directory. The build creates `dist/404.html` as a fallback for static hosts. For Render, also add a rewrite rule so direct navigation and refreshes on client-side routes load the app:

- Source: `/*`
- Destination: `/index.html`
- Action: Rewrite

## Render backend

The API routes are in `server/`. Deploy the latest `main` branch to the Render
backend service so its `/local/admin/users` endpoints are available. If the
service uses a repository root directory, set it to `server`, install with
`npm install`, and start with `node index.js`. Keep the backend's existing
server-only environment variables configured in Render; do not copy them into
the static site's `VITE_` variables.

The root `.env.example` documents the frontend variables for local development. Copy it to `.env` and replace the placeholder values; never commit `.env`.
