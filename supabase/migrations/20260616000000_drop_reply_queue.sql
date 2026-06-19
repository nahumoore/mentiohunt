-- Drop reply queue tables (order respects FK constraints)
DROP TABLE IF EXISTS reply_queue_items;
DROP TABLE IF EXISTS reply_queue_runs;
DROP TABLE IF EXISTS reply_queue_configs;

-- Drop enum no longer referenced by any table
DROP TYPE IF EXISTS reply_queue_platform;
