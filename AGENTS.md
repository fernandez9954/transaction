
## 2. Rule Precedence Hierarchy
When two directives or principles conflict, resolve strictly in this order:
1. **Security & Data Integrity** (Secrets, authorization, production data safety)
2. **Explicit User Requirement** (What the user explicitly instructed)
3. **Correctness & Invariants** (Math models, schema constraints, API contracts)
4. **Production & Runtime Safety** (Edge isolate limits, non-destructive migrations)
5. **Architectural Invariants** (Single source of truth, separation of concerns)
6. **Smallest Viable Diff** (Minimal targeted change; never overrides security or integrity)
7. **KISS / YAGNI / Style Preferences** (Simplicity is preferred, but never at the expense of correctness)

## 3. Universal Engineering Principles
1. **KISS (Keep It Simple):** The simplest working solution always beats a clever abstraction. Push back on over-engineering.
2. **YAGNI (You Aren't Gonna Need It):** Never build speculative flexibility, wrapper layers, or config hooks for hypothetical future needs.
3. **Single Responsibility:** Each function, component, and module must do exactly one thing. Separate by business lifecycle, not arbitrary file length.
4. **Separation of Concerns:** Keep UI rendering, business/chemical math, and data access strictly decoupled. Never tangle math inside JSX.
5. **Fail Fast & Explicit Errors:** Surface errors immediately and visibly. Never silently swallow errors, mask undefined values, or guess fallback data.
6. **Least Astonishment:** State transitions and UI controls must behave predictably with zero hidden side effects.
7. **Convention Over Configuration:** Follow standard React, Tailwind v4, and Cloudflare Worker conventions instead of inventing custom patterns.
8. **Idempotency & Concurrency:** State syncs, migrations, cron jobs, and alerts must be idempotent. Atomic state changes must be enforced in SQLite/D1 via transactions or unique constraints, never assumed via `SELECT` then `UPDATE`.
9. **No Hardcoding & Single Source of Truth:** Each business rule or calculation has exactly one canonical implementation, derived parametrically.
10. **Security & Privacy by Default:** Scrub all secrets/tokens. Validate and authorize inputs at network boundaries. Never log headers, tokens, or raw payloads. Never weaken auth or SSL.
11. **Boundary Validation (Parse, Don't Trust):** Validate all external payloads (D1/KV reads, external APIs, query params, webhooks) at runtime boundaries before passing to domain math or UI logic.
12. **Non-Destructive Migrations & Edge Resilience:** Database migrations must be additive and backward-compatible. All external edge `fetch()` calls must include explicit timeout budgets (`AbortSignal`).
13. **Zero Mutable Module State:** Never use Worker module-level variables for state persistence or locking; isolates are ephemeral and concurrent.
14. **Plan Before Code:** Always inspect the live repo/database and formulate an implementation plan before modifying files.
15. **Smallest Viable Diff:** Make only the minimal targeted change that fulfills the requirement. Do not touch or "clean up" adjacent code.

## 4. Adversarial Directives & Hard Prohibitions
### Adversarial Mindset
- **Ruthlessly Skeptical:** Assume initial assumptions contain edge cases or hidden failure modes.
- **Hunt Edge Race Conditions:** Look for distributed edge replication lags, concurrent writer collisions, and stale local state.
- **Poke Holes in Proposals:** Preemptively critique data integrity, fail-closed behavior, and blast-radius containment before asking for review.

### Strict Prohibitions
- ❌ **Zero Symptom-Masking (Root-Cause Only):** Strictly forbidden to conceal unexpected invariant violations or upstream errors with ad-hoc clamps (`Math.max`, `Math.min`), fallback masks (`?? []`, `|| default`), or special-case branches. Natural domain bounds and defensive defaults are allowed only when explicitly defined at the owning boundary.
- ❌ **Zero Production Mutation During Investigation:** Read-only by default when investigating. Never run `INSERT`, `UPDATE`, or `DELETE` on production D1/KV for debugging, experimentation, or validation.
- ❌ **Zero Test-Gaming:** Never modify, weaken, or delete a failing test to simulate a fix. Tests verify reality; adjust the production implementation.
- ❌ **Zero Unverified "Done" Claims:** Never declare completion without executing and reporting full test and typecheck evidence.
- ❌ **Zero Scope Creep / Unrequested Refactoring:** Never refactor surrounding files or add unrequested stylistic churn.
- ❌ **Zero Silent Breaking Changes:** Statically search all direct and indirect consumers (routes, schema consumers, exports) before changing a shared signature.
- ❌ **Context-Driven / Multi-Tenant by Construction:** All physics, calculations, and data logic dependent on entity configuration must accept entity context/profiles (e.g. `PoolProfile`). Flag and refactor legacy global singletons.
