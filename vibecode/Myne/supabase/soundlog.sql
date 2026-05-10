-- Run this in Supabase Dashboard → SQL Editor (after schema.sql)
-- Stores public Spotify share data so friends can find each other by code.

CREATE TABLE IF NOT EXISTS public.spotify_shares (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  share_code   text        NOT NULL,
  display_name text,
  top_artists  jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id),
  UNIQUE (share_code)
);

ALTER TABLE public.spotify_shares ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed to look up friends by code)
CREATE POLICY "public_read_shares" ON public.spotify_shares
  FOR SELECT USING (true);

-- Only the owner can insert/update/delete their own row
CREATE POLICY "owner_write_shares" ON public.spotify_shares
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
