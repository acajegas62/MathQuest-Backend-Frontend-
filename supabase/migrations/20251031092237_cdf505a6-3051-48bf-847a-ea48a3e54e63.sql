-- Fix the student classroom viewing policy (it had a bug)
DROP POLICY IF EXISTS "Students can view their classrooms" ON classrooms;

-- Allow anyone to view classrooms by code (needed for joining)
CREATE POLICY "Anyone can view classrooms by code"
ON classrooms
FOR SELECT
USING (true);

-- Update the quizzes table to add deadline
ALTER TABLE quizzes
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;