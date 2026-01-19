import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function LabDashboard() {
    const supabase = await createClient();

    // Fetch pending test requests
    const { data: pendingTests, count: pendingCount } = await supabase
        .from("lab_report")
        .select(`
      *,
      appointment:appointment_id (
        date,
        patient:patient_id (first_name, last_name)
      )
    `, { count: "exact" })
        .eq("status", "Requested")
        .order("created_at", { ascending: true })
        .limit(10);

    // Fetch processing tests count
    const { count: processingCount } = await supabase
        .from("lab_report")
        .select("*", { count: "exact", head: true })
        .eq("status", "Processing");

    // Fetch completed today count
    const today = new Date().toISOString().split("T")[0];
    const { count: completedTodayCount } = await supabase
        .from("lab_report")
        .select("*", { count: "exact", head: true })
        .eq("status", "Completed")
        .gte("updated_at", today);

    // Fetch total test types
    const { count: testTypesCount } = await supabase
        .from("lab_test_type")
        .select("*", { count: "exact", head: true });

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-500 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">Laboratory Dashboard</h1>
                <p className="text-indigo-100 mt-1">
                    Manage test requests and upload results
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{pendingCount || 0}</p>
                                <p className="text-sm text-slate-500">Pending Requests</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{processingCount || 0}</p>
                                <p className="text-sm text-slate-500">In Progress</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{completedTodayCount || 0}</p>
                                <p className="text-sm text-slate-500">Completed Today</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{testTypesCount || 0}</p>
                                <p className="text-sm text-slate-500">Test Types</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Test Requests */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Pending Test Requests</CardTitle>
                    <Link href="/lab/requests">
                        <Button variant="outline" size="sm">View All</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {pendingTests && pendingTests.length > 0 ? (
                        <div className="space-y-3">
                            {pendingTests.map((test) => (
                                <div
                                    key={test.id}
                                    className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{test.test_name}</p>
                                        <p className="text-sm text-slate-500">
                                            {test.appointment?.patient?.first_name} {test.appointment?.patient?.last_name}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-500">
                                            {new Date(test.created_at).toLocaleDateString()}
                                        </span>
                                        <Button size="sm">Process</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-8 text-slate-500">
                            No pending test requests
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/lab/requests">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">View All Requests</p>
                                <p className="text-sm text-slate-500">Process and upload results</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/lab/test-types">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Manage Test Types</p>
                                <p className="text-sm text-slate-500">Add or edit lab test types</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
