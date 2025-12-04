-- Add lock control fields to lessons table
ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS availability_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS availability_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS visible_when_locked BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.lessons.availability_start IS 'When the lesson becomes accessible to students';
COMMENT ON COLUMN public.lessons.availability_end IS 'When the lesson access expires (optional)';
COMMENT ON COLUMN public.lessons.is_locked IS 'If true, lesson is locked until availability_start';
COMMENT ON COLUMN public.lessons.visible_when_locked IS 'If true, show lesson as locked instead of hiding it';

-- Create storage bucket for lesson images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-images', 'lesson-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for lesson-images bucket
CREATE POLICY "Anyone can view lesson images"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-images');

CREATE POLICY "Teachers can upload lesson images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-images' AND
  auth.uid() IN (
    SELECT teacher_id FROM classrooms
  )
);

CREATE POLICY "Teachers can update their lesson images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-images' AND
  auth.uid() IN (
    SELECT teacher_id FROM classrooms
  )
);

CREATE POLICY "Teachers can delete their lesson images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-images' AND
  auth.uid() IN (
    SELECT teacher_id FROM classrooms
  )
);