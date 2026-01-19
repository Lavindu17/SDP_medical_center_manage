"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { createInvoice } from "@/lib/actions/reception";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote } from "lucide-react";

interface BillingDetails {
    appointment: any;
    doctorFee: number;
    medicineItems: any[];
    medicineTotal: number;
    labItems: any[];
    labTotal: number;
    grandTotal: number;
}

export default function BillingForm({ details }: { details: BillingDetails }) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card'>('Cash');

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // Construct line items
            const lineItems = [
                { description: 'Doctor Consultation Fee', amount: details.doctorFee, type: 'doctor_fee' },
                ...details.medicineItems.map((m: any) => ({ description: m.description, amount: m.total, type: 'medicine' })),
                ...details.labItems.map((l: any) => ({ description: l.description, amount: l.total, type: 'lab_test' }))
            ];

            const res = await createInvoice(
                details.appointment.id,
                lineItems,
                details.grandTotal,
                paymentMethod
            );

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Payment successful! Invoice generated.");
                router.push("/reception");
            }
        } catch (e) {
            toast.error("Payment processing failed.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                {/* Invoice Review */}
                <Card>
                    <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
                    <CardContent className="space-y-4">

                        {/* Doctor Charges */}
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-slate-600">Consultation Fee ({details.appointment.doctor?.first_name})</span>
                            <span className="font-semibold">Rs. {details.doctorFee.toFixed(2)}</span>
                        </div>

                        {/* Medicine Charges */}
                        {details.medicineItems.length > 0 && (
                            <div>
                                <div className="text-sm font-semibold text-slate-500 uppercase mb-2">Pharmacy Charges</div>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                                    {details.medicineItems.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span>{item.description} (x{item.quantity})</span>
                                            <span>Rs. {item.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 border-t font-medium">
                                        <span>Total Pharmacy</span>
                                        <span>Rs. {details.medicineTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lab Charges */}
                        {details.labItems.length > 0 && (
                            <div>
                                <div className="text-sm font-semibold text-slate-500 uppercase mb-2">Lab Charges</div>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                                    {details.labItems.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span>{item.description}</span>
                                            <span>Rs. {item.total.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 border-t font-medium">
                                        <span>Total Lab</span>
                                        <span>Rs. {details.labTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-between py-4 border-t-2 border-slate-900 mt-4">
                            <span className="text-xl font-bold text-slate-900">Total Amount</span>
                            <span className="text-xl font-bold text-indigo-600">Rs. {details.grandTotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Actions */}
            <div>
                <Card>
                    <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                onClick={() => setPaymentMethod('Cash')}
                                className={`cursor-pointer p-4 rounded-lg border text-center transition-all ${paymentMethod === 'Cash' ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                            >
                                <Banknote className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'Cash' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className={`font-medium ${paymentMethod === 'Cash' ? 'text-emerald-900' : 'text-slate-600'}`}>Cash</span>
                            </div>
                            <div
                                onClick={() => setPaymentMethod('Card')}
                                className={`cursor-pointer p-4 rounded-lg border text-center transition-all ${paymentMethod === 'Card' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                            >
                                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${paymentMethod === 'Card' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <span className={`font-medium ${paymentMethod === 'Card' ? 'text-indigo-900' : 'text-slate-600'}`}>Card</span>
                            </div>
                        </div>

                        <Button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {isProcessing ? "Processing..." : `Pay Rs. ${details.grandTotal.toFixed(2)}`}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
