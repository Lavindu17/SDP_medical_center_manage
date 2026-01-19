-- Fix for role detection - Run in Supabase SQL Editor
-- WARNING: This drops and recreates the function AND the dependent RLS policies

-- Step 1: Drop the existing function with CASCADE (this drops dependent policies)
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- Step 2: Create the fixed function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin WHERE id = user_id) THEN
    RETURN 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.doctor WHERE id = user_id) THEN
    RETURN 'doctor';
  ELSIF EXISTS (SELECT 1 FROM public.pharmacist WHERE id = user_id) THEN
    RETURN 'pharmacist';
  ELSIF EXISTS (SELECT 1 FROM public.receptionist WHERE id = user_id) THEN
    RETURN 'receptionist';
  ELSIF EXISTS (SELECT 1 FROM public.lab_assistant WHERE id = user_id) THEN
    RETURN 'lab_assistant';
  ELSIF EXISTS (SELECT 1 FROM public.patient WHERE id = user_id) THEN
    RETURN 'patient';
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- Step 3: Recreate the RLS policies that were dropped

-- Patient Policies
CREATE POLICY "Staff can view all patients" ON patient FOR SELECT USING (
  get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin')
);

-- Doctor Policies
CREATE POLICY "Staff can view all doctors" ON doctor FOR SELECT USING (
  get_user_role(auth.uid()) IN ('patient', 'receptionist', 'admin', 'pharmacist')
);

-- Appointment Policies
CREATE POLICY "Staff can view all appointments" ON appointment FOR SELECT USING (
  get_user_role(auth.uid()) IN ('receptionist', 'admin', 'pharmacist', 'lab_assistant')
);
CREATE POLICY "Staff can manage appointments" ON appointment FOR ALL USING (
  get_user_role(auth.uid()) IN ('receptionist', 'admin')
);

-- Medicine Policies
CREATE POLICY "Staff can view medicines" ON medicine FOR SELECT USING (
  get_user_role(auth.uid()) IN ('doctor', 'pharmacist', 'admin')
);
CREATE POLICY "Pharmacists can manage medicines" ON medicine FOR ALL USING (
  get_user_role(auth.uid()) IN ('pharmacist', 'admin')
);

-- Inventory Policies
CREATE POLICY "Pharmacists can manage inventory" ON inventory FOR ALL USING (
  get_user_role(auth.uid()) IN ('pharmacist', 'admin')
);

-- Prescription Policies
CREATE POLICY "Doctors can manage prescriptions" ON prescription FOR ALL USING (
  get_user_role(auth.uid()) = 'doctor'
);
CREATE POLICY "Staff can view prescriptions" ON prescription FOR SELECT USING (
  get_user_role(auth.uid()) IN ('pharmacist', 'admin', 'receptionist')
);

-- Lab Report Policies
CREATE POLICY "Doctors can manage lab reports" ON lab_report FOR ALL USING (
  get_user_role(auth.uid()) = 'doctor'
);
CREATE POLICY "Lab assistants can manage lab reports" ON lab_report FOR ALL USING (
  get_user_role(auth.uid()) = 'lab_assistant'
);

-- Invoice Policies
CREATE POLICY "Receptionists can manage invoices" ON invoice FOR ALL USING (
  get_user_role(auth.uid()) IN ('receptionist', 'admin')
);

-- Activity Log Policies
CREATE POLICY "Admin can view logs" ON activity_log FOR SELECT USING (
  get_user_role(auth.uid()) = 'admin'
);
