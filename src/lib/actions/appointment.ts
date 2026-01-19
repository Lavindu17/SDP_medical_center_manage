"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface AppointmentActionState {
    error?: string;
    success?: boolean;
    message?: string;
    appointmentId?: string;
}

/**
 * Get list of doctors with optional search and filter
 */
export async function getDoctors(search?: string, specialization?: string) {
    const supabase = await createClient();

    let query = supabase
        .from("doctor")
        .select("*")
        .order("last_name", { ascending: true });

    if (specialization && specialization !== "all") {
        query = query.eq("specialization", specialization);
    }

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,specialization.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching doctors:", error);
        return [];
    }

    return (data as any[]) || [];
}

/**
 * Get distinct specializations for filter
 */
export async function getSpecializations() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("doctor")
        .select("specialization")
        .not("specialization", "is", null);

    if (error) {
        console.error("Error fetching specializations:", error);
        return [];
    }

    // extract unique specializations
    const uniqueSpecializations = Array.from(new Set(data.map(d => d.specialization).filter(Boolean)));
    return uniqueSpecializations.sort() as string[];
}

/**
 * Check doctor availability and get queue info for a date
 */
export async function getDoctorAvailability(doctorId: string, date: string) {
    const supabase = await createClient();

    // Get doctor details for working hours/fees
    const { data: doctor, error: docError } = await supabase
        .from("doctor")
        .select("id, first_name, last_name, specialization, consultation_fee")
        .eq("id", doctorId)
        .single();

    if (docError || !doctor) {
        return { error: "Doctor not found" };
    }

    const doc = doctor as any;

    // Get existing appointments count for queue calculation
    const { count, error: countError } = await supabase
        .from("appointment")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .eq("date", date)
        .neq("status", "Cancelled");

    if (countError) {
        return { error: "Failed to check availability" };
    }

    const currentQueueSize = count || 0;
    const nextQueueNumber = currentQueueSize + 1;

    // Estimate time (assuming 15 mins per patient, starting 9 AM)
    // This is a simple estimation logic
    const startHour = 9;
    const startMinute = 0;
    const minsPerPatient = 15;

    const totalMins = (currentQueueSize) * minsPerPatient;
    const estimatedHour = startHour + Math.floor((startMinute + totalMins) / 60);
    const estimatedMinute = (startMinute + totalMins) % 60;

    const timeSlot = `${estimatedHour.toString().padStart(2, '0')}:${estimatedMinute.toString().padStart(2, '0')}`;

    return {
        doctor: doc,
        date,
        nextQueueNumber,
        estimatedTime: timeSlot,
        queueSize: currentQueueSize
    };
}

/**
 * Book an appointment
 */
export async function bookAppointment(
    doctorId: string,
    date: string,
    reason: string
): Promise<AppointmentActionState> {
    const user = await getAuthUser();

    if (!user) {
        return { error: "You must be logged in to book an appointment" };
    }

    const supabase = await createClient();

    try {
        // 1. Get availability again to ensure queue number concurrency (simple version)
        // In a real high-concurrency app, we'd use a database function or lock
        const { count } = await supabase
            .from("appointment")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctorId)
            .eq("date", date)
            .neq("status", "Cancelled");

        const queueNumber = (count || 0) + 1;

        // Calculate simple estimated time
        const startHour = 9;
        const minsPerPatient = 15;
        const totalMins = (count || 0) * minsPerPatient;
        const estimatedHour = startHour + Math.floor(totalMins / 60);
        const estimatedMinute = totalMins % 60;
        const timeSlot = `${estimatedHour.toString().padStart(2, '0')}:${estimatedMinute.toString().padStart(2, '0')}`;

        // 2. Insert appointment
        const { data, error } = await supabase
            .from("appointment")
            .insert({
                patient_id: user.id,
                doctor_id: doctorId,
                date: date,
                time_slot: timeSlot,
                queue_number: queueNumber,
                status: "Booked",
                notes: reason
            })
            .select()
            .single();

        if (error) {
            console.error("Booking error:", error);
            return { error: `Failed to book appointment: ${error.message}` };
        }

        // 3. Add to daily queue tracker (optional, but good for quick lookups)
        // We check if a queue record exists for this doctor/date
        const { data: existingQueue } = await supabase
            .from("appointment_queue")
            .select("id")
            .eq("doctor_id", doctorId)
            .eq("date", date)
            .single();

        if (existingQueue) {
            await supabase
                .from("appointment_queue")
                .update({ total_appointments: queueNumber })
                .eq("id", existingQueue.id);
        } else {
            await supabase
                .from("appointment_queue")
                .insert({
                    doctor_id: doctorId,
                    date: date,
                    current_queue_number: 0,
                    total_appointments: queueNumber,
                    status: "Active"
                });
        }

        revalidatePath("/patient");
        revalidatePath("/patient/appointments");

        return {
            success: true,
            message: "Appointment booked successfully",
            appointmentId: data.id
        };

    } catch (error) {
        console.error("Unexpected error:", error);
        return { error: "An unexpected error occurred" };
    }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(appointmentId: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const supabase = await createClient();

    // Check ownership
    const { data: appointment } = await supabase
        .from("appointment")
        .select("patient_id")
        .eq("id", appointmentId)
        .single();

    if (!appointment || appointment.patient_id !== user.id) {
        return { error: "You can only cancel your own appointments" };
    }

    const { error } = await supabase
        .from("appointment")
        .update({ status: "Cancelled" })
        .eq("id", appointmentId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/patient");
    revalidatePath("/patient/appointments");
    return { success: true };
}
