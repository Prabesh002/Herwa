# Herwa

**Herwa** (Nepali for *"Watcher"*) is a modular Discord bot designed to observe server activity and record events.

Herwa is designed to act as a data sink for your community. It currently stores:

1.  **Message Events:** Timestamps, channel IDs, user IDs, and message kinds (text, attachment, embed).
2.  **Voice Sessions:** Join times, leave times, and calculated duration.
3.  **Member Lifecycle:** Join and Leave events to track retention.
4.  **Feature Usage:** Tracks how often specific commands/features are used per guild

## Architecture

*   **Redis:** Handles hot state, entitlement checks, and usage buffers
*   **PostgreSQL:** The source for configuration, subscriptions, and staging event data.
*   **ClickHouse:** Analytics
*   **ETL Worker:** A background process that strictly moves data from Redis/Postgres -> ClickHouse and cleans up old rows.

## Use Cases

With the raw data stored in ClickHouse, you can refine it to generate:

*   **Activity Heatmaps:** Visualize exactly when your server is most active 
*   **Retention Analysis:** Correlate user join dates with their voice participation weeks later.
*   **Billing & Quotas:** Enforce usage limits (e.g., "1,000 queries per month") based on subscription tiers.

---

## Development

### 1. Adding Commands

Adding a command is straightforward. The architecture separates the "What" (Entitlements) from the "How" (Logic).

1.  **Create the Command:**
    Add a new class implementing `ICommand` in `src/discord/commands/modules/<module>/commands/`.

    ```typescript
    export class MyCommand implements ICommand {
      public readonly data = new SlashCommandBuilder()
        .setName('my-command')
        .setDescription('Does something cool');

      public async execute(interaction: CommandInteraction): Promise<void> {
        await interaction.reply('Hello World');
      }
    }
    ```

2.  **Register the Command:**
    Add it to the registrar in `src/discord/commands/modules/<module>/<module>.registrar.ts`.

3.  **Seed the Platform:**
    Run `bun platform:seed`. This registers the command in the database, links it to a Feature Flag, and warms the Global Command Cache.

### 2. Adding Events

Adding new event listeners (e.g., `MessageReactionAdd`) requires hooking into the ETL

1.  **Create the Schema:**
    Define the table in `src/infrastructure/database/schema/analytics/`. Use `chIngestedAt` column for sync tracking.

2.  **Create the Event Handler:**
    Implement `IEventHandler` in `src/discord/events/modules/...`.
    *   *Note:* Do **not** write complex logic here. Just capture the data and write it to the Postgres persistence service.

3.  **Create the Sync Task:**
    Create a task in `src/infrastructure/analytics/etl/tasks/`.
    *   Read from Postgres (where `chIngestedAt` is NULL).
    *   Batch insert into ClickHouse.
    *   Update Postgres rows to set `chIngestedAt = NOW()`.

4.  **Register the ETL:**
    Add your new task to `src/infrastructure/analytics/etl/run-etl.ts`.

---

## Setup & Running

**Prerequisites:** Docker & Bun.

1.  **Environment:**
    ```bash
    cp .env.example .env
    # Fill in Discord Token and Client ID
    ```

2.  **Start Infrastructure (DB, Redis, ClickHouse):**
    ```bash
    docker compose -f docker-compose.dev.yml up -d
    ```

3.  **Seed Data:**
    Initialize the tiers, features, and command cache.
    ```bash
    bun run platform:seed
    ```

4.  **Run Dev:**
    ```bash
    bun run dev
    ```
