import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getPendingLabRequests } from "@/lib/actions/lab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function LabDashboard() {
    const user = await getAuthUser();
    const queue = await getPendingLabRequests();

    if (!user) return <div>Unauthorized</div>;

    const pendingCount = Array.isArray(queue) ? queue.length : 0;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h1 className="text-2xl font-bold text-slate-900">Laboratory Dashboard</h1>
                <p className="text-slate-500">Manage test requests and upload results</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats */}
                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="p-6">
                        <p className="text-sm font-medium text-purple-600">Pending Requests</p>
                        <h3 className="text-3xl font-bold text-purple-900 mt-2">{pendingCount}</h3>
                    </CardContent>
                </Card>

                {/* Queue List */}
                <Card className="md:col-span-2 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Test Request Queue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingCount > 0 ? (
                            <div className="space-y-4">
                                {(queue as any[]).map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border hover:border-purple-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold">
                                                Lab
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{item.testName}</h4>
                                                <p className="text-sm text-slate-500">{item.patientName} • {item.doctorName}</p>
                                            </div>
                                        </div>
                                        <Link href={`/lab/upload/${item.id}`}>
                                            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                                Process & Upload
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                No pending test requests.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
