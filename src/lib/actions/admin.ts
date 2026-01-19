"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

/**
 * Get System Dashboard Stats
 */
export async function getSystemStats() {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return { error: "Unauthorized" };

    const supabase = await createClient();

    // Parallel fetch for counts
    const [
        { count: patients },
        { count: doctors },
        { count: appointments },
        { count: revenue } // Revenue is sum, not count. Need different query.
    ] = await Promise.all([
        supabase.from("patient").select("*", { count: "exact", head: true }),
        supabase.from("doctor").select("*", { count: "exact", head: true }),
        supabase.from("appointment").select("*", { count: "exact", head: true }),
        supabase.from("invoice").select("total_amount")
    ]);

    // Calculate generic revenue (sum of invoice totals)
    // Note: Supabase JS select doesn't do SUM easily without RPC or fetching all data. 
    // For MVP with small data, fetching all 'total_amount' is okay.
    const { data: invoices } = await supabase.from("invoice").select("total_amount");
    const totalRevenue = invoices?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;

    return {
        patients: patients || 0,
        doctors: doctors || 0,
        appointments: appointments || 0,
        revenue: totalRevenue
    };
}

/**
 * Get Recent Activity Logs
 */
export async function getActivityLogs() {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return [];

    const supabase = await createClient();

    // If activity_log table is empty, we might want to mock some or ensure triggers populate it.
    // For now, simple fetch.
    const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

    if (error) return [];
    return data;
}

/**
 * Get All Users (Staff + Patients)
 */
export async function getAllUsers() {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return [];

    const supabase = await createClient();

    // We have multiple tables. Let's fetch essential ones.
    const [patients, doctors, pharmacists, receptionists, labAssistants] = await Promise.all([
        supabase.from("patient").select("id, first_name, last_name, email, created_at").limit(10),
        supabase.from("doctor").select("id, first_name, last_name, email, created_at").limit(10),
        supabase.from("pharmacist").select("id, first_name, last_name, email, created_at").limit(10),
        supabase.from("receptionist").select("id, first_name, last_name, email, created_at").limit(10),
        supabase.from("lab_assistant").select("id, first_name, last_name, email, created_at").limit(10)
    ]);

    // Combine and map
    const allUsers = [
        ...(patients.data || []).map(u => ({ ...u, role: 'Patient' })),
        ...(doctors.data || []).map(u => ({ ...u, role: 'Doctor' })),
        ...(pharmacists.data || []).map(u => ({ ...u, role: 'Pharmacist' })),
        ...(receptionists.data || []).map(u => ({ ...u, role: 'Receptionist' })),
        ...(labAssistants.data || []).map(u => ({ ...u, role: 'Lab Assistant' })),
    ];

    // Sort by created_at desc
    return allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
