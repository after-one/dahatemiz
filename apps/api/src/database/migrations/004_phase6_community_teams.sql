CREATE TABLE IF NOT EXISTS community_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 64),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 3 AND 500),
  city TEXT NOT NULL CHECK (char_length(city) BETWEEN 1 AND 120),
  district TEXT CHECK (district IS NULL OR char_length(district) <= 120),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city, district, name)
);
CREATE INDEX IF NOT EXISTS community_teams_discovery_idx ON community_teams (city, district, name);

CREATE TABLE IF NOT EXISTS community_team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES community_teams(id),
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);
CREATE INDEX IF NOT EXISTS community_team_memberships_user_idx
  ON community_team_memberships (user_id, joined_at DESC);
