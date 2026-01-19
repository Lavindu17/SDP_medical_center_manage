import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PrescriptionsPage() {
    const user = await getAuthUser();
    const supabase = await createClient();

    if (!user) return null;

    // Fetch prescriptions
    const { data: prescriptions } = await supabase
        .from("prescription")
        .select(`
      *,
      doctor:doctor_id (first_name, last_name, specialization),
      appointment:appointment_id (date)
    `)
        .order("created_at", { ascending: false });

    // For RLS security, we filter by appointment.patient_id implicitly via the policy, 
    // but the current policy uses a subquery which is fine.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
                    <p className="text-slate-500">History of your medication orders</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prescriptions && prescriptions.length > 0 ? (
                    prescriptions.map((rx) => (
                        <Link key={rx.id} href={`/patient/prescriptions/${rx.id}`}>
                            <Card className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">Dr. {rx.doctor?.first_name} {rx.doctor?.last_name}</CardTitle>
                                            <p className="text-sm text-slate-500">{rx.doctor?.specialization}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                            #{rx.id}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm text-slate-600 gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {new Date(rx.appointment?.date).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                        <div className="text-sm text-slate-500 mt-2 line-clamp-2">
                                            {rx.notes || "No general notes"}
                                        </div>
                                        <div className="pt-2 text-emerald-600 text-sm font-medium flex items-center gap-1">
                                            View Details
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-xl border-dashed border-2">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="font-medium">No prescriptions found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
