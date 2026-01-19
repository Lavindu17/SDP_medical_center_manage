import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPatientHistory, getDoctorQueue } from "@/lib/actions/doctor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ConsultationTabs from "./consultation-tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
    params: { id: string };
};

export default async function ConsultationPage({ params }: Props) {
    const user = await getAuthUser();
    if (!user || user.role !== "doctor") redirect("/login");

    const supabase = await createClient();

    // Fetch Appointment Details
    const { data: appointment } = await supabase
        .from("appointment")
        .select(`
      *,
      patient:patient_id (*)
    `)
        .eq("id", params.id)
        .single();

    if (!appointment) return notFound();

    // Security: only assigned doctor can view
    if (appointment.doctor_id !== user.id) {
        return <div className="p-8">Unauthorized access to this consultation.</div>;
    }

    // Fetch Patient History
    const history = await getPatientHistory(appointment.patient_id);

    // Calculate Age
    const dob = new Date(appointment.patient.dob);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col gap-4">
            {/* Header Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/doctor">
                        <Button variant="ghost" size="icon">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {appointment.patient.first_name} {appointment.patient.last_name}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{age} yrs • {appointment.patient.contact_number}</span>
                            <Badge variant="outline" className={
                                appointment.status === "In_Consultation" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100"
                            }>
                                {appointment.status.replace("_", " ")}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div>
                    {/* Timer or Status Indicator could go here */}
                    <div className="text-right text-xs text-slate-400">
                        Started: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                {/* Left Sidebar: Patient History */}
                <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-2">
                    <Card>
                        <CardHeader className="py-3 bg-slate-50 border-b">
                            <CardTitle className="text-sm font-medium">Patient Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-slate-500">DOB:</span>
                                <span className="col-span-2 font-medium">{new Date(appointment.patient.dob).toLocaleDateString()}</span>

                                <span className="text-slate-500">Address:</span>
                                <span className="col-span-2">{appointment.patient.address || "N/A"}</span>

                                <span className="text-slate-500">Email:</span>
                                <span className="col-span-2 truncate" title={appointment.patient.email}>{appointment.patient.email}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 min-h-[300px]">
                        <CardHeader className="py-3 bg-slate-50 border-b">
                            <CardTitle className="text-sm font-medium">Visit History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {history?.visits && history.visits.length > 0 ? (
                                    history.visits.map((visit: any) => (
                                        <div key={visit.id} className="p-3 text-sm hover:bg-slate-50">
                                            <div className="flex justify-between font-medium">
                                                <span>{new Date(visit.date).toLocaleDateString()}</span>
                                                <span className="text-slate-500 truncate max-w-[80px]">Dr. {visit.doctor?.last_name}</span>
                                            </div>
                                            <p className="text-slate-500 mt-1 line-clamp-2 text-xs">
                                                {visit.doctor_notes || "No notes recorded."}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-slate-400 text-center italic text-xs">No previous visits</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="py-3 bg-slate-50 border-b">
                            <CardTitle className="text-sm font-medium">Past Prescriptions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {history?.prescriptions && history.prescriptions.length > 0 ? (
                                    history.prescriptions.map((rx: any) => (
                                        <div key={rx.id} className="p-3 text-sm hover:bg-slate-50">
                                            <div className="flex justify-between font-medium text-emerald-700">
                                                <span>{new Date(rx.created_at).toLocaleDateString()}</span>
                                                <span className="text-xs border border-emerald-200 px-1 rounded">View</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Dr. {rx.doctor?.last_name}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-slate-400 text-center italic text-xs">No past prescriptions</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Work Area: Clinical Tools */}
                <div className="lg:col-span-9 h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <ConsultationTabs appointment={appointment} />
                </div>
            </div>
        </div>
    );
}
