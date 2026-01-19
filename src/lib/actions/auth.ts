"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getDashboardPath, getUserRole } from "@/lib/auth";
import type { UserRole } from "@/types/database";

export interface AuthResult {
    error: string | null;
    success: boolean;
    redirectTo?: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(formData: FormData): Promise<AuthResult> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required", success: false };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message, success: false };
    }

    if (!data.user) {
        return { error: "Failed to sign in", success: false };
    }

    // Get user role and return redirect path
    const role = await getUserRole(data.user.id);
    const dashboardPath = getDashboardPath(role);

    return { error: null, success: true, redirectTo: dashboardPath };
}

/**
 * Sign up as a patient
 */
export async function signUpPatient(formData: FormData): Promise<AuthResult> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const contactNumber = formData.get("contactNumber") as string;

    if (!email || !password || !firstName) {
        return { error: "Email, password, and first name are required", success: false };
    }

    const supabase = await createClient();

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: "patient",
                full_name: `${firstName} ${lastName || ""}`.trim(),
            },
        },
    });

    if (error) {
        return { error: error.message, success: false };
    }

    if (!data.user) {
        return { error: "Failed to create user", success: false };
    }

    // Create patient profile
    // Create patient profile using Admin Client to bypass RLS
    // (User might not be logged in yet if email confirmation is enabled, causing RLS failure)
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

    const { error: profileError } = await supabaseAdmin.from("patient").insert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName || null,
        email: email,
        contact_number: contactNumber || null,
    });

    if (profileError) {
        console.error("Failed to create patient profile:", profileError);
        return { error: "Account created but profile setup failed. Please contact support.", success: false };
    }

    return { error: null, success: true, redirectTo: "/patient" };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}

/**
 * Request password reset
 */
export async function forgotPassword(formData: FormData): Promise<AuthResult> {
    const email = formData.get("email") as string;

    if (!email) {
        return { error: "Email is required", success: false };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
    });

    if (error) {
        return { error: error.message, success: false };
    }

    return { error: null, success: true };
}

/**
 * Create a staff user (admin only)
 */
export async function createStaffUser(
    email: string,
    password: string,
    role: Exclude<UserRole, "patient">,
    profileData: Record<string, unknown>
): Promise<AuthResult> {
    const supabase = await createClient();

    // Sign up the user with the service role (bypasses RLS for admin operations)
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            role,
            full_name: profileData.first_name as string,
        },
    });

    if (error) {
        return { error: error.message, success: false };
    }

    if (!data.user) {
        return { error: "Failed to create user", success: false };
    }

    // Create profile in the appropriate table
    const tableMap: Record<string, string> = {
        doctor: "doctor",
        pharmacist: "pharmacist",
        receptionist: "receptionist",
        lab_assistant: "lab_assistant",
        admin: "admin",
    };

    const { error: profileError } = await supabase
        .from(tableMap[role])
        .insert({
            id: data.user.id,
            email,
            ...profileData,
        });

    if (profileError) {
        return { error: `Profile creation failed: ${profileError.message}`, success: false };
    }

    return { error: null, success: true };
}
