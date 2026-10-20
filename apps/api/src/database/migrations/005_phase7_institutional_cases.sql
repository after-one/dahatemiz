DO $$ BEGIN
  CREATE TYPE organization_member_role AS ENUM ('ORG_ADMIN', 'OFFICER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS context TEXT;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 160),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  city TEXT NOT NULL CHECK (char_length(city) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS organization_memberships (
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role organization_member_role NOT NULL DEFAULT 'OFFICER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  PRIMARY KEY (organization_id, user_id)
);
CREATE INDEX IF NOT EXISTS organization_memberships_user_idx ON organization_memberships (user_id, organization_id);

CREATE TABLE IF NOT EXISTS institution_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  report_id UUID NOT NULL UNIQUE REFERENCES reports(id),
  forwarded_by UUID NOT NULL REFERENCES users(id),
  forwarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  UNIQUE (organization_id, id)
);
CREATE INDEX IF NOT EXISTS institution_cases_org_forwarded_idx ON institution_cases (organization_id, forwarded_at DESC);

CREATE TABLE IF NOT EXISTS institution_case_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES institution_cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS institution_case_notes_case_idx ON institution_case_notes (case_id, created_at);
