-- Create lesson_completions table to track student progress
CREATE TABLE public.lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- Create activity_completions table
CREATE TABLE public.activity_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER,
  UNIQUE(student_id, activity_id)
);

-- Enable RLS
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for lesson_completions
CREATE POLICY "Students can view their own completions"
ON public.lesson_completions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own completions"
ON public.lesson_completions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view completions in their classrooms"
ON public.lesson_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE classrooms.id = lesson_completions.classroom_id
    AND classrooms.teacher_id = auth.uid()
  )
);

-- RLS policies for activity_completions
CREATE POLICY "Students can view their own activity completions"
ON public.activity_completions FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own activity completions"
ON public.activity_completions FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can view activity completions in their classrooms"
ON public.activity_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE classrooms.id = activity_completions.classroom_id
    AND classrooms.teacher_id = auth.uid()
  )
);