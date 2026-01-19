import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PatientDashboard() {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Fetch patient profile
    const { data: patient } = await supabase
        .from("patient")
        .select("*")
        .eq("id", user?.id)
        .single();

    // Fetch upcoming appointments
    const { data: upcomingAppointments } = await supabase
        .from("appointment")
        .select(`
      *,
      doctor:doctor_id (first_name, last_name, specialization)
    `)
        .eq("patient_id", user?.id)
        .gte("date", new Date().toISOString().split("T")[0])
        .in("status", ["Booked", "Arrived"])
        .order("date", { ascending: true })
        .limit(5);

    // Fetch recent prescriptions
    const { data: recentPrescriptions } = await supabase
        .from("prescription")
        .select(`
      *,
      appointment:appointment_id (date),
      doctor:doctor_id (first_name, last_name)
    `)
        .eq("doctor_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(3);

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">
                    Welcome back, {patient?.first_name || "Patient"}!
                </h1>
                <p className="text-blue-100 mt-1">
                    Manage your appointments and view your medical history
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/patient/appointments/new">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">Book Appointment</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/patient/prescriptions">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-emerald-500">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">Prescriptions</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/patient/lab-reports">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">Lab Reports</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/patient/bills">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-amber-500">
                        <CardContent className="p-4 text-center">
                            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="font-medium text-slate-700">Bills</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Upcoming Appointments */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <Link href="/patient/appointments">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {upcomingAppointments && upcomingAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                Dr. {apt.doctor?.first_name} {apt.doctor?.last_name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {apt.doctor?.specialization || "General"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-slate-900">
                                            {new Date(apt.date).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {apt.time_slot || "TBD"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <p>No upcoming appointments</p>
                            <Link href="/patient/appointments/book">
                                <Button className="mt-4">Book an Appointment</Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Prescriptions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Prescriptions</CardTitle>
                    <Link href="/patient/prescriptions">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentPrescriptions && recentPrescriptions.length > 0 ? (
                        <div className="space-y-4">
                            {recentPrescriptions.map((rx) => (
                                <div
                                    key={rx.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            Prescription #{rx.id}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Dr. {rx.doctor?.first_name} {rx.doctor?.last_name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-slate-500">
                                            {new Date(rx.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-slate-500">
                            No prescriptions yet
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
