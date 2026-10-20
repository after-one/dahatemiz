DO $$ BEGIN
  CREATE TYPE community_event_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE xp_reason AS ENUM ('VERIFIED_COMMUNITY_ATTENDANCE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE in_app_notification_type AS ENUM ('COMMUNITY_ATTENDANCE_VERIFIED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS leaderboard_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 3 AND 1000),
  city TEXT NOT NULL CHECK (char_length(city) BETWEEN 1 AND 120),
  district TEXT CHECK (district IS NULL OR char_length(district) <= 120),
  starts_at TIMESTAMPTZ NOT NULL,
  status community_event_status NOT NULL DEFAULT 'SCHEDULED',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS community_events_discovery_idx
  ON community_events (status, city, starts_at);

CREATE TABLE IF NOT EXISTS community_event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'RSVP' CHECK (status IN ('RSVP', 'CHECKED_IN', 'CANCELLED')),
  checked_in_by UUID REFERENCES users(id),
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id),
  CHECK (
    (status = 'CHECKED_IN' AND checked_in_by IS NOT NULL AND checked_in_at IS NOT NULL)
    OR (status <> 'CHECKED_IN' AND checked_in_by IS NULL AND checked_in_at IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS community_event_participants_user_idx
  ON community_event_participants (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  reason xp_reason NOT NULL,
  points INTEGER NOT NULL CHECK (points > 0 AND points <= 100),
  source_type TEXT NOT NULL CHECK (source_type = 'COMMUNITY_EVENT'),
  source_id UUID NOT NULL REFERENCES community_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source_type, source_id)
);
CREATE INDEX IF NOT EXISTS xp_events_user_idx ON xp_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type in_app_notification_type NOT NULL,
  event_id UUID NOT NULL REFERENCES community_events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE (user_id, type, event_id)
);
CREATE INDEX IF NOT EXISTS in_app_notifications_unread_idx
  ON in_app_notifications (user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS engagement_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
