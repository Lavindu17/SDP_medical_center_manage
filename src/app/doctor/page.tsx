
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DoctorDashboard() {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Fetch doctor profile
    const { data: doctor } = await supabase
        .from("doctor")
        .select("*")
        .eq("id", user?.id)
        .single();

    // Fetch today's appointments
    const today = new Date().toISOString().split("T")[0];
    const { data: todaysAppointments, count: todayCount } = await supabase
        .from("appointment")
        .select("*, patient:patient_id (first_name, last_name)", { count: "exact" })
        .eq("doctor_id", user?.id)
        .eq("date", today)
        .neq("status", "Cancelled")
        .order("time_slot", { ascending: true });

    // Fetch monthly stats
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const { count: monthlyCount } = await supabase
        .from("appointment")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", user?.id)
        .gte("date", startOfMonth)
        .in("status", ["Completed", "Arrived", "In_Consultation"]);

    const monthlyRevenue = (monthlyCount || 0) * (doctor?.consultation_fee || 0);

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">
                    Welcome, Dr. {doctor?.first_name || "Doctor"}!
                </h1>
                <p className="text-emerald-100 mt-1">
                    {doctor?.specialization || "General Practice"}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{todayCount || 0}</p>
                                <p className="text-sm text-slate-500">Today&apos;s Appointments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{monthlyCount || 0}</p>
                                <p className="text-sm text-slate-500">This Month</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">
                                    Rs. {monthlyRevenue.toLocaleString()}
                                </p>
                                <p className="text-sm text-slate-500">Monthly Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Queue */}
            <Card>
                <CardHeader>
                    <CardTitle>Today&apos;s Appointment Queue</CardTitle>
                </CardHeader>
                <CardContent>
                    {todaysAppointments && todaysAppointments.length > 0 ? (
                        <div className="space-y-3">
                            {todaysAppointments.map((apt: any, index: number) => (
                                <div
                                    key={apt.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${apt.status === "In_Consultation"
                                            ? "border-emerald-500 bg-emerald-50"
                                            : apt.status === "Arrived"
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-slate-200 bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${apt.status === "In_Consultation"
                                                ? "bg-emerald-500 text-white"
                                                : apt.status === "Arrived"
                                                    ? "bg-blue-500 text-white"
                                                    : "bg-slate-200 text-slate-600"
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {apt.patient?.first_name} {apt.patient?.last_name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {apt.time_slot || "Queue #" + (index + 1)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === "In_Consultation"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : apt.status === "Arrived"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : apt.status === "Completed"
                                                        ? "bg-slate-100 text-slate-700"
                                                        : "bg-amber-100 text-amber-700"
                                            }`}>
                                            {apt.status.replace("_", " ")}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-slate-500">
                            No appointments scheduled for today
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

