-- Track which step of the onboarding email sequence has been sent
-- 0 = none sent, 1 = welcome sent, 2 = day-2 sent, 3 = day-3 sent
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_sequence_step integer NOT NULL DEFAULT 0;
