"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface DoctorQueueItem {
    id: string; // appointment id
    patient_id: string;
    patient_name: string;
    queue_number: number;
    time_slot: string;
    status: string;
    reason?: string;
    type: string; // "New" or "Follow-up" (inferred)
}

/**
 * Get today's appointment queue for the logged-in doctor
 */
export async function getDoctorQueue() {
    const user = await getAuthUser();
    if (!user || user.role !== "doctor") return { error: "Unauthorized" };

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
        .from("appointment")
        .select(`
      id,
      patient_id,
      queue_number,
      time_slot,
      status,
      notes,
      patient:patient_id (first_name, last_name)
    `)
        .eq("doctor_id", user.id)
        .eq("date", today)
        .order("queue_number", { ascending: true });

    if (error) {
        console.error("Queue fetch error:", error);
        return [];
    }

    // Transform data safely
    return (data as any[]).map(item => ({
        id: item.id,
        patient_id: item.patient_id,
        patient_name: `${item.patient?.first_name} ${item.patient?.last_name}`,
        queue_number: item.queue_number,
        time_slot: item.time_slot,
        status: item.status,
        reason: item.notes,
        type: "Regular" // Placeholder logic
    }));
}

/**
 * Get patient history for consultation view
 */
export async function getPatientHistory(patientId: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "doctor") return null;
    const supabase = await createClient();

    // 1. Get Demographics
    const { data: profile } = await supabase
        .from("patient")
        .select("*")
        .eq("id", patientId)
        .single();

    // 2. Get Past Appointments (Visit History)
    const { data: visits } = await supabase
        .from("appointment")
        .select(`
      id,
      date,
      status,
      doctor:doctor_id (first_name, last_name, specialization),
      doctor_notes
    `)
        .eq("patient_id", patientId)
        .neq("status", "Booked") // Only show past/active interactions
        .order("date", { ascending: false })
        .limit(10);

    // 3. Get Past Prescriptions
    // This is a bit complex due to the join structure, simplified here
    const { data: prescriptions } = await supabase
        .from("prescription")
        .select(`
      id,
      created_at,
      doctor:doctor_id (first_name, last_name),
      items:prescription_item (
        medicine:medicine_id (brand_name),
        dosage,
        frequency
      )
    `)
        // We need to filter by patient via appointment, but supabase-js recursive query
        // constraints might make this tricky. 
        // Alternative: Filter in application layer if volume is low, or use specific RPC.
        // For now, let's assume we can fetch all and filter by the ones linked to this patient's appointments
        // Actually, simpler: fetch appointments for this patient, then prescriptions for those appointments.
        .order("created_at", { ascending: false });

    // NOTE: The above query fetches ALL prescriptions. 
    // Correct way with RLS + Foreign Key filtering:
    // .eq("appointment.patient_id", patientId) -- Requires inner join syntax

    // Let's use a more direct approach: fetch appointments first, then their prescriptions.
    // Or rely on the "Patients can view own prescriptions" logic but we are a doctor.
    // "Doctors can manage prescriptions" allows ALL access for now (simpler RLS in schema.sql for doctors).

    // Refined query for prescriptions specific to this patient:
    const { data: patientPrescriptions } = await supabase
        .from("prescription")
        .select(`
      id,
      created_at,
      doctor:doctor_id (first_name, last_name),
      appointment!inner(patient_id)
    `)
        .eq("appointment.patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(5);

    return {
        profile,
        visits,
        prescriptions: patientPrescriptions
    };
}

/**
 * Update Appointment Status (e.g. "In_Consultation", "Completed")
 */
export async function updateAppointmentStatus(appointmentId: string, status: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "doctor") return { error: "Unauthorized" };
    const supabase = await createClient();

    const { error } = await supabase
        .from("appointment")
        .update({ status: status })
        .eq("id", appointmentId)
        .eq("doctor_id", user.id); // Security check

    if (error) return { error: error.message };

    revalidatePath("/doctor");
    return { success: true };
}

/**
 * Search Medicines for Prescription
 */
export async function searchMedicines(query: string) {
    const supabase = await createClient();

    const { data } = await supabase
        .from("medicine")
        .select("id, brand_name, generic_name, default_dosage, default_frequency, unit")
        .or(`brand_name.ilike.%${query}%,generic_name.ilike.%${query}%`)
        .limit(20);

    return data || [];
}

/**
 * Save Consultation (Notes + Prescription)
 */
export async function saveConsultation(
    appointmentId: string,
    notes: string,
    prescriptionItems: any[], // { medicineId, dosage, frequency, days, qty, notes }
    labTestIds: number[]
) {
    const user = await getAuthUser();
    if (!user || user.role !== "doctor") return { error: "Unauthorized" };
    const supabase = await createClient();

    // 1. Update Appointment Notes & Status
    await supabase
        .from("appointment")
        .update({
            doctor_notes: notes,
            status: "Pharmacy" // Move to next stage flow 
        })
        .eq("id", appointmentId);

    // 2. Create Prescription if items exist
    if (prescriptionItems && prescriptionItems.length > 0) {
        const { data: rx, error: rxError } = await supabase
            .from("prescription")
            .insert({
                appointment_id: appointmentId,
                doctor_id: user.id
            })
            .select()
            .single();

        if (!rxError && rx) {
            const itemsToInsert = prescriptionItems.map(item => ({
                prescription_id: rx.id,
                medicine_id: item.medicineId,
                dosage: item.dosage,
                frequency: item.frequency,
                duration_days: item.days,
                quantity: item.qty, // or calc logic
                notes: item.notes
            }));

            await supabase.from("prescription_item").insert(itemsToInsert);
        }
    }

    // 3. Create Lab Request if tests exist
    if (labTestIds && labTestIds.length > 0) {
        // Need to fetch test names/prices first or just insert IDs if simplified
        // Schema: lab_report links to lab_test_type_id

        // We create one lab_report entry per test request? 
        // Or one "Report" containing multiple tests?
        // Schema says: lab_report has `test_name` and `lab_test_type_id`.
        // It seems designed for 1 row per test.

        // We need to fetch test details to fill `test_name` properly
        const { data: tests } = await supabase
            .from("lab_test_type")
            .select("*")
            .in("id", labTestIds);

        if (tests) {
            const reportsToInsert = tests.map(test => ({
                appointment_id: appointmentId,
                lab_test_type_id: test.id,
                test_name: test.name,
                price: test.price,
                status: "Requested",
                requested_by: user.id
            }));

            await supabase.from("lab_report").insert(reportsToInsert);
        }
    }

    revalidatePath("/doctor");
    return { success: true };
}

export async function getLabTestTypes() {
    const supabase = await createClient();
    const { data } = await supabase.from("lab_test_type").select("*").order("name");
    return data || [];
}
