# ToolForge AI

ToolForge AI is an SEO-first AI tool page CMS. It lets you configure form-based AI tools, generate draft pages from keywords, manage publishing readiness, and ship indexable pages with sitemap, FAQ schema, and multilingual routes.

![ToolForge AI screenshot](docs/screenshot.svg)

## Features

- Configurable AI tool pages: fields, prompts, result format, and SEO blocks
- Admin workspace with tool table, search, filters, SEO readiness, and bulk publish actions
- Keyword library for bulk draft tool generation
- Discovery pipeline:
  - import keyword lines from Google Search Console / Trends / other tools
  - AI opportunity scoring (intent, competition, phrase quality, demand)
  - one-click draft tool generation from selected opportunities
- Automatic internal linking based on category and keyword tags
- Runs log for generated outputs
- Draft preview support
- Sitemap and robots.txt
- Multilingual public routes for English and Chinese:
  - `/en`, `/en/tools`, `/en/[slug]`
  - `/zh`, `/zh/tools`, `/zh/[slug]`
- Prisma persistence with local SQLite and a clear PostgreSQL upgrade path
- Optional OpenAI execution when `OPENAI_API_KEY` is set; mock provider otherwise

## Tech Stack

- Next.js App Router
- React
- Prisma
- SQLite for local development
- Optional PostgreSQL for production

## Getting Started

```bash
npm install
cp .env.example .env
cp .env.example .env.local
npm run db:push
npm run db:seed
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/admin
```

## Environment Variables

```bash
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD=change-this-password
ADMIN_SESSION_SECRET=replace-with-a-long-random-secret
OPENAI_API_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

If `ADMIN_PASSWORD` is not set, the admin workspace is open for local development.

## Database

Local development uses SQLite:

```bash
npm run db:push
npm run db:seed
```

For PostgreSQL, update the Prisma datasource provider and set `DATABASE_URL` to your production connection string. See [docs/database.md](docs/database.md).

## Discovery Input Format

In the Admin `Discovery` tab, paste one keyword per line:

```text
keyword, search_volume(optional), competition(optional)
ai resume summary generator, 1900, 0.42
youtube title generator, 5400, 0.58
```

Then:

1. Analyze opportunities
2. Select high-score rows
3. Generate draft tools

### Google Search Console CSV

Set source to `gsc`, then paste CSV rows directly from Search Console export:

```text
query,clicks,impressions,ctr,position
ai resume summary generator,31,1900,1.63%,8.7
youtube title generator,96,5400,1.78%,6.2
```

The system will parse query rows and estimate demand/competition signals for opportunity scoring.

### Discovery Signal Fetch (Current MVP)

The Discovery tab also supports `Fetch signals` via a provider abstraction.

Current provider:

- `internal_seed`: derives opportunity candidates from your keyword library and recent run patterns.
- `google_trends_free`: fetches trending search topics from Google Trends public RSS (no API key).

This is a scaffold for plugging in real connectors next, such as:

- Google Search Console API
- Google Trends API wrapper
- DataForSEO / Semrush / Ahrefs / SerpAPI

## License

This project is open source under the [MIT License](LICENSE).
