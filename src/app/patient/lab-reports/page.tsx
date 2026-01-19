import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LabReportsPage() {
    const user = await getAuthUser();
    const supabase = await createClient();

    if (!user) return null;

    // Fetch lab reports
    // We use !inner on appointment to ensure we only get reports for this patient
    const { data: reports } = await supabase
        .from("lab_report")
        .select(`
      *,
      appointment!inner (
        date,
        doctor:doctor_id (first_name, last_name)
      ),
      files:lab_report_file (*)
    `)
        .eq("appointment.patient_id", user.id)
        .order("created_at", { ascending: false });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Completed": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "Processing": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            default: return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lab Reports</h1>
                    <p className="text-slate-500">View and download your test results</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reports && reports.length > 0 ? (
                    reports.map((report) => (
                        <Card key={report.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg text-slate-900">{report.test_name}</h3>
                                            <Badge className={getStatusColor(report.status || "")}>
                                                {report.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-slate-500 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(report.appointment?.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Ref: Dr. {report.appointment?.doctor?.first_name} {report.appointment?.doctor?.last_name}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {report.files && report.files.length > 0 ? (
                                            report.files.map((file: any) => (
                                                <a
                                                    key={file.id}
                                                    href={file.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="outline" className="gap-2 border-slate-300">
                                                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                        </svg>
                                                        View Result
                                                    </Button>
                                                </a>
                                            ))
                                        ) : (
                                            report.status === "Completed" ? (
                                                <span className="text-sm text-slate-400 italic">File not uploaded yet</span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">Pending result</span>
                                            )
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-xl border-dashed border-2">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <p className="font-medium">No lab reports found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
