# Database

The app now uses Prisma as the primary persistence layer when `DATABASE_URL` is set.

Local development uses SQLite:

```bash
DATABASE_URL="file:./dev.db"
npm run db:push
npm run db:seed
```

Production can move to PostgreSQL by changing `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then set `DATABASE_URL` to the hosted PostgreSQL connection string and run:

```bash
npm run db:push
npm run db:seed
```

The current schema keeps the editor payloads as JSON columns:

- `Tool.fields`
- `Tool.prompt`
- `Tool.result`
- `Tool.seo`
- `ToolRun.values`

That keeps the CMS flexible while the tool configuration model is still evolving. When the product stabilizes, these JSON columns can be normalized into dedicated `ToolField`, `ToolPrompt`, `SeoBlock`, and `Faq` tables.
