-- AI Response Modes: track when patterns were last surfaced to users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_pattern_surfaced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pattern_surface_count INTEGER DEFAULT 0;
