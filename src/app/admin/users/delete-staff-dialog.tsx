"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStaffUser } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface StaffMember {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    role: string;
}

interface DeleteStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staff: StaffMember | null;
}

export default function DeleteStaffDialog({ open, onOpenChange, staff }: DeleteStaffDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    async function handleDelete() {
        if (!staff) return;

        setIsLoading(true);

        try {
            const result = await deleteStaffUser(staff.id, staff.role);

            if (result.error) {
                toast.error(result.error);
                setIsLoading(false);
                return;
            }

            toast.success("Staff member deleted successfully!");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error("Error deleting staff:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    if (!staff) return null;

    const fullName = `${staff.first_name} ${staff.last_name || ""}`.trim();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle>Delete Staff Member</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete <strong>{fullName}</strong> ({staff.role})?
                    </p>
                    <p className="text-sm text-slate-500 mt-2">
                        This will permanently remove their account and they will no longer be able to access the system.
                    </p>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : "Delete Staff"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
