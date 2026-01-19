import { getDoctors, getSpecializations } from "@/lib/actions/appointment";
import BookingWizard from "./booking-wizard";

export default async function NewAppointmentPage() {
    const doctors = await getDoctors();
    const specializations = await getSpecializations();

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Book New Appointment</h1>
                <p className="text-slate-500">Follow the steps to schedule your visit</p>
            </div>

            <BookingWizard
                initialDoctors={doctors}
                specializations={specializations}
            />
        </div>
    );
}
