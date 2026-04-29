# Database Design

<!-- SECTION: schema-design -->
## Schema Design

**Naming conventions:**
- Tables: plural, snake_case (`user_accounts`, `order_items`)
- Columns: singular, snake_case (`created_at`, `is_active`)
- Primary keys: `id` (auto-increment or UUID)
- Foreign keys: `{referenced_table_singular}_id` (`user_id`, `order_id`)
- Indexes: `idx_{table}_{columns}` (`idx_users_email`)
- Constraints: `{type}_{table}_{columns}` (`uq_users_email`, `fk_orders_user_id`)

**Required columns for all tables:**
- `id` — primary key
- `created_at` — timestamp, set on insert
- `updated_at` — timestamp, set on insert and update

**Soft deletes:** Add `deleted_at` timestamp column. Filter `WHERE deleted_at IS NULL` by default. Use hard deletes only for GDPR compliance.

**Data types:** Use the most specific type. `boolean` not `int`, `decimal` not `float` for money, `timestamptz` not `timestamp`.

<!-- SECTION: migrations -->
## Migrations

**Rules:**
- One migration per schema change
- Migrations are append-only — never edit a deployed migration
- Every migration must be reversible (include down/rollback)
- Test migrations against production-size data before deploying
- Name format: `{timestamp}_{description}.sql` or framework equivalent

**Safe operations:** Add column (nullable), add index (concurrent), add table, add constraint (validate later).

**Dangerous operations:** Remove column, rename column, change column type, add NOT NULL without default. These require multi-step migrations with backfill.

<!-- SECTION: indexing -->
## Indexing

**When to index:**
- Foreign key columns (always)
- Columns in WHERE clauses (frequently queried)
- Columns in ORDER BY (for sorted queries)
- Columns in JOIN conditions
- Unique constraints (automatic)

**When NOT to index:**
- Small tables (< 1000 rows)
- Write-heavy columns rarely queried
- Low-cardinality columns (boolean, status with 3 values)

**Composite indexes:** Column order matters — put highest-cardinality column first. The index on `(user_id, created_at)` supports queries on `user_id` alone but NOT `created_at` alone.

**Monitor:** Use `EXPLAIN ANALYZE` to verify index usage. Drop unused indexes — they slow writes.

<!-- SECTION: orm-patterns -->
## ORM Patterns

**Repository pattern:** Wrap ORM queries behind a repository interface. Business logic never calls ORM directly.

**N+1 prevention:** Use eager loading (`include`, `prefetch_related`, `JOIN FETCH`) for known associations. Use DataLoader pattern for GraphQL resolvers.

**Transactions:** Wrap multi-table writes in transactions. Keep transactions short — no external API calls inside transactions.

**Query optimization:**
- Select only needed columns (`select` / `only`)
- Paginate all list queries
- Use database-level aggregations, not application-level loops
- Cache expensive queries with TTL
