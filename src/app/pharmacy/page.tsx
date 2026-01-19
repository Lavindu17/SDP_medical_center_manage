import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getPendingPrescriptions } from "@/lib/actions/pharmacy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function PharmacyDashboard() {
    const user = await getAuthUser();
    const queue = await getPendingPrescriptions();

    if (!user) return <div>Unauthorized</div>;

    const pendingCount = Array.isArray(queue) ? queue.length : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pharmacy Dashboard</h1>
                    <p className="text-slate-500">Manage dispensing and inventory</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/pharmacy/inventory">
                        <Button variant="outline">Manage Inventory</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats */}
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-emerald-600">Pending Prescriptions</p>
                        <h3 className="text-3xl font-bold text-emerald-900 mt-2">{pendingCount}</h3>
                    </CardContent>
                </Card>

                {/* Queue List */}
                <Card className="md:col-span-2 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Dispensing Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingCount > 0 ? (
                            <div className="space-y-4">
                                {(queue as any[]).map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:border-emerald-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                                                Rx
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{item.patientName}</h4>
                                                <p className="text-sm text-slate-500">{item.doctorName} • {item.date}</p>
                                            </div>
                                        </div>
                                        <Link href={`/pharmacy/dispensing/${item.id}`}>
                                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                                Dispense
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No pending prescriptions.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
