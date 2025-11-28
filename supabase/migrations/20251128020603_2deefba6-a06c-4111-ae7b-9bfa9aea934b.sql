-- Add health information fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS blood_sugar_level text,
ADD COLUMN IF NOT EXISTS major_diseases_history text,
ADD COLUMN IF NOT EXISTS type_of_work text,
ADD COLUMN IF NOT EXISTS stress_level text,
ADD COLUMN IF NOT EXISTS previous_donation boolean DEFAULT false;