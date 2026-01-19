"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dispensePrescription } from "@/lib/actions/pharmacy";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function DispensingForm({ prescription, inventory }: { prescription: any, inventory: any[] }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [itemsToDispense, setItemsToDispense] = useState(
        prescription.items.map((item: any) => ({
            prescriptionItemId: item.id,
            medicineId: item.medicine_id,
            quantity: item.quantity > 0 ? item.quantity : item.duration_days * 3, // Fallback if qty 0
            availableStock: inventory
                .filter((inv: any) => inv.medicine_id === item.medicine_id)
                .reduce((acc: number, curr: any) => acc + curr.stock_level, 0)
        }))
    );

    const handleDispense = async () => {
        setIsSubmitting(true);
        try {
            // Check stock first
            const outOfStock = itemsToDispense.some((i: any) => i.quantity > i.availableStock);
            if (outOfStock) {
                toast.error("Some items have insufficient stock!");
                setIsSubmitting(false);
                return;
            }

            const payload = itemsToDispense.map((i: any) => ({
                prescriptionItemId: i.prescriptionItemId,
                medicineId: i.medicineId,
                quantity: i.quantity
            }));

            const res = await dispensePrescription(prescription.id, payload);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Medicines dispensed successfully!");
                router.push("/pharmacy");
            }
        } catch (e) {
            toast.error("Failed to dispense.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Medicine</TableHead>
                        <TableHead>Prescribed</TableHead>
                        <TableHead>Qty Required</TableHead>
                        <TableHead>Available Stock</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {prescription.items.map((item: any, idx: number) => {
                        const dispItem = itemsToDispense[idx];
                        const isEnough = dispItem.availableStock >= dispItem.quantity;

                        return (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <div className="text-slate-900">{item.medicine?.brand_name}</div>
                                    <div className="text-xs text-slate-500">{item.medicine?.generic_name}</div>
                                    <div className="text-xs text-indigo-600 font-medium mt-1">
                                        {item.dosage} • {item.frequency} • {item.duration_days} days
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.quantity || "Calc"} units
                                </TableCell>
                                <TableCell>
                                    <div className="font-bold">{dispItem.quantity}</div>
                                </TableCell>
                                <TableCell>
                                    <div className={`${isEnough ? "text-slate-700" : "text-red-600 font-bold"}`}>
                                        {dispItem.availableStock}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {isEnough ? (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Ready</Badge>
                                    ) : (
                                        <Badge variant="destructive">Shortage</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
                <div className="text-sm text-slate-500">
                    Total Items: {prescription.items.length}
                </div>
                <Button
                    onClick={handleDispense}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Processing..." : "Confirm & Dispense"}
                </Button>
            </div>
        </div>
    );
}
