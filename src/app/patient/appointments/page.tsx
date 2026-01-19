import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cancelAppointment } from "@/lib/actions/appointment";
import { revalidatePath } from "next/cache";

export default async function AppointmentsPage() {
    const user = await getAuthUser();
    const supabase = await createClient();

    if (!user) return null;

    const today = new Date().toISOString().split("T")[0];

    // Fetch appointments
    const { data: appointments } = await supabase
        .from("appointment")
        .select(`
      *,
      doctor:doctor_id (first_name, last_name, specialization)
    `)
        .eq("patient_id", user.id)
        .order("date", { ascending: false });

    const upcoming = appointments?.filter(a => a.date >= today && a.status !== "Cancelled") || [];
    const past = appointments?.filter(a => a.date < today || a.status === "Cancelled") || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
                    <p className="text-slate-500">Manage your bookings</p>
                </div>
                <Link href="/patient/appointments/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
                        Book New Appointment
                    </Button>
                </Link>
            </div>

            {/* Upcoming Appointments */}
            <h2 className="text-lg font-semibold text-slate-800 mt-6">Upcoming</h2>
            {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcoming.map((apt) => (
                        <Card key={apt.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}</CardTitle>
                                        <CardDescription>{apt.doctor?.specialization}</CardDescription>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                        Queue: {apt.queue_number}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-slate-600 gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(apt.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600 gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Estimated Time: {apt.time_slot}
                                    </div>

                                    <div className="pt-2">
                                        <form action={async () => {
                                            "use server";
                                            await cancelAppointment(apt.id);
                                            revalidatePath("/patient/appointments");
                                        }}>
                                            <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                                                Cancel Appointment
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-50 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-slate-600 font-medium">No upcoming appointments</p>
                        <p className="text-slate-500 text-sm mt-1">Book a new appointment to see a doctor</p>
                    </CardContent>
                </Card>
            )}

            {/* Past Appointments */}
            <h2 className="text-lg font-semibold text-slate-800 mt-10">Past & Cancelled</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {past.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-900">Date</th>
                                <th className="px-6 py-4 font-medium text-slate-900">Doctor</th>
                                <th className="px-6 py-4 font-medium text-slate-900">Status</th>
                                <th className="px-6 py-4 font-medium text-slate-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {past.map((apt) => (
                                <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(apt.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}</div>
                                        <div className="text-xs text-slate-500">{apt.doctor?.specialization}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${apt.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                apt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {apt.status === 'Completed' && (
                                            <Button variant="ghost" size="sm" className="text-blue-600">
                                                View Details
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-slate-500">
                        No past appointment history found
                    </div>
                )}
            </div>
        </div>
    );
}
