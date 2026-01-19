import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Props = {
    params: { id: string };
};

export default async function PrescriptionDetailsPage({ params }: Props) {
    const user = await getAuthUser();
    const supabase = await createClient();

    if (!user) return null;

    // Fetch prescription details
    const { data: prescription } = await supabase
        .from("prescription")
        .select(`
      *,
      doctor:doctor_id (first_name, last_name, specialization, slmc_reg_number),
      appointment:appointment_id (date)
    `)
        .eq("id", params.id)
        .single();

    if (!prescription) {
        notFound();
    }

    // Fetch items
    const { data: items } = await supabase
        .from("prescription_item")
        .select(`
      *,
      medicine:medicine_id (brand_name, generic_name, unit)
    `)
        .eq("prescription_id", prescription.id);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/patient/prescriptions">
                    <Button variant="outline" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to List
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Prescription Details</h1>
            </div>

            <Card>
                <CardHeader className="border-b bg-slate-50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border text-emerald-600 font-bold text-xl shadow-sm">
                                Rx
                            </div>
                            <div>
                                <CardTitle className="text-xl">Dr. {prescription.doctor?.first_name} {prescription.doctor?.last_name}</CardTitle>
                                <p className="text-sm text-slate-500">{prescription.doctor?.specialization}</p>
                                <p className="text-xs text-slate-400">Reg No: {prescription.doctor?.slmc_reg_number}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Date Issued</p>
                            <p className="font-semibold text-slate-900">
                                {new Date(prescription.appointment?.date).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Prescription #{prescription.id}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Medicine</TableHead>
                                <TableHead>Dosage</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-right">Total Qty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.medicine?.brand_name}</div>
                                        <div className="text-xs text-slate-500">{item.medicine?.generic_name}</div>
                                        {item.notes && <div className="text-xs text-amber-600 mt-1">Note: {item.notes}</div>}
                                    </TableCell>
                                    <TableCell>{item.dosage}</TableCell>
                                    <TableCell>{item.frequency}</TableCell>
                                    <TableCell>{item.duration_days} days</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {item.quantity} {item.medicine?.unit}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {prescription.notes && (
                        <div className="p-6 bg-amber-50 border-t border-amber-100">
                            <h4 className="font-semibold text-amber-900 text-sm mb-1">Doctor&apos;s Notes</h4>
                            <p className="text-amber-800 text-sm">{prescription.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Prescription
                </Button>
            </div>
        </div>
    );
}
