
# @netlify/neon

[![npm version](https://img.shields.io/npm/v/@netlify/neon.svg)](https://www.npmjs.com/package/@netlify/neon)
[![License](https://img.shields.io/npm/l/@netlify/neon.svg)](LICENSE)

Netlify-optimized wrapper for **[`@neondatabase/serverless`](https://www.npmjs.com/package/@neondatabase/serverless)** with automatic environment configuration.

> `@neondatabase/serverless` is [Neon](https://neon.tech)'s PostgreSQL driver for JavaScript and TypeScript. It's:
> - **Low-latency**, thanks to [message pipelining](https://neon.tech/blog/quicker-serverless-postgres) and other optimizations
> - **Ideal for serverless/edge** deployment, using https and WebSockets in place of TCP
> - **A drop-in replacement** for [node-postgres](https://node-postgres.com/), aka [`pg`](https://www.npmjs.com/package/pg) (on which it's based)


## Netlify Integration

Automatically uses your Neon database connection via Netlify environment variables:

```bash
# Install package
npm install @netlify/neon

# Configure database (via Netlify CLI)
netlify db init
```

## Basic Usage

```ts
import { neon } from '@netlify/neon'
const sql = neon() // automatically uses env NETLIFY_DATABASE_URL

const [post] = await sql`SELECT * FROM posts WHERE id = ${postId}`
// `post` is now { id: 12, title: 'My post', ... } (or undefined)
```

## Usage with `Drizzle-ORM`
```ts
// ./src/db/index.ts
import { neon } from '@netlify/neon'
import { drizzle } from 'drizzle-orm/neon-http'
import { posts } from "./schema"

export const db = drizzle({
  schema,
  client: neon() // Uses NETLIFY_DATABASE_URL automatically
})

// ./src/db/schema.ts
import { integer, pgTable, varchar, text } from 'drizzle-orm/pg-core'

export const postsTable = pgTable('posts', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull().default('')
})
```

### Querying with Drizzle

```ts
import { db } from "./db"
import { postsTable } from "./db/schema"

const posts = await db.select().from(postsTable)
```

Read more about using Drizzle-ORM with Neon: [Get started](https://orm.drizzle.team/docs/get-started/neon-new#step-4---create-a-table)

## With additional options
The `neon` function imported from `@netlify/neon` also supports all of the same HTTP options as `@neondatabase/serverless`.

```ts
import { neon } from '@netlify/neon'

// automatically using connection string from env NETLIFY_DATABASE_URL 
const sql = neon({
    arrayMode: true,
    fetchOptions: { priority: 'high' }
})

// or when explicitly passing in a connection string override
const sql = neon("postgres://user:pass@host/db",{
    arrayMode: true,
    fetchOptions: { priority: 'high' }
})
```

## Transactions

Supports all **[Neon transaction options](https://neon.tech/docs/serverless/serverless-driver#issue-multiple-queries-with-the-transaction-function)**:

```ts
import { neon } from '@netlify/neon'

const sql = neon() // automatically uses env NETLIFY_DATABASE_URL
const showLatestN = 10
const [posts, tags] = await sql.transaction(
  [sql`SELECT * FROM posts ORDER BY posted_at DESC LIMIT ${showLatestN}`, sql`SELECT * FROM tags`],
  {
    isolationLevel: 'RepeatableRead',
    readOnly: true,
  }
)
```

## Documentation

📚 **[Neon Serverless Driver Docs](https://neon.tech/docs/serverless/serverless-driver)**  
📚 **[Drizzle with Neon Postgres](https://orm.drizzle.team/docs/tutorials/drizzle-with-neon)**
