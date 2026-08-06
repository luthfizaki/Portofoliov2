# PORTFOLIOV2

Standalone hero-only portfolio. The hero implementation and complete landing
page asset set were extracted from V1, but this project does not import files or
runtime services from `Portofolio_New` or `BE`.

## Structure

```text
PORTFOLIOV2/
├── data/                 # Initial PostgreSQL seed
├── public/               # Complete landing page asset set
├── server/               # Minimal Express + PostgreSQL API
└── src/                  # Hero-only React frontend
```

## Local setup

1. Copy `.env.example` to `.env.local` and update the database credentials.
2. Install dependencies with `npm install`.
3. Create the isolated database with `npm run db:create`.
4. Run frontend and API together with `npm run dev`.

The frontend runs at `http://localhost:3100` and the API at
`http://localhost:3101`. On first start, the API creates and seeds the isolated
`portfolio_v2_hero` table.

For production, run `npm run build` followed by `npm start`. The Express server
serves the generated frontend and API from the same port.
