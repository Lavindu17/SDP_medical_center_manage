import { getInvoiceDetails } from "@/lib/actions/reception";
import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import BillingForm from "./billing-form";

type Props = {
    params: { id: string }; // Appointment ID
};

export default async function BillingPage({ params }: Props) {
    const user = await getAuthUser();
    if (!user || user.role !== "receptionist") redirect("/login");

    const details = await getInvoiceDetails(params.id);

    if (!details) return notFound();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Generate Invoice</h1>
                    <p className="text-slate-500">Appointment #{details.appointment.id} • {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-500">Patient</div>
                    <div className="font-bold text-slate-900">{details.appointment.patient?.first_name} {details.appointment.patient?.last_name}</div>
                </div>
            </div>

            <BillingForm details={details} />
        </div>
    );
}
