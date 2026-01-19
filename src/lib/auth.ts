import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole | null;
}

/**
 * Get the current user's role using RPC function (bypasses RLS)
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
    const supabase = await createClient();

    // Use the RPC function that bypasses RLS
    const { data, error } = await supabase.rpc("get_user_role", {
        user_id: userId,
    });

    if (error) {
        console.error("Error getting user role:", error);
        // Fallback: check tables directly (may fail due to RLS)
        return await getUserRoleFallback(userId);
    }

    return data as UserRole | null;
}

/**
 * Fallback role detection (slower, may be blocked by RLS)
 */
async function getUserRoleFallback(userId: string): Promise<UserRole | null> {
    const supabase = await createClient();

    // Check each role table in order of priority
    const roleChecks: { table: string; role: UserRole }[] = [
        { table: "admin", role: "admin" },
        { table: "doctor", role: "doctor" },
        { table: "pharmacist", role: "pharmacist" },
        { table: "receptionist", role: "receptionist" },
        { table: "lab_assistant", role: "lab_assistant" },
        { table: "patient", role: "patient" },
    ];

    for (const check of roleChecks) {
        const { data, error } = await supabase
            .from(check.table)
            .select("id")
            .eq("id", userId)
            .maybeSingle();

        if (data && !error) {
            return check.role;
        }
    }

    return null;
}

/**
 * Get current authenticated user with role
 */
export async function getAuthUser(): Promise<AuthUser | null> {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    const role = await getUserRole(user.id);

    return {
        id: user.id,
        email: user.email || "",
        role,
    };
}

/**
 * Get the dashboard path for a specific role
 */
export function getDashboardPath(role: UserRole | null): string {
    switch (role) {
        case "admin":
            return "/admin";
        case "doctor":
            return "/doctor";
        case "pharmacist":
            return "/pharmacy";
        case "receptionist":
            return "/reception";
        case "lab_assistant":
            return "/lab";
        case "patient":
            return "/patient";
        default:
            return "/login";
    }
}

/**
 * Check if a user has access to a specific route based on their role
 */
export function hasRouteAccess(role: UserRole | null, pathname: string): boolean {
    if (!role) return false;

    const roleRoutes: Record<UserRole, string[]> = {
        admin: ["/admin"],
        doctor: ["/doctor"],
        pharmacist: ["/pharmacy"],
        receptionist: ["/reception"],
        lab_assistant: ["/lab"],
        patient: ["/patient"],
    };

    const allowedRoutes = roleRoutes[role];
    return allowedRoutes.some((route) => pathname.startsWith(route));
}
