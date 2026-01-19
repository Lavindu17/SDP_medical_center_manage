"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStaffUser } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type StaffRole = "doctor" | "pharmacist" | "receptionist" | "lab_assistant" | "admin";

interface CreateStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateStaffDialog({ open, onOpenChange }: CreateStaffDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<StaffRole>("doctor");
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const firstName = formData.get("firstName") as string;
        const lastName = formData.get("lastName") as string;
        const contactNumber = formData.get("contactNumber") as string;

        // Build profile data based on role
        const profileData: Record<string, unknown> = {
            first_name: firstName,
            last_name: lastName || null,
            contact_number: contactNumber || null,
        };

        // Add role-specific fields
        if (role === "doctor") {
            profileData.specialization = formData.get("specialization") as string || null;
            profileData.slmc_reg_number = formData.get("slmcRegNumber") as string || null;
            profileData.consultation_fee = parseFloat(formData.get("consultationFee") as string) || 0;
        } else if (role === "pharmacist") {
            profileData.license_number = formData.get("licenseNumber") as string || null;
        } else if (role === "receptionist") {
            profileData.desk_id = formData.get("deskId") as string || null;
        }

        try {
            const result = await createStaffUser(email, password, role, profileData);

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            toast.success(`${role.charAt(0).toUpperCase() + role.slice(1).replace("_", " ")} created successfully!`);
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Error creating staff:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                        Create a new staff account. They will be able to log in immediately.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="role">Staff Role *</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="doctor">Doctor</SelectItem>
                                <SelectItem value="pharmacist">Pharmacist</SelectItem>
                                <SelectItem value="receptionist">Receptionist</SelectItem>
                                <SelectItem value="lab_assistant">Lab Assistant</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Common Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="staff@hospital.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                            id="contactNumber"
                            name="contactNumber"
                            type="tel"
                            placeholder="+94 77 123 4567"
                        />
                    </div>

                    {/* Doctor-specific fields */}
                    {role === "doctor" && (
                        <>
                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-3">Doctor Details</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="specialization">Specialization</Label>
                                        <Input
                                            id="specialization"
                                            name="specialization"
                                            placeholder="e.g., General Medicine, Cardiology"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="slmcRegNumber">SLMC Reg. Number</Label>
                                            <Input
                                                id="slmcRegNumber"
                                                name="slmcRegNumber"
                                                placeholder="SLMC12345"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="consultationFee">Consultation Fee (Rs.)</Label>
                                            <Input
                                                id="consultationFee"
                                                name="consultationFee"
                                                type="number"
                                                placeholder="1500"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Pharmacist-specific fields */}
                    {role === "pharmacist" && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-slate-700 mb-3">Pharmacist Details</h4>
                            <div className="space-y-2">
                                <Label htmlFor="licenseNumber">License Number</Label>
                                <Input
                                    id="licenseNumber"
                                    name="licenseNumber"
                                    placeholder="PH-12345"
                                />
                            </div>
                        </div>
                    )}

                    {/* Receptionist-specific fields */}
                    {role === "receptionist" && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-slate-700 mb-3">Receptionist Details</h4>
                            <div className="space-y-2">
                                <Label htmlFor="deskId">Desk ID</Label>
                                <Input
                                    id="deskId"
                                    name="deskId"
                                    placeholder="DESK-01"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Staff"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
