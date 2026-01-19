"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get Pending Lab Requests
 */
export async function getPendingLabRequests() {
    const user = await getAuthUser();
    if (!user || user.role !== "lab_assistant") return { error: "Unauthorized" };

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("lab_report")
        .select(`
      id,
      test_name,
      status,
      created_at,
      appointment:appointment_id (
        id,
        patient:patient_id (first_name, last_name, gender, dob),
        doctor:doctor_id (first_name, last_name)
      )
    `)
        .eq("status", "Requested")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching lab queue:", error);
        return [];
    }

    return (data as any[]).map(item => ({
        id: item.id, // Report ID
        testName: item.test_name,
        patientName: `${item.appointment?.patient?.first_name} ${item.appointment?.patient?.last_name}`,
        doctorName: `Dr. ${item.appointment?.doctor?.first_name} ${item.appointment?.doctor?.last_name}`,
        date: new Date(item.created_at).toLocaleDateString(),
        status: item.status
    }));
}

/**
 * Get Lab Report Details for Upload
 */
export async function getLabRequestDetails(reportId: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "lab_assistant") return null;

    const supabase = await createClient();

    const { data } = await supabase
        .from("lab_report")
        .select(`
      *,
      appointment:appointment_id (
        patient:patient_id (*)
      )
    `)
        .eq("id", reportId)
        .single();

    return data;
}

/**
 * Upload Lab Result manually (URL bypass for MVP)
 * In a real app, we'd use supabase.storage.upload -> getPublicUrl -> save here.
 * For this MVP, we will simulate the "upload" by taking a filename/url string 
 * or just marking it as complete if we don't have a real file uploader UI widget ready.
 * 
 * Let's assume the user provides a "File Name" or "Link" for now to keep it simple 
 * without building a full file picker + storage bucket integration flow in 5 mins.
 * OR we can use a dummy file link generator.
 */
export async function completeLabTest(reportId: number, fileUrl: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "lab_assistant") return { error: "Unauthorized" };

    const supabase = await createClient();

    // 1. Insert File Record
    const { error: fileError } = await supabase.from("lab_report_file").insert({
        lab_report_id: reportId,
        file_url: fileUrl,
        file_type: "PDF",
        file_name: "Lab Result.pdf",
        uploaded_by: user.id
    });

    if (fileError) return { error: "Failed to save file record" };

    // 2. Update Report Status
    await supabase
        .from("lab_report")
        .update({
            status: "Completed",
            processed_by: user.id
        })
        .eq("id", reportId);

    // 3. Update Appointment Status? 
    // Lab requests might be part of an appointment, but maybe not the only thing.
    // If we want to mark appointment as 'Completed' if it was in 'Lab' state:

    // Check appointment status
    const { data: report } = await supabase.from("lab_report").select("appointment_id").eq("id", reportId).single();
    if (report) {
        // Optional: Check if all lab requests for this appointment are done?
        // For now, simple logic: leave appointment status or set to specific value if needed.
        // Let's leave appointment status as is, or update to 'Completed' if it was 'Lab'.
    }

    revalidatePath("/lab");
    return { success: true };
}
