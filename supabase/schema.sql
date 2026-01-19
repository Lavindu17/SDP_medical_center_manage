-- ============================================================================
-- IMMS Database Schema (Integrated Medical Management System)
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE relationship_type AS ENUM ('Parent', 'Child', 'Spouse', 'Guardian');
CREATE TYPE relationship_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE appointment_status AS ENUM (
  'Booked', 
  'Arrived', 
  'In_Consultation', 
  'Pharmacy', 
  'Lab', 
  'Completed', 
  'Cancelled',
  'Absent'
);
CREATE TYPE notification_type AS ENUM ('Appointment', 'LabResult', 'System');
CREATE TYPE lab_report_status AS ENUM ('Requested', 'Processing', 'Completed');
CREATE TYPE payment_method AS ENUM ('Cash', 'Card');
CREATE TYPE payment_status AS ENUM ('Pending', 'Paid');
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'pharmacist', 'receptionist', 'lab_assistant', 'admin');

-- ============================================================================
-- A. USER ADMINISTRATION MODULE
-- ============================================================================

-- 1. Patient Profile
CREATE TABLE patient (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  dob DATE,
  contact_number TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctor Profile
CREATE TABLE doctor (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  specialization TEXT,
  slmc_reg_number TEXT,
  consultation_fee DECIMAL(10, 2) DEFAULT 0,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pharmacist Profile
CREATE TABLE pharmacist (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  license_number TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Receptionist Profile
CREATE TABLE receptionist (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  desk_id TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Lab Assistant Profile
CREATE TABLE lab_assistant (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Admin Profile
CREATE TABLE admin (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  contact_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Patient Relationships (Family Linking)
CREATE TABLE patient_relationships (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  status relationship_status DEFAULT 'Pending',
  approved_by UUID REFERENCES receptionist(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_relationship UNIQUE (requester_id, target_id)
);

-- ============================================================================
-- B. CLINICAL OPERATIONS MODULE
-- ============================================================================

-- 8. Appointment
CREATE TABLE appointment (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctor(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TIME,
  status appointment_status DEFAULT 'Booked',
  doctor_notes TEXT, -- Private notes visible only to doctors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Appointment Queue (Daily Queue Numbers)
CREATE TABLE appointment_queue (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
  queue_number INT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  queue_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_queue_per_day UNIQUE (queue_number, queue_date, appointment_id)
);

-- 10. Notification
CREATE TABLE notification (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'System',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- C. PHARMACY & INVENTORY MODULE
-- ============================================================================

-- 11. Medicine Catalog
CREATE TABLE medicine (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brand_name TEXT NOT NULL,
  generic_name TEXT,
  manufacturer TEXT,
  default_dosage TEXT,
  default_frequency TEXT, -- e.g., "1-0-1" (morning-afternoon-night)
  unit TEXT DEFAULT 'tablets', -- tablets, capsules, ml, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Inventory (Stock Management)
CREATE TABLE inventory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medicine_id BIGINT NOT NULL REFERENCES medicine(id) ON DELETE CASCADE,
  batch_number TEXT,
  expiry_date DATE,
  stock_level INT DEFAULT 0,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Prescription (Doctor's Order)
CREATE TABLE prescription (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctor(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Prescription Item (Individual Medicines)
CREATE TABLE prescription_item (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prescription_id BIGINT NOT NULL REFERENCES prescription(id) ON DELETE CASCADE,
  medicine_id BIGINT NOT NULL REFERENCES medicine(id) ON DELETE CASCADE,
  dosage TEXT, -- e.g., "5mg", "10ml"
  frequency TEXT, -- e.g., "1-0-1"
  duration_days INT DEFAULT 0,
  quantity INT DEFAULT 0, -- Auto-calculated or doctor-specified
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Dispensing (Pharmacist's Action)
CREATE TABLE dispensing (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prescription_id BIGINT NOT NULL REFERENCES prescription(id) ON DELETE CASCADE,
  pharmacist_id UUID NOT NULL REFERENCES pharmacist(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending', -- Pending, Issued
  dispensed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Dispensing Item (Actual Dispensed Medicines)
CREATE TABLE dispensing_item (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  dispensing_id BIGINT NOT NULL REFERENCES dispensing(id) ON DELETE CASCADE,
  prescription_item_id BIGINT REFERENCES prescription_item(id) ON DELETE CASCADE,
  inventory_id BIGINT REFERENCES inventory(id) ON DELETE SET NULL,
  quantity_issued INT DEFAULT 0,
  price_at_issue DECIMAL(10, 2) DEFAULT 0, -- Frozen price at time of sale
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- D. LABORATORY MODULE
-- ============================================================================

-- 17. Lab Test Types (Catalog)
CREATE TABLE lab_test_type (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Lab Report (Test Request)
CREATE TABLE lab_report (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
  lab_test_type_id BIGINT REFERENCES lab_test_type(id) ON DELETE SET NULL,
  test_name TEXT NOT NULL,
  status lab_report_status DEFAULT 'Requested',
  price DECIMAL(10, 2) DEFAULT 0,
  requested_by UUID REFERENCES doctor(id),
  processed_by UUID REFERENCES lab_assistant(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Lab Report File (Uploaded Results)
CREATE TABLE lab_report_file (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lab_report_id BIGINT NOT NULL REFERENCES lab_report(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT, -- 'PDF', 'JPG', 'PNG'
  file_name TEXT,
  uploaded_by UUID REFERENCES lab_assistant(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- E. FINANCIAL MODULE
-- ============================================================================

-- 20. Invoice (Master Bill)
CREATE TABLE invoice (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointment(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method payment_method,
  payment_status payment_status DEFAULT 'Pending',
  issued_by UUID REFERENCES receptionist(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Invoice Item (Bill Line Items)
CREATE TABLE invoice_item (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  source_type TEXT, -- 'doctor_fee', 'medicine', 'lab_test', 'service'
  source_ref TEXT, -- e.g., "dispensing_item:54"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- F. SYSTEM LOGS (ADMIN)
-- ============================================================================

-- 22. System Activity Log
CREATE TABLE activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_appointment_patient ON appointment(patient_id);
CREATE INDEX idx_appointment_doctor ON appointment(doctor_id);
CREATE INDEX idx_appointment_date ON appointment(date);
CREATE INDEX idx_appointment_status ON appointment(status);
CREATE INDEX idx_prescription_appointment ON prescription(appointment_id);
CREATE INDEX idx_prescription_item_prescription ON prescription_item(prescription_id);
CREATE INDEX idx_lab_report_appointment ON lab_report(appointment_id);
CREATE INDEX idx_invoice_appointment ON invoice(appointment_id);
CREATE INDEX idx_notification_user ON notification(user_id);
CREATE INDEX idx_inventory_medicine ON inventory(medicine_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_patient_updated_at BEFORE UPDATE ON patient FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctor_updated_at BEFORE UPDATE ON doctor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacist_updated_at BEFORE UPDATE ON pharmacist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receptionist_updated_at BEFORE UPDATE ON receptionist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_assistant_updated_at BEFORE UPDATE ON lab_assistant FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON admin FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointment_updated_at BEFORE UPDATE ON appointment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicine_updated_at BEFORE UPDATE ON medicine FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lab_report_updated_at BEFORE UPDATE ON lab_report FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON invoice FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE patient ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptionist ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_assistant ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispensing_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_report_file ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check User Role
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
  role_found user_role;
BEGIN
  IF EXISTS (SELECT 1 FROM admin WHERE id = user_id) THEN
    RETURN 'admin'::user_role;
  ELSIF EXISTS (SELECT 1 FROM doctor WHERE id = user_id) THEN
    RETURN 'doctor'::user_role;
  ELSIF EXISTS (SELECT 1 FROM pharmacist WHERE id = user_id) THEN
    RETURN 'pharmacist'::user_role;
  ELSIF EXISTS (SELECT 1 FROM receptionist WHERE id = user_id) THEN
    RETURN 'receptionist'::user_role;
  ELSIF EXISTS (SELECT 1 FROM lab_assistant WHERE id = user_id) THEN
    RETURN 'lab_assistant'::user_role;
  ELSIF EXISTS (SELECT 1 FROM patient WHERE id = user_id) THEN
    RETURN 'patient'::user_role;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Patient Policies
CREATE POLICY "Patients can view own profile" ON patient FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Patients can update own profile" ON patient FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can view all patients" ON patient FOR SELECT USING (
  get_user_role(auth.uid()) IN ('doctor', 'receptionist', 'admin')
);

-- Doctor Policies
CREATE POLICY "Doctors can view own profile" ON doctor FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Doctors can update own profile" ON doctor FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Staff can view all doctors" ON doctor FOR SELECT USING (
  get_user_role(auth.uid()) IN ('patient', 'receptionist', 'admin', 'pharmacist')
);

-- Appointment Policies
CREATE POLICY "Patients can view own appointments" ON appointment FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "Doctors can view their appointments" ON appointment FOR SELECT USING (doctor_id = auth.uid());
CREATE POLICY "Doctors can update their appointments" ON appointment FOR UPDATE USING (doctor_id = auth.uid());
CREATE POLICY "Staff can view all appointments" ON appointment FOR SELECT USING (
  get_user_role(auth.uid()) IN ('receptionist', 'admin', 'pharmacist', 'lab_assistant')
);
CREATE POLICY "Staff can manage appointments" ON appointment FOR ALL USING (
  get_user_role(auth.uid()) IN ('receptionist', 'admin')
);

-- Notification Policies
CREATE POLICY "Users can view own notifications" ON notification FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notification FOR UPDATE USING (user_id = auth.uid());

-- Medicine Policies (Read by all staff)
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
CREATE POLICY "Patients can view own prescriptions" ON prescription FOR SELECT USING (
  appointment_id IN (SELECT id FROM appointment WHERE patient_id = auth.uid())
);
CREATE POLICY "Doctors can manage prescriptions" ON prescription FOR ALL USING (
  get_user_role(auth.uid()) = 'doctor'
);
CREATE POLICY "Staff can view prescriptions" ON prescription FOR SELECT USING (
  get_user_role(auth.uid()) IN ('pharmacist', 'admin', 'receptionist')
);

-- Lab Report Policies
CREATE POLICY "Patients can view own lab reports" ON lab_report FOR SELECT USING (
  appointment_id IN (SELECT id FROM appointment WHERE patient_id = auth.uid())
);
CREATE POLICY "Doctors can manage lab reports" ON lab_report FOR ALL USING (
  get_user_role(auth.uid()) = 'doctor'
);
CREATE POLICY "Lab assistants can manage lab reports" ON lab_report FOR ALL USING (
  get_user_role(auth.uid()) = 'lab_assistant'
);

-- Invoice Policies
CREATE POLICY "Patients can view own invoices" ON invoice FOR SELECT USING (
  appointment_id IN (SELECT id FROM appointment WHERE patient_id = auth.uid())
);
CREATE POLICY "Receptionists can manage invoices" ON invoice FOR ALL USING (
  get_user_role(auth.uid()) IN ('receptionist', 'admin')
);

-- Activity Log Policies (Admin Only)
CREATE POLICY "Admin can view logs" ON activity_log FOR SELECT USING (
  get_user_role(auth.uid()) = 'admin'
);
