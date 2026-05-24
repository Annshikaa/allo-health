# AlloInventory — Multi-Warehouse Inventory & Reservation Platform

A full-stack Next.js 15 App Router application featuring race-condition-safe inventory reservations, a stunning Three.js animated UI, and a two-layer expiry system.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL via Prisma (Supabase / Neon) |
| Cache / Idempotency | Upstash Redis |
| Validation | Zod |
| 3D Background | Three.js + @react-three/fiber + @react-three/drei |
| Animations | Framer Motion |
| Styling | Tailwind CSS v3 |

---

## Local Setup

```bash
# 1. Clone and install
git clone <repo>
cd allo-inventory
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CRON_SECRET

# 3. Migrate the database
npx prisma migrate dev --name init

# 4. Seed with sample data (5 products, 3 warehouses, varied stock levels)
npm run db:seed

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## How Expiry Works — Two-Layer Design

Reservations hold stock for `RESERVATION_TTL_MINUTES` (default 10 minutes). If neither confirmed nor released, the hold expires and the units return to the available pool via **two complementary mechanisms**:

### Layer 1 — Lazy Check on GET
When a client fetches `GET /api/reservations/[id]`, the handler checks whether `expiresAt < now`. If so, it immediately:
1. Decrements `reservedUnits` on the `Stock` row
2. Updates the reservation status to `RELEASED`
3. Returns the updated state

This means the UI always sees the current truth — no stale "PENDING" shown to users after expiry.

### Layer 2 — Vercel Cron (every 5 minutes)
`vercel.json` schedules `GET /api/cron/expire-reservations` every 5 minutes. This route:
- Finds all `PENDING` reservations with `expiresAt < now`
- Releases them in parallel via `Promise.allSettled` (one failure doesn't block others)
- Requires `Authorization: Bearer <CRON_SECRET>` for security

Together, Layer 1 handles the "next viewer" case instantly; Layer 2 is the safety net for reservations that nobody ever looks at again.

---

## Concurrency Approach — Postgres Row-Level Locking

The core challenge: two users simultaneously clicking "Reserve Now" for the last unit must not both succeed.

**Solution: `SELECT FOR UPDATE` inside a Prisma transaction**

```typescript
await prisma.$transaction(async (tx) => {
  // Acquires an exclusive row lock on the Stock row.
  // If another transaction holds this lock, this query BLOCKS until it releases.
  // Once unblocked, it re-reads the freshly-committed reservedUnits.
  const stocks = await tx.$queryRaw`
    SELECT id, "totalUnits", "reservedUnits"
    FROM "Stock"
    WHERE "productId" = ${productId} AND "warehouseId" = ${warehouseId}
    FOR UPDATE
  `;

  const available = stocks[0].totalUnits - stocks[0].reservedUnits;
  if (available < quantity) throw new Error("INSUFFICIENT_STOCK"); // → 409

  await tx.stock.update({ ... reservedUnits: { increment: quantity } });
  await tx.reservation.create({ ... });
});
```

**Why not a Redis distributed lock?**

A Redis lock is an application-level convention — it works only if every code path honors it. Postgres `FOR UPDATE` is enforced by the database engine itself, is atomic with the data mutation, and automatically releases on transaction commit/rollback. It's strictly stronger here because our critical section *is* a database read-modify-write — collocating the lock with the data is the right abstraction.

---

## Idempotency Bonus

Every `POST /api/reservations` call can include an `Idempotency-Key` header (a UUID generated client-side). The server:

1. Checks Redis for `idempotency:<key>` before executing
2. If found → returns the cached response immediately (24h TTL)
3. If not found → creates the reservation, then caches the response

This makes the endpoint safe to retry on network failures without double-booking.

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | All products with per-warehouse stock |
| GET | `/api/warehouses` | All warehouses |
| POST | `/api/reservations` | Create reservation (SELECT FOR UPDATE) |
| GET | `/api/reservations/:id` | Fetch + lazy expire if needed |
| POST | `/api/reservations/:id/confirm` | Confirm → decrement totalUnits + reservedUnits |
| POST | `/api/reservations/:id/release` | Cancel → decrement reservedUnits only |
| GET | `/api/cron/expire-reservations` | Batch expire (Bearer auth) |

---

## Trade-offs & What I'd Add With More Time

- **Optimistic UI updates** — After reserving, immediately show updated stock counts without waiting for a re-fetch; roll back on error.
- **WebSockets / Server-Sent Events** — Push live stock changes to all connected clients so the available count updates in real-time as others reserve or release.
- **Proper auth** — Currently reservation actions are unauthenticated. A real system needs JWT-authenticated users so reservations are user-scoped.
- **Quantity selector** — The UI currently reserves exactly 1 unit. A quantity stepper would be straightforward to add.
- **Reservation history** — A `/account/orders` page showing past reservations and their outcomes.
- **Webhook on confirm** — Trigger a payment gateway webhook instead of a direct API call; handle payment failure gracefully with a 3-retry queue before releasing stock.
- **Read replicas** — Route GET reads to a read replica; write transactions stay on the primary.
- **Connection pooling** — Add PgBouncer (or Supabase's built-in pooler) for serverless environments where each Lambda creates a new Postgres connection.
