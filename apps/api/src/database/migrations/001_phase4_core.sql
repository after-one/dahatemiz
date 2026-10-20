CREATE EXTENSION IF NOT EXISTS postgis;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CITIZEN', 'MODERATOR', 'AUTHORITY_OFFICIAL', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE incident_category AS ENUM (
    'LITTERING', 'CIGARETTE_BUTTS', 'ILLEGAL_DUMPING', 'CONSTRUCTION_DEBRIS',
    'VEHICLE_DISCHARGE', 'OVERFLOWING_WASTE', 'WATER_POLLUTION', 'AIR_POLLUTION', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'FORWARDED_TO_AUTHORITY', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'REJECTED', 'WITHDRAWN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  role user_role NOT NULL DEFAULT 'CITIZEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  category incident_category NOT NULL,
  status report_status NOT NULL DEFAULT 'SUBMITTED',
  description TEXT,
  precise_location GEOGRAPHY(POINT, 4326) NOT NULL,
  district TEXT,
  city TEXT NOT NULL DEFAULT 'Bilinmiyor',
  privacy_consent_given BOOLEAN NOT NULL CHECK (privacy_consent_given = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS reports_reporter_created_idx ON reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_created_idx ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_precise_location_idx ON reports USING GIST (precise_location);

CREATE TABLE IF NOT EXISTS media_upload_intents (
  upload_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  object_key TEXT NOT NULL UNIQUE,
  media_type media_type NOT NULL,
  mime_type TEXT NOT NULL,
  max_file_size_bytes BIGINT NOT NULL CHECK (max_file_size_bytes > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL UNIQUE REFERENCES media_upload_intents(upload_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  status report_status NOT NULL,
  public_message TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS report_status_events_report_idx ON report_status_events (report_id, created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs (resource_type, resource_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_report_id UUID NOT NULL REFERENCES reports(id),
  category incident_category NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  derivative_object_key TEXT,
  approximate_location GEOGRAPHY(POINT, 4326),
  approved_by UUID NOT NULL REFERENCES users(id),
  approved_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (derivative_object_key IS NULL OR derivative_object_key NOT LIKE 'evidence/%')
);
CREATE INDEX IF NOT EXISTS public_posts_published_idx ON public_posts (published_at DESC) WHERE published_at IS NOT NULL;
