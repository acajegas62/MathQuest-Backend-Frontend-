-- Add gender field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('Male', 'Female'));

-- Update existing profiles to have a default gender (can be changed later)
UPDATE public.profiles SET gender = 'Male' WHERE gender IS NULL;