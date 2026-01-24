CREATE TABLE IF NOT EXISTS schema_migrations
(
    `version` String,
    `applied_at` DateTime DEFAULT now()
)
ENGINE = MergeTree()
ORDER BY version;

CREATE TABLE IF NOT EXISTS message_events
(
    `id` UUID,
    `guild_id` String,
    `channel_id` String,
    `user_id` String,
    `created_at` DateTime64(3),
    `message_kind` Enum('text' = 1, 'attachment' = 2, 'sticker' = 3, 'embed' = 4),
    `is_bot` UInt8
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (guild_id, user_id, created_at);

CREATE TABLE IF NOT EXISTS member_lifecycle_events
(
    `id` UUID,
    `guild_id` String,
    `user_id` String,
    `event_type` Enum('JOIN' = 1, 'LEAVE' = 2),
    `created_at` DateTime64(3)
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (guild_id, event_type, created_at);

CREATE TABLE IF NOT EXISTS voice_sessions
(
    `id` UUID,
    `guild_id` String,
    `channel_id` String,
    `user_id` String,
    `joined_at` DateTime64(3),
    `left_at` DateTime64(3),
    `duration_seconds` UInt32
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(joined_at)
ORDER BY (guild_id, user_id, joined_at);