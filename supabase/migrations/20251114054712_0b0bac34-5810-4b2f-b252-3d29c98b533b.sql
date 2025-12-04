-- Add lock controls to quizzes table
ALTER TABLE quizzes 
ADD COLUMN is_locked boolean DEFAULT false,
ADD COLUMN availability_start timestamp with time zone,
ADD COLUMN availability_end timestamp with time zone,
ADD COLUMN visible_when_locked boolean DEFAULT true;

-- Add lock controls to activities table
ALTER TABLE activities 
ADD COLUMN is_locked boolean DEFAULT false,
ADD COLUMN availability_start timestamp with time zone,
ADD COLUMN availability_end timestamp with time zone,
ADD COLUMN visible_when_locked boolean DEFAULT true;