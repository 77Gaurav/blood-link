-- Add new health-related columns to participations table
ALTER TABLE public.participations
ADD COLUMN blood_sugar_level text,
ADD COLUMN type_of_work text,
ADD COLUMN stress_level text CHECK (stress_level IN ('low', 'moderate', 'high')),
ADD COLUMN previous_donation boolean DEFAULT false,
ADD COLUMN major_diseases_history text;

-- Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id uuid NOT NULL,
  hospital_id uuid NOT NULL,
  emergency_post_id uuid,
  appointment_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS policies for appointments
CREATE POLICY "Volunteers can view their own appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = volunteer_id);

CREATE POLICY "Hospitals can view their appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = hospital_id);

CREATE POLICY "Volunteers can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Volunteers can update their own appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = volunteer_id);

CREATE POLICY "Hospitals can update their appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = hospital_id);

-- Add trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();