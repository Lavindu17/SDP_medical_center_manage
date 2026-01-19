"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDoctors, getDoctorAvailability, bookAppointment } from "@/lib/actions/appointment";
import { toast } from "sonner"; // Assuming sonner is installed as per plan

type Doctor = {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
    consultation_fee: number;
};

type Availability = {
    nextQueueNumber: number;
    estimatedTime: string;
    queueSize: number;
    doctor: Doctor;
    date: string;
};

export default function BookingWizard({
    initialDoctors,
    specializations
}: {
    initialDoctors: Doctor[],
    specializations: string[]
}) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [reason, setReason] = useState("");
    const [availability, setAvailability] = useState<Availability | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    // Search/Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSpec, setFilterSpec] = useState("all");
    const [doctors, setDoctors] = useState(initialDoctors);

    // Filter doctors when search/filter changes
    useEffect(() => {
        const filtered = initialDoctors.filter(doc => {
            const matchSearch = searchTerm === "" ||
                `${doc.first_name} ${doc.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                doc.specialization.toLowerCase().includes(searchTerm.toLowerCase());

            const matchSpec = filterSpec === "all" || doc.specialization === filterSpec;

            return matchSearch && matchSpec;
        });
        setDoctors(filtered);
    }, [searchTerm, filterSpec, initialDoctors]);

    // Check availability when date/doctor changes
    useEffect(() => {
        async function check() {
            if (selectedDoctor && selectedDate) {
                setIsChecking(true);
                const dateStr = format(selectedDate, "yyyy-MM-dd");
                const result = await getDoctorAvailability(selectedDoctor.id, dateStr);

                if (result.error) {
                    toast.error(result.error);
                } else {
                    setAvailability(result as Availability);
                }
                setIsChecking(false);
            }
        }
        check();
    }, [selectedDoctor, selectedDate]);

    const handleBook = async () => {
        if (!selectedDoctor || !selectedDate) return;

        setIsBooking(true);
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const result = await bookAppointment(selectedDoctor.id, dateStr, reason);

        if (result.success) {
            toast.success("Appointment booked successfully!");
            router.push("/patient/appointments");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to book appointment");
            setIsBooking(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-slate-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? "border-blue-600 bg-blue-50" : "border-slate-300"} font-semibold`}>1</div>
                    <span className="ml-2 font-medium">Select Doctor</span>
                </div>
                <div className={`w-16 h-1 mx-4 ${step >= 2 ? "bg-blue-600" : "bg-slate-200"}`} />
                <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-slate-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? "border-blue-600 bg-blue-50" : "border-slate-300"} font-semibold`}>2</div>
                    <span className="ml-2 font-medium">Date & Time</span>
                </div>
                <div className={`w-16 h-1 mx-4 ${step >= 3 ? "bg-blue-600" : "bg-slate-200"}`} />
                <div className={`flex items-center ${step >= 3 ? "text-blue-600" : "text-slate-400"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? "border-blue-600 bg-blue-50" : "border-slate-300"} font-semibold`}>3</div>
                    <span className="ml-2 font-medium">Confirm</span>
                </div>
            </div>

            {/* Step 1: Select Doctor */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search doctors..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="w-48">
                            <Select value={filterSpec} onValueChange={setFilterSpec}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Specializations</SelectItem>
                                    {specializations.map(spec => (
                                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {doctors.map(doc => (
                            <Card
                                key={doc.id}
                                className={`cursor-pointer transition-all hover:shadow-md border-2 ${selectedDoctor?.id === doc.id ? "border-blue-500 bg-blue-50" : "border-transparent"}`}
                                onClick={() => setSelectedDoctor(doc)}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {doc.first_name[0]}{doc.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">Dr. {doc.first_name} {doc.last_name}</h3>
                                        <p className="text-sm text-slate-500">{doc.specialization}</p>
                                        <p className="text-xs text-slate-400 mt-1">Fee: Rs. {doc.consultation_fee}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button disabled={!selectedDoctor} onClick={() => setStep(2)}>
                            Next Step
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Select Date */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="flex-1">
                            <h3 className="font-semibold mb-4 text-lg">Select Date</h3>
                            <div className="border rounded-lg p-4 inline-block bg-white">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={(date) => date < new Date() || date.getDay() === 0} // Disable past dates & Sundays
                                    className="rounded-md"
                                />
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="font-semibold mb-4 text-lg">Availability Check</h3>
                            {selectedDate ? (
                                isChecking ? (
                                    <div className="p-8 text-center text-slate-500">Checking availability...</div>
                                ) : availability ? (
                                    <Card className="bg-emerald-50 border-emerald-100">
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex justify-between items-center border-b border-emerald-200 pb-3">
                                                <span className="text-emerald-800 font-medium">Available Token</span>
                                                <span className="text-2xl font-bold text-emerald-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                                                    #{availability.nextQueueNumber}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-emerald-800">Estimated Time</span>
                                                <span className="font-semibold text-emerald-700">{availability.estimatedTime}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-emerald-800">Current Queue Size</span>
                                                <span className="font-semibold text-emerald-700">{availability.queueSize} patients</span>
                                            </div>
                                            <div className="text-xs text-emerald-600 bg-white/50 p-2 rounded mt-2">
                                                * Time is estimated based on average consultation duration.
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : null
                            ) : (
                                <div className="p-8 text-center text-slate-500 border-2 border-dashed rounded-lg">
                                    Select a date to see availability
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button disabled={!selectedDate || !availability} onClick={() => setStep(3)}>
                            Next Step
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && availability && selectedDoctor && (
                <div className="max-w-2xl mx-auto space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            <div className="text-center border-b pb-6">
                                <h3 className="text-xl font-bold text-slate-900">Confirm Booking</h3>
                                <p className="text-slate-500">Please review your appointment details</p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctor</label>
                                    <p className="font-medium text-lg">Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}</p>
                                    <p className="text-sm text-slate-500">{selectedDoctor.specialization}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                                    <p className="font-medium text-lg">{format(new Date(availability.date), "EEEE, MMMM d, yyyy")}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Token Number</label>
                                    <p className="font-bold text-2xl text-blue-600">#{availability.nextQueueNumber}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Time</label>
                                    <p className="font-medium text-lg">{availability.estimatedTime}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consultation Fee</label>
                                    <p className="font-medium text-lg">Rs. {selectedDoctor.consultation_fee}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t">
                                <label className="text-sm font-medium text-slate-700 mb-2 block">Reason for Visit (Optional)</label>
                                <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="E.g., High fever, follow-up..."
                                    className="w-full"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                        <Button
                            onClick={handleBook}
                            disabled={isBooking}
                            className="px-8 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isBooking ? "Booking..." : "Confirm & Book Appointment"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
