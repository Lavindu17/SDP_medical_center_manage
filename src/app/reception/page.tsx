import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ReceptionDashboard() {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // Fetch today's appointments
    const { data: todaysAppointments, count: todayCount } = await supabase
        .from("appointment")
        .select(`
      *,
      patient:patient_id (first_name, last_name),
      doctor:doctor_id (first_name, last_name, specialization)
    `, { count: "exact" })
        .eq("date", today)
        .neq("status", "Cancelled")
        .order("time_slot", { ascending: true });

    // Count by status
    const arrivedCount = todaysAppointments?.filter(a => a.status === "Arrived").length || 0;
    const waitingCount = todaysAppointments?.filter(a => a.status === "Booked").length || 0;
    const completedCount = todaysAppointments?.filter(a => a.status === "Completed").length || 0;

    // Pending family link requests
    const { count: pendingLinksCount } = await supabase
        .from("patient_relationships")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending");

    // Pending bills
    const { count: pendingBillsCount } = await supabase
        .from("invoice")
        .select("*", { count: "exact", head: true })
        .eq("payment_status", "Pending");

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">Reception Dashboard</h1>
                <p className="text-amber-100 mt-1">
                    Manage appointments, patients, and billing
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{todayCount || 0}</p>
                        <p className="text-sm text-slate-500">Today&apos;s Total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-amber-600">{waitingCount}</p>
                        <p className="text-sm text-slate-500">Waiting</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{arrivedCount}</p>
                        <p className="text-sm text-slate-500">Arrived</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-slate-600">{completedCount}</p>
                        <p className="text-sm text-slate-500">Completed</p>
                    </CardContent>
                </Card>
                <Card className="border-2 border-red-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-red-600">{pendingBillsCount || 0}</p>
                        <p className="text-sm text-slate-500">Pending Bills</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/reception/appointments/new">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">New Appointment</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/reception/patients/new">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-emerald-500">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">Register Patient</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/reception/billing">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-amber-500">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">Process Bills</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/reception/family-links">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
                        <CardContent className="p-4 text-center relative">
                            {(pendingLinksCount || 0) > 0 && (
                                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {pendingLinksCount}
                                </span>
                            )}
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">Family Links</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Today's Queue */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Today&apos;s Appointments</CardTitle>
                    <Link href="/reception/appointments">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {todaysAppointments && todaysAppointments.length > 0 ? (
                        <div className="space-y-3">
                            {todaysAppointments.slice(0, 10).map((apt) => (
                                <div
                                    key={apt.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${apt.status === "Arrived"
                                            ? "border-emerald-500 bg-emerald-50"
                                            : apt.status === "Booked"
                                                ? "border-amber-500 bg-amber-50"
                                                : "border-slate-200 bg-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {apt.patient?.first_name} {apt.patient?.last_name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                Dr. {apt.doctor?.first_name} - {apt.doctor?.specialization || "General"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === "Arrived"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : apt.status === "Booked"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : apt.status === "Completed"
                                                        ? "bg-slate-100 text-slate-700"
                                                        : "bg-blue-100 text-blue-700"
                                            }`}>
                                            {apt.status.replace("_", " ")}
                                        </span>
                                        {apt.status === "Booked" && (
                                            <Button size="sm" variant="outline">
                                                Check In
                                            </Button>
                                        )}
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
