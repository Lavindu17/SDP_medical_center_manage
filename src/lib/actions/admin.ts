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

/**
 * Get All Staff with Detailed Information (for admin users page)
 */
export async function getAllStaffDetailed(roleFilter?: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return { error: "Unauthorized", data: [] };

    const supabase = await createClient();

    // Define which tables to query based on filter
    const tablesToQuery = roleFilter && roleFilter !== "all"
        ? [roleFilter]
        : ["doctor", "pharmacist", "receptionist", "lab_assistant", "admin"];

    const allStaff: Array<{
        id: string;
        first_name: string;
        last_name: string | null;
        email: string | null;
        role: string;
        specialization?: string | null;
        license_number?: string | null;
        slmc_reg_number?: string | null;
        consultation_fee?: number | null;
        desk_id?: string | null;
        contact_number?: string | null;
        created_at: string;
    }> = [];

    for (const table of tablesToQuery) {
        const query = supabase.from(table).select("*");

        const { data, error } = await query;

        if (!error && data) {
            const roleLabel = table === "lab_assistant" ? "Lab Assistant" :
                table.charAt(0).toUpperCase() + table.slice(1);
            allStaff.push(...data.map(u => ({ ...u, role: roleLabel })));
        }
    }

    // Sort by created_at descending
    allStaff.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { error: null, data: allStaff };
}

/**
 * Get Staff Member by ID and Role
 */
export async function getStaffById(staffId: string, role: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return { error: "Unauthorized", data: null };

    const supabase = await createClient();

    const tableMap: Record<string, string> = {
        "Doctor": "doctor",
        "Pharmacist": "pharmacist",
        "Receptionist": "receptionist",
        "Lab Assistant": "lab_assistant",
        "Admin": "admin",
    };

    const table = tableMap[role];
    if (!table) return { error: "Invalid role", data: null };

    const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", staffId)
        .single();

    if (error) return { error: error.message, data: null };

    return { error: null, data: { ...data, role } };
}

/**
 * Update Staff User Profile
 */
export async function updateStaffUser(
    staffId: string,
    role: string,
    updateData: Record<string, unknown>
) {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return { error: "Unauthorized", success: false };

    const supabase = await createClient();

    const tableMap: Record<string, string> = {
        "Doctor": "doctor",
        "Pharmacist": "pharmacist",
        "Receptionist": "receptionist",
        "Lab Assistant": "lab_assistant",
        "Admin": "admin",
    };

    const table = tableMap[role];
    if (!table) return { error: "Invalid role", success: false };

    // Remove fields that shouldn't be updated
    const { id, created_at, updated_at, role: _, ...safeData } = updateData as Record<string, unknown> & {
        id?: string; created_at?: string; updated_at?: string; role?: string
    };

    const { error } = await supabase
        .from(table)
        .update(safeData)
        .eq("id", staffId);

    if (error) return { error: error.message, success: false };

    return { error: null, success: true };
}

/**
 * Delete Staff User (removes auth user and profile)
 */
export async function deleteStaffUser(staffId: string, role: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") return { error: "Unauthorized", success: false };

    // Use Admin Client for auth operations
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    const tableMap: Record<string, string> = {
        "Doctor": "doctor",
        "Pharmacist": "pharmacist",
        "Receptionist": "receptionist",
        "Lab Assistant": "lab_assistant",
        "Admin": "admin",
    };

    const table = tableMap[role];
    if (!table) return { error: "Invalid role", success: false };

    // First delete the profile (foreign key constraint)
    const { error: profileError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("id", staffId);

    if (profileError) {
        return { error: `Failed to delete profile: ${profileError.message}`, success: false };
    }

    // Then delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(staffId);

    if (authError) {
        return { error: `Failed to delete auth user: ${authError.message}`, success: false };
    }

    return { error: null, success: true };
}
