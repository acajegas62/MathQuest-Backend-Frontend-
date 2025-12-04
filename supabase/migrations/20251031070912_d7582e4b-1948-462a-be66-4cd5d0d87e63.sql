-- Add foreign key relationship between student_scores and profiles
ALTER TABLE public.student_scores
ADD CONSTRAINT student_scores_student_id_profiles_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;