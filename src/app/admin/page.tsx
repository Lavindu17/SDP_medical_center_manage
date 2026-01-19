import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminDashboard() {
    const supabase = await createClient();

    // Fetch user counts
    const { count: patientCount } = await supabase.from("patient").select("*", { count: "exact", head: true });
    const { count: doctorCount } = await supabase.from("doctor").select("*", { count: "exact", head: true });
    const { count: pharmacistCount } = await supabase.from("pharmacist").select("*", { count: "exact", head: true });
    const { count: receptionistCount } = await supabase.from("receptionist").select("*", { count: "exact", head: true });
    const { count: labAssistantCount } = await supabase.from("lab_assistant").select("*", { count: "exact", head: true });

    // Fetch monthly revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const { data: monthlyInvoices } = await supabase
        .from("invoice")
        .select("total_amount")
        .eq("payment_status", "Paid")
        .gte("paid_at", startOfMonth);

    const monthlyRevenue = monthlyInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;

    // Fetch today's appointments count
    const today = new Date().toISOString().split("T")[0];
    const { count: todayAppointments } = await supabase
        .from("appointment")
        .select("*", { count: "exact", head: true })
        .eq("date", today)
        .neq("status", "Cancelled");

    // Fetch recent activity logs
    const { data: recentLogs } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

    const totalStaff = (doctorCount || 0) + (pharmacistCount || 0) + (receptionistCount || 0) + (labAssistantCount || 0);

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-red-100 mt-1">
                    System overview and management
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{patientCount || 0}</p>
                                <p className="text-sm text-slate-500">Patients</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{totalStaff}</p>
                                <p className="text-sm text-slate-500">Staff Members</p>
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
                                <p className="text-2xl font-bold text-slate-900">Rs. {monthlyRevenue.toLocaleString()}</p>
                                <p className="text-sm text-slate-500">Monthly Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{todayAppointments || 0}</p>
                                <p className="text-sm text-slate-500">Today&apos;s Appointments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Staff Breakdown */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Staff Breakdown</CardTitle>
                    <Link href="/admin/users">
                        <Button variant="outline" size="sm">Manage Users</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-emerald-600">{doctorCount || 0}</p>
                            <p className="text-sm text-slate-600">Doctors</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-purple-600">{pharmacistCount || 0}</p>
                            <p className="text-sm text-slate-600">Pharmacists</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-amber-600">{receptionistCount || 0}</p>
                            <p className="text-sm text-slate-600">Receptionists</p>
                        </div>
                        <div className="p-4 bg-indigo-50 rounded-lg text-center">
                            <p className="text-2xl font-bold text-indigo-600">{labAssistantCount || 0}</p>
                            <p className="text-sm text-slate-600">Lab Assistants</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Link href="/admin/logs">
                        <Button variant="outline" size="sm">View All Logs</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentLogs && recentLogs.length > 0 ? (
                        <div className="space-y-3">
                            {recentLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{log.action}</p>
                                        <p className="text-sm text-slate-500">
                                            {log.entity_type} {log.entity_id && `#${log.entity_id}`}
                                        </p>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {new Date(log.created_at).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-slate-500">
                            No recent activity
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/users">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Manage Users</p>
                                <p className="text-sm text-slate-500">Add, edit, or remove users</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/revenue">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Revenue Reports</p>
                                <p className="text-sm text-slate-500">View financial analytics</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/logs">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Activity Logs</p>
                                <p className="text-sm text-slate-500">View system logs</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
