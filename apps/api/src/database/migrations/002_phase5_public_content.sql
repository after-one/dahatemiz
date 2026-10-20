DO $$ BEGIN
  CREATE TYPE public_content_report_reason AS ENUM (
    'INACCURATE', 'PERSONAL_DATA', 'DANGEROUS_CONTENT', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public_content_report_status AS ENUM ('OPEN', 'DISMISSED', 'ACTIONED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS public_posts_source_report_uq ON public_posts (source_report_id);

CREATE TABLE IF NOT EXISTS public_content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public_posts(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  reason public_content_report_reason NOT NULL,
  details TEXT CHECK (details IS NULL OR char_length(details) <= 500),
  status public_content_report_status NOT NULL DEFAULT 'OPEN',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS public_content_reports_queue_idx
  ON public_content_reports (status, created_at DESC);
