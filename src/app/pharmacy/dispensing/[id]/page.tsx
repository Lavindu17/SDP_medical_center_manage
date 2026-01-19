import { getPrescriptionDetails } from "@/lib/actions/pharmacy";
import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import DispensingForm from "./dispensing-form";

type Props = {
    params: { id: string }; // This is Appointment ID in current url structure logic? 
    // Actually dashboard links uses "item.id" which was Appointment ID from `getPendingPrescriptions`.
    // Wait, `getPendingPrescriptions` returns appointments.
    // And `getPrescriptionDetails` takes `appointmentId`.
    // So params.id is correct.
};

export default async function DispensingPage({ params }: Props) {
    const user = await getAuthUser();
    if (!user || user.role !== "pharmacist") redirect("/login");

    const details = await getPrescriptionDetails(params.id);

    if (!details || !details.prescription) {
        return <div className="p-8 text-center text-slate-500">Prescription not found or no medicines prescribed.</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Dispense Prescription</h1>
                <p className="text-slate-500">Rx ID: #{details.prescription.id} • Verify medicines and issue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <DispensingForm
                        prescription={details.prescription}
                        inventory={details.inventory}
                    />
                </div>

                <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                        <strong>Instructions:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Verify patient identity.</li>
                            <li>Check expiry dates on packs.</li>
                            <li>Explain dosage instructions clearly.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
