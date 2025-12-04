-- Create story_progress table for tracking student progress in story mode
CREATE TABLE IF NOT EXISTS public.story_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planet_name text NOT NULL,
  level_number integer NOT NULL,
  stars_earned integer NOT NULL DEFAULT 0,
  badge_unlocked boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, planet_name, level_number)
);

-- Enable RLS
ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;

-- Students can view and insert their own progress
CREATE POLICY "Students can view their own story progress"
ON public.story_progress
FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own story progress"
ON public.story_progress
FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own story progress"
ON public.story_progress
FOR UPDATE
USING (student_id = auth.uid());

-- Teachers can view progress of students in their classrooms
CREATE POLICY "Teachers can view student story progress in their classrooms"
ON public.story_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classroom_members cm
    JOIN classrooms c ON c.id = cm.classroom_id
    WHERE cm.student_id = story_progress.student_id
    AND c.teacher_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_story_progress_student ON public.story_progress(student_id);
CREATE INDEX idx_story_progress_planet ON public.story_progress(planet_name);