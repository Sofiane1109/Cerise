-- Run this once in: Supabase Dashboard → SQL Editor → New query

-- Single table storing all app data as JSONB rows keyed by localStorage key.
-- This mirrors the localStorage structure and requires no schema changes when new features are added.

CREATE TABLE IF NOT EXISTS public.user_data (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  key         text        NOT NULL,
  value       jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

-- Row Level Security: each user can only read and write their own rows.
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON public.user_data
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
