import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PharmacyDashboard() {
    const supabase = await createClient();

    // Fetch pending prescriptions count
    const { count: pendingCount } = await supabase
        .from("dispensing")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending");

    // Fetch low stock items
    const { data: lowStockItems, count: lowStockCount } = await supabase
        .from("inventory")
        .select("*, medicine:medicine_id (brand_name, generic_name)", { count: "exact" })
        .lt("stock_level", 20)
        .order("stock_level", { ascending: true })
        .limit(5);

    // Fetch expiring soon items (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { count: expiringCount } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .gt("stock_level", 0);

    // Fetch total medicines count
    const { count: medicinesCount } = await supabase
        .from("medicine")
        .select("*", { count: "exact", head: true });

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">Pharmacy Dashboard</h1>
                <p className="text-purple-100 mt-1">
                    Manage prescriptions and inventory
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{pendingCount || 0}</p>
                                <p className="text-sm text-slate-500">Pending Prescriptions</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{lowStockCount || 0}</p>
                                <p className="text-sm text-slate-500">Low Stock Items</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{expiringCount || 0}</p>
                                <p className="text-sm text-slate-500">Expiring Soon</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{medicinesCount || 0}</p>
                                <p className="text-sm text-slate-500">Total Medicines</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Low Stock Alert</CardTitle>
                        <Link href="/pharmacy/inventory">
                            <Button variant="outline" size="sm">View All</Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {lowStockItems && lowStockItems.length > 0 ? (
                            <div className="space-y-3">
                                {lowStockItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {item.medicine?.brand_name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {item.medicine?.generic_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-amber-600">
                                                {item.stock_level} left
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Batch: {item.batch_number}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-8 text-slate-500">
                                All items are well stocked
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/pharmacy/prescriptions" className="block">
                            <Button className="w-full justify-start gap-3" variant="outline">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Pending Prescriptions
                            </Button>
                        </Link>
                        <Link href="/pharmacy/medicines" className="block">
                            <Button className="w-full justify-start gap-3" variant="outline">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add New Medicine
                            </Button>
                        </Link>
                        <Link href="/pharmacy/inventory" className="block">
                            <Button className="w-full justify-start gap-3" variant="outline">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Manage Inventory
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
