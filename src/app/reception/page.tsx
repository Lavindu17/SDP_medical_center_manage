import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { getReceptionDashboardData, getPendingFamilyRequests } from "@/lib/actions/reception"; // Added import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, CreditCard, Calendar } from "lucide-react";
import FamilyRequests from "./family-requests"; // Added import

export default async function ReceptionDashboard() {
    const user = await getAuthUser();
    const appointments = await getReceptionDashboardData();
    const familyRequests = await getPendingFamilyRequests();

    if (!user) return <div>Unauthorized</div>;

    const todayCount = Array.isArray(appointments) ? appointments.length : 0;
    const billingReady = (appointments as any[]).filter(a => a.status === 'Completed' || a.status === 'Pharmacy' || a.status === 'Lab');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reception Dashboard</h1>
                    <p className="text-slate-500">Manage patient flow and billing</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/reception/register">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Register Walk-in
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-blue-600">Today's Total</p>
                                <h3 className="text-2xl font-bold text-blue-900">{todayCount}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-emerald-600">Ready for Bill</p>
                                <h3 className="text-2xl font-bold text-emerald-900">{billingReady.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Appointment Queue (2/3 width) */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Appointments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {todayCount > 0 ? (
                                <div className="space-y-1">
                                    {(appointments as any[]).map((apt) => (
                                        <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-slate-50 border-b last:border-0 transition-all">
                                            <div className="flex gap-4 items-center">
                                                <div className="text-slate-500 font-mono text-sm w-16">{apt.time?.slice(0, 5)}</div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-900">{apt.patientName}</h4>
                                                    <p className="text-sm text-slate-500">{apt.doctorName} • <span className="text-slate-400">{apt.contact}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className={`
                                ${apt.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        apt.status === 'Cancelled' ? 'bg-gray-100 text-gray-500' :
                                                            'bg-blue-50 text-blue-700 border-blue-200'}
                             `}>
                                                    {apt.status}
                                                </Badge>

                                                {/* Only show Bill button if Completed or in progress */}
                                                {apt.status !== 'Cancelled' && apt.status !== 'Booked' && (
                                                    <Link href={`/reception/billing/${apt.id}`}>
                                                        <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            Generate Bill
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    No appointments for today.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Family Requests (1/3 width) */}
                <div className="lg:col-span-1">
                    <FamilyRequests requests={familyRequests} />
                </div>
            </div>
        </div>
    );
}
