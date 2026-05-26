-- Annual profections: prevent duplicate birthday readings
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_birthday_reading_sent DATE;
