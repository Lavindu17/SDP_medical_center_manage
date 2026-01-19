// Database Types for IMMS (Integrated Medical Management System)
// Auto-derived from database schema

export type UserRole =
    | 'patient'
    | 'doctor'
    | 'pharmacist'
    | 'receptionist'
    | 'lab_assistant'
    | 'admin';

export type RelationshipType = 'Parent' | 'Child' | 'Spouse' | 'Guardian';
export type RelationshipStatus = 'Pending' | 'Approved' | 'Rejected';

export type AppointmentStatus =
    | 'Booked'
    | 'Arrived'
    | 'In_Consultation'
    | 'Pharmacy'
    | 'Lab'
    | 'Completed'
    | 'Cancelled'
    | 'Absent';

export type NotificationType = 'Appointment' | 'LabResult' | 'System';
export type LabReportStatus = 'Requested' | 'Processing' | 'Completed';
export type PaymentMethod = 'Cash' | 'Card';
export type PaymentStatus = 'Pending' | 'Paid';

// ============================================================================
// User Administration Module
// ============================================================================

export interface Patient {
    id: string;
    first_name: string;
    last_name: string | null;
    dob: string | null;
    contact_number: string | null;
    email: string | null;
    address: string | null;
    created_at: string;
    updated_at: string;
}

export interface Doctor {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    specialization: string | null;
    slmc_reg_number: string | null;
    consultation_fee: number;
    contact_number: string | null;
    created_at: string;
    updated_at: string;
}

export interface Pharmacist {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    license_number: string | null;
    contact_number: string | null;
    created_at: string;
    updated_at: string;
}

export interface Receptionist {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    desk_id: string | null;
    contact_number: string | null;
    created_at: string;
    updated_at: string;
}

export interface LabAssistant {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    contact_number: string | null;
    created_at: string;
    updated_at: string;
}

export interface Admin {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    contact_number: string | null;
    created_at: string;
    updated_at: string;
}

export interface PatientRelationship {
    id: number;
    requester_id: string;
    target_id: string;
    relationship: RelationshipType;
    status: RelationshipStatus;
    approved_by: string | null;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// Clinical Operations Module
// ============================================================================

export interface Appointment {
    id: number;
    patient_id: string;
    doctor_id: string;
    date: string;
    time_slot: string | null;
    status: AppointmentStatus;
    doctor_notes: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    patient?: Patient;
    doctor?: Doctor;
}

export interface AppointmentQueue {
    id: number;
    appointment_id: number;
    queue_number: number;
    is_active: boolean;
    queue_date: string;
    created_at: string;
}

export interface Notification {
    id: number;
    user_id: string;
    message: string;
    type: NotificationType;
    is_read: boolean;
    created_at: string;
}

// ============================================================================
// Pharmacy & Inventory Module
// ============================================================================

export interface Medicine {
    id: number;
    brand_name: string;
    generic_name: string | null;
    manufacturer: string | null;
    default_dosage: string | null;
    default_frequency: string | null;
    unit: string;
    created_at: string;
    updated_at: string;
}

export interface Inventory {
    id: number;
    medicine_id: number;
    batch_number: string | null;
    expiry_date: string | null;
    stock_level: number;
    unit_price: number;
    created_at: string;
    updated_at: string;
    // Joined fields
    medicine?: Medicine;
}

export interface Prescription {
    id: number;
    appointment_id: number;
    doctor_id: string;
    notes: string | null;
    created_at: string;
    // Joined fields
    items?: PrescriptionItem[];
    doctor?: Doctor;
}

export interface PrescriptionItem {
    id: number;
    prescription_id: number;
    medicine_id: number;
    dosage: string | null;
    frequency: string | null;
    duration_days: number;
    quantity: number;
    notes: string | null;
    created_at: string;
    // Joined fields
    medicine?: Medicine;
}

export interface Dispensing {
    id: number;
    prescription_id: number;
    pharmacist_id: string;
    status: string;
    dispensed_at: string | null;
    created_at: string;
    // Joined fields
    items?: DispensingItem[];
    pharmacist?: Pharmacist;
}

export interface DispensingItem {
    id: number;
    dispensing_id: number;
    prescription_item_id: number | null;
    inventory_id: number | null;
    quantity_issued: number;
    price_at_issue: number;
    created_at: string;
}

// ============================================================================
// Laboratory Module
// ============================================================================

export interface LabTestType {
    id: number;
    name: string;
    description: string | null;
    price: number;
    created_at: string;
    updated_at: string;
}

export interface LabReport {
    id: number;
    appointment_id: number;
    lab_test_type_id: number | null;
    test_name: string;
    status: LabReportStatus;
    price: number;
    requested_by: string | null;
    processed_by: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    files?: LabReportFile[];
}

export interface LabReportFile {
    id: number;
    lab_report_id: number;
    file_url: string;
    file_type: string | null;
    file_name: string | null;
    uploaded_by: string | null;
    created_at: string;
}

// ============================================================================
// Financial Module
// ============================================================================

export interface Invoice {
    id: number;
    appointment_id: number;
    total_amount: number;
    payment_method: PaymentMethod | null;
    payment_status: PaymentStatus;
    issued_by: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
    // Joined fields
    items?: InvoiceItem[];
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    description: string;
    amount: number;
    source_type: string | null;
    source_ref: string | null;
    created_at: string;
}

// ============================================================================
// System
// ============================================================================

export interface ActivityLog {
    id: number;
    user_id: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: Record<string, unknown> | null;
    ip_address: string | null;
    created_at: string;
}

// ============================================================================
// User with Role (for auth)
// ============================================================================

export interface UserWithRole {
    id: string;
    email: string;
    role: UserRole;
    profile: Patient | Doctor | Pharmacist | Receptionist | LabAssistant | Admin;
}
