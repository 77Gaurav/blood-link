-- Update handle_new_user function to include role in profiles insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile with role
  INSERT INTO public.profiles (id, full_name, phone, organization_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'organization_name',
    CAST(NEW.raw_user_meta_data->>'role' AS public.user_role)
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CAST(NEW.raw_user_meta_data->>'role' AS public.user_role)
  );
  
  RETURN NEW;
END;
$$;