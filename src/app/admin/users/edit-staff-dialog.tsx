"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStaffUser } from "@/lib/actions/admin";
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
import { toast } from "sonner";

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    role: string;
    contact_number?: string | null;
    specialization?: string | null;
    slmc_reg_number?: string | null;
    consultation_fee?: number | null;
    license_number?: string | null;
    desk_id?: string | null;
}

interface EditStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: StaffMember | null;
}

export default function EditStaffDialog({ open, onOpenChange, staff }: EditStaffDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<StaffMember>>({});
    const router = useRouter();

    useEffect(() => {
        if (staff) {
            setFormData(staff);
        }
    }, [staff]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!staff) return;

        setIsLoading(true);

        try {
            const result = await updateStaffUser(staff.id, staff.role, formData);

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            toast.success("Staff member updated successfully!");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Error updating staff:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    if (!staff) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Staff Member</DialogTitle>
                    <DialogDescription>
                        Update the staff member&apos;s profile information.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Role (Read-only) */}
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Input value={staff.role} disabled className="bg-slate-100" />
                    </div>

                    {/* Common Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={formData.first_name || ""}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.last_name || ""}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactNumber">Contact Number</Label>
                        <Input
                            id="contactNumber"
                            type="tel"
                            value={formData.contact_number || ""}
                            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                        />
                    </div>

                    {/* Doctor-specific fields */}
                    {staff.role === "Doctor" && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-slate-700 mb-3">Doctor Details</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Input
                                        id="specialization"
                                        value={formData.specialization || ""}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="slmcRegNumber">SLMC Reg. Number</Label>
                                        <Input
                                            id="slmcRegNumber"
                                            value={formData.slmc_reg_number || ""}
                                            onChange={(e) => setFormData({ ...formData, slmc_reg_number: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="consultationFee">Consultation Fee (Rs.)</Label>
                                        <Input
                                            id="consultationFee"
                                            type="number"
                                            value={formData.consultation_fee || ""}
                                            onChange={(e) => setFormData({ ...formData, consultation_fee: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pharmacist-specific fields */}
                    {staff.role === "Pharmacist" && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-slate-700 mb-3">Pharmacist Details</h4>
                            <div className="space-y-2">
                                <Label htmlFor="licenseNumber">License Number</Label>
                                <Input
                                    id="licenseNumber"
                                    value={formData.license_number || ""}
                                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Receptionist-specific fields */}
                    {staff.role === "Receptionist" && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-slate-700 mb-3">Receptionist Details</h4>
                            <div className="space-y-2">
                                <Label htmlFor="deskId">Desk ID</Label>
                                <Input
                                    id="deskId"
                                    value={formData.desk_id || ""}
                                    onChange={(e) => setFormData({ ...formData, desk_id: e.target.value })}
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
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
