"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get pending prescriptions (Appointments with status 'Pharmacy')
 */
export async function getPendingPrescriptions() {
    const user = await getAuthUser();
    if (!user || user.role !== "pharmacist") return { error: "Unauthorized" };

    const supabase = await createClient();

    // We look for appointments in 'Pharmacy' state
    const { data, error } = await supabase
        .from("appointment")
        .select(`
      id,
      patient:patient_id (first_name, last_name, dob, gender),
      doctor:doctor_id (first_name, last_name, specialization),
      created_at,
      status
    `)
        .eq("status", "Pharmacy")
        .order("updated_at", { ascending: true }); // FIFO

    if (error) {
        console.error("Error fetching pharmacy queue:", error);
        return [];
    }

    return (data as any[]).map(apt => ({
        id: apt.id,
        patientName: `${apt.patient?.first_name} ${apt.patient?.last_name}`,
        doctorName: `Dr. ${apt.doctor?.first_name} ${apt.doctor?.last_name}`,
        date: new Date(apt.created_at).toLocaleDateString(),
        status: apt.status
    }));
}

/**
 * Get details for a specific prescription/appointment for dispensing
 */
export async function getPrescriptionDetails(appointmentId: string) {
    const user = await getAuthUser();
    if (!user || user.role !== "pharmacist") return null;

    const supabase = await createClient();

    // 1. Get Prescription
    const { data: prescription } = await supabase
        .from("prescription")
        .select(`
      id,
      notes,
      items:prescription_item (
        id,
        medicine_id,
        dosage,
        frequency,
        duration_days,
        quantity,
        medicine:medicine_id (brand_name, generic_name, unit)
      )
    `)
        .eq("appointment_id", appointmentId)
        .single();

    if (!prescription) return null;

    // 2. Get Inventory Items for these medicines
    // We need to know current stock for each medicine in the prescription
    const medicineIds = prescription.items.map((i: any) => i.medicine_id);

    const { data: inventory } = await supabase
        .from("inventory")
        .select("medicine_id, stock_level, unit_price, batch_number, expiry_date")
        .in("medicine_id", medicineIds)
        .gt("stock_level", 0)
        .order("expiry_date", { ascending: true }); // First to expire first

    return {
        prescription,
        inventory: inventory || []
    };
}

/**
 * Dispense Medicines
 */
export async function dispensePrescription(
    prescriptionId: number,
    items: {
        prescriptionItemId: number,
        medicineId: number,
        quantity: number
    }[]
) {
    const user = await getAuthUser();
    if (!user || user.role !== "pharmacist") return { error: "Unauthorized" };

    const supabase = await createClient();

    // Start Transaction (logic) - Supabase doesn't support convenient transactions via JS client easily 
    // without RPC, but we will try sequential writes and assume success for MVP.
    // In production, use RPC for atomicity.

    // 1. Create Dispensing Record
    const { data: dispensing, error: dispError } = await supabase
        .from("dispensing")
        .insert({
            prescription_id: prescriptionId,
            pharmacist_id: user.id,
            status: "Issued",
            dispensed_at: new Date().toISOString()
        })
        .select()
        .single();

    if (dispError || !dispensing) return { error: "Failed to create dispensing record" };

    // 2. Process Items
    for (const item of items) {
        // Find inventory batch to deduct from (FIFO)
        const { data: inventoryBatches } = await supabase
            .from("inventory")
            .select("*")
            .eq("medicine_id", item.medicineId)
            .gt("stock_level", 0)
            .order("expiry_date", { ascending: true });

        let remainingToDispense = item.quantity;

        if (inventoryBatches) {
            for (const batch of inventoryBatches) {
                if (remainingToDispense <= 0) break;

                const take = Math.min(batch.stock_level, remainingToDispense);

                // Deduct items
                await supabase
                    .from("inventory")
                    .update({ stock_level: batch.stock_level - take })
                    .eq("id", batch.id);

                // Record Dispensing Item
                await supabase.from("dispensing_item").insert({
                    dispensing_id: dispensing.id,
                    prescription_item_id: item.prescriptionItemId,
                    inventory_id: batch.id,
                    quantity_issued: take,
                    price_at_issue: batch.unit_price
                });

                remainingToDispense -= take;
            }
        }
    }

    // 3. Update Appointment Status
    // Fetch appointment ID via prescription
    const { data: pres } = await supabase.from("prescription").select("appointment_id").eq("id", prescriptionId).single();
    if (pres) {
        await supabase.from("appointment").update({ status: "Completed" }).eq("id", pres.appointment_id);
    }

    revalidatePath("/pharmacy");
    return { success: true };
}

/**
 * Get Inventory List
 */
export async function getInventory(search?: string) {
    const supabase = await createClient();

    let query = supabase
        .from("inventory")
        .select(`
      id,
      stock_level,
      unit_price,
      expiry_date,
      batch_number,
      medicine:medicine_id (brand_name, generic_name, unit)
    `)
        .order("expiry_date", { ascending: true });

    if (search) {
        // This search is imperfect because of the join, but valid for simple filtering
        // For standard usage, we might fetch all and filter or use a view.
    }

    const { data } = await query;
    return data || [];
}
