-- Allow hospitals to view all blood bank inventories (for checking availability)
-- This is safe because it's just inventory data (city, blood group, quantity), not personal info
CREATE POLICY "Hospitals can view all inventories"
ON public.blood_inventory FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'hospital'
  )
);