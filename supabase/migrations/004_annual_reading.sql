-- Annual reading: cache the AI-generated year narrative per profection cycle.
-- profection_reading_house tracks which house the reading was generated for,
-- so it can be invalidated automatically when the user's birthday arrives.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profection_reading       TEXT,
  ADD COLUMN IF NOT EXISTS profection_reading_house INTEGER;
