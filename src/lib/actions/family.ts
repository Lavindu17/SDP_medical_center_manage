"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Send a family link request by email
 */
export async function sendLinkRequest(targetEmail: string, relationship: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    if (targetEmail === user.email) {
        return { error: "You cannot link to yourself" };
    }

    const supabase = await createClient();

    // 1. Find target patient by email
    const { data: targetUser } = await supabase
        .from("patient")
        .select("id, first_name, last_name")
        .eq("email", targetEmail)
        .single();

    if (!targetUser) {
        return { error: "Patient with this email not found" };
    }

    // 2. Check if relationship already exists
    const { data: existing } = await supabase
        .from("patient_relationships")
        .select("*")
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .or(`requester_id.eq.${targetUser.id},target_id.eq.${targetUser.id}`) // check reverse too?
        .single();

    // Actually our unique constraint is (requester_id, target_id). 
    // We should check if A->B or B->A exists.

    if (existing) {
        return { error: "A relationship link already exists or is pending" };
    }

    // 3. Create request
    const { error } = await supabase
        .from("patient_relationships")
        .insert({
            requester_id: user.id,
            target_id: targetUser.id,
            relationship: relationship,
            status: "Pending" // Needs receptionist approval as per rules
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/patient/family");
    return { success: true, message: "Link request sent. Waiting for receptionist validation." };
}

/**
 * Get linked family members
 */
export async function getFamilyMembers() {
    const user = await getAuthUser();
    if (!user) return [];

    const supabase = await createClient();

    // Get relationships where status is Approved
    // We need to check both directions: where I am requester OR where I am target
    // But for now, let's assume the graph is directed or we query both.

    // Actually, the simpler model for MVP:
    // Show everyone I am linked to (Approved)

    const { data } = await supabase
        .from("patient_relationships")
        .select(`
      id,
      relationship,
      status,
      target:target_id (id, first_name, last_name, email),
      requester:requester_id (id, first_name, last_name, email)
    `)
        .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`)
        .eq("status", "Approved");

    if (!data) return [];

    return (data as any[]).map(rel => {
        // Determine which side is "the other person"
        const isMeRequester = rel.requester?.id === user.id;
        const otherPerson = isMeRequester ? rel.target : rel.requester;

        return {
            id: rel.id,
            relationship: rel.relationship,
            member: otherPerson
        };
    });
}

/**
 * Get pending requests (sent by me)
 */
export async function getPendingRequests() {
    const user = await getAuthUser();
    if (!user) return [];

    const supabase = await createClient();

    const { data } = await supabase
        .from("patient_relationships")
        .select(`
      id,
      relationship,
      status,
      target:target_id (first_name, last_name, email),
      created_at
    `)
        .eq("requester_id", user.id)
        .eq("status", "Pending")
        .order("created_at", { ascending: false });

    return (data as any[]) || [];
}
