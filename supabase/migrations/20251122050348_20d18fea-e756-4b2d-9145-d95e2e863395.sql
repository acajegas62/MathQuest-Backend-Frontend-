-- Create table to track where content was shared to
CREATE TABLE IF NOT EXISTS public.shared_content_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_content_id UUID NOT NULL REFERENCES public.shared_content(id) ON DELETE CASCADE,
  destination_classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_content_destinations ENABLE ROW LEVEL SECURITY;

-- Teachers can view destinations for content they shared
CREATE POLICY "Teachers can view their shared content destinations"
  ON public.shared_content_destinations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_content sc
      WHERE sc.id = shared_content_destinations.shared_content_id
      AND sc.shared_by = auth.uid()
    )
  );

-- System can insert destinations
CREATE POLICY "System can insert destinations"
  ON public.shared_content_destinations
  FOR INSERT
  WITH CHECK (true);

-- Create index for better query performance
CREATE INDEX idx_shared_content_destinations_shared_content_id 
  ON public.shared_content_destinations(shared_content_id);

CREATE INDEX idx_shared_content_destinations_classroom_id 
  ON public.shared_content_destinations(destination_classroom_id);