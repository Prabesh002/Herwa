### Phase 1: Governance & Logic (COMPLETED)
- [x] **Database Layers:** Catalog (Tiers/Features), Entitlement (State), History (Immutable truth).
- [x] **Manager Orchestration:** Business logic decoupled from Discord and Database.
- [x] **Feature Discovery:** Auto-syncing code commands to DB records.
- [x] **The Guardrail:** Live permission/tier checking on every interaction.
- [x] **Visual Polish:** High-precision chart generation with custom fonts.

### Phase 2: Data Engine (COMPLETED)
- [x] **OLAP Power:** ClickHouse integration for massive data.
- [x] **Reliable ETL:** ACK-based sync to prevent data loss.
- [x] **Postgres Janitor:** Automatic self-cleaning with configurable retention.

---

### Phase 3: Optimization & Real-World Readiness (CURRENT)
*Goal: Prepare the bot for thousands of simultaneous users.*

- [ ] **3.1. Performance Caching (High Priority):** 
    *   Currently, every command types `/` triggers a Postgres lookup for Tiers and Permissions.
    *   **Task:** Implement an in-memory (or Redis) cache for the `EntitlementManager`.
- [ ] **3.2. Usage Quotas (The "SaaS" Limit):**
    *   We have the `guild_feature_usage` table but aren't enforcing limits.
    *   **Task:** Implement logic to block commands if a guild hits their "Free Tier" monthly message limit.
- [ ] **3.3. Error Tracking:**
    *   Integrate Sentry or a professional logging sink for the production environment.

### Phase 4: The API Layer (The "Bridge")
*Goal: Expose Herwa's power to the web.*

- [ ] **4.1. Standalone API (`herwa-api`):** 
    *   Create a new microservice in the `docker-compose`.
    *   Connect it to the same ClickHouse and Postgres instances.
- [ ] **4.2. Developer Keys:** 
    *   Implement logic to generate and validate `sk_live_...` API keys.
    *   Create the "Developer Sandbox" where they can test endpoints.
- [ ] **4.3. Authentication:** 
    *   Set up Discord OAuth2 so users can log in to your future website.

### Phase 5: The Web Dashboard (The "Product")
*Goal: A beautiful UI for server owners.*

- [ ] **5.1. Dashboard UI:** 
    *   Built with Next.js and Tailwind.
    *   Interactive versions of your Discord charts (Zoom, Filter by date).
- [ ] **5.2. Command Center:** 
    *   A web interface to toggle features and set RBAC permissions (Roles/Channels) without using Discord commands.
- [ ] **5.3. Billing Integration:** 
    *   Connect Stripe to your `payments` table. When a user pays, the `SubscriptionManager` automatically upgrades their tier.