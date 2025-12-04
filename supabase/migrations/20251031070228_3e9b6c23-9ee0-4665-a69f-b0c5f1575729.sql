-- Create app_role enum for security
CREATE TYPE public.app_role AS ENUM ('teacher', 'student', 'admin');

-- Create user_roles table (secure role management)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update profiles table structure
ALTER TABLE public.profiles DROP COLUMN IF EXISTS full_name;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add cover image to classrooms
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT NOT NULL, -- 'game', 'story', 'challenge'
  content JSONB,
  xp_reward INTEGER DEFAULT 20,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create student_scores table (class record system)
CREATE TABLE IF NOT EXISTS public.student_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'quiz', 'activity', 'assignment'
  activity_id UUID NOT NULL,
  activity_title TEXT NOT NULL,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  percentage NUMERIC(5,2) GENERATED ALWAYS AS (CASE WHEN max_score > 0 THEN (score::NUMERIC / max_score::NUMERIC) * 100 ELSE 0 END) STORED,
  date_submitted TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_scores ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for classroom covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('classroom-covers', 'classroom-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can manage roles"
ON public.user_roles FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for activities
CREATE POLICY "Teachers can manage activities in their classrooms"
ON public.activities FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE classrooms.id = activities.classroom_id
    AND classrooms.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view activities in their classrooms"
ON public.activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_members
    WHERE classroom_members.classroom_id = activities.classroom_id
    AND classroom_members.student_id = auth.uid()
  )
);

-- RLS Policies for student_scores
CREATE POLICY "Teachers can view all scores in their classrooms"
ON public.student_scores FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE classrooms.id = student_scores.classroom_id
    AND classrooms.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own scores"
ON public.student_scores FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "System can insert scores"
ON public.student_scores FOR INSERT
WITH CHECK (true);

CREATE POLICY "Teachers can update scores in their classrooms"
ON public.student_scores FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE classrooms.id = student_scores.classroom_id
    AND classrooms.teacher_id = auth.uid()
  )
);

-- Storage policies for classroom covers
CREATE POLICY "Anyone can view classroom covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'classroom-covers');

CREATE POLICY "Teachers can upload classroom covers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'classroom-covers' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Teachers can update their classroom covers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'classroom-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can delete their classroom covers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'classroom-covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Update handle_new_user function to use first_name, last_name and create role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, first_name, last_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for activities updated_at
CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();