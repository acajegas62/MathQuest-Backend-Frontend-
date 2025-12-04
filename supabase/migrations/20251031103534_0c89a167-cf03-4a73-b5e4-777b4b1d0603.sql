-- Add max_attempts column to quizzes table
ALTER TABLE quizzes ADD COLUMN max_attempts integer DEFAULT 5;

-- Add comment for clarity
COMMENT ON COLUMN quizzes.max_attempts IS 'Maximum number of attempts allowed for this quiz (default 5)';