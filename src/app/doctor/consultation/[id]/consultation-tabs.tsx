"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { searchMedicines, saveConsultation, updateAppointmentStatus, getLabTestTypes } from "@/lib/actions/doctor";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Types
interface Medicine {
    id: number;
    brand_name: string;
    generic_name: string;
    default_dosage: string;
    default_frequency: string;
    unit: string;
}

interface Prescriptionitem {
    medicineId: number;
    name: string;
    dosage: string;
    frequency: string;
    days: number;
    qty: number;
    notes: string;
}

export default function ConsultationTabs({ appointment }: { appointment: any }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("notes");
    const [notes, setNotes] = useState(appointment.doctor_notes || "");
    const [isSaving, setIsSaving] = useState(false);

    // Prescription State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Medicine[]>([]);
    const [rxItems, setRxItems] = useState<Prescriptionitem[]>([]);
    const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
    const [dosage, setDosage] = useState("");
    const [frequency, setFrequency] = useState("");
    const [days, setDays] = useState(5);

    // Lab State
    const [labTests, setLabTests] = useState<any[]>([]); // Catalog
    const [selectedLabTests, setSelectedLabTests] = useState<number[]>([]);

    // Load lab test catalog on mount
    useState(() => {
        getLabTestTypes().then(setLabTests);
    });

    // Search Logic
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            const results = await searchMedicines(query);
            setSearchResults(results as Medicine[]);
        } else {
            setSearchResults([]);
        }
    };

    const selectMedicine = (med: Medicine) => {
        setSelectedMed(med);
        setSearchQuery(med.brand_name);
        setSearchResults([]);
        setDosage(med.default_dosage || "");
        setFrequency(med.default_frequency || "1-0-1");
    };

    const addMedicine = () => {
        if (!selectedMed) return;

        // Quick qty calc (very rough)
        const freqCount = frequency.split("-").length || 1;
        const qty = freqCount * days; // e.g. 3 * 5 = 15

        const newItem: Prescriptionitem = {
            medicineId: selectedMed.id,
            name: selectedMed.brand_name,
            dosage,
            frequency,
            days,
            qty,
            notes: ""
        };

        setRxItems([...rxItems, newItem]);
        // Reset form
        setSelectedMed(null);
        setSearchQuery("");
        setDosage("");
        setFrequency("");
        setDays(5);
    };

    const removeMedicine = (index: number) => {
        const newItems = [...rxItems];
        newItems.splice(index, 1);
        setRxItems(newItems);
    };

    // Final Save
    const handleComplete = async () => {
        setIsSaving(true);

        try {
            const res = await saveConsultation(
                appointment.id,
                notes,
                rxItems,
                selectedLabTests
            );

            if (res.error) {
                toast.error(res.error);
            } else {
                await updateAppointmentStatus(appointment.id, "Completed");
                toast.success("Consultation finalized successfully");
                router.push("/doctor");
            }
        } catch (e) {
            toast.error("Failed to save consultation");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="border-b px-4 bg-slate-50">
                    <TabsList className="bg-transparent h-12">
                        <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Clinical Notes</TabsTrigger>
                        <TabsTrigger value="prescription" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Prescription ({rxItems.length})</TabsTrigger>
                        <TabsTrigger value="lab" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Lab Requests ({selectedLabTests.length})</TabsTrigger>
                        <TabsTrigger value="history" className="hidden sm:block">Detailed History</TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 p-0 overflow-y-auto bg-slate-50/30">
                    {/* NOTES TAB */}
                    <TabsContent value="notes" className="h-full p-6 m-0">
                        <div className="h-full flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700">Presenting Complaints & Findings</label>
                            <Textarea
                                placeholder="Enter patient symptoms, diagnosis, and observations..."
                                className="flex-1 min-h-[300px] text-lg leading-relaxed p-4 resize-none focus-visible:ring-indigo-500"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <p className="text-xs text-slate-400">Autosaved locally (wip)</p>
                        </div>
                    </TabsContent>

                    {/* PRESCRIPTION TAB */}
                    <TabsContent value="prescription" className="h-full p-6 m-0 space-y-6">
                        {/* Adder Form */}
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                            <div className="relative">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Search Medicine</label>
                                <Input
                                    placeholder="Type brand or generic name (e.g. Panadol)"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="mt-1"
                                />
                                {/* Dropdown Results */}
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {searchResults.map((med: any) => (
                                            <div
                                                key={med.id}
                                                onClick={() => selectMedicine(med)}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                                            >
                                                <div className="font-semibold text-slate-900">{med.brand_name}</div>
                                                <div className="text-xs text-slate-500">{med.generic_name} • {med.default_dosage}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Dosage</label>
                                    <Input value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 500mg" className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Frequency</label>
                                    <Input value={frequency} onChange={e => setFrequency(e.target.value)} placeholder="e.g. 1-0-1" className="mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Duration (Days)</label>
                                    <Input type="number" value={days} onChange={e => setDays(parseInt(e.target.value))} className="mt-1" />
                                </div>
                            </div>
                            <Button onClick={addMedicine} disabled={!selectedMed} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                Add Medicine
                            </Button>
                        </div>

                        {/* Rx List */}
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-2">Current Prescription</h3>
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50">
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Dosage</TableHead>
                                            <TableHead>Duration</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rxItems.length > 0 ? (
                                            rxItems.map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">
                                                        {item.name}
                                                        <div className="text-xs text-slate-400">Freq: {item.frequency}</div>
                                                    </TableCell>
                                                    <TableCell>{item.dosage}</TableCell>
                                                    <TableCell>{item.days} days ({item.qty})</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => removeMedicine(idx)} className="text-red-500 hover:text-red-700">
                                                            Remove
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">
                                                    No medicines added yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* LAB TAB */}
                    <TabsContent value="lab" className="h-full p-6 m-0">
                        <div className="bg-white p-6 rounded-lg border border-slate-200">
                            <h3 className="font-semibold text-slate-800 mb-4">Select Lab Tests</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {labTests.map((test: any) => (
                                    <div
                                        key={test.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${selectedLabTests.includes(test.id) ? "bg-indigo-50 border-indigo-500" : "bg-white border-slate-200 hover:border-indigo-300"
                                            }`}
                                        onClick={() => {
                                            if (selectedLabTests.includes(test.id)) {
                                                setSelectedLabTests(selectedLabTests.filter(id => id !== test.id));
                                            } else {
                                                setSelectedLabTests([...selectedLabTests, test.id]);
                                            }
                                        }}
                                    >
                                        <span className="font-medium text-slate-700">{test.name}</span>
                                        <span className="text-sm text-slate-500">Rs. {test.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t flex justify-between items-center shrink-0">
                    <div className="text-sm text-slate-500">
                        <span className="font-semibold text-slate-900">{rxItems.length}</span> medicines • <span className="font-semibold text-slate-900">{selectedLabTests.length}</span> tests
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push("/doctor")}>Save Draft & Exit</Button>
                        <Button
                            onClick={handleComplete}
                            disabled={isSaving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[150px]"
                        >
                            {isSaving ? "Finalizing..." : "Finalize Consultation"}
                        </Button>
                    </div>
                </div>
            </Tabs>
        </div>
    );
}
