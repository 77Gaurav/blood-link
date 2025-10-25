-- Update urgency_level check constraint to match form values
ALTER TABLE public.emergency_posts 
DROP CONSTRAINT IF EXISTS emergency_posts_urgency_level_check;

ALTER TABLE public.emergency_posts 
ADD CONSTRAINT emergency_posts_urgency_level_check 
CHECK (urgency_level IN ('critical', 'high', 'medium', 'low'));