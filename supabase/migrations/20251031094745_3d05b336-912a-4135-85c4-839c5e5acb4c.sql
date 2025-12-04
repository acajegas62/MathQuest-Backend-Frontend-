-- Create storage bucket for lesson files
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-files', 'lesson-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for lesson files
CREATE POLICY "Anyone can view lesson files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-files');

CREATE POLICY "Teachers can upload lesson files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-files' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Teachers can update their lesson files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'lesson-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete their lesson files"
ON storage.objects FOR DELETE
USING (bucket_id = 'lesson-files' AND auth.uid() IS NOT NULL);

-- Add file_url column to lessons table if not exists
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_url text;

-- Create shared_content table for sharing lessons, activities, and quizzes
CREATE TABLE IF NOT EXISTS shared_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('lesson', 'activity', 'quiz')),
  content_id uuid NOT NULL,
  source_classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on shared_content
ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_content
CREATE POLICY "Teachers can view shared content"
ON shared_content FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM classrooms
    WHERE classrooms.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can share their content"
ON shared_content FOR INSERT
WITH CHECK (
  shared_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM classrooms
    WHERE classrooms.id = shared_content.source_classroom_id
    AND classrooms.teacher_id = auth.uid()
  )
);