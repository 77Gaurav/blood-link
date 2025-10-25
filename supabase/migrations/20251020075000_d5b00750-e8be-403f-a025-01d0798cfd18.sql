-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('hospital', 'blood_bank', 'volunteer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL,
  phone TEXT,
  location TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blood groups enum
CREATE TYPE public.blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');

-- Create emergency posts table
CREATE TABLE public.emergency_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blood_group public.blood_group NOT NULL,
  quantity INTEGER NOT NULL,
  location TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('critical', 'urgent', 'moderate')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participation table
CREATE TABLE public.participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID REFERENCES public.emergency_posts(id) ON DELETE CASCADE NOT NULL,
  volunteer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for emergency posts
CREATE POLICY "Anyone can view active emergency posts"
  ON public.emergency_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.emergency_posts FOR INSERT
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Users can update own posts"
  ON public.emergency_posts FOR UPDATE
  USING (auth.uid() = posted_by);

CREATE POLICY "Users can delete own posts"
  ON public.emergency_posts FOR DELETE
  USING (auth.uid() = posted_by);

-- RLS Policies for participations
CREATE POLICY "Anyone can view participations"
  ON public.participations FOR SELECT
  USING (true);

CREATE POLICY "Volunteers can create participations"
  ON public.participations FOR INSERT
  WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Volunteers can update own participations"
  ON public.participations FOR UPDATE
  USING (auth.uid() = volunteer_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.emergency_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, organization_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CAST(NEW.raw_user_meta_data->>'role' AS public.user_role),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'organization_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();