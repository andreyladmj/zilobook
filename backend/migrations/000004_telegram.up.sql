-- Phase 3: Telegram notifications — account linking + scheduled reminder delivery

-- A user's linked Telegram chat. One chat per user.
CREATE TABLE IF NOT EXISTS telegram_accounts (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- One-time codes for the t.me/<bot>?start=<code> deep-link flow.
CREATE TABLE IF NOT EXISTS telegram_link_codes (
    code TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_codes_user ON telegram_link_codes(user_id);

-- Extend the notifications log into a dispatch queue.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0;

-- Dispatcher polls pending rows whose scheduled_for has passed.
CREATE INDEX IF NOT EXISTS idx_notifications_dispatch ON notifications(status, scheduled_for);
