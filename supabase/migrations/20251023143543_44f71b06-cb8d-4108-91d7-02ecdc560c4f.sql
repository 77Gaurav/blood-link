-- Add volunteer details to participations table
ALTER TABLE public.participations
ADD COLUMN volunteer_name TEXT,
ADD COLUMN age INTEGER,
ADD COLUMN gender TEXT,
ADD COLUMN weight NUMERIC,
ADD COLUMN city TEXT,
ADD COLUMN contact_number TEXT;