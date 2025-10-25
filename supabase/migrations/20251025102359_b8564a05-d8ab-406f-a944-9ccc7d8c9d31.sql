-- Create blood inventory table for blood banks
CREATE TABLE public.blood_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blood_bank_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  blood_group public.blood_group NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blood_bank_id, city, blood_group)
);

-- Enable RLS
ALTER TABLE public.blood_inventory ENABLE ROW LEVEL SECURITY;

-- Blood banks can view their own inventory
CREATE POLICY "Blood banks can view own inventory"
ON public.blood_inventory FOR SELECT
USING (auth.uid() = blood_bank_id);

-- Blood banks can insert their own inventory
CREATE POLICY "Blood banks can insert own inventory"
ON public.blood_inventory FOR INSERT
WITH CHECK (auth.uid() = blood_bank_id);

-- Blood banks can update their own inventory
CREATE POLICY "Blood banks can update own inventory"
ON public.blood_inventory FOR UPDATE
USING (auth.uid() = blood_bank_id);

-- Blood banks can delete their own inventory
CREATE POLICY "Blood banks can delete own inventory"
ON public.blood_inventory FOR DELETE
USING (auth.uid() = blood_bank_id);

-- Add updated_at trigger
CREATE TRIGGER update_blood_inventory_updated_at
BEFORE UPDATE ON public.blood_inventory
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();