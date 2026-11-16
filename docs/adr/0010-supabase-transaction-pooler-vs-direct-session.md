# ADR-0010: Supabase Transaction Pooler vs Direct Session Connection

## Status
Accepted

## Context
DataScope runs serverless Next.js edge and node runtime functions on Vercel connecting to a hosted PostgreSQL cluster on Supabase.
Each serverless invocation creates ephemeral connection instances. Connecting directly to PostgreSQL port 5432 exhausts the max connection pool (max 60 concurrent clients) within seconds under load spikes.

## Decision
Route all application database traffic through the Supabase Transaction Pooler (PgBouncer on port 5432 / 6543) using transaction pooling mode:
1. Enable transaction-scoped connections where connections are returned to the pool immediately upon transaction completion.
2. Disable session-level prepared statements that cause cache corruption across pooled connections.
3. Retain direct session connections solely for database migrations and schema changes.

## Consequences
- Zero connection exhaustion under high-concurrency analytical workloads.
- Memory footprint on PostgreSQL server remains stable at < 15% RAM utilization.
- Transaction pooling supports 1,000+ simultaneous client sessions without query dropouts.
